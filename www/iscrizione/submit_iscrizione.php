<?php
/**
 * submit_iscrizione.php
 * Riceve i dati del form di iscrizione (JSON via POST)
 * e li salva nelle tabelle specifiche per gioco.
 */

define('DB_HOST',    'db');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'root');
define('DB_CHARSET', 'utf8mb4');

/* ── CORS & HEADERS ── */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo non consentito.']);
    exit;
}

/* ── LEGGI BODY JSON ── */
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Dati non validi.']);
    exit;
}

/* ── VALIDAZIONE SERVER-SIDE ── */
$caposquadra = trim($data['caposquadra'] ?? '');
$corso       = trim($data['corso']       ?? '');
$gioco       = strtolower(trim($data['gioco'] ?? ''));
$giocatori   = $data['giocatori']        ?? [];

$corsi_validi = [
    'Developer', 'Cybersecurity', 'Cloud Computing', 'Game Developer',
    'Digital Media Specialist', 'AI and Data Science Specialist'
];

$giochi_validi = ['valorant', 'r6', 'lol'];

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

if (!$gioco || !in_array($gioco, $giochi_validi)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Devi selezionare un gioco valido (Valorant, Rainbow Six o League of Legends).']);
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

/* ── CALCOLA MMR TOTALE ── */
$mmr_totale = array_sum(array_column($giocatori, 'mmr'));

/* ── NOMI TABELLE ── */
$tbl_sq = "squadre_{$gioco}";
$tbl_gi = "giocatori_{$gioco}";

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

/* ── AUTO-SETUP TABELLE ── */
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `{$tbl_sq}` (
            id               INT          UNSIGNED NOT NULL AUTO_INCREMENT,
            caposquadra      VARCHAR(120) NOT NULL,
            corso            VARCHAR(60)  NOT NULL,
            mmr_totale       INT          UNSIGNED NOT NULL DEFAULT 0,
            data_iscrizione  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `{$tbl_gi}` (
            id               INT          UNSIGNED NOT NULL AUTO_INCREMENT,
            squadra_id       INT          UNSIGNED NOT NULL,
            numero_giocatore TINYINT      UNSIGNED NOT NULL,
            nome             VARCHAR(120) NOT NULL,
            mmr              INT          UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            CONSTRAINT `fk_{$gioco}_sq`
                FOREIGN KEY (squadra_id) REFERENCES `{$tbl_sq}`(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (PDOException $e) {
    /* tabelle già esistenti — prosegui */
}

/* ── TRANSAZIONE ── */
try {
    $pdo->beginTransaction();

    $stmtSquadra = $pdo->prepare("
        INSERT INTO `{$tbl_sq}` (caposquadra, corso, mmr_totale, data_iscrizione)
        VALUES (:caposquadra, :corso, :mmr_totale, NOW())
    ");
    $stmtSquadra->execute([
        ':caposquadra' => $caposquadra,
        ':corso'       => $corso,
        ':mmr_totale'  => $mmr_totale,
    ]);
    $squadra_id = $pdo->lastInsertId();

    $stmtGiocatore = $pdo->prepare("
        INSERT INTO `{$tbl_gi}` (squadra_id, nome, mmr, numero_giocatore)
        VALUES (:squadra_id, :nome, :mmr, :numero)
    ");
    foreach ($giocatori as $i => $g) {
        $stmtGiocatore->execute([
            ':squadra_id' => $squadra_id,
            ':nome'       => trim($g['nome']),
            ':mmr'        => (int)$g['mmr'],
            ':numero'     => $i + 1,
        ]);
    }

    $pdo->commit();

    $nomi_gioco = ['valorant' => 'Valorant', 'r6' => 'Rainbow Six Siege', 'lol' => 'League of Legends'];

    echo json_encode([
        'success'    => true,
        'message'    => 'Iscrizione a ' . $nomi_gioco[$gioco] . ' salvata con successo.',
        'squadra_id' => $squadra_id,
        'gioco'      => $gioco,
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il salvataggio. Riprova.']);
}
