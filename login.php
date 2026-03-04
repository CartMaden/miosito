<?php
session_start();

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
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; margin-top: 100px; background: #f4f4f4;}
        .login-box { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        input { display: block; width: 100%; margin-bottom: 15px; padding: 10px; box-sizing: border-box;}
        button { padding: 10px 20px; background: #007BFF; color: white; border: none; cursor: pointer; width: 100%;}
        .errore { color: red; font-size: 14px; margin-bottom: 10px;}
    </style>
</head>
<body>
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
</body>
</html>