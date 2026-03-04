<?php
// Credenziali di default per server locali come XAMPP o MAMP
$host = 'localhost';
$user = 'root';
$pass = ''; // MAMP su Mac di solito usa 'root' come password

try {
    // 1. Connessione a MySQL (senza selezionare un database)
    $pdo = new PDO("mysql:host=$host", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Creazione del Database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS area_privata");
    $pdo->exec("USE area_privata");

    // 3. Creazione della Tabella degli amministratori
    $sql = "CREATE TABLE IF NOT EXISTS admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    )";
    $pdo->exec($sql);

    // 4. Creazione dell'utente Admin (Password crittografata in modo sicuro!)
    $usernameAdmin = 'admin';
    $passwordAdmin = 'admin123'; // La password in chiaro che userai per entrare
    $passwordHasciata = password_hash($passwordAdmin, PASSWORD_DEFAULT);

    // Evitiamo di creare duplicati se ricarichi la pagina
    $check = $pdo->prepare("SELECT id FROM admin WHERE username = ?");
    $check->execute([$usernameAdmin]);
    
    if($check->rowCount() == 0) {
        $insert = $pdo->prepare("INSERT INTO admin (username, password) VALUES (?, ?)");
        $insert->execute([$usernameAdmin, $passwordHasciata]);
        echo "✅ Database, tabella e utente amministratore creati con successo!<br>";
        echo "Ora vai alla pagina <a href='login.php'>login.php</a>";
    } else {
        echo "L'utente admin esiste già. Vai al <a href='login.php'>login.php</a>";
    }

} catch(PDOException $e) {
    die("Errore di connessione: " . $e->getMessage());
}
?>