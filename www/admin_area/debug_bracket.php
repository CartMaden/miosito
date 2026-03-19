<?php
/**
 * debug_bracket.php
 * FILE TEMPORANEO DI DIAGNOSTICA — rimuovilo dopo l'uso.
 * Accedilo da browser: https://tuosito/admin_area/debug_bracket.php
 */
session_start();
if (!isset($_SESSION['admin_loggato']) || $_SESSION['admin_loggato'] !== true) {
    die("Non autorizzato. Devi essere loggato come admin.");
}

define('DB_HOST',    'db');
define('DB_NAME',    'area_privata');
define('DB_USER',    'root');
define('DB_PASS',    'root');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: text/html; charset=utf-8');

try {
    $dsn = "mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=".DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    echo "<h2>Tabelle esistenti</h2><pre>";
    foreach ($pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_NUM) as $r) echo $r[0]."\n";
    echo "</pre>";

    /* bracket_state */
    echo "<h2>bracket_state (contenuto completo)</h2>";
    try {
        $rows = $pdo->query("SELECT gioco, LEFT(bracket_json,300) AS preview, updated_at FROM bracket_state")->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) { echo "<p style='color:red'>TABELLA VUOTA — nessun bracket salvato.</p>"; }
        else {
            echo "<table border='1' cellpadding='6'><tr><th>gioco</th><th>updated_at</th><th>bracket_json (primi 300 char)</th></tr>";
            foreach ($rows as $r) {
                echo "<tr><td>{$r['gioco']}</td><td>{$r['updated_at']}</td><td><pre>".htmlspecialchars($r['preview'])."</pre></td></tr>";
            }
            echo "</table>";
        }
    } catch (Exception $e) { echo "<p style='color:red'>Tabella bracket_state non esiste: ".$e->getMessage()."</p>"; }

    /* classifiche_finali */
    echo "<h2>classifiche_finali</h2>";
    try {
        $rows = $pdo->query("SELECT gioco, turni_giocati, esportata_il FROM classifiche_finali ORDER BY esportata_il DESC")->fetchAll(PDO::FETCH_ASSOC);
        if (!$rows) echo "<p>Nessuna classifica finale salvata.</p>";
        else {
            echo "<table border='1' cellpadding='6'><tr><th>gioco</th><th>turni</th><th>esportata_il</th></tr>";
            foreach ($rows as $r) echo "<tr><td>{$r['gioco']}</td><td>{$r['turni_giocati']}</td><td>{$r['esportata_il']}</td></tr>";
            echo "</table>";
        }
    } catch (Exception $e) { echo "<p style='color:red'>Tabella classifiche_finali non esiste: ".$e->getMessage()."</p>"; }

    /* Test scrittura diretta */
    echo "<h2>Test scrittura diretta in bracket_state</h2>";
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `bracket_state` (
            gioco VARCHAR(20) NOT NULL,
            bracket_json LONGTEXT,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (gioco)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $testJson = json_encode([["t1"=>["caposquadra"=>"TEST"],"t2"=>null,"winner"=>["caposquadra"=>"TEST"]]]);
        $stmt = $pdo->prepare("REPLACE INTO `bracket_state` (gioco, bracket_json, updated_at) VALUES (?, ?, NOW())");
        $stmt->execute(['debug_test', $testJson]);
        echo "<p style='color:green'>✅ Scrittura OK. Righe affette: ".$stmt->rowCount()."</p>";

        $row = $pdo->query("SELECT bracket_json FROM bracket_state WHERE gioco='debug_test'")->fetch(PDO::FETCH_ASSOC);
        echo "<p style='color:green'>✅ Rilettura OK: <code>".htmlspecialchars(substr($row['bracket_json'],0,100))."</code></p>";

        $pdo->exec("DELETE FROM bracket_state WHERE gioco='debug_test'");
    } catch (Exception $e) {
        echo "<p style='color:red'>❌ Errore scrittura: ".$e->getMessage()."</p>";
    }

    /* Mostra il PHP di save_bracket attualmente deployato */
    echo "<h2>Percorso file save_bracket.php</h2>";
    $path = __DIR__."/save_bracket.php";
    if (file_exists($path)) {
        echo "<p>File trovato: <code>$path</code></p>";
        echo "<pre>".htmlspecialchars(file_get_contents($path))."</pre>";
    } else {
        echo "<p style='color:red'>File NOT trovato in: $path</p>";
    }

    echo "<h2>Percorso file get_bracket.php</h2>";
    $path2 = __DIR__."/get_bracket.php";
    if (file_exists($path2)) {
        echo "<p>File trovato: <code>$path2</code></p>";
        echo "<pre>".htmlspecialchars(file_get_contents($path2))."</pre>";
    } else {
        echo "<p style='color:red'>File NOT trovato in: $path2</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color:red'>Errore connessione DB: ".$e->getMessage()."</p>";
}
