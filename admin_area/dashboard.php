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
    <link rel="stylesheet" href="dashboard.css">
</head>
<body style="font-family: Arial; padding: 20px;">


    <button onclick="location.href='matchmaking.php'" >Avvia il matchmaking</button>
    <button onclick="location.href='logout.php'" style="color: red;">Esci (Logout)</a>
    <button onclick="location.href='squadre.html'" >Visualizza squadre Iscritte</button>

</body>
</html>