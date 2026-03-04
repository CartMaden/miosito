<?php
session_start();

// IL BUTTAFUORI: Se non hai il pass (la sessione), torni al login
if (!isset($_SESSION['admin_loggato']) || $_SESSION['admin_loggato'] !== true) {
    header("Location: login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Pannello di Controllo</title>
</head>
<body style="font-family: Arial; padding: 20px;">


    <a href="matchmaking.php" >Avvia il matchmaking</a>
    <a href="logout.php" style="color: red;">Esci (Logout)</a>

</body>
</html>