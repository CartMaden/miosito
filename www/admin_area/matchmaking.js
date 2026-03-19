document.addEventListener("DOMContentLoaded", () => {
    let squadre    = [];
    let rounds     = [];
    let maxMMR     = 0;
    let currentGame = "valorant";

    const GAME_META = {
        valorant: { label: 'Valorant',          color: '#ff4655' },
        r6:       { label: 'Rainbow Six Siege',  color: '#f0a500' },
        lol:      { label: 'League of Legends',  color: '#c89b3c' },
    };

    const btnRefresh   = document.getElementById("btnRefresh");
    const btnNextRound = document.getElementById("btnNextRound");
    const btnReset     = document.getElementById("btnReset");
    const btnFinish    = document.getElementById("btnFinish");
    const roundsArea   = document.getElementById("roundsArea");

    btnRefresh.addEventListener("click",   loadSquadre);
    btnNextRound.addEventListener("click", generateNextRound);
    btnReset.addEventListener("click",     resetTournament);
    btnFinish.addEventListener("click",    exportLeaderboard);

    /* ── GAME TABS ── */
    document.querySelectorAll(".game-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            if (tab.dataset.gioco === currentGame) return;
            currentGame = tab.dataset.gioco;
            document.querySelectorAll(".game-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            document.documentElement.style.setProperty('--game-accent', GAME_META[currentGame].color);
            squadre = []; rounds = []; maxMMR = 0;
            renderUI();
            loadTournament().then(() => { if (rounds.length === 0) loadSquadre(); });
        });
    });

    document.documentElement.style.setProperty('--game-accent', GAME_META[currentGame].color);

    /* ── TOAST ── */
    function showToast(msg, isError = false) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.className = "toast show" + (isError ? " error" : "");
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = "toast"; }, 3200);
    }

    /* ── CARICA SQUADRE ── */
    async function loadSquadre() {
        btnRefresh.disabled = true;
        btnRefresh.textContent = "Caricamento…";
        try {
            const res  = await fetch(`get_iscrizioni.php?gioco=${currentGame}&orderby=mmr`);
            const json = await res.json();
            if (!json.success) throw new Error(json.message);
            squadre = json.data.map(s => ({ ...s, punti: 0 }));
            maxMMR  = squadre.length ? Math.max(...squadre.map(s => s.mmr_totale)) : 1;
            if (rounds.length > 0) rounds = [];
            recalculatePoints();
            renderUI();
            showToast(`✅ ${squadre.length} squadre caricate (${GAME_META[currentGame].label})`);
        } catch (err) {
            showToast("❌ Errore caricamento squadre: " + err.message, true);
        } finally {
            btnRefresh.disabled    = false;
            btnRefresh.textContent = "↺ Ricarica";
        }
    }

    /* ── RESET ── */
    async function resetTournament() {
        if (!confirm("Sei sicuro di voler azzerare l'intero torneo?")) return;
        rounds = [];
        squadre.forEach(s => s.punti = 0);
        await saveTournament();
        renderUI();
        showToast("🗑️ Torneo resettato");
    }

    /* ── RICALCOLA PUNTI ── */
    function recalculatePoints() {
        squadre.forEach(s => s.punti = 0);
        rounds.forEach(round => {
            round.forEach(match => {
                if (match.winner && match.t2 !== null) {
                    const t = squadre.find(s => s.caposquadra === match.winner.caposquadra);
                    if (t) t.punti += 1;
                }
            });
        });
    }

    /* ── BYE CHECK ── */
    function hasReceivedBye(caposquadra) {
        return rounds.some(r => r.some(m => m.t2 === null && m.t1.caposquadra === caposquadra));
    }

    /* ── GENERA TURNO ── */
    function generateNextRound() {
        if (squadre.length < 2) return;
        if (rounds.length > 0) {
            const last = rounds[rounds.length - 1];
            if (last.some(m => !m.winner)) {
                showToast("⚠️ Concludi tutte le partite del turno corrente!", true);
                return;
            }
        }

        recalculatePoints();
        const sorted = [...squadre].sort((a, b) => {
            if (b.punti !== a.punti) return b.punti - a.punti;
            return b.mmr_totale - a.mmr_totale;
        });

        const newRound = [];
        let byeTeam = null;

        if (sorted.length % 2 !== 0) {
            let byeIdx = -1;
            for (let i = sorted.length - 1; i >= 0; i--) {
                if (!hasReceivedBye(sorted[i].caposquadra)) { byeIdx = i; break; }
            }
            if (byeIdx === -1) byeIdx = sorted.length - 1;
            byeTeam = sorted.splice(byeIdx, 1)[0];
        }

        let idx = 0;
        while (idx < sorted.length) {
            newRound.push({ t1: sorted[idx++], t2: sorted[idx++], winner: null });
        }
        if (byeTeam) newRound.push({ t1: byeTeam, t2: null, winner: byeTeam });

        rounds.push(newRound);
        recalculatePoints();
        saveTournament();
        renderUI();
        setTimeout(() => { roundsArea.scrollLeft = roundsArea.scrollWidth; }, 100);
        showToast(`✅ Turno ${rounds.length} generato!`);
    }

    /* ── SET VINCITORE ── */
    function setWinner(roundIdx, matchIdx, teamSlot) {
        const match = rounds[roundIdx][matchIdx];
        if (!match.t1 || !match.t2) return;
        const newWinner = teamSlot === 1 ? match.t1 : match.t2;
        if (match.winner && match.winner.caposquadra === newWinner.caposquadra) return;
        match.winner = newWinner;
        recalculatePoints();
        saveTournament();
        renderUI();
    }

    /* ── ESPORTA CLASSIFICA ── */
    async function exportLeaderboard() {
        const sorted = [...squadre].sort((a, b) => {
            if (b.punti !== a.punti) return b.punti - a.punti;
            return b.mmr_totale - a.mmr_totale;
        });
        try {
            btnFinish.textContent = "Esportazione...";
            const res = await fetch("export_classifica.php", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ gioco: currentGame, classifica: sorted, turniGiocati: rounds.length }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`🏆 Torneo ${GAME_META[currentGame].label} concluso! Classifica esportata.`);
            } else {
                showToast("❌ Errore esportazione: " + (data.message || ""), true);
            }
        } catch (err) {
            showToast("❌ Impossibile esportare: " + err.message, true);
        } finally {
            btnFinish.textContent = "🏆 Concludi Torneo";
        }
    }

    /* ── RENDER UI ── */
    function renderUI() {
        const isReadyForNext = rounds.length === 0 || rounds[rounds.length - 1].every(m => m.winner !== null);
        const allDone        = rounds.length > 0 && rounds.every(r => r.every(m => m.winner !== null));
        btnNextRound.disabled   = !isReadyForNext || squadre.length < 2;
        btnReset.style.display  = rounds.length > 0 ? "inline-block" : "none";
        btnFinish.style.display = rounds.length > 0 ? "inline-block" : "none";
        btnFinish.disabled      = !allDone;
        updateStats();
        renderRounds();
        renderLeaderboard();
    }

    function updateStats() {
        const n = squadre.length;
        let partiteTot = 0;
        rounds.forEach(r => partiteTot += r.length);
        const avgMMR = n > 0 ? Math.round(squadre.reduce((a, s) => a + s.mmr_totale, 0) / n) : 0;
        document.getElementById("statSquadre").textContent  = n || "—";
        document.getElementById("statTurni").textContent    = rounds.length || "0";
        document.getElementById("statPartite").textContent  = partiteTot || "0";
        document.getElementById("statAvgMMR").textContent   = avgMMR > 0 ? avgMMR.toLocaleString("it-IT") : "—";
    }

    function renderRounds() {
        if (rounds.length === 0) {
            roundsArea.innerHTML = `<div class="empty-state">
                <div class="icon">🎮</div>
                <h2>Nessun turno generato</h2>
                <p>Clicca "Nuovo Turno" per iniziare il torneo.</p>
            </div>`;
            return;
        }
        let html = "";
        rounds.forEach((matches, rIdx) => {
            html += `<div class="round-section">
                <div class="round-header">Turno ${rIdx + 1}</div>
                <div class="round-content">`;
            matches.forEach((match, mIdx) => {
                const { t1, t2, winner } = match;
                const isBye  = t2 === null;
                const isDone = winner !== null;
                const canVote = t1 !== null && t2 !== null;
                html += `<div class="match-card${isDone ? " match-done" : ""}">`;
                html += `<div class="match-num">Match ${mIdx + 1} ${isBye ? "(BYE)" : ""}</div>`;
                html += teamRowHTML(t1, 1, winner, canVote, rIdx, mIdx);
                if (isBye) {
                    html += `<div class="team-row" style="opacity:0.4;justify-content:center;">
                                <span class="team-name" style="text-align:center;width:100%;">— BYE —</span>
                             </div>`;
                } else {
                    html += teamRowHTML(t2, 2, winner, canVote, rIdx, mIdx);
                }
                html += `</div>`;
            });
            html += `</div></div>`;
        });
        roundsArea.innerHTML = html;
        roundsArea.querySelectorAll(".vote-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                setWinner(+btn.dataset.round, +btn.dataset.match, +btn.dataset.slot);
            });
        });
    }

    function teamRowHTML(team, slot, winner, canVote, rIdx, mIdx) {
        if (!team) return "";
        const isWinner = winner && winner.caposquadra === team.caposquadra;
        const isLoser  = winner && winner.caposquadra !== team.caposquadra;
        const rowCls   = isWinner ? " winner" : isLoser ? " loser" : "";
        let action = "";
        if (canVote && winner === null) {
            action = `<button class="vote-btn" data-round="${rIdx}" data-match="${mIdx}" data-slot="${slot}">Vittoria</button>`;
        } else if (isWinner) {
            action = `<span class="win-badge">✓</span>`;
        }
        const pts = squadre.find(s => s.caposquadra === team.caposquadra)?.punti || 0;
        return `<div class="team-row${rowCls}">
            <span class="team-pts">[${pts} pt]</span>
            <span class="team-name">${esc(team.caposquadra)}</span>
            <span class="team-mmr">${team.mmr_totale.toLocaleString("it-IT")}</span>
            ${action}
        </div>`;
    }

    function renderLeaderboard() {
        const section = document.getElementById("leaderboardSection");
        const tbody   = document.getElementById("leaderboardBody");
        if (squadre.length === 0) { section.style.display = "none"; return; }
        section.style.display = "block";
        const sorted = [...squadre].sort((a, b) => {
            if (b.punti !== a.punti) return b.punti - a.punti;
            return b.mmr_totale - a.mmr_totale;
        });
        tbody.innerHTML = sorted.map((s, i) => {
            const rankClass = i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "";
            return `<tr class="${rankClass}">
                <td><b>${i + 1}°</b></td>
                <td style="font-weight:600">${esc(s.caposquadra)}</td>
                <td class="pts-highlight">${s.punti}</td>
                <td style="color:var(--accent);font-family:'Rajdhani',sans-serif">${s.mmr_totale.toLocaleString("it-IT")}</td>
            </tr>`;
        }).join("");
    }

    function esc(str) {
        if (!str) return "";
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── SALVA BRACKET ── */
    async function saveTournament() {
        try {
            const res  = await fetch("save_bracket.php", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ gioco: currentGame, bracket: rounds }),
            });
            const json = await res.json();
            if (!json.success) {
                console.error("saveTournament failed:", json.message);
                showToast("⚠️ Salvataggio fallito: " + (json.message || "errore sconosciuto"), true);
            }
        } catch (err) {
            console.error("saveTournament error:", err);
            showToast("⚠️ Errore di rete durante il salvataggio!", true);
        }
    }

    /* ── CARICA BRACKET ── */
    async function loadTournament() {
        try {
            const res  = await fetch(`get_bracket.php?gioco=${currentGame}`);
            if (!res.ok) {
                console.warn("loadTournament HTTP error:", res.status);
                return;
            }
            const json = await res.json();
            if (!json.success || !json.bracket || json.bracket.length === 0) return;

            rounds = json.bracket;
            const teamsMap = new Map();
            rounds.forEach(r => r.forEach(m => {
                [m.t1, m.t2].forEach(t => {
                    if (t) {
                        teamsMap.set(t.caposquadra, t);
                        if (t.mmr_totale > maxMMR) maxMMR = t.mmr_totale;
                    }
                });
            }));
            squadre = Array.from(teamsMap.values()).map(t => ({ ...t, punti: 0 }));
            recalculatePoints();
            renderUI();
        } catch (err) {
            console.warn("loadTournament error:", err);
        }
    }

    /* ── INIT ── */
    loadTournament().then(() => { if (rounds.length === 0) loadSquadre(); });
});
