<?php
/*
 * get_bracket.php — endpoint PUBBLICO
 * GET ?gioco=valorant|r6|lol  (default: valorant)
 *
 * Logica timestamp-aware:
 *   - Se bracket_state.updated_at > classifiche_finali.esportata_il
 *     → è iniziato un nuovo torneo dopo l'ultima esportazione → restituisce bracket
 *   - Se classifica è più recente (o bracket è null) → restituisce classifica finale
 *   - Se niente → bracket:null
 */

define('DB_HOST',    'db');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'root');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

$allowed = ['valorant', 'r6', 'lol'];
$gioco   = strtolower(trim($_GET['gioco'] ?? 'valorant'));
if (!in_array($gioco, $allowed)) $gioco = 'valorant';

try {
    $pdo = new PDO(
        "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=".DB_CHARSET,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => true]
    );

    /* ── Leggi bracket ── */
    $bracket    = null;
    $bracketAt  = null;
    try {
        $s = $pdo->prepare("SELECT bracket_json, updated_at FROM bracket_state WHERE gioco=?");
        $s->execute([$gioco]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['bracket_json']) {
            $decoded = json_decode($row['bracket_json'], true);
            if ($decoded !== null && count($decoded) > 0) {
                $bracket   = $decoded;
                $bracketAt = strtotime($row['updated_at']);
            }
        }
    } catch (PDOException $e) {}

    /* ── Leggi classifica finale ── */
    $classifica   = null;
    $classificaAt = null;
    $turniGiocati = 0;
    $savedAt      = null;
    try {
        $s = $pdo->prepare("SELECT classifica_json, turni_giocati, esportata_il FROM classifiche_finali WHERE gioco=? ORDER BY esportata_il DESC LIMIT 1");
        $s->execute([$gioco]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        if ($row && $row['classifica_json']) {
            $classifica   = json_decode($row['classifica_json'], true);
            $classificaAt = strtotime($row['esportata_il']);
            $turniGiocati = (int)$row['turni_giocati'];
            $savedAt      = $row['esportata_il'];
        }
    } catch (PDOException $e) {}

    /* ── Decisione: bracket vince se è più recente della classifica ── */
    if ($bracket !== null) {
        if ($classifica === null || $bracketAt >= $classificaAt) {
            /* Torneo in corso (o nuovo torneo dopo l'ultimo export) */
            echo json_encode([
                'success'  => true,
                'gioco'    => $gioco,
                'bracket'  => $bracket,
                'saved_at' => date('Y-m-d H:i:s', $bracketAt),
            ]);
            exit;
        }
    }

    if ($classifica !== null) {
        /* Torneo concluso e nessun nuovo bracket più recente */
        echo json_encode([
            'success'      => true,
            'gioco'        => $gioco,
            'bracket'      => null,
            'classifica'   => $classifica,
            'turniGiocati' => $turniGiocati,
            'saved_at'     => $savedAt,
        ]);
        exit;
    }

    /* ── Niente ── */
    echo json_encode(['success' => true, 'gioco' => $gioco, 'bracket' => null]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
