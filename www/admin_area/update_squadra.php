<?php
/**
 * update_squadra.php
 * Riceve via POST (JSON) i dati aggiornati di una squadra
 * e li salva nel database MySQL.
 */

define('DB_HOST',    'db');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'root');
define('DB_CHARSET', 'utf8mb4');

/* ── HEADERS ── */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito.']);
    exit;
}

/* ── LEGGI BODY ── */
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dati non validi.']);
    exit;
}

/* ── VALIDAZIONE ── */
$id          = intval($data['id']          ?? 0);
$caposquadra = trim($data['caposquadra']   ?? '');
$corso       = trim($data['corso']         ?? '');
$giocatori   = $data['giocatori']          ?? [];

$corsi_validi = [
    'Developer', 'Cybersecurity', 'Cloud Computing', 'Game Developer',
    'Digital Media Specialist', 'AI and Data Science Specialist'
];

if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'ID squadra non valido.']);
    exit;
}
if (!$caposquadra || !$corso) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Caposquadra e corso sono obbligatori.']);
    exit;
}
if (!in_array($corso, $corsi_validi)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Corso non valido.']);
    exit;
}
if (count($giocatori) !== 5) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Servono esattamente 5 giocatori.']);
    exit;
}
foreach ($giocatori as $g) {
    if (empty(trim($g['nome'] ?? ''))) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Tutti i nomi dei giocatori sono obbligatori.']);
        exit;
    }
    if (!is_numeric($g['mmr']) || $g['mmr'] < 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'MMR non valido per uno o più giocatori.']);
        exit;
    }
}

/* ── CONNESSIONE DB ── */
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

    /* 1. Aggiorna la squadra */
    $stmt = $pdo->prepare("
        UPDATE squadre
        SET caposquadra = :caposquadra,
            corso       = :corso
        WHERE id = :id
    ");
    $stmt->execute([
        ':caposquadra' => $caposquadra,
        ':corso'       => $corso,
        ':id'          => $id,
    ]);

    if ($stmt->rowCount() === 0) {
        /* Verifica che la squadra esista */
        $check = $pdo->prepare("SELECT id FROM squadre WHERE id = :id");
        $check->execute([':id' => $id]);
        if (!$check->fetch()) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Squadra non trovata.']);
            exit;
        }
    }

    /* 2. Aggiorna i giocatori */
    $stmtG = $pdo->prepare("
        UPDATE giocatori
        SET nome = :nome,
            mmr  = :mmr
        WHERE squadra_id       = :squadra_id
          AND numero_giocatore = :numero
    ");

    foreach ($giocatori as $i => $g) {
        $stmtG->execute([
            ':nome'      => trim($g['nome']),
            ':mmr'       => (int)$g['mmr'],
            ':squadra_id' => $id,
            ':numero'    => $i + 1,
        ]);
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Squadra aggiornata con successo.'
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il salvataggio. Riprova.']);
}
