/* ============================================================
   calendario.js — Logica della pagina calendario
   Legge il bracket da get_bracket.php (tramite calendario_bracket.js)
   e lo rende in una vista calendario interattiva con tab e stats.
   ============================================================ */

(function () {

    const POLL_INTERVAL = 15000;
    let   currentTab    = "tutti";
    let   lastData      = null;

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
        t.className   = "toast show";
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = "toast"; }, 3000);
    }

    function buildRoundNames(total) {
        return Array.from({ length: total }, (_, i) => {
            const fromEnd = total - 1 - i;
            if (fromEnd === 0) return "Finale";
            if (fromEnd === 1) return "Semifinale";
            if (fromEnd === 2) return "Quarti di Finale";
            return `Turno ${i + 1}`;
        });
    }

    /* ── FETCH ── */
    async function fetchBracket() {
        const res  = await fetch("../admin_area/get_bracket.php?t=" + Date.now());
        const json = await res.json();
        return json;
    }

    /* ── STATS ── */
    function updateStats(matches, bracket) {
        const totali    = matches.length;
        const giocate   = matches.filter(m => m.winner !== null).length;
        const rimanenti = totali - giocate;

        // Fase attuale = il nome del round più avanzato con almeno una partita giocata
        let faseAttuale = "—";
        const roundNames = bracket ? buildRoundNames(bracket.length) : [];
        if (bracket) {
            for (let r = bracket.length - 1; r >= 0; r--) {
                const hasPlayed = bracket[r].some(m => m.winner !== null && m.t1 && m.t2);
                if (hasPlayed) { faseAttuale = roundNames[r]; break; }
            }
            if (faseAttuale === "—" && totali > 0) faseAttuale = roundNames[0] ?? "—";
        }

        document.getElementById("statTotali").textContent    = totali    || "—";
        document.getElementById("statGiocate").textContent   = giocate   || "—";
        document.getElementById("statRimanenti").textContent = rimanenti || (totali ? "0" : "—");
        document.getElementById("statFase").textContent      = faseAttuale;

        // Live dot: visibile se ci sono partite in corso (giocate > 0 e rimanenti > 0)
        const liveDot = document.getElementById("liveDot");
        if (liveDot) liveDot.style.display = (giocate > 0 && rimanenti > 0) ? "flex" : "none";
    }

    /* ── RENDER ── */
    function render(data) {
        const content = document.getElementById("calContent");
        const tabBar  = document.getElementById("tabBar");
        if (!content) return;

        if (!data.success || !data.bracket) {
            content.innerHTML = `<div class="empty-state">
                <div class="icon">📅</div>
                <h2>Nessun torneo in corso</h2>
                <p>Il bracket non è ancora stato generato nella pagina Matchmaking.</p>
            </div>`;
            updateStats([], null);
            if (tabBar) tabBar.style.display = "none";
            return;
        }

        const bracket    = data.bracket;
        const roundNames = data.rounds?.length ? data.rounds : buildRoundNames(bracket.length);
        const savedAt    = data.saved_at ? new Date(data.saved_at) : null;

        // Appiattisci le partite reali (escludi BYE)
        const allMatches = [];
        bracket.forEach((round, rIdx) => {
            round.forEach((match, mIdx) => {
                if (match.t1 === null || match.t2 === null) return; // BYE
                allMatches.push({
                    roundName: roundNames[rIdx],
                    roundIdx:  rIdx,
                    matchIdx:  mIdx,
                    label:     `Partita ${rIdx + 1}.${mIdx + 1}`,
                    t1:        match.t1,
                    t2:        match.t2,
                    winner:    match.winner,
                });
            });
        });

        updateStats(allMatches, bracket);
        if (tabBar) tabBar.style.display = allMatches.length ? "flex" : "none";

        // Filtra in base al tab attivo
        let filtered = allMatches;
        if (currentTab === "risultati") filtered = allMatches.filter(m => m.winner !== null);
        if (currentTab === "prossime")  filtered = allMatches.filter(m => m.winner === null);

        if (filtered.length === 0) {
            const msg = currentTab === "risultati"
                ? "Nessuna partita ancora disputata."
                : currentTab === "prossime"
                    ? "Tutte le partite sono state giocate!"
                    : "Nessuna partita trovata.";
            content.innerHTML = `<div class="empty-state">
                <div class="icon">${currentTab === "risultati" ? "⏳" : "✅"}</div>
                <h2>${msg}</h2>
            </div>`;
            return;
        }

        // Campione
        const finalMatch  = bracket[bracket.length - 1]?.[0];
        const champion    = finalMatch?.winner ?? null;

        let html = "";

        // Timestamp aggiornamento
        if (savedAt) {
            html += `<div class="last-update">Aggiornato: ${savedAt.toLocaleString("it-IT")}</div>`;
        }

        // Banner campione (solo se il torneo è concluso)
        if (champion && currentTab !== "prossime") {
            html += `<div class="champion-card">
                <div class="champion-trophy">🏆</div>
                <div class="champion-info">
                    <div class="champion-label">Campione del torneo</div>
                    <div class="champion-name">${esc(champion.caposquadra)}</div>
                    <div class="champion-mmr">${champion.mmr_totale.toLocaleString("it-IT")} MMR</div>
                </div>
            </div>`;
        }

        // Raggruppa per round mantenendo l'ordine
        const roundOrder = [];
        const byRound    = {};
        filtered.forEach(m => {
            if (!byRound[m.roundName]) {
                byRound[m.roundName] = [];
                roundOrder.push(m.roundName);
            }
            byRound[m.roundName].push(m);
        });

        roundOrder.forEach(roundName => {
            const matches  = byRound[roundName];
            const total    = matches.length;
            const played   = matches.filter(m => m.winner !== null).length;

            let badgeCls, badgeTxt;
            if (played === total)       { badgeCls = "round-badge--done";    badgeTxt = "Completato"; }
            else if (played > 0)        { badgeCls = "round-badge--partial"; badgeTxt = `${played}/${total} disputate`; }
            else                        { badgeCls = "round-badge--pending"; badgeTxt = "In attesa"; }

            html += `<div class="round-block">`;
            html += `<div class="round-header">
                <div class="round-title">${roundName}</div>
                <span class="round-badge ${badgeCls}">${badgeTxt}</span>
                <div class="round-divider"></div>
            </div>`;
            html += `<div class="matches-grid">`;

            matches.forEach(m => {
                const isDone   = m.winner !== null;
                const t1Wins   = isDone && m.winner.caposquadra === m.t1.caposquadra;
                const t2Wins   = isDone && m.winner.caposquadra === m.t2.caposquadra;
                const cardCls  = isDone ? "match-card--done" : "match-card--pending";

                const t1Cls = t1Wins ? "team-slot--winner" : t2Wins ? "team-slot--loser" : "";
                const t2Cls = t2Wins ? "team-slot--winner" : t1Wins ? "team-slot--loser" : "";

                html += `<div class="match-card ${cardCls}">
                    <span class="match-label">${esc(m.label)}</span>

                    <!-- Indicatore sinistro -->
                    <div class="side-indicator">
                        <span class="win-chevron ${t1Wins ? "visible" : ""}">›</span>
                    </div>

                    <!-- Team 1 -->
                    <div class="team-slot ${t1Cls}">
                        <span class="team-name ${!m.t1 ? "tbd" : ""}">${m.t1 ? esc(m.t1.caposquadra) : "TBD"}</span>
                        ${m.t1 ? `<span class="team-mmr">${m.t1.mmr_totale.toLocaleString("it-IT")} MMR</span>` : ""}
                    </div>

                    <!-- Centro VS / risultato -->
                    <div class="match-center">
                        ${isDone
                            ? `<span class="result-icon">✓</span><span class="vs-label">Fine</span>`
                            : `<span class="vs-label">VS</span>`
                        }
                    </div>

                    <!-- Team 2 -->
                    <div class="team-slot team-slot--right ${t2Cls}">
                        <span class="team-name ${!m.t2 ? "tbd" : ""}">${m.t2 ? esc(m.t2.caposquadra) : "TBD"}</span>
                        ${m.t2 ? `<span class="team-mmr">${m.t2.mmr_totale.toLocaleString("it-IT")} MMR</span>` : ""}
                    </div>

                    <!-- Indicatore destro -->
                    <div class="side-indicator">
                        <span class="win-chevron ${t2Wins ? "visible" : ""}">‹</span>
                    </div>
                </div>`;
            });

            html += `</div></div>`;
        });

        content.innerHTML = html;
    }

    /* ── POLLING ── */
    async function refresh(silent = false) {
        try {
            const data = await fetchBracket();
            const prev = JSON.stringify(lastData);
            const curr = JSON.stringify(data);
            if (prev && prev !== curr && !silent) {
                showToast("🔄 Risultati aggiornati");
            }
            lastData = data;
            render(data);
        } catch (err) {
            if (!lastData) {
                const content = document.getElementById("calContent");
                if (content) content.innerHTML = `<div class="empty-state">
                    <div class="icon">⚠️</div>
                    <h2>Errore di connessione</h2>
                    <p>Impossibile recuperare i dati del torneo.</p>
                </div>`;
            }
        }
    }

    /* ── TAB LOGIC ── */
    function initTabs() {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".tab-btn");
            if (!btn) return;
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = btn.dataset.tab;
            if (lastData) render(lastData);
        });
    }

    /* ── INIT ── */
    document.addEventListener("DOMContentLoaded", () => {
        initTabs();
        refresh(true);
        setInterval(() => refresh(false), POLL_INTERVAL);
    });

})();
