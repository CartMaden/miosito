/* ============================================================
   matchmaking.js — Bracket a eliminazione diretta basato su MMR
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ── STATE ── */
    let squadre = [];
    let bracket = null;  // Array di round; ogni round è Array di {t1, t2, winner}
    let maxMMR  = 0;

    /* ── PERSIST: salva il bracket su server ── */
    async function saveBracket() {
        if (!bracket) return;
        try {
            await fetch("save_bracket.php", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    bracket: bracket,
                    rounds:  buildRoundNames(bracket.length)
                })
            });
        } catch (err) {
            console.warn("saveBracket error:", err);
        }
    }

    /* ── PERSIST: ripristina il bracket dal server al caricamento pagina ── */
    async function loadBracket() {
        try {
            const res  = await fetch("get_bracket.php");
            const json = await res.json();
            if (!json.success || !json.bracket) return;

            bracket = json.bracket;
            maxMMR  = 0;
            // Ricalcola maxMMR dai dati del bracket
            bracket.forEach(round => round.forEach(m => {
                [m.t1, m.t2].forEach(t => {
                    if (t && t.mmr_totale > maxMMR) maxMMR = t.mmr_totale;
                });
            }));

            renderBracket();
            btnReset.style.display = "";
            btnGenerate.disabled   = false;
            showToast(`♻️ Bracket ripristinato (salvato il ${new Date(json.saved_at).toLocaleString("it-IT")})`);
        } catch (err) {
            // Nessun bracket salvato — normale al primo avvio
        }
    }

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
    async function resetBracket() {
        bracket = null;
        bracketArea.innerHTML = emptyState("🎮", "Bracket resettato", "Clicca \"Genera bracket\" per crearne uno nuovo.");
        btnReset.style.display = "none";
        // Cancella il bracket salvato sul server
        try {
            await fetch("save_bracket.php", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ bracket: null, rounds: [] })
            });
        } catch(e) {}
    }

    /* ── STATS ── */
    function updateStats() {
        const n      = squadre.length;
        const size   = n > 0 ? nextPow2(n) : 0;
        const rounds = size > 0 ? Math.log2(size) : 0;
        const totalM = size > 0 ? size - 1 : 0;
        const avgMMR = n > 0 ? Math.round(squadre.reduce((a, s) => a + s.mmr_totale, 0) / n) : 0;

        document.getElementById("statSquadre").textContent = n || "—";
        document.getElementById("statPartite").textContent = totalM || "—";
        document.getElementById("statTurni").textContent   = rounds || "—";
        document.getElementById("statAvgMMR").textContent  = avgMMR > 0 ? avgMMR.toLocaleString("it-IT") : "—";
    }

    /* ── SEEDING TABLE ── */
    function renderSeeding() {
        const section = document.getElementById("seedingSection");
        const tbody   = document.getElementById("seedBody");

        if (!squadre.length) { section.style.display = "none"; return; }
        section.style.display = "block";

        tbody.innerHTML = squadre.map((s, i) => {
            const barW = Math.round((s.mmr_totale / maxMMR) * 120);
            return `<tr>
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
       ALGORITMO DI ABBINAMENTO — minimo divario MMR al primo turno

       Principio:
         - Ordina per MMR decrescente: [s1, s2, s3 … sN]
         - I BYE vanno alle squadre con MMR PIÙ ALTO (in testa alla lista)
           come ricompensa per il ranking migliore
         - I BYE occupano i primi slot del round 0 (match 0, 1, …)
           così alimentano il nextMatch 0 del round 1 senza collisioni
         - Le partite reali (coppie adiacenti) vengono dopo, min divario MMR
         - Esempio con 6 squadre (size=8, byes=2):
             slot 0: s1 BYE  ┐→ nextMatch 0 del round 1
             slot 1: s2 BYE  ┘
             slot 2: s3 vs s4 ┐→ nextMatch 1 del round 1
             slot 3: s5 vs s6 ┘
    ══════════════════════════════════════════════════════════ */
    function generateBracket() {
        if (squadre.length < 2) return;

        const seeded = [...squadre].sort((a, b) => b.mmr_totale - a.mmr_totale);
        const size   = nextPow2(seeded.length);
        const byes   = size - seeded.length;

        const firstRound = [];
        let idx = 0;

        // BYE PRIMA: le squadre con MMR più alto saltano il primo turno
        // Occupano i primi slot in coppie (slot 0+1, 2+3, …) → ogni coppia
        // alimenta un singolo nextMatch senza collisioni di indice
        for (let i = 0; i < byes; i++) {
            const t1 = seeded[idx++];
            firstRound.push({ t1, t2: null, winner: t1 });
        }

        // PARTITE REALI DOPO: coppie adiacenti → divario MMR minimo
        while (idx < seeded.length) {
            const t1 = seeded[idx++];
            const t2 = seeded[idx++] ?? null;
            if (t2 === null) {
                // Squadra spaiata (non dovrebbe accadere con nextPow2, ma gestita)
                firstRound.push({ t1, t2: null, winner: t1 });
            } else {
                firstRound.push({ t1, t2, winner: null });
            }
        }

        // Costruisce i round successivi come slot vuoti
        bracket = [firstRound];
        let prev = firstRound;
        while (prev.length > 1) {
            const next = [];
            for (let i = 0; i < prev.length; i += 2) {
                next.push({ t1: null, t2: null, winner: null });
            }
            bracket.push(next);
            prev = next;
        }

        // Propaga i BYE del round 0 → round 1
        advanceAllByes(0);

        renderBracket();
        saveBracket();
        btnReset.style.display = "";
        showToast(`✅ Bracket generato — ${bracket.length} turni, ${seeded.length} squadre`);
    }

    /* ══════════════════════════════════════════════════════════
       AVANZAMENTO VINCITORI — propaga solo il match specificato
       al proprio slot nel round successivo. Non tocca gli altri.
    ══════════════════════════════════════════════════════════ */
    function advanceSingleMatch(roundIdx, matchIdx) {
        if (roundIdx >= bracket.length - 1) return;

        const w = bracket[roundIdx][matchIdx].winner;
        if (w === null) return;

        const nextMatchIdx = Math.floor(matchIdx / 2);
        const isFirst      = matchIdx % 2 === 0;
        const nextMatch    = bracket[roundIdx + 1][nextMatchIdx];

        if (isFirst) nextMatch.t1 = w;
        else         nextMatch.t2 = w;
        // Nessun auto-avanzamento: ogni nextMatch aspetta entrambi gli slot.
        // I BYE sono già pre-risolti con winner:t1 alla generazione e
        // propagati da advanceAllByes — non servono ulteriori auto-avanzamenti.
    }

    /* Propaga tutti i vincitori già noti (BYE pre-risolti) dal round indicato in poi.
       Usato alla generazione per popolare i round iniziali con i BYE. */
    function advanceAllByes(roundIdx) {
        if (roundIdx >= bracket.length - 1) return;
        const cur  = bracket[roundIdx];
        const next = bracket[roundIdx + 1];

        for (let m = 0; m < cur.length; m++) {
            if (cur[m].winner !== null) advanceSingleMatch(roundIdx, m);
        }

        // Risolvi automaticamente i nextMatch che ora hanno un solo partecipante
        // (succede quando due BYE adiacenti alimentano lo stesso nextMatch)
        next.forEach(m => {
            if (m.winner !== null) return;
            if (m.t1 !== null && m.t2 === null) { m.winner = m.t1; }
            if (m.t1 === null && m.t2 !== null) { m.winner = m.t2; }
        });

        // Ricorsione: se nel round successivo ci sono nuovi BYE, propagali ancora
        advanceAllByes(roundIdx + 1);
    }

    /* ── Dichiara il vincitore di una partita ── */
    function setWinner(roundIdx, matchIdx, teamSlot) {
        const match = bracket[roundIdx][matchIdx];
        if (!match.t1 || !match.t2) return;  // non interagibile (BYE o TBD)

        const newWinner = teamSlot === 1 ? match.t1 : match.t2;
        if (match.winner === newWinner) return;  // già impostato, nessun cambio

        // Se c'era già un vincitore diverso, pulisci a cascata prima
        if (match.winner !== null) {
            cascadeClear(roundIdx, matchIdx);
        }

        match.winner = newWinner;

        // Avanza solo questo match al round successivo
        advanceSingleMatch(roundIdx, matchIdx);

        renderBracket();
        saveBracket();
        showToast(`🏆 ${esc(newWinner.caposquadra)} avanza al prossimo turno!`);
    }

    /* ── Pulisce a cascata dal round successivo a matchIdx in poi ── */
    function cascadeClear(roundIdx, matchIdx) {
        if (roundIdx >= bracket.length - 1) return;

        const nextMatchIdx = Math.floor(matchIdx / 2);
        const isFirst      = matchIdx % 2 === 0;
        const nextMatch    = bracket[roundIdx + 1][nextMatchIdx];

        // Rimuovi il valore propagato nel round successivo
        if (isFirst) nextMatch.t1 = null;
        else         nextMatch.t2 = null;

        // Se il round successivo aveva già un vincitore, pulisci oltre
        if (nextMatch.winner !== null) {
            cascadeClear(roundIdx + 1, nextMatchIdx);
            nextMatch.winner = null;
        }
    }

    /* ══════════════════════════════════════════════════════════
       RENDER BRACKET
    ══════════════════════════════════════════════════════════ */
    function renderBracket() {
        const rounds     = bracket;
        const roundNames = buildRoundNames(rounds.length);
        const BASE_H     = 105;
        const BASE_GAP   = 16;

        const finalMatch = rounds[rounds.length - 1][0];
        const champion   = finalMatch ? finalMatch.winner : null;

        let html = `<div class="bracket-container">`;

        rounds.forEach((matches, rIdx) => {
            const factor = Math.pow(2, rIdx);
            const slotH  = BASE_H * factor + BASE_GAP * (factor - 1) + BASE_GAP;

            html += `<div class="round-col">`;
            html += `<div class="round-header">${roundNames[rIdx]}</div>`;
            html += `<div class="round-matches">`;

            matches.forEach((match, mIdx) => {
                const { t1, t2, winner } = match;
                const isBye  = (t1 !== null && t2 === null) || (t1 === null && t2 !== null);
                const diff   = t1 && t2 ? Math.abs(t1.mmr_totale - t2.mmr_totale) : null;
                const isDone = winner !== null;
                const canVote = t1 !== null && t2 !== null && !isBye;

                html += `<div class="match-wrapper" style="height:${slotH}px">`;
                html += `<div class="match-card${isDone ? " match-done" : ""}">`;
                html += `<div class="match-num">Partita ${rIdx + 1}.${mIdx + 1}${isBye ? " — BYE" : ""}</div>`;
                html += teamRowHTML(t1, 1, winner, canVote, rIdx, mIdx);
                html += isBye
                    ? `<div class="team-row"><span class="team-seed">—</span><span class="team-name tbd">— BYE —</span></div>`
                    : teamRowHTML(t2, 2, winner, canVote, rIdx, mIdx);
                if (diff !== null) {
                    html += `<div class="match-diff">Δ MMR ${diff.toLocaleString("it-IT")}</div>`;
                }
                html += `</div></div>`;
            });

            html += `</div></div>`;
        });

        // Colonna campione
        const cf = Math.pow(2, rounds.length);
        const cs = BASE_H * cf + BASE_GAP * (cf - 1) + BASE_GAP;
        html += `<div class="round-col">
            <div class="round-header">🏆 Campione</div>
            <div class="round-matches">
            <div class="match-wrapper" style="height:${cs}px">`;
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
        html += `</div></div></div></div>`;

        bracketArea.innerHTML = html;

        bracketArea.querySelectorAll(".vote-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                setWinner(+btn.dataset.round, +btn.dataset.match, +btn.dataset.slot);
            });
        });
    }

    /* ── HTML di una riga team ── */
    function teamRowHTML(team, slot, winner, canVote, rIdx, mIdx) {
        if (!team) {
            return `<div class="team-row">
                <span class="team-seed">${slot}</span>
                <span class="team-name tbd">TBD</span>
            </div>`;
        }
        const isWinner = winner !== null && winner === team;
        const isLoser  = winner !== null && winner !== team;
        const rowCls   = isWinner ? " winner" : isLoser ? " loser" : "";

        let badge = "";
        if (canVote && winner === null) {
            badge = `<button class="vote-btn" data-round="${rIdx}" data-match="${mIdx}" data-slot="${slot}" title="Dichiara vincitore">▶</button>`;
        } else if (isWinner) {
            badge = `<span class="win-badge">✓</span>`;
        }

        return `<div class="team-row${rowCls}">
            <span class="team-seed">${slot}</span>
            <span class="team-name">${esc(team.caposquadra)}</span>
            <span class="team-mmr">${team.mmr_totale.toLocaleString("it-IT")}</span>
            ${badge}
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
    // Prima prova a ripristinare un bracket esistente, poi carica le squadre
    loadBracket().then(() => loadSquadre());

}); // DOMContentLoaded
