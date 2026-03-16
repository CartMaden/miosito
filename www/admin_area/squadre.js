
/* ── STATE ── */
let allSquadre = [];
let activeCorse = "";

/* ── FETCH ── */
async function loadSquadre(orderby = "data_iscrizione") {
    const grid = document.getElementById("grid");
    grid.innerHTML = `<div class="state-box"><div class="spinner"></div><p>Caricamento…</p></div>`;

    try {
        const params = new URLSearchParams({ orderby });
        const res    = await fetch(`get_iscrizioni.php?${params}`);
        const json   = await res.json();

        if (!json.success) throw new Error(json.message);

        allSquadre = json.data;
        renderSquadre(activeCorse);

    } catch (err) {
        grid.innerHTML = `
            <div class="state-box">
                <span class="icon">⚠️</span>
                <p>Errore nel caricamento dei dati</p>
            </div>`;
    }
}

/* ── RENDER ── */
function renderSquadre(filterCorso = "") {
    const grid = document.getElementById("grid");
    const count = document.getElementById("squadCount");

    const filtered = filterCorso
        ? allSquadre.filter(s => s.corso === filterCorso)
        : allSquadre;

    count.textContent = `${filtered.length} squadr${filtered.length === 1 ? 'a' : 'e'}`;

    if (!filtered.length) {
        grid.innerHTML = `
            <div class="state-box">
                <span class="icon">🎮</span>
                <p>Nessuna squadra trovata</p>
            </div>`;
        return;
    }

    grid.innerHTML = filtered.map((s, i) => `
        <div class="squad-card" style="animation-delay:${i * 60}ms">
            <div class="card-header">
                <div>
                    <div class="captain">${esc(s.caposquadra)}</div>
                    <div class="squad-id"># ${String(s.id).padStart(3, '0')}</div>
                </div>
                <div class="mmr-pill">⚡ ${s.mmr_totale.toLocaleString('it-IT')} MMR</div>
            </div>
            <div class="card-body">
                <span class="corso-tag">${esc(s.corso)}</span>
                <ul class="players-list">
                    ${s.giocatori.map(g => `
                        <li>
                            <span class="player-num">${g.numero}</span>
                            <span class="player-name">${esc(g.nome)}</span>
                            <span class="player-mmr">${g.mmr.toLocaleString('it-IT')}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="card-footer">
                Iscritto il ${formatDate(s.data_iscrizione)}
            </div>
        </div>
    `).join('');
}

/* ── UTILS ── */
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

/* ── EVENTS ── */
document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeCorse = btn.dataset.corso;
        renderSquadre(activeCorse);
    });
});

document.getElementById("sortSelect").addEventListener("change", (e) => {
    loadSquadre(e.target.value);
});

/* ── INIT ── */
loadSquadre();