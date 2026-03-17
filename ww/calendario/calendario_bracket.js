/* ============================================================
   calendario_bracket.js
   Include questo script nella pagina calendario.html per
   mostrare i risultati del torneo bracket man mano che avanzano.

   Utilizzo in calendario.html:
     <div id="bracketCalendario"></div>
     <script src="../matchmaking/calendario_bracket.js"></script>
   (adatta il percorso a seconda della struttura delle cartelle)
   ============================================================ */

(function () {
    const ENDPOINT = "../admin_area/get_bracket.php"; // ← adatta il percorso
    const CONTAINER_ID = "bracketCalendario";
    const POLL_INTERVAL = 15000; // aggiorna ogni 15 secondi

    /* ── ROUND NAMES (copiata da matchmaking.js) ── */
    function buildRoundNames(total) {
        return Array.from({ length: total }, (_, i) => {
            const fromEnd = total - 1 - i;
            if (fromEnd === 0) return "Finale";
            if (fromEnd === 1) return "Semifinale";
            if (fromEnd === 2) return "Quarti di Finale";
            return `Turno ${i + 1}`;
        });
    }

    /* ── RENDERING ── */
    function render(data) {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;

        if (!data.success || !data.bracket) {
            container.innerHTML = `<div class="cal-bracket-empty">
                <span class="cal-bracket-icon">🎮</span>
                <p>Nessun torneo in corso al momento.</p>
            </div>`;
            return;
        }

        const bracket    = data.bracket;
        const roundNames = data.rounds?.length ? data.rounds : buildRoundNames(bracket.length);
        const savedAt    = data.saved_at ? new Date(data.saved_at) : null;

        // Appiattisci tutte le partite in un array arricchito, escludi i BYE
        const allMatches = [];
        bracket.forEach((round, rIdx) => {
            round.forEach((match, mIdx) => {
                const isBye = match.t2 === null || match.t1 === null;
                if (isBye) return; // i BYE non appaiono nel calendario
                allMatches.push({
                    roundName: roundNames[rIdx],
                    roundIdx:  rIdx,
                    matchIdx:  mIdx,
                    t1:        match.t1,
                    t2:        match.t2,
                    winner:    match.winner,
                });
            });
        });

        if (allMatches.length === 0) {
            container.innerHTML = `<div class="cal-bracket-empty">
                <span class="cal-bracket-icon">⏳</span>
                <p>Bracket generato — nessuna partita ancora disputata.</p>
            </div>`;
            return;
        }

        // Raggruppa per round
        const byRound = {};
        allMatches.forEach(m => {
            if (!byRound[m.roundName]) byRound[m.roundName] = [];
            byRound[m.roundName].push(m);
        });

        let html = `<div class="cal-bracket-wrap">`;

        // Header con timestamp
        if (savedAt) {
            html += `<div class="cal-bracket-meta">
                <span class="cal-bracket-label">Torneo in corso</span>
                <span class="cal-bracket-ts">Aggiornato: ${savedAt.toLocaleString("it-IT")}</span>
            </div>`;
        }

        Object.entries(byRound).forEach(([roundName, matches]) => {
            html += `<div class="cal-round-block">`;
            html += `<div class="cal-round-title">${roundName}</div>`;
            html += `<div class="cal-matches-list">`;

            matches.forEach(m => {
                const isDone   = m.winner !== null;
                const t1Win    = isDone && m.winner.caposquadra === m.t1.caposquadra;
                const t2Win    = isDone && m.winner.caposquadra === m.t2.caposquadra;
                const statusCls = isDone ? "cal-match--done" : "cal-match--pending";

                html += `<div class="cal-match ${statusCls}">
                    <div class="cal-match-status">${isDone ? "✓" : "⏳"}</div>
                    <div class="cal-match-body">
                        <div class="cal-team ${t1Win ? "cal-team--winner" : t2Win ? "cal-team--loser" : ""}">
                            <span class="cal-team-name">${esc(m.t1.caposquadra)}</span>
                            <span class="cal-team-mmr">${m.t1.mmr_totale.toLocaleString("it-IT")}</span>
                            ${t1Win ? `<span class="cal-win-badge">Vincitore</span>` : ""}
                        </div>
                        <div class="cal-vs">VS</div>
                        <div class="cal-team ${t2Win ? "cal-team--winner" : t1Win ? "cal-team--loser" : ""}">
                            <span class="cal-team-name">${esc(m.t2.caposquadra)}</span>
                            <span class="cal-team-mmr">${m.t2.mmr_totale.toLocaleString("it-IT")}</span>
                            ${t2Win ? `<span class="cal-win-badge">Vincitore</span>` : ""}
                        </div>
                    </div>
                </div>`;
            });

            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    /* ── FETCH + POLLING ── */
    async function fetchAndRender() {
        try {
            const res  = await fetch(ENDPOINT + "?t=" + Date.now()); // cache-bust
            const data = await res.json();
            render(data);
        } catch (err) {
            const container = document.getElementById(CONTAINER_ID);
            if (container) container.innerHTML = `<div class="cal-bracket-empty">
                <span class="cal-bracket-icon">⚠️</span>
                <p>Impossibile caricare i risultati del torneo.</p>
            </div>`;
        }
    }

    /* ── XSS ESCAPE ── */
    function esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── CSS INLINE (iniettato automaticamente, compatibile con il tema dark) ── */
    const style = document.createElement("style");
    style.textContent = `
        .cal-bracket-wrap {
            font-family: "Barlow Condensed", sans-serif;
            color: #e8e8ff;
        }
        .cal-bracket-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0 18px;
            border-bottom: 1px solid #252545;
            margin-bottom: 20px;
        }
        .cal-bracket-label {
            font-family: "Rajdhani", sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #4a7fff;
        }
        .cal-bracket-ts {
            font-size: 12px;
            color: #6868aa;
        }
        .cal-round-block {
            margin-bottom: 28px;
        }
        .cal-round-title {
            font-family: "Rajdhani", sans-serif;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #6868aa;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #252545;
        }
        .cal-matches-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .cal-match {
            display: flex;
            align-items: center;
            gap: 14px;
            background: #16162a;
            border: 1px solid #252545;
            border-radius: 3px;
            padding: 12px 16px;
            transition: border-color 0.2s;
        }
        .cal-match--done {
            border-left: 3px solid #22c55e;
        }
        .cal-match--pending {
            border-left: 3px solid #4a7fff44;
        }
        .cal-match-status {
            font-size: 16px;
            flex-shrink: 0;
            width: 20px;
            text-align: center;
        }
        .cal-match-body {
            display: flex;
            align-items: center;
            gap: 14px;
            flex: 1;
            flex-wrap: wrap;
        }
        .cal-team {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            min-width: 120px;
        }
        .cal-team--loser .cal-team-name {
            opacity: 0.4;
            text-decoration: line-through;
            text-decoration-color: rgba(255,51,85,0.4);
        }
        .cal-team--loser .cal-team-mmr { opacity: 0.4; }
        .cal-team-name {
            font-size: 15px;
            font-weight: 600;
            color: #e8e8ff;
        }
        .cal-team--winner .cal-team-name {
            color: #22c55e;
        }
        .cal-team-mmr {
            font-family: "Rajdhani", sans-serif;
            font-size: 12px;
            font-weight: 700;
            color: #4a7fff;
        }
        .cal-win-badge {
            font-family: "Rajdhani", sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            background: rgba(34,197,94,0.15);
            color: #22c55e;
            border: 1px solid rgba(34,197,94,0.3);
            padding: 2px 7px;
            border-radius: 2px;
        }
        .cal-vs {
            font-family: "Rajdhani", sans-serif;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 2px;
            color: #6868aa;
            flex-shrink: 0;
        }
        .cal-bracket-empty {
            text-align: center;
            padding: 40px 20px;
            color: #6868aa;
        }
        .cal-bracket-icon {
            display: block;
            font-size: 36px;
            margin-bottom: 10px;
        }
        @media (max-width: 600px) {
            .cal-match-body { flex-direction: column; align-items: flex-start; gap: 6px; }
            .cal-vs { display: none; }
        }
    `;
    document.head.appendChild(style);

    /* ── INIT ── */
    document.addEventListener("DOMContentLoaded", () => {
        fetchAndRender();
        setInterval(fetchAndRender, POLL_INTERVAL);
    });

})();
