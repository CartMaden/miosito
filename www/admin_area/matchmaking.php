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
    <title>Matchmaking — Admin</title>
    <link rel="shortcut icon" href="../photo/favicon.ico">
    <link rel="stylesheet" href="../condivisi/headerdarkmode.css">
    <link rel="stylesheet" href="matchmaking.css">
</head>
<body class="dark-mode">

<header>
    <a href="../index.html"><img src="../photo/Logo_Laziodigital.png" alt="logo"></a>
    <nav>
        <a href="../calendario/calendario.html">Calendario</a>
        <a href="../news/news.html">News</a>
        <a href="../info/info.html">Info</a>
        <a href="../live/live.html">Live</a>
        <a href="../iscrizione/iscrizione.html">partecipa</a>
        <a href="../admin_area/login.php">Dashboard</a>
        <a href="squadre.php">Squadre</a>
        <a href="matchmaking.php">Matchmaking</a>
        <button id="darkModeToggle">⏾</button>
    </nav>
</header>

<div class="page-hero">
    <div class="hero-left">
        <h1>Match<span>making</span></h1>
        <p>Torneo a Punti (Svizzera) — Sviluppo Orizzontale</p>
    </div>
    <div class="hero-actions">
        <button class="btn btn-outline" id="btnRefresh">↺ Ricarica squadre</button>
        <button class="btn btn-primary" id="btnNextRound" disabled>⚡ Nuovo Turno</button>
        <button class="btn btn-danger"  id="btnReset" style="display:none">✕ Reset</button>
        <button class="btn btn-win" id="btnFinish" style="display:none" disabled>🏆 Concludi Torneo</button>
    </div>
</div>

<div class="stats-bar" id="statsBar">
    <div class="stat-item"><div class="stat-value" id="statSquadre">—</div><div class="stat-label">Squadre</div></div>
    <div class="stat-item"><div class="stat-value" id="statTurni">—</div><div class="stat-label">Turni Giocati</div></div>
    <div class="stat-item"><div class="stat-value" id="statPartite">—</div><div class="stat-label">Partite Totali</div></div>
    <div class="stat-item"><div class="stat-value" id="statAvgMMR">—</div><div class="stat-label">MMR medio</div></div>
</div>

<div class="main-wrap">
    <div id="roundsArea" class="horizontal-board">
        <div class="empty-state">
            <div class="icon">🎮</div>
            <h2>Nessun turno generato</h2>
            <p>Clicca "Ricarica squadre" per iniziare, poi genera il primo turno.</p>
        </div>
    </div>

    <div class="leaderboard-section" id="leaderboardSection" style="display:none">
        <div class="section-title">Classifica Globale</div>
        <table class="seed-table" id="leaderboardTable">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Caposquadra</th>
                    <th>Punti</th>
                    <th>MMR Totale</th>
                </tr>
            </thead>
            <tbody id="leaderboardBody"></tbody>
        </table>
    </div>
</div>

<div class="toast" id="toast"></div>

<script src="matchmaking.js"></script>
</body>
</html>