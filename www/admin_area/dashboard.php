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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pannello di Controllo</title>
    <link rel="stylesheet" href="../condivisi/headerdarkmode.css">
    <link rel="stylesheet" href="dashboard.css">
    <link rel="shortcut icon" href="../photo/favicon.ico">

</head>

<body>
    <header>
        <a href="../index.html"><img src="../photo/Logo_Laziodigital.png" alt="logo"></a>
        <nav>
            <a href="../info/info.html">Info</a>
            <a href="../calendario/calendario.html">Calendario</a>
            <a href="../classifica/classifiche.html">Classifica</a>
            <a href="../news/news.html">News</a>
            <a href="../live/live.html">Live</a>
            <a href="../iscrizione/iscrizione.html">Iscriviti</a>
            <a href="squadre.html">Squadre</a>
            <a href="matchmaking.html">Matchmaking</a>
            <button id="darkModeToggle">⏾</button>
        </nav>
    </header>
    <div class="wrapper">
        <main style="padding: 20px;">
            <button class="btn-dashboard" onclick="location.href='matchmaking.html'">Avvia il matchmaking</button>
            <button class="btn-dashboard" onclick="location.href='squadre.html'">Visualizza squadre Iscritte</button>
            <button class="btn-dashboard" onclick="location.href='logout.php'" style="background-color: red;">Esci(Logout)</buton>
        </main>
    </div>
    <script src="../condivisi/darkmode.js"></script>
</body>
</html>