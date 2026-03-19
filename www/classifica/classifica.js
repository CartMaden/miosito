/* ============================================================
   classifica.js — Classifica Torneo a Punti (Swiss)
   Multi-gioco: Valorant / Rainbow Six Siege / League of Legends

   Tre stati per ogni gioco:
   1. TORNEO NON INIZIATO  → bracket === null e nessuna classifica finale
   2. IN CORSO / PROVVISORIA → bracket presente
   3. CONCLUSO / FINALE    → classifica esportata (bracket === null, classifica presente)

   Polling ogni 15 secondi durante il torneo.
   ============================================================ */

(function () {

    const POLL_INTERVAL = 15000;
    const START_DATE    = new Date("2026-05-15T00:00:00");
    const ENDPOINT      = "../admin_area/get_bracket.php";

    const GAME_META = {
        valorant: { label: 'Valorant',            color: '#ff4655', icon: '🎯' },
        r6:       { label: 'Rainbow Six Siege',    color: '#f0a500', icon: '🛡️' },
        lol:      { label: 'League of Legends',    color: '#c89b3c', icon: '⚔️' },
    };

    let currentGame    = 'valorant';
    let lastJSON       = null;
    let pollingTimer   = null;
    let countdownTimer = null;

    /* ── UTILS ── */
    function esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    function showToast(msg) {
        const t = document.getElementById("toast");
        if (!t) return;
        t.textContent = msg;
        t.className = "toast show";
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = "toast"; }, 3000);
    }

    /* ── GAME TABS ── */
    function initGameTabs() {
        document.querySelectorAll(".game-tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.dataset.gioco === currentGame) return;
                currentGame = btn.dataset.gioco;

                document.querySelectorAll(".game-tab-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                /* accento colore dinamico */
                document.documentElement.style.setProperty('--game-accent', GAME_META[currentGame].color);

                lastJSON = null;
                if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
                document.getElementById("claContent").innerHTML =
                    `<div class="empty-state"><div class="empty-icon">⏳</div><h2>Caricamento…</h2></div>`;
                refresh(true);
            });
        });
    }

    /* ── FETCH ── */
    async function fetchData() {
        const res  = await fetch(`${ENDPOINT}?gioco=${currentGame}&t=${Date.now()}`);
        const json = await res.json();
        return json;
    }

    /* ── CALCOLA CLASSIFICA DAL BRACKET ── */
    function buildLeaderboardFromBracket(bracket) {
        const teams = new Map();

        bracket.forEach(round => {
            round.forEach(match => {
                [match.t1, match.t2].forEach(t => {
                    if (t && !teams.has(t.caposquadra)) {
                        teams.set(t.caposquadra, {
                            caposquadra: t.caposquadra,
                            corso:       t.corso      || "",
                            mmr_totale:  t.mmr_totale || 0,
                            punti: 0, vinte: 0, perse: 0,
                        });
                    }
                });

                if (match.winner && match.t2 !== null) {
                    const w = teams.get(match.winner.caposquadra);
                    const loserName = match.t1.caposquadra === match.winner.caposquadra
                        ? match.t2.caposquadra : match.t1.caposquadra;
                    const l = teams.get(loserName);
                    if (w) { w.punti++; w.vinte++; }
                    if (l) { l.perse++; }
                }
            });
        });

        return Array.from(teams.values()).sort((a, b) => {
            if (b.punti !== a.punti) return b.punti - a.punti;
            return b.mmr_totale - a.mmr_totale;
        });
    }

    /* ── RENDER PODIO ── */
    function renderPodio(top3) {
        const medals  = ["🥇", "🥈", "🥉"];
        const classes = ["podio-card--1", "podio-card--2", "podio-card--3"];
        const order   = [1, 0, 2]; // visivo: 2° | 1° | 3°

        const cards = order.map(i => {
            const t = top3[i];
            if (!t) return `<div class="podio-card ${classes[i]}" data-medal="${medals[i]}"></div>`;
            return `
            <div class="podio-card ${classes[i]}" data-medal="${medals[i]}">
                <span class="podio-medal">${medals[i]}</span>
                <div class="podio-pos">${i + 1}° Posto</div>
                <div class="podio-name">${esc(t.caposquadra)}</div>
                <div class="podio-corso">${esc(t.corso)}</div>
                <div class="podio-pts">${t.punti}<span>pt</span></div>
            </div>`;
        });

        return `<div class="podio">${cards.join("")}</div>`;
    }

    /* ── RENDER TABELLA ── */
    function renderTable(leaderboard) {
        const medals = ["🥇", "🥈", "🥉"];
        const rowCls = ["row-gold", "row-silver", "row-bronze"];

        const rows = leaderboard.map((t, i) => {
            const pos    = i < 3 ? medals[i] : `${i + 1}°`;
            const cls    = i < 3 ? rowCls[i] : "";
            const record = `${t.vinte}V&nbsp;/&nbsp;${t.perse}P`;
            return `
            <tr class="${cls}">
                <td class="col-pos">${pos}</td>
                <td class="col-team">${esc(t.caposquadra)}</td>
                <td class="col-corso hide-mobile">${esc(t.corso)}</td>
                <td class="col-pts">${t.punti}</td>
                <td class="col-record hide-mobile">${record}</td>
                <td class="hide-mobile" style="font-family:'Rajdhani',sans-serif;font-size:13px;color:#7a8aaa;text-align:right">
                    ${t.mmr_totale.toLocaleString("it-IT")}
                </td>
            </tr>`;
        }).join("");

        return `
        <div class="cla-table-wrap">
            <table class="cla-table">
                <thead>
                    <tr>
                        <th class="col-pos">Pos</th>
                        <th>Squadra</th>
                        <th class="hide-mobile">Corso</th>
                        <th class="col-pts" style="text-align:center">Punti</th>
                        <th class="col-record hide-mobile" style="text-align:center">Record</th>
                        <th class="hide-mobile" style="text-align:right">MMR</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
    }

    /* ── STATO 1: TORNEO NON INIZIATO ── */
    function renderNotStarted() {
        if (countdownTimer) clearInterval(countdownTimer);
        const meta = GAME_META[currentGame];

        function getCountdown() {
            const diff = START_DATE - new Date();
            if (diff <= 0) return { giorni: 0, ore: 0, minuti: 0, secondi: 0 };
            return {
                giorni:  Math.floor(diff / 86400000),
                ore:     Math.floor((diff % 86400000) / 3600000),
                minuti:  Math.floor((diff % 3600000) / 60000),
                secondi: Math.floor((diff % 60000) / 1000),
            };
        }
        function pad(n) { return String(n).padStart(2, "0"); }

        document.getElementById("claContent").innerHTML = `
        <div class="waiting-card">
            <span class="waiting-trophy">${meta.icon}</span>
            <h2>${meta.label} — Il torneo non è ancora iniziato</h2>
            <p>La classifica sarà disponibile a partire dall'inizio del torneo.<br>
               Segna la data sul calendario e torna a trovarci!</p>
            <div class="waiting-date">📅 15 Maggio 2026</div>
            <div class="countdown" id="countdown">
                <div class="countdown-unit"><div class="countdown-value" id="cd-giorni">--</div><div class="countdown-label">Giorni</div></div>
                <div class="countdown-unit"><div class="countdown-value" id="cd-ore">--</div><div class="countdown-label">Ore</div></div>
                <div class="countdown-unit"><div class="countdown-value" id="cd-minuti">--</div><div class="countdown-label">Minuti</div></div>
                <div class="countdown-unit"><div class="countdown-value" id="cd-secondi">--</div><div class="countdown-label">Secondi</div></div>
            </div>
        </div>`;

        function tick() {
            const c = getCountdown();
            const g = document.getElementById("cd-giorni");
            const o = document.getElementById("cd-ore");
            const m = document.getElementById("cd-minuti");
            const s = document.getElementById("cd-secondi");
            if (g) g.textContent = pad(c.giorni);
            if (o) o.textContent = pad(c.ore);
            if (m) m.textContent = pad(c.minuti);
            if (s) s.textContent = pad(c.secondi);
        }
        tick();
        countdownTimer = setInterval(tick, 1000);
    }

    /* ── STATO 2: TORNEO IN CORSO ── */
    function renderProvisional(bracket, savedAt) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

        const leaderboard      = buildLeaderboardFromBracket(bracket);
        const turniCompletati  = bracket.filter(r => r.every(m => m.winner !== null)).length;

        let html = "";
        if (savedAt) {
            html += `<div class="last-update">Aggiornato: ${new Date(savedAt).toLocaleString("it-IT")}</div>`;
        }
        html += `
        <div class="status-banner status-banner--provisional">
            <span class="status-banner-icon">⚠️</span>
            <div class="status-banner-body">
                <h3>Classifica Provvisoria — ${esc(GAME_META[currentGame].label)}</h3>
                <p>Il torneo è ancora in corso. La classifica si aggiorna automaticamente e diventerà <strong>ufficiale e definitiva</strong> solo alla conclusione di tutti i turni.</p>
            </div>
        </div>`;

        if (turniCompletati > 0) {
            html += `<div class="turni-badge">⚔️ ${turniCompletati} turno${turniCompletati !== 1 ? "i" : ""} completato${turniCompletati !== 1 ? "i" : ""} su ${bracket.length}</div>`;
        }

        if (leaderboard.length >= 3) html += renderPodio(leaderboard.slice(0, 3));
        html += renderTable(leaderboard);
        document.getElementById("claContent").innerHTML = html;
    }

    /* ── STATO 3: TORNEO CONCLUSO ── */
    function renderFinal(classifica, turniGiocati) {
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

        const leaderboard = classifica.map(t => ({
            ...t,
            vinte: t.vinte ?? t.punti ?? 0,
            perse: t.perse ?? 0,
        }));

        let html = `
        <div class="status-banner status-banner--final">
            <span class="status-banner-icon">🏆</span>
            <div class="status-banner-body">
                <h3>Classifica Finale — ${esc(GAME_META[currentGame].label)}</h3>
                <p>Il torneo si è concluso dopo <strong>${turniGiocati} turni</strong>. Questa è la classifica definitiva delle E-Olimpiadi Lazio Digital 2026.</p>
            </div>
        </div>`;

        if (leaderboard.length >= 3) html += renderPodio(leaderboard.slice(0, 3));
        html += renderTable(leaderboard);
        document.getElementById("claContent").innerHTML = html;
    }

    /* ── RENDER ROUTER ── */
    function render(data) {
        if (data.success && data.classifica && data.bracket === null) {
            renderFinal(data.classifica, data.turniGiocati || 0);
            return;
        }
        if (data.success && data.bracket && data.bracket.length > 0) {
            renderProvisional(data.bracket, data.saved_at);
            return;
        }
        renderNotStarted();
    }

    /* ── POLLING ── */
    async function refresh(silent = false) {
        try {
            const data = await fetchData();
            const prev = JSON.stringify(lastJSON);
            const curr = JSON.stringify(data);
            if (prev && prev !== curr && !silent) showToast("🔄 Classifica aggiornata");
            lastJSON = data;
            render(data);
        } catch (err) {
            if (!lastJSON) renderNotStarted();
        }
    }

    function startPolling() {
        if (pollingTimer) clearInterval(pollingTimer);
        pollingTimer = setInterval(() => refresh(false), POLL_INTERVAL);
    }

    /* ── INIT ── */
    document.addEventListener("DOMContentLoaded", () => {
        /* imposta colore accent iniziale */
        document.documentElement.style.setProperty('--game-accent', GAME_META[currentGame].color);
        initGameTabs();
        refresh(true);
        startPolling();
    });

})();
