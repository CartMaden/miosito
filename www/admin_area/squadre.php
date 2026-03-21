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
    <title>Squadre Iscritte — Torneo ITS Lazio Digital Gaming</title>
    <link rel="stylesheet" href="../iscrizione/iscrizione.css">
    <link rel="shortcut icon" href="../photo/favicon.ico">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Barlow:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../condivisi/headerdarkmode.css">
    <link rel="stylesheet" href="squadre.css">
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
    <h1>Squadre Iscritte</h1>
    <p>Tutte le squadre registrate al Torneo ITS Lazio Digital Gaming</p>
</div>

<!-- ── GAME TABS ── -->
<div class="game-filter-bar">
    <button class="game-filter-btn active" data-gioco="valorant"><img class="manImg" src="../photo/val_icon.jpg"></img>
        Valorant
    </button>
    <button class="game-filter-btn" data-gioco="r6"><img class="manImg" src="../photo/r6_icon.png"></img>
        Rainbow Six Siege
    </button>
    <button class="game-filter-btn" data-gioco="lol"><img class="manImg" src="../photo/lol_icon.png"></img>
        League of Legends
    </button>
</div>

<div class="controls">
    <div class="controls-left">
        <button class="filter-btn active" data-corso="">Tutti</button>
        <button class="filter-btn" data-corso="Developer">Developer</button>
        <button class="filter-btn" data-corso="Cybersecurity">Cybersecurity</button>
        <button class="filter-btn" data-corso="Cloud Computing">Cloud Computing</button>
        <button class="filter-btn" data-corso="Game Developer">Game Developer</button>
        <button class="filter-btn" data-corso="Digital Media Specialist">Digital Media Specialist</button>
        <button class="filter-btn" data-corso="AI and Data Science Specialist">AI and Data Science Specialist</button>
    </div>
    <div style="display:flex;align-items:center;gap:12px;">
        <select class="sort-select" id="sortSelect">
            <option value="data_iscrizione">Data iscrizione</option>
            <option value="mmr">MMR totale</option>
            <option value="nome">Nome caposquadra</option>
            <option value="corso">Corso</option>
        </select>
        <span class="squad-count" id="squadCount"></span>
    </div>
</div>

<div class="grid" id="grid">
    <div class="state-box">
        <div class="spinner"></div>
        <p>Caricamento squadre…</p>
    </div>
</div>

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

<script src="squadre.js"></script>
<script src="../condivisi/darkmode.js"></script>
<script>
    // Dropdown toggle (click for mobile, hover handled by CSS for desktop)
    (function() {
        var dropdown = document.getElementById('navDropdown');
        if (!dropdown) return;
        var toggle = dropdown.querySelector('.nav-dropdown-toggle');
        var arrow  = dropdown.querySelector('.dropdown-arrow');

        toggle.addEventListener('click', function(e) {
            // On mobile (hamburger visible), toggle dropdown on click
            if (window.getComputedStyle(document.getElementById('hamburger')).display !== 'none') {
                e.preventDefault();
                dropdown.classList.toggle('open');
            }
            // On desktop, let the link navigate normally
        });

        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    })();
</script>
</body>
</html>