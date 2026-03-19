<?php
/**
 * delete_squadra.php
 * Elimina una squadra (e i suoi giocatori via CASCADE) dalla tabella
 * specifica per gioco.
 * Riceve JSON via POST con: id, gioco
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
$id    = (int)($data['id']    ?? 0);
$gioco = strtolower(trim($data['gioco'] ?? 'valorant'));

$giochi_validi = ['valorant', 'r6', 'lol'];

if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'ID non valido.']);
    exit;
}

if (!in_array($gioco, $giochi_validi)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Gioco non valido.']);
    exit;
}

$tbl_sq = "squadre_{$gioco}";

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

/* ── ELIMINAZIONE ── */
try {
    /* Verifica esistenza */
    $check = $pdo->prepare("SELECT id FROM `{$tbl_sq}` WHERE id = ?");
    $check->execute([$id]);
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Squadra non trovata.']);
        exit;
    }

    /* La FK con ON DELETE CASCADE elimina automaticamente i giocatori */
    $stmt = $pdo->prepare("DELETE FROM `{$tbl_sq}` WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(['success' => true, 'message' => 'Squadra eliminata con successo.']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante l\'eliminazione. Riprova.']);
}
