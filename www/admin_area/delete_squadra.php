<?php
/**
 * delete_squadra.php
 * Riceve via POST (JSON) l'ID di una squadra e la elimina
 * dal database (la FK ON DELETE CASCADE rimuove anche i giocatori).
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

$id = intval($data['id'] ?? 0);

if ($id <= 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'ID squadra non valido.']);
    exit;
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

/* ── ELIMINA ── */
try {
    /* La FK ON DELETE CASCADE in giocatori elimina automaticamente
       i giocatori legati a questa squadra. */
    $stmt = $pdo->prepare("DELETE FROM squadre WHERE id = :id");
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Squadra non trovata.']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Squadra eliminata con successo.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante l\'eliminazione. Riprova.']);
}
