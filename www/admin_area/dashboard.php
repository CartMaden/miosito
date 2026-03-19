<?php
session_start();

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
        <div class="nav-links" id="navLinks">
            <a href="../info/info.html">Info</a>
            <a href="../calendario/calendario.html">Calendario</a>
            <a href="../classifica/classifica.html">Classifica</a>
            <a href="../news/news.html">News</a>
            <a href="../live/live.html">Live</a>
            <a href="../merchandise/merchandise.php">Shop</a>
            <a href="../iscrizione/iscrizione.html">Partecipa</a>
            <a href="dashboard.php">Dashboard</a>
            <a href="squadre.php">Squadre</a>
            <a href="matchmaking.php">Matchmaking</a>
        </div>
        <label class="switch" title="Toggle dark mode">
            <input type="checkbox" id="darkModeToggle">
            <span class="track"></span>
            <span class="thumb"></span>
        </label>
        <button class="hamburger" id="hamburger" aria-label="Apri menu" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>
    </nav>
</header>

<div class="wrapper">
    <main style="padding: 20px;">
        <button class="btn-dashboard" onclick="location.href='matchmaking.php'">Avvia il matchmaking</button>
        <button class="btn-dashboard" onclick="location.href='squadre.php'">Visualizza squadre iscritte</button>
        <button class="btn-dashboard" onclick="location.href='logout.php'" style="background-color: red;">Esci (Logout)</button>
    </main>
</div>

<script src="../condivisi/darkmode.js"></script>
<script>
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open);
    });
    navLinks.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
        });
    });
    document.addEventListener('click', e => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', false);
        }
    });
</script>
</body>
</html>
