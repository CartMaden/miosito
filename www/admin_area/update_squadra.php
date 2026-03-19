<?php
/**
 * update_squadra.php
 * Aggiorna i dati di una squadra nelle tabelle specifiche per gioco.
 * Riceve JSON via POST con: id, caposquadra, corso, giocatori[], gioco
 */

session_start();
if (!isset($_SESSION['admin_loggato']) || $_SESSION['admin_loggato'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non autorizzato.']);
    exit;
}

define('DB_HOST',    'db');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'root');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito.']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dati non validi.']);
    exit;
}

/* ── VALIDAZIONE ── */
$id          = (int)($data['id']          ?? 0);
$caposquadra = trim($data['caposquadra']  ?? '');
$corso       = trim($data['corso']        ?? '');
$gioco       = strtolower(trim($data['gioco'] ?? 'valorant'));
$giocatori   = $data['giocatori']         ?? [];

$giochi_validi = ['valorant', 'r6', 'lol'];
$corsi_validi  = [
    'Developer', 'Cybersecurity', 'Cloud Computing', 'Game Developer',
    'Digital Media Specialist', 'AI and Data Science Specialist'
];

if ($id <= 0)                             { http_response_code(422); echo json_encode(['success' => false, 'message' => 'ID non valido.']); exit; }
if (!$caposquadra || !$corso)             { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Caposquadra e corso sono obbligatori.']); exit; }
if (!in_array($corso, $corsi_validi))     { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Corso non valido.']); exit; }
if (!in_array($gioco, $giochi_validi))    { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Gioco non valido.']); exit; }
if (count($giocatori) !== 5)              { http_response_code(422); echo json_encode(['success' => false, 'message' => 'Servono esattamente 5 giocatori.']); exit; }

foreach ($giocatori as $g) {
    if (empty(trim($g['nome'] ?? ''))) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Tutti i nomi dei giocatori sono obbligatori.']);
        exit;
    }
    if (!is_numeric($g['mmr'] ?? '') || (int)$g['mmr'] < 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'MMR non valido per uno o più giocatori.']);
        exit;
    }
}

/* ── NOMI TABELLE ── */
$tbl_sq = "squadre_{$gioco}";
$tbl_gi = "giocatori_{$gioco}";

/* ── MMR TOTALE ── */
$mmr_totale = array_sum(array_column($giocatori, 'mmr'));

/* ── CONNESSIONE ── */
try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore di connessione al database.']);
    exit;
}

/* ── TRANSAZIONE ── */
try {
    $pdo->beginTransaction();

    /* 1. Verifica che la squadra esista nella tabella giusta */
    $check = $pdo->prepare("SELECT id FROM `{$tbl_sq}` WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Squadra non trovata.']);
        exit;
    }

    /* 2. Aggiorna la squadra */
    $stmtSq = $pdo->prepare("
        UPDATE `{$tbl_sq}`
        SET caposquadra = :caposquadra,
            corso       = :corso,
            mmr_totale  = :mmr_totale
        WHERE id = :id
    ");
    $stmtSq->execute([
        ':caposquadra' => $caposquadra,
        ':corso'       => $corso,
        ':mmr_totale'  => $mmr_totale,
        ':id'          => $id,
    ]);

    /* 3. Elimina i giocatori esistenti e reinserisce */
    $pdo->prepare("DELETE FROM `{$tbl_gi}` WHERE squadra_id = ?")->execute([$id]);

    $stmtGi = $pdo->prepare("
        INSERT INTO `{$tbl_gi}` (squadra_id, numero_giocatore, nome, mmr)
        VALUES (:squadra_id, :numero, :nome, :mmr)
    ");
    foreach ($giocatori as $i => $g) {
        $stmtGi->execute([
            ':squadra_id' => $id,
            ':numero'     => $i + 1,
            ':nome'       => trim($g['nome']),
            ':mmr'        => (int)$g['mmr'],
        ]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Squadra aggiornata con successo.']);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il salvataggio. Riprova.']);
}
