<?php
/**
 * get_iscrizioni.php
 * Restituisce i dati delle squadre iscritte in formato JSON.
 *
 * ── UTILIZZO ─────────────────────────────────────────────────
 * GET get_iscrizioni.php                  → tutte le squadre
 * GET get_iscrizioni.php?id=3             → una squadra specifica
 * GET get_iscrizioni.php?corso=Cybersecurity → filtra per corso
 * GET get_iscrizioni.php?orderby=mmr      → ordina per MMR totale
 */

define('DB_HOST',    'localhost');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'password');   // ← modifica con la tua password
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

/* ── CONNESSIONE ── */
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET,
        DB_USER, DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore di connessione al database.']);
    exit;
}

/* ── PARAMETRI GET ── */
$id      = isset($_GET['id'])      ? (int)$_GET['id']            : null;
$corso   = isset($_GET['corso'])   ? trim($_GET['corso'])         : null;
$orderby = isset($_GET['orderby']) ? trim($_GET['orderby'])       : 'data_iscrizione';

$orderby_map = [
    'mmr'             => 'mmr_totale DESC',
    'data_iscrizione' => 's.data_iscrizione ASC',
    'nome'            => 's.caposquadra ASC',
    'corso'           => 's.corso ASC',
];
$order_sql = $orderby_map[$orderby] ?? 's.data_iscrizione ASC';

/* ── QUERY SQUADRE ── */
try {
    $where  = [];
    $params = [];

    if ($id) {
        $where[]          = 's.id = :id';
        $params[':id']    = $id;
    }
    if ($corso) {
        $where[]          = 's.corso = :corso';
        $params[':corso'] = $corso;
    }

    $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    // Recupera squadre con MMR totale calcolato
    $stmtSquadre = $pdo->prepare("
        SELECT
            s.id,
            s.caposquadra,
            s.corso,
            s.data_iscrizione,
            COALESCE(SUM(g.mmr), 0) AS mmr_totale
        FROM squadre s
        LEFT JOIN giocatori g ON g.squadra_id = s.id
        $where_sql
        GROUP BY s.id, s.caposquadra, s.corso, s.data_iscrizione
        ORDER BY $order_sql
    ");
    $stmtSquadre->execute($params);
    $squadre = $stmtSquadre->fetchAll();

    if (!$squadre) {
        echo json_encode(['success' => true, 'data' => []]);
        exit;
    }

    // Recupera tutti i giocatori delle squadre trovate
    $ids = array_column($squadre, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmtGiocatori = $pdo->prepare("
        SELECT squadra_id, numero_giocatore, nome, mmr
        FROM giocatori
        WHERE squadra_id IN ($placeholders)
        ORDER BY squadra_id, numero_giocatore
    ");
    $stmtGiocatori->execute($ids);
    $giocatori = $stmtGiocatori->fetchAll();

    // Raggruppa i giocatori per squadra
    $giocatori_map = [];
    foreach ($giocatori as $g) {
        $giocatori_map[$g['squadra_id']][] = [
            'numero' => (int)$g['numero_giocatore'],
            'nome'   => $g['nome'],
            'mmr'    => (int)$g['mmr'],
        ];
    }

    // Assembla risposta finale
    $result = [];
    foreach ($squadre as $s) {
        $result[] = [
            'id'               => (int)$s['id'],
            'caposquadra'      => $s['caposquadra'],
            'corso'            => $s['corso'],
            'data_iscrizione'  => $s['data_iscrizione'],
            'mmr_totale'       => (int)$s['mmr_totale'],
            'giocatori'        => $giocatori_map[$s['id']] ?? [],
        ];
    }

    echo json_encode(['success' => true, 'data' => $result], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Errore durante il recupero dei dati.']);
}
