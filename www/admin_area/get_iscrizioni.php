<?php
/**
 * get_iscrizioni.php
 * Restituisce le squadre iscritte per un determinato gioco.
 * Parametri GET:
 *   gioco    = valorant | r6 | lol  (default: valorant)
 *   orderby  = mmr | nome | corso | data_iscrizione  (default: data_iscrizione)
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

/* ── PARAMETRI ── */
$giochi_validi = ['valorant', 'r6', 'lol'];
$gioco = strtolower(trim($_GET['gioco'] ?? 'valorant'));
if (!in_array($gioco, $giochi_validi)) $gioco = 'valorant';

$order_map = [
    'mmr'             => 's.mmr_totale DESC',
    'nome'            => 's.caposquadra ASC',
    'corso'           => 's.corso ASC',
    'data_iscrizione' => 's.data_iscrizione DESC',
];
$orderby  = $_GET['orderby'] ?? 'data_iscrizione';
$order_sql = $order_map[$orderby] ?? $order_map['data_iscrizione'];

/* ── NOMI TABELLE ── */
$tbl_sq = "squadre_{$gioco}";
$tbl_gi = "giocatori_{$gioco}";

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
            CONSTRAINT `fk_{$gioco}_squadra`
                FOREIGN KEY (squadra_id) REFERENCES `{$tbl_sq}`(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
} catch (PDOException $e) {
    /* ignora se già esistono */
}

/* ── QUERY PRINCIPALE ── */
try {
    $stmt = $pdo->query("SELECT * FROM `{$tbl_sq}` s ORDER BY {$order_sql}");
    $squadre = $stmt->fetchAll();

    $stmtG = $pdo->prepare("
        SELECT numero_giocatore AS numero, nome, mmr
        FROM `{$tbl_gi}`
        WHERE squadra_id = ?
        ORDER BY numero_giocatore
    ");

    $result = [];
    foreach ($squadre as $s) {
        $stmtG->execute([$s['id']]);
        $giocatori = $stmtG->fetchAll();

        $result[] = [
            'id'              => (int)$s['id'],
            'caposquadra'     => $s['caposquadra'],
            'corso'           => $s['corso'],
            'mmr_totale'      => (int)$s['mmr_totale'],
            'data_iscrizione' => $s['data_iscrizione'],
            'giocatori'       => array_map(fn($g) => [
                'numero' => (int)$g['numero'],
                'nome'   => $g['nome'],
                'mmr'    => (int)$g['mmr'],
            ], $giocatori),
        ];
    }

    echo json_encode(['success' => true, 'data' => $result, 'gioco' => $gioco]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il recupero dei dati.']);
}
