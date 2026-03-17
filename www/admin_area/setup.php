<?php
// ✅ Con Docker: host = "db" (nome del servizio nel docker-compose), password = "root"
$host = 'db';
$user = 'root';
$pass = 'root';

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
    $passwordHashata = password_hash($passwordAdmin, PASSWORD_DEFAULT);

    // Evitiamo di creare duplicati se ricarichi la pagina
    $check = $pdo->prepare("SELECT id FROM admin WHERE username = ?");
    $check->execute([$usernameAdmin]);
    
    if($check->rowCount() == 0) {
        $insert = $pdo->prepare("INSERT INTO admin (username, password) VALUES (?, ?)");
        $insert->execute([$usernameAdmin, $passwordHashata]);
    }

    // Reindirizza al login in entrambi i casi
    header("Location: login.php");
    exit;

} catch(PDOException $e) {
    die("Errore di connessione: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="3;url=login.php">
    <title>Setup</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center;
               align-items: center; height: 100vh; margin: 0; background: #0a0a12; color: #e8e8ff; }
        p { font-size: 18px; letter-spacing: 1px; opacity: 0.7; }
    </style>
</head>
<body>
    <p>⏳ Reindirizzamento in corso…</p>
</body>
</html>
