<?php
/**
 * submit_iscrizione.php
 * Riceve i dati del form di iscrizione (JSON via POST)
 * e li salva nel database MySQL.
 *
 * ── CONFIGURAZIONE DB ──────────────────────────────────────────
 * Modifica le costanti qui sotto con i dati del tuo server.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'area_privata');    // ← stesso database del sito
define('DB_USER', 'root');            // ← utente MySQL
define('DB_PASS', 'password');        // ← password MySQL
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

/* ── ACCETTA SOLO POST ── */
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
$giocatori   = $data['giocatori']        ?? [];

$corsi_validi = [
    'Cybersecurity', 'Sviluppo Web', 'Cloud Computing',
    'Data Science', 'Digital Marketing', 'Game Design', 'Altro'
];

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

/* ── AUTO-SETUP TABELLE (se non esistono) ── */
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS squadre (
            id               INT          UNSIGNED NOT NULL AUTO_INCREMENT,
            caposquadra      VARCHAR(120) NOT NULL,
            corso            VARCHAR(60)  NOT NULL,
            data_iscrizione  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS giocatori (
            id               INT          UNSIGNED NOT NULL AUTO_INCREMENT,
            squadra_id       INT          UNSIGNED NOT NULL,
            numero_giocatore TINYINT      UNSIGNED NOT NULL,
            nome             VARCHAR(120) NOT NULL,
            mmr              INT          UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            CONSTRAINT fk_squadra
                FOREIGN KEY (squadra_id) REFERENCES squadre(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante la creazione delle tabelle.']);
    exit;
}

/* ── TRANSAZIONE ── */
try {
    $pdo->beginTransaction();

    /* 1. Inserisci la squadra */
    $stmtSquadra = $pdo->prepare("
        INSERT INTO squadre (caposquadra, corso, data_iscrizione)
        VALUES (:caposquadra, :corso, NOW())
    ");
    $stmtSquadra->execute([
        ':caposquadra' => $caposquadra,
        ':corso'       => $corso,
    ]);
    $squadra_id = $pdo->lastInsertId();

    /* 2. Inserisci i giocatori */
    $stmtGiocatore = $pdo->prepare("
        INSERT INTO giocatori (squadra_id, nome, mmr, numero_giocatore)
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

    echo json_encode([
        'success'    => true,
        'message'    => 'Iscrizione salvata con successo.',
        'squadra_id' => $squadra_id
    ]);

} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il salvataggio. Riprova.']);
}
