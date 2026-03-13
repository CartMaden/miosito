<?php
session_start();

try {
    $pdo = new PDO("mysql:host=localhost;dbname=area_privata", "root", "");
} catch (PDOException $e) {
    header("Location: setup.php");
    exit;
}


// Se l'admin è già loggato, mandalo direttamente alla dashboard
if (isset($_SESSION['admin_loggato']) && $_SESSION['admin_loggato'] === true) {
    header("Location: dashboard.php");
    exit;
}

$errore = '';

// Se il modulo è stato inviato...
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Connessione al database creato prima
    $pdo = new PDO("mysql:host=localhost;dbname=area_privata", "root", "");

    // Cerca l'utente nel database
    $stmt = $pdo->prepare("SELECT * FROM admin WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    // Se l'utente esiste E la password corrisponde a quella crittografata...
    if ($user && password_verify($password, $user['password'])) {
        // Login effettuato! Creiamo la sessione (il "pass" per navigare)
        $_SESSION['admin_loggato'] = true;
        $_SESSION['admin_username'] = $user['username'];
        
        header("Location: dashboard.php"); // Reindirizza alla pagina segreta
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
    <title>Login Admin</title>
    <link rel="stylesheet" href="login.css">
</head>
<body>
    <div>
        <header>
            <a href="../index.html"><img src="../photo/Logo_Laziodigital.png" alt="logo"></a>
            <nav>
                <a href="../calendario/calendario.html">Calendario</a>
                <a href="../classifica/classifiche.html">Classifica</a>
                <a href="../news/news.html">News</a>
                <a href="../info/info.html">Info</a>
                <a href="../live/live.html">Live</a>
                <a href="../iscrizione/iscrizione.html">Iscriviti</a>
                <button id="darkModeToggle">⏾</button> 
            </nav>
        </header>
    </div>
    <div class="login-box">
        
        <?php if($errore): ?>
            <div class="errore"><?php echo $errore; ?></div>
        <?php endif; ?>

        <form method="POST" action="">
            <h2>Accesso Riservato</h2>
            <label>Username</label>
            <input type="text" name="username" required>
            
            <label>Password</label>
            <input type="password" name="password" required>
            
            <button type="submit">Entra</button>
        </form>
    </div>
    /*ciaone */
</body>
<script src="darkmode.js"></script>
</html>