/* ============================================================
   matchmaking.js — Bracket a eliminazione diretta basato su MMR
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ── DARK MODE ── */

    /* ── STATE ── */
    let squadre = [];
    let bracket = null;
    let maxMMR  = 0;

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

            // Se c'era già un bracket generato, invalidalo
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

    /* ── GENERATE BRACKET ── */
    function generateBracket() {
        if (squadre.length < 2) return;

        // Ordina per MMR decrescente → seed 1 = MMR più alto
        const seeded = [...squadre].sort((a, b) => b.mmr_totale - a.mmr_totale);
        const size   = nextPow2(seeded.length);

        // Costruisce l'ordine dei seed per il bracket standard
        // es. size=8 → [0,7,3,4,1,6,2,5] → slot 0 vs slot 1, slot 2 vs slot 3, ...
        const order = buildSeedOrder(size);

        // Mappa i seed negli slot (null = BYE se non c'è abbastanza squadre)
        const slots = order.map(seedIdx => seeded[seedIdx] ?? null);

        // Crea i turni
        const rounds = [];
        let currentSlots = slots;

        while (currentSlots.length > 1) {
            const matches = [];
            for (let i = 0; i < currentSlots.length; i += 2) {
                matches.push({
                    t1: currentSlots[i],
                    t2: currentSlots[i + 1] ?? null
                });
            }
            rounds.push(matches);
            currentSlots = new Array(matches.length).fill(null);
        }

        bracket = rounds;
        renderBracket(rounds, seeded.length);
        btnReset.style.display = "";
        showToast(`✅ Bracket generato — ${rounds.length} turni, ${seeded.length} squadre`);
    }

    /* ── SEED ORDER (standard tournament bracket) ── */
    function nextPow2(n) {
        let p = 1;
        while (p < n) p *= 2;
        return p;
    }

    function buildSeedOrder(size) {
        // Genera l'ordine dei seed in modo che:
        // - Il seed 1 (top) e il seed 2 (bottom) si incontrino solo in finale
        // - Le partite del primo turno siano le più bilanciate possibile
        let order = [0, 1];
        while (order.length < size) {
            const next = [];
            const newSize = order.length * 2;
            for (let i = 0; i < order.length; i++) {
                next.push(order[i]);
                next.push(newSize - 1 - order[i]);
            }
            order = next;
        }
        return order;
    }

    /* ── RENDER BRACKET ── */
    function renderBracket(rounds, numTeams) {
        const roundNames  = buildRoundNames(rounds.length);
        const BASE_CARD_H = 105; // altezza approssimativa di una match-card in px
        const BASE_GAP    = 16;  // gap minimo tra card

        let html = `<div class="bracket-container">`;

        rounds.forEach((matches, rIdx) => {
            // Ogni round successivo raddoppia lo spazio tra le card
            const factor = Math.pow(2, rIdx);
            const slotH  = BASE_CARD_H * factor + BASE_GAP * (factor - 1) + BASE_GAP;

            html += `<div class="round-col">`;
            html += `<div class="round-header">${roundNames[rIdx]}</div>`;
            html += `<div class="round-matches">`;

            matches.forEach((match, mIdx) => {
                const { t1, t2 } = match;
                const isBye = t1 !== null && t2 === null;
                const diff  = t1 && t2
                    ? Math.abs(t1.mmr_totale - t2.mmr_totale)
                    : null;

                html += `<div class="match-wrapper" style="height:${slotH}px">`;
                html += `<div class="match-card">`;
                html += `<div class="match-num">Partita ${rIdx + 1}.${mIdx + 1}${isBye ? " — BYE" : ""}</div>`;
                html += teamRow(t1, 1, isBye);
                html += isBye
                    ? `<div class="team-row"><span class="team-name tbd">— BYE —</span></div>`
                    : teamRow(t2, 2, false);
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
        html += `<div class="champion-box">
            <div class="trophy">🏆</div>
            <div class="label">Vincitore</div>
            <div class="name tbd">Da determinare</div>
        </div>`;
        html += `</div></div></div>`; // wrapper, round-matches, round-col

        html += `</div>`; // .bracket-container

        bracketArea.innerHTML = html;
    }

    /* ── TEAM ROW HTML ── */
    function teamRow(team, seed, isBye) {
        if (!team) {
            return `<div class="team-row">
                <span class="team-seed">${seed}</span>
                <span class="team-name tbd">TBD</span>
            </div>`;
        }
        const cls = isBye ? " winner" : "";
        return `<div class="team-row${cls}">
            <span class="team-seed">${seed}</span>
            <span class="team-name">${esc(team.caposquadra)}</span>
            <span class="team-mmr">${team.mmr_totale.toLocaleString("it-IT")}</span>
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

    /* ── EMPTY STATE HTML ── */
    function emptyState(icon, title, text) {
        return `<div class="empty-state">
            <div class="icon">${icon}</div>
            <h2>${title}</h2>
            <p>${text}</p>
        </div>`;
    }

    /* ── XSS ESCAPE ── */
    function esc(str) {
        const d = document.createElement("div");
        d.textContent = str;
        return d.innerHTML;
    }

    /* ── AUTO-LOAD ── */
    loadSquadre();

}); // DOMContentLoaded
