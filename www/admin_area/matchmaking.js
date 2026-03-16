/* ============================================================
   matchmaking.js — Bracket a eliminazione diretta basato su MMR
   Algoritmo: abbinamento greedy ottimale (min divario MMR)
   Interazione: click su team per dichiararlo vincitore
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ── STATE ── */
    let squadre  = [];
    let bracket  = null;   // Array di round; ogni round è Array di match {t1, t2, winner}
    let maxMMR   = 0;

    /* ── ELEMENTS ── */
    const btnRefresh  = document.getElementById("btnRefresh");
    const btnGenerate = document.getElementById("btnGenerate");
    const btnReset    = document.getElementById("btnReset");
    const bracketArea = document.getElementById("bracketArea");

    /* ── EVENT LISTENERS ── */
    btnRefresh.addEventListener("click",  loadSquadre);
    btnGenerate.addEventListener("click", generateBracket);
    btnReset.addEventListener("click",    resetBracket);

    /* ── TOAST ── */
    function showToast(msg, isError = false) {
        const t = document.getElementById("toast");
        t.textContent = msg;
        t.className = "toast show" + (isError ? " error" : "");
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.className = "toast"; }, 3200);
    }

    /* ── LOAD SQUADRE ── */
    async function loadSquadre() {
        btnRefresh.disabled    = true;
        btnRefresh.textContent = "Caricamento…";

        try {
            const res  = await fetch("get_iscrizioni.php?orderby=mmr");
            const json = await res.json();

            if (!json.success) throw new Error(json.message);

            squadre = json.data;
            maxMMR  = squadre.length ? Math.max(...squadre.map(s => s.mmr_totale)) : 1;

            updateStats();
            renderSeeding();

            btnGenerate.disabled = squadre.length < 2;
            showToast(`✅ ${squadre.length} squadre caricate`);

            if (bracket) {
                bracket = null;
                bracketArea.innerHTML = emptyState("🔄", "Squadre aggiornate", "Rigenera il bracket per applicare le modifiche.");
                btnReset.style.display = "none";
            }

        } catch (err) {
            showToast("❌ Errore nel caricamento: " + err.message, true);
        } finally {
            btnRefresh.disabled    = false;
            btnRefresh.textContent = "↺ Aggiorna squadre";
        }
    }

    /* ── RESET ── */
    function resetBracket() {
        bracket = null;
        bracketArea.innerHTML = emptyState("🎮", "Bracket resettato", "Clicca \"Genera bracket\" per crearne uno nuovo.");
        btnReset.style.display = "none";
    }

    /* ── STATS ── */
    function updateStats() {
        const n      = squadre.length;
        const size   = n > 0 ? nextPow2(n) : 0;
        const rounds = size > 0 ? Math.log2(size) : 0;
        const totalMatches = size > 0 ? size - 1 : 0;
        const avgMMR = n > 0
            ? Math.round(squadre.reduce((a, s) => a + s.mmr_totale, 0) / n)
            : 0;

        document.getElementById("statSquadre").textContent = n || "—";
        document.getElementById("statPartite").textContent = totalMatches || "—";
        document.getElementById("statTurni").textContent   = rounds  || "—";
        document.getElementById("statAvgMMR").textContent  = avgMMR > 0
            ? avgMMR.toLocaleString("it-IT")
            : "—";
    }

    /* ── SEEDING TABLE ── */
    function renderSeeding() {
        const section = document.getElementById("seedingSection");
        const tbody   = document.getElementById("seedBody");

        if (!squadre.length) {
            section.style.display = "none";
            return;
        }

        section.style.display = "block";

        tbody.innerHTML = squadre.map((s, i) => {
            const barW = Math.round((s.mmr_totale / maxMMR) * 120);
            return `
            <tr>
                <td><span class="seed-num">${i + 1}</span></td>
                <td>${esc(s.caposquadra)}</td>
                <td>${esc(s.corso)}</td>
                <td>
                    <div class="mmr-bar-wrap">
                        <span style="min-width:70px">${s.mmr_totale.toLocaleString("it-IT")}</span>
                        <div class="mmr-bar" style="width:${barW}px"></div>
                    </div>
                </td>
                <td style="color:var(--muted);font-size:12px">${s.giocatori.length} giocatori</td>
            </tr>`;
        }).join("");
    }

    /* ══════════════════════════════════════════════════════════
       ALGORITMO DI ABBINAMENTO OTTIMALE (greedy min-diff MMR)
       ══════════════════════════════════════════════════════════
       Strategia:
         1. Ordina le squadre per MMR decrescente (seed 1 = MMR max).
         2. Riempi con BYE null fino alla prossima potenza di 2.
         3. Abbina seed 1 vs seed N, seed 2 vs seed N-1, …
            → minimizza il divario MMR massimo al primo turno e
              garantisce che le squadre più forti si incontrino
              il più tardi possibile nel bracket.
    ══════════════════════════════════════════════════════════ */
    function generateBracket() {
        if (squadre.length < 2) return;

        const seeded = [...squadre].sort((a, b) => b.mmr_totale - a.mmr_totale);
        const size   = nextPow2(seeded.length);

        // Riempi con BYE fino alla dimensione del bracket
        const padded = [...seeded];
        while (padded.length < size) padded.push(null);

        // Abbinamento ottimale: seed i vs seed (size-1-i)
        // es. size=8: 0vs7, 1vs6, 2vs5, 3vs4
        const firstRound = [];
        for (let i = 0; i < size / 2; i++) {
            firstRound.push({
                t1:     padded[i],
                t2:     padded[size - 1 - i],
                winner: null
            });
        }

        // Auto-avanza i BYE del primo turno
        firstRound.forEach(m => {
            if (m.t1 !== null && m.t2 === null) m.winner = m.t1;
            if (m.t1 === null && m.t2 !== null) m.winner = m.t2;
        });

        // Costruisce i round successivi come slot vuoti
        bracket = buildEmptyRounds(firstRound, size);
        propagateByes();

        renderBracket();
        btnReset.style.display = "";
        showToast(`✅ Bracket generato — ${bracket.length} turni, ${seeded.length} squadre`);
    }

    /* ── Crea la struttura di tutti i round (slot null per i turni futuri) ── */
    function buildEmptyRounds(firstRound, size) {
        const rounds = [firstRound];
        let prev = firstRound;
        while (prev.length > 1) {
            const next = [];
            for (let i = 0; i < prev.length; i += 2) {
                next.push({ t1: null, t2: null, winner: null });
            }
            rounds.push(next);
            prev = next;
        }
        return rounds;
    }

    /* ── Propagazione automatica dei BYE attraverso il bracket ── */
    function propagateByes() {
        for (let r = 0; r < bracket.length - 1; r++) {
            const cur  = bracket[r];
            const next = bracket[r + 1];
            for (let m = 0; m < cur.length; m++) {
                const matchWinner = cur[m].winner;
                const nextMatchIdx = Math.floor(m / 2);
                const isFirst      = m % 2 === 0;
                if (matchWinner !== null) {
                    if (isFirst) next[nextMatchIdx].t1 = matchWinner;
                    else         next[nextMatchIdx].t2 = matchWinner;
                }
            }
            // Auto-avanza BYE nel round successivo
            next.forEach(m => {
                if (m.t1 !== null && m.t2 === null) m.winner = m.t1;
                if (m.t1 === null && m.t2 !== null) m.winner = m.t2;
            });
        }
    }

    /* ── Dichiara il vincitore di una partita e aggiorna il bracket ── */
    function setWinner(roundIdx, matchIdx, teamSlot) {
        const match = bracket[roundIdx][matchIdx];

        // Impedisce di cambiare vincitore se il round successivo è già avanzato
        if (roundIdx < bracket.length - 1) {
            const nextMatchIdx = Math.floor(matchIdx / 2);
            const nextMatch    = bracket[roundIdx + 1][nextMatchIdx];
            const isFirst      = matchIdx % 2 === 0;
            const occupiedSlot = isFirst ? nextMatch.t1 : nextMatch.t2;

            // Se il round successivo ha già un vincitore per questo slot,
            // avvisa e non procedere (evita stati invalidi)
            if (nextMatch.winner !== null) {
                showToast("⚠️ Il turno successivo è già stato completato. Effettua prima un reset parziale.", true);
                return;
            }
        }

        // Annulla il precedente vincitore di questa partita nel bracket successivo
        if (match.winner !== null && roundIdx < bracket.length - 1) {
            const nextMatchIdx = Math.floor(matchIdx / 2);
            const isFirst      = matchIdx % 2 === 0;
            const nextMatch    = bracket[roundIdx + 1][nextMatchIdx];
            if (isFirst) nextMatch.t1 = null;
            else         nextMatch.t2 = null;
            nextMatch.winner = null;
            // Pulisci a cascata i round successivi
            clearFromRound(roundIdx + 1, nextMatchIdx);
        }

        // Imposta il nuovo vincitore
        match.winner = teamSlot === 1 ? match.t1 : match.t2;

        // Propaga
        propagateByes();
        renderBracket();
        showToast(`🏆 ${esc(match.winner.caposquadra)} avanza al turno successivo!`);
    }

    /* ── Pulisce a cascata il bracket da un certo round/match ── */
    function clearFromRound(roundIdx, matchIdx) {
        if (roundIdx >= bracket.length) return;
        const match    = bracket[roundIdx][matchIdx];
        const isFirst  = matchIdx % 2 === 0;
        const nextIdx  = Math.floor(matchIdx / 2);

        if (roundIdx < bracket.length - 1) {
            const nextMatch = bracket[roundIdx + 1][nextIdx];
            if (isFirst) nextMatch.t1 = null;
            else         nextMatch.t2 = null;
            nextMatch.winner = null;
            clearFromRound(roundIdx + 1, nextIdx);
        }

        match.t1     = (matchIdx % 2 === 0) ? match.t1 : null;
        match.t2     = (matchIdx % 2 === 0) ? null : match.t2;
        match.winner = null;
    }

    /* ══════════════════════════════════════════════════════════
       RENDER BRACKET
    ══════════════════════════════════════════════════════════ */
    function renderBracket() {
        const rounds      = bracket;
        const roundNames  = buildRoundNames(rounds.length);
        const BASE_CARD_H = 105;
        const BASE_GAP    = 16;

        // Trova il campione (vincitore dell'ultima partita)
        const finalMatch = rounds[rounds.length - 1][0];
        const champion   = finalMatch ? finalMatch.winner : null;

        let html = `<div class="bracket-container">`;

        rounds.forEach((matches, rIdx) => {
            const factor = Math.pow(2, rIdx);
            const slotH  = BASE_CARD_H * factor + BASE_GAP * (factor - 1) + BASE_GAP;

            html += `<div class="round-col">`;
            html += `<div class="round-header">${roundNames[rIdx]}</div>`;
            html += `<div class="round-matches">`;

            matches.forEach((match, mIdx) => {
                const { t1, t2, winner } = match;
                const isBye   = (t1 !== null && t2 === null) || (t1 === null && t2 !== null);
                const diff    = t1 && t2 ? Math.abs(t1.mmr_totale - t2.mmr_totale) : null;
                const isDone  = winner !== null;

                // Determina se i team sono cliccabili (partita giocabile)
                const canVote = t1 !== null && t2 !== null && !isBye;

                html += `<div class="match-wrapper" style="height:${slotH}px">`;
                html += `<div class="match-card${isDone ? " match-done" : ""}">`;
                html += `<div class="match-num">Partita ${rIdx + 1}.${mIdx + 1}${isBye ? " — BYE" : ""}</div>`;

                // Team 1
                html += teamRowHTML(t1, 1, winner, canVote, rIdx, mIdx);
                // Team 2
                if (isBye && t1 !== null) {
                    html += `<div class="team-row"><span class="team-seed">—</span><span class="team-name tbd">— BYE —</span></div>`;
                } else if (isBye && t2 !== null) {
                    html += `<div class="team-row"><span class="team-seed">—</span><span class="team-name tbd">— BYE —</span></div>`;
                    html += teamRowHTML(t2, 2, winner, canVote, rIdx, mIdx);
                } else {
                    html += teamRowHTML(t2, 2, winner, canVote, rIdx, mIdx);
                }

                if (diff !== null) {
                    html += `<div class="match-diff">Δ MMR ${diff.toLocaleString("it-IT")}</div>`;
                }
                html += `</div>`; // .match-card
                html += `</div>`; // .match-wrapper
            });

            html += `</div></div>`; // .round-matches .round-col
        });

        // Colonna campione
        const champFactor = Math.pow(2, rounds.length);
        const champSlotH  = BASE_CARD_H * champFactor + BASE_GAP * (champFactor - 1) + BASE_GAP;

        html += `<div class="round-col">`;
        html += `<div class="round-header">🏆 Campione</div>`;
        html += `<div class="round-matches">`;
        html += `<div class="match-wrapper" style="height:${champSlotH}px">`;

        if (champion) {
            html += `<div class="champion-box">
                <div class="trophy">🏆</div>
                <div class="label">Vincitore</div>
                <div class="name">${esc(champion.caposquadra)}</div>
                <div style="font-size:13px;color:var(--win);margin-top:6px;font-family:'Rajdhani',sans-serif;letter-spacing:1px">${champion.mmr_totale.toLocaleString("it-IT")} MMR</div>
            </div>`;
        } else {
            html += `<div class="champion-box">
                <div class="trophy">🏆</div>
                <div class="label">Vincitore</div>
                <div class="name tbd">Da determinare</div>
            </div>`;
        }

        html += `</div></div></div>`; // wrapper, round-matches, round-col
        html += `</div>`; // .bracket-container

        bracketArea.innerHTML = html;

        // Aggiunge event listener ai bottoni vincitore
        bracketArea.querySelectorAll(".vote-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const rIdx    = parseInt(btn.dataset.round);
                const mIdx    = parseInt(btn.dataset.match);
                const slot    = parseInt(btn.dataset.slot);
                setWinner(rIdx, mIdx, slot);
            });
        });
    }

    /* ── HTML di una riga team con bottone vincitore ── */
    function teamRowHTML(team, slot, winner, canVote, rIdx, mIdx) {
        if (!team) {
            return `<div class="team-row">
                <span class="team-seed">${slot}</span>
                <span class="team-name tbd">TBD</span>
            </div>`;
        }

        const isWinner  = winner !== null && winner === team;
        const isLoser   = winner !== null && winner !== team;
        const rowCls    = isWinner ? " winner" : isLoser ? " loser" : "";

        let voteBtn = "";
        if (canVote && winner === null) {
            // Bottone per dichiarare vincitore
            voteBtn = `<button class="vote-btn" data-round="${rIdx}" data-match="${mIdx}" data-slot="${slot}" title="Dichiara vincitore">▶</button>`;
        } else if (isWinner) {
            voteBtn = `<span class="win-badge">✓</span>`;
        }

        return `<div class="team-row${rowCls}">
            <span class="team-seed">${slot}</span>
            <span class="team-name">${esc(team.caposquadra)}</span>
            <span class="team-mmr">${team.mmr_totale.toLocaleString("it-IT")}</span>
            ${voteBtn}
        </div>`;
    }

    /* ── ROUND NAMES ── */
    function buildRoundNames(total) {
        return Array.from({ length: total }, (_, i) => {
            const fromEnd = total - 1 - i;
            if (fromEnd === 0) return "Finale";
            if (fromEnd === 1) return "Semifinale";
            if (fromEnd === 2) return "Quarti di Finale";
            return `Turno ${i + 1}`;
        });
    }

    /* ── UTILITIES ── */
    function nextPow2(n) {
        let p = 1;
        while (p < n) p *= 2;
        return p;
    }

    function emptyState(icon, title, text) {
        return `<div class="empty-state">
            <div class="icon">${icon}</div>
            <h2>${title}</h2>
            <p>${text}</p>
        </div>`;
    }

    function esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── AUTO-LOAD ── */
    loadSquadre();

}); // DOMContentLoaded
