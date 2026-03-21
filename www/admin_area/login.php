<?php
session_start();

// Se l'admin è già loggato, mandalo direttamente alla dashboard
if (isset($_SESSION['admin_loggato']) && $_SESSION['admin_loggato'] === true) {
    header("Location: dashboard.php");
    exit;
}

// ✅ CHECK: controlla se il database E la tabella admin esistono, altrimenti manda a setup.php
try {
    $pdo = new PDO("mysql:host=db;dbname=area_privata", "root", "root");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Controlla anche che la tabella admin esista
    $check = $pdo->query("SHOW TABLES LIKE 'admin'");
    if ($check->rowCount() === 0) {
        header("Location: setup.php");
        exit;
    }
} catch (PDOException $e) {
    // Database non trovato → vai a setup.php
    header("Location: setup.php");
    exit;
}

$errore = '';

// Se il modulo è stato inviato...
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Cerca l'utente nel database
    $stmt = $pdo->prepare("SELECT * FROM admin WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Se l'utente esiste E la password corrisponde a quella crittografata...
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['admin_loggato'] = true;
        $_SESSION['admin_username'] = $user['username'];
        
        header("Location: dashboard.php");
        exit;
    } else {
        $errore = "Username o password errati.";
    }
}
?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login Admin</title>
    <link rel="shortcut icon" href="../photo/favicon.ico">
    <link rel="stylesheet" href="login.css">
    <link rel="stylesheet" href="../condivisi/headerdarkmode.css">
</head>
<body>

<header>
    <a href="../index.html"><img src="../photo/Logo_Laziodigital.png" alt="logo"></a>
    <nav>
        <div class="nav-links" id="navLinks">
            <a href="../info/info.html">Info</a>
            <a href="../calendario/calendario.html">Calendario</a>
            <a href="../classifica/classifica.html">Classifica</a>
            <a href="../news/news.html">News</a>
            <a href="../live/live.html">Live</a>
            <a href="../merchandise/merchandise.php">Shop</a>
            <a href="../iscrizione/iscrizione.html">Partecipa</a>
        </div>
        <!-- Switch identico a index.html: darkmode.js usa toggle.checked -->
        <label class="switch" title="Toggle dark mode">
            <input type="checkbox" id="darkModeToggle">
            <span class="track"></span>
            <span class="thumb"></span>
        </label>
        <button class="hamburger" id="hamburger" aria-label="Apri menu" aria-expanded="false">
            <span></span>
            <span></span>
            <span></span>
        </button>
    </nav>
</header>

<div class="login-box">
    <h2>Accesso Riservato</h2>

    <?php if($errore): ?>
        <div class="errore"><?php echo $errore; ?></div>
    <?php endif; ?>

    <form method="POST" action="">
        <label>Username</label>
        <input type="text" name="username" required>

        <label>Password</label>
        <input type="password" name="password" required>

        <button type="submit">Entra</button>
    </form>
</div>

<script src="../condivisi/darkmode.js"></script>
</body>
</html>
