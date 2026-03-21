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
            <div class="nav-dropdown" id="navDropdown">
                <a href="dashboard.php" class="nav-dropdown-toggle">Dashboard <span class="dropdown-arrow">▾</span></a>
                <div class="nav-dropdown-menu">
                    <a href="matchmaking.php"> Matchmaking</a>
                    <a href="squadre.php"> Squadre</a>
                    <a href="logout.php" class="dropdown-logout">⏻ Logout</a>
                </div>
            </div>
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

<div class="page-hero">
    <div class="hero-left">
        <h1>Match<span>making</span></h1>
        <p>Torneo a Punti — Sviluppo Orizzontale</p>
    </div>
    <div class="hero-actions">
        <button class="btn btn-outline" id="btnRefresh">↺ Ricarica squadre</button>
        <button class="btn btn-primary" id="btnNextRound" disabled>Nuovo Turno</button>
        <button class="btn btn-danger"  id="btnReset" style="display:none">✕ Reset</button>
        <button class="btn btn-win"     id="btnFinish" style="display:none" disabled>Concludi Torneo</button>
    </div>
</div>

<!-- ── GAME TABS ── -->
<div class="game-tabs-bar">
    <button class="game-tab active" data-gioco="valorant">
        <img class="manImg" src="../photo/val_icon.jpg"></img>
        <span class="gt-label">Valorant</span>
    </button>
    <button class="game-tab" data-gioco="r6">
        <img class="manImg" src="../photo/r6_icon.png"></img>
        <span class="gt-label">Rainbow Six</span>
    </button>
    <button class="game-tab" data-gioco="lol">
        <img class="manImg" src="../photo/lol_icon.png"></img>
        <span class="gt-label">League of Legends</span>
    </button>
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
            <p>Seleziona un gioco, poi clicca "Ricarica squadre" per iniziare.</p>
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

<footer class="site-footer">
    <div class="footer-center">
        <p class="footer-title">Torneo ITS Lazio Digital Gaming</p>
        <p class="footer-copy">© 2026 All rights reserved.</p>
    </div>
    <div class="footer-right">
        <p><a href="tel:+393281693209">☎ Ivan He — +39 328 169 3209</a></p>
        <p><a href="tel:+393518152561">☎ Emanuele Campus — +39 351 815 2561</a></p>
        <p><a href="mailto:itstorneoesports@gmail.com">✉ itstorneoesports@gmail.com</a></p>
    </div>
</footer>


<script src="../condivisi/darkmode.js"></script>
<script src="matchmaking.js"></script>
</body>
</html>