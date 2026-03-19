<?php
/**
 * export_classifica.php
 * Salva la classifica finale di un gioco nel database.
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

$giochi_validi = ['valorant', 'r6', 'lol'];
$gioco = strtolower(trim($data['gioco'] ?? 'valorant'));
if (!in_array($gioco, $giochi_validi)) $gioco = 'valorant';

$classifica   = $data['classifica']   ?? [];
$turniGiocati = (int)($data['turniGiocati'] ?? 0);

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `classifiche_finali` (
            id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
            gioco           VARCHAR(20) NOT NULL,
            classifica_json LONGTEXT,
            turni_giocati   INT UNSIGNED NOT NULL DEFAULT 0,
            esportata_il    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_gioco (gioco)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $stmt = $pdo->prepare("
        INSERT INTO `classifiche_finali` (gioco, classifica_json, turni_giocati, esportata_il)
        VALUES (:gioco, :classifica, :turni, NOW())
    ");
    $stmt->execute([
        ':gioco'      => $gioco,
        ':classifica' => json_encode($classifica),
        ':turni'      => $turniGiocati,
    ]);

    echo json_encode(['success' => true, 'gioco' => $gioco]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore DB durante l\'esportazione.']);
}
