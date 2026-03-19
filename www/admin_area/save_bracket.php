<?php
/**
 * save_bracket.php
 * Salva il bracket di un gioco specifico nel database.
 * Usa REPLACE INTO per evitare qualsiasi problema con ON DUPLICATE KEY.
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
    echo json_encode(['success' => false, 'message' => 'JSON non valido.']);
    exit;
}

$giochi_validi = ['valorant', 'r6', 'lol'];
$gioco         = strtolower(trim($data['gioco'] ?? 'valorant'));
if (!in_array($gioco, $giochi_validi)) $gioco = 'valorant';

$bracket     = $data['bracket'] ?? null;
$bracketJson = ($bracket !== null) ? json_encode($bracket) : null;

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE          => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => true,   // necessario per REPLACE INTO su alcuni driver
    ]);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `bracket_state` (
            gioco        VARCHAR(20) NOT NULL,
            bracket_json LONGTEXT,
            updated_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (gioco)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    /*
     * REPLACE INTO = DELETE + INSERT: nessun problema con parametri duplicati,
     * nessun conflitto con ON UPDATE CURRENT_TIMESTAMP.
     */
    $stmt = $pdo->prepare("
        REPLACE INTO `bracket_state` (gioco, bracket_json, updated_at)
        VALUES (?, ?, NOW())
    ");
    $stmt->execute([$gioco, $bracketJson]);

    echo json_encode(['success' => true, 'gioco' => $gioco]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore DB: ' . $e->getMessage()]);
}
