/* ============================================================
   calendario_bracket.js — Widget inline risultati torneo
   Multi-gioco: legge window.BRACKET_GIOCO per sapere quale
   gioco mostrare (default: 'valorant').
   Imposta window.BRACKET_GIOCO prima di includere questo script:
       <script>window.BRACKET_GIOCO = 'r6';</script>
   ============================================================ */

(function () {
    const GIOCO        = (window.BRACKET_GIOCO || 'valorant').toLowerCase();
    const ENDPOINT     = "../admin_area/get_bracket.php";
    const CONTAINER_ID = "bracketCalendario";
    const POLL_INTERVAL = 15000;

    const GAME_META = {
        valorant: { label: 'Valorant',          color: '#ff4655', icon: '🎯' },
        r6:       { label: 'Rainbow Six Siege',  color: '#f0a500', icon: '🛡️' },
        lol:      { label: 'League of Legends',  color: '#c89b3c', icon: '⚔️' },
    };
    const meta = GAME_META[GIOCO] || GAME_META['valorant'];

    /* ── XSS ESCAPE ── */
    function esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── CALCOLA CLASSIFICA ── */
    function buildLeaderboard(bracket) {
        const teams = new Map();

        bracket.forEach(round => {
            round.forEach(match => {
                [match.t1, match.t2].forEach(t => {
                    if (t && !teams.has(t.caposquadra)) {
                        teams.set(t.caposquadra, {
                            caposquadra: t.caposquadra,
                            mmr_totale: t.mmr_totale,
                            punti: 0, vinte: 0, perse: 0
                        });
                    }
                });

                if (match.winner && match.t2 !== null) {
                    const winner = teams.get(match.winner.caposquadra);
                    const loserName = match.t1.caposquadra === match.winner.caposquadra
                        ? match.t2.caposquadra : match.t1.caposquadra;
                    const loser = teams.get(loserName);
                    if (winner) { winner.punti++; winner.vinte++; }
                    if (loser)  { loser.perse++; }
                }
            });
        });

        return Array.from(teams.values()).sort((a, b) => {
            if (b.punti !== a.punti) return b.punti - a.punti;
            return b.mmr_totale - a.mmr_totale;
        });
    }

    /* ── RENDERING ── */
    function render(data) {
        const container = document.getElementById(CONTAINER_ID);
        if (!container) return;

        /* Torneo concluso */
        if (data.success && data.classifica && data.bracket === null) {
            const lb = data.classifica;
            const medalEmoji = ["🥇", "🥈", "🥉"];
            let html = `<div class="cal-bracket-wrap">
                <div class="cal-bracket-meta">
                    <span class="cal-bracket-label">${meta.icon} ${meta.label} — Torneo Concluso (${data.turniGiocati || 0} Turni)</span>
                </div>
                <div class="cal-leaderboard">
                    <div class="cal-leaderboard-title">🏆 Classifica Finale</div>
                    <div class="cal-leaderboard-rows">`;
            lb.forEach((team, i) => {
                const medal = i < 3 ? medalEmoji[i] : `${i + 1}°`;
                html += `<div class="cal-lb-row${i === 0 ? " cal-lb-row--top" : ""}">
                    <span class="cal-lb-pos">${medal}</span>
                    <span class="cal-lb-name">${esc(team.caposquadra)}</span>
                    <span class="cal-lb-record">${team.vinte ?? team.punti}V-${team.perse ?? 0}P</span>
                    <span class="cal-lb-pts">${team.punti} pt</span>
                </div>`;
            });
            html += `</div></div></div>`;
            container.innerHTML = html;
            return;
        }

        /* Nessun torneo */
        if (!data.success || !data.bracket || !data.bracket.length) {
            container.innerHTML = `<div class="cal-bracket-empty">
                <span class="cal-bracket-icon">${meta.icon}</span>
                <p>${meta.label} — Nessun torneo in corso.</p>
            </div>`;
            return;
        }

        const bracket     = data.bracket;
        const savedAt     = data.saved_at ? new Date(data.saved_at) : null;
        const leaderboard = buildLeaderboard(bracket);
        const medalEmoji  = ["🥇", "🥈", "🥉"];

        let html = `<div class="cal-bracket-wrap">`;

        if (savedAt) {
            html += `<div class="cal-bracket-meta">
                <span class="cal-bracket-label">${meta.icon} ${meta.label} — ${bracket.length} Turni Giocati</span>
                <span class="cal-bracket-ts">Aggiornato: ${savedAt.toLocaleString("it-IT")}</span>
            </div>`;
        }

        /* Classifica */
        if (leaderboard.length > 0) {
            html += `<div class="cal-leaderboard">
                <div class="cal-leaderboard-title">🏆 Classifica</div>
                <div class="cal-leaderboard-rows">`;
            leaderboard.forEach((team, i) => {
                const medal = i < 3 ? medalEmoji[i] : `${i + 1}°`;
                html += `<div class="cal-lb-row${i === 0 ? " cal-lb-row--top" : ""}">
                    <span class="cal-lb-pos">${medal}</span>
                    <span class="cal-lb-name">${esc(team.caposquadra)}</span>
                    <span class="cal-lb-record">${team.vinte}V-${team.perse}P</span>
                    <span class="cal-lb-pts">${team.punti} pt</span>
                </div>`;
            });
            html += `</div></div>`;
        }

        /* Turni */
        html += `<div class="cal-rounds">`;
        bracket.forEach((round, rIdx) => {
            const realMatches = round.filter(m => m.t2 !== null);
            const played  = realMatches.filter(m => m.winner !== null).length;
            const total   = realMatches.length;
            const isDone  = played === total && total > 0;

            html += `<div class="cal-round-block">
                <div class="cal-round-header">
                    <span class="cal-round-title">Turno ${rIdx + 1}</span>
                    <span class="cal-round-badge ${isDone ? "cal-badge--done" : played > 0 ? "cal-badge--partial" : "cal-badge--pending"}">
                        ${isDone ? "✓ Completato" : played > 0 ? `${played}/${total}` : "In attesa"}
                    </span>
                </div>
                <div class="cal-matches-list">`;

            round.forEach((match) => {
                const { t1, t2, winner } = match;
                const isBye  = t2 === null;

                if (isBye) {
                    html += `<div class="cal-match cal-match--bye">
                        <div class="cal-match-status">🔵</div>
                        <div class="cal-match-body">
                            <span class="cal-team-name">${esc(t1.caposquadra)}</span>
                            <span class="cal-vs">BYE</span>
                            <span class="cal-team-name" style="opacity:0.4">—</span>
                        </div>
                    </div>`;
                    return;
                }

                const isDone2 = winner !== null;
                const t1Win   = isDone2 && winner.caposquadra === t1.caposquadra;
                const t2Win   = isDone2 && winner.caposquadra === t2.caposquadra;

                html += `<div class="cal-match ${isDone2 ? "cal-match--done" : "cal-match--pending"}">
                    <div class="cal-match-status">${isDone2 ? "✓" : "⏳"}</div>
                    <div class="cal-match-body">
                        <div class="cal-team ${t1Win ? "cal-team--winner" : t2Win ? "cal-team--loser" : ""}">
                            <span class="cal-team-name">${esc(t1.caposquadra)}</span>
                            <span class="cal-team-mmr">${t1.mmr_totale.toLocaleString("it-IT")}</span>
                            ${t1Win ? `<span class="cal-win-badge">Win</span>` : ""}
                        </div>
                        <div class="cal-vs">VS</div>
                        <div class="cal-team ${t2Win ? "cal-team--winner" : t1Win ? "cal-team--loser" : ""}">
                            <span class="cal-team-name">${esc(t2.caposquadra)}</span>
                            <span class="cal-team-mmr">${t2.mmr_totale.toLocaleString("it-IT")}</span>
                            ${t2Win ? `<span class="cal-win-badge">Win</span>` : ""}
                        </div>
                    </div>
                </div>`;
            });

            html += `</div></div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    /* ── CSS INLINE ── */
    const style = document.createElement("style");
    style.textContent = `
        .cal-bracket-wrap { font-family: "Barlow Condensed", sans-serif; color: #e8e8ff; }
        .cal-bracket-meta { display:flex; justify-content:space-between; align-items:center; padding:10px 0 18px; border-bottom:1px solid #252545; margin-bottom:20px; flex-wrap:wrap; gap:8px; }
        .cal-bracket-label { font-family:"Rajdhani",sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${meta.color}; }
        .cal-bracket-ts { font-size:12px; color:#6868aa; }
        .cal-leaderboard { background:rgba(74,127,255,0.05); border:1px solid #252545; border-radius:4px; margin-bottom:28px; overflow:hidden; }
        .cal-leaderboard-title { font-family:"Rajdhani",sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:${meta.color}; padding:10px 16px; background:rgba(74,127,255,0.08); border-bottom:1px solid #252545; }
        .cal-leaderboard-rows { display:flex; flex-direction:column; }
        .cal-lb-row { display:flex; align-items:center; gap:10px; padding:9px 16px; border-bottom:1px solid #1a1a2e; transition:background 0.15s; }
        .cal-lb-row:last-child { border-bottom:none; }
        .cal-lb-row:hover { background:rgba(74,127,255,0.06); }
        .cal-lb-row--top { background:rgba(34,197,94,0.06); }
        .cal-lb-pos { font-family:"Rajdhani",sans-serif; font-size:15px; font-weight:700; width:28px; flex-shrink:0; }
        .cal-lb-name { flex:1; font-size:14px; font-weight:600; color:#e8e8ff; }
        .cal-lb-record { font-size:12px; color:#6868aa; font-family:"Rajdhani",sans-serif; }
        .cal-lb-pts { font-family:"Rajdhani",sans-serif; font-size:16px; font-weight:700; color:#22c55e; min-width:40px; text-align:right; }
        .cal-rounds { display:flex; flex-direction:column; gap:20px; }
        .cal-round-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; padding-bottom:6px; border-bottom:1px solid #252545; }
        .cal-round-title { font-family:"Rajdhani",sans-serif; font-size:13px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#6868aa; }
        .cal-round-badge { font-family:"Rajdhani",sans-serif; font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:2px 8px; border-radius:2px; }
        .cal-badge--done    { background:rgba(34,197,94,0.12);  color:#22c55e; border:1px solid rgba(34,197,94,0.3); }
        .cal-badge--partial { background:rgba(74,127,255,0.12); color:#4a7fff; border:1px solid rgba(74,127,255,0.3); }
        .cal-badge--pending { background:rgba(104,104,170,0.1); color:#6868aa; border:1px solid rgba(104,104,170,0.2); }
        .cal-matches-list { display:flex; flex-direction:column; gap:8px; }
        .cal-match { display:flex; align-items:center; gap:14px; background:#16162a; border:1px solid #252545; border-radius:3px; padding:10px 14px; transition:border-color 0.2s; }
        .cal-match--done    { border-left:3px solid #22c55e; }
        .cal-match--pending { border-left:3px solid rgba(74,127,255,0.35); }
        .cal-match--bye     { border-left:3px solid #252545; opacity:0.6; }
        .cal-match-status { font-size:14px; flex-shrink:0; width:20px; text-align:center; }
        .cal-match-body   { display:flex; align-items:center; gap:12px; flex:1; flex-wrap:wrap; }
        .cal-team { display:flex; align-items:center; gap:8px; flex:1; min-width:100px; }
        .cal-team-name { font-size:14px; font-weight:600; color:#e8e8ff; }
        .cal-team--winner .cal-team-name { color:#22c55e; }
        .cal-team--loser  .cal-team-name { opacity:0.35; text-decoration:line-through; text-decoration-color:rgba(255,51,85,0.4); }
        .cal-team--loser  .cal-team-mmr  { opacity:0.35; }
        .cal-team-mmr { font-family:"Rajdhani",sans-serif; font-size:12px; font-weight:700; color:${meta.color}; }
        .cal-win-badge { font-family:"Rajdhani",sans-serif; font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; background:rgba(34,197,94,0.15); color:#22c55e; border:1px solid rgba(34,197,94,0.3); padding:1px 6px; border-radius:2px; }
        .cal-vs { font-family:"Rajdhani",sans-serif; font-size:11px; font-weight:700; letter-spacing:2px; color:#6868aa; flex-shrink:0; }
        .cal-bracket-empty { text-align:center; padding:40px 20px; color:#6868aa; }
        .cal-bracket-icon { display:block; font-size:36px; margin-bottom:10px; }
        @media (max-width:600px) {
            .cal-bracket-meta { flex-direction:column; align-items:flex-start; }
            .cal-match-body   { flex-direction:column; align-items:flex-start; gap:6px; }
            .cal-vs           { display:none; }
        }
    `;
    document.head.appendChild(style);

    /* ── FETCH + POLLING ── */
    async function fetchAndRender() {
        try {
            const res  = await fetch(`${ENDPOINT}?gioco=${GIOCO}&t=${Date.now()}`);
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

    /* ── INIT ── */
    document.addEventListener("DOMContentLoaded", () => {
        fetchAndRender();
        setInterval(fetchAndRender, POLL_INTERVAL);
    });

})();
