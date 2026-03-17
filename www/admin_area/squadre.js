
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
    const grid  = document.getElementById("grid");
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
        <div class="squad-card" style="animation-delay:${i * 60}ms" data-id="${s.id}">
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
                <span>Iscritto il ${formatDate(s.data_iscrizione)}</span>
                <div class="card-actions">
                    <button class="action-btn edit-btn" data-id="${s.id}" title="Modifica squadra">
                        ✏️ Modifica
                    </button>
                    <button class="action-btn delete-btn" data-id="${s.id}" title="Elimina squadra">
                        🗑️ Elimina
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    /* attach card-level events */
    document.querySelectorAll(".edit-btn").forEach(btn =>
        btn.addEventListener("click", () => openEditModal(parseInt(btn.dataset.id)))
    );
    document.querySelectorAll(".delete-btn").forEach(btn =>
        btn.addEventListener("click", () => confirmDelete(parseInt(btn.dataset.id)))
    );
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

/* ══════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════ */
const CORSI = [
    'Developer', 'Cybersecurity', 'Cloud Computing',
    'Game Developer', 'Digital Media Specialist', 'AI and Data Science Specialist'
];

function openEditModal(id) {
    const squadra = allSquadre.find(s => s.id === id);
    if (!squadra) return;

    const modal = document.getElementById("editModal");
    modal.dataset.squadraId = id;

    /* fill fields */
    document.getElementById("edit-caposquadra").value = squadra.caposquadra;
    document.getElementById("edit-corso").value       = squadra.corso;

    for (let i = 0; i < 5; i++) {
        const g = squadra.giocatori[i] || { nome: '', mmr: 0 };
        document.getElementById(`edit-pname-${i+1}`).value = g.nome;
        document.getElementById(`edit-pmmr-${i+1}`).value  = g.mmr;
    }

    updateEditMMRTotal();
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeEditModal() {
    const modal = document.getElementById("editModal");
    modal.classList.remove("open");
    document.body.style.overflow = "";
    document.getElementById("edit-feedback").className = "edit-feedback";
    document.getElementById("edit-feedback").textContent = "";
}

function updateEditMMRTotal() {
    let total = 0;
    for (let i = 1; i <= 5; i++) {
        total += parseInt(document.getElementById(`edit-pmmr-${i}`).value) || 0;
    }
    document.getElementById("edit-mmr-total").textContent = total.toLocaleString('it-IT');
}

async function saveEdit() {
    const modal     = document.getElementById("editModal");
    const id        = parseInt(modal.dataset.squadraId);
    const feedback  = document.getElementById("edit-feedback");
    const saveBtn   = document.getElementById("edit-save-btn");

    /* collect data */
    const caposquadra = document.getElementById("edit-caposquadra").value.trim();
    const corso       = document.getElementById("edit-corso").value;
    const giocatori   = [];

    for (let i = 1; i <= 5; i++) {
        giocatori.push({
            nome: document.getElementById(`edit-pname-${i}`).value.trim(),
            mmr:  parseInt(document.getElementById(`edit-pmmr-${i}`).value) || 0
        });
    }

    /* basic validation */
    if (!caposquadra || !corso) {
        feedback.textContent = "⚠ Caposquadra e corso sono obbligatori.";
        feedback.className = "edit-feedback error";
        return;
    }
    if (giocatori.some(g => !g.nome)) {
        feedback.textContent = "⚠ Tutti i nomi dei giocatori sono obbligatori.";
        feedback.className = "edit-feedback error";
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Salvataggio…";

    try {
        const res = await fetch("update_squadra.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, caposquadra, corso, giocatori })
        });
        const json = await res.json();

        if (res.ok && json.success) {
            feedback.textContent = "✅ Modifiche salvate!";
            feedback.className = "edit-feedback success";
            setTimeout(() => {
                closeEditModal();
                loadSquadre(document.getElementById("sortSelect").value);
            }, 900);
        } else {
            feedback.textContent = "❌ " + (json.message || "Errore durante il salvataggio.");
            feedback.className = "edit-feedback error";
        }
    } catch (err) {
        feedback.textContent = "❌ Errore di rete. Riprova.";
        feedback.className = "edit-feedback error";
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Salva modifiche";
    }
}

/* ══════════════════════════════════════════
   DELETE CONFIRM
══════════════════════════════════════════ */
function confirmDelete(id) {
    const squadra = allSquadre.find(s => s.id === id);
    if (!squadra) return;

    const modal = document.getElementById("deleteModal");
    modal.dataset.squadraId = id;
    document.getElementById("delete-captain-name").textContent = squadra.caposquadra;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("open");
    document.body.style.overflow = "";
}

async function executeDelete() {
    const modal   = document.getElementById("deleteModal");
    const id      = parseInt(modal.dataset.squadraId);
    const btn     = document.getElementById("delete-confirm-btn");

    btn.disabled = true;
    btn.textContent = "Eliminazione…";

    try {
        const res  = await fetch("delete_squadra.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id })
        });
        const json = await res.json();

        if (res.ok && json.success) {
            closeDeleteModal();
            loadSquadre(document.getElementById("sortSelect").value);
        } else {
            alert("❌ " + (json.message || "Errore durante l'eliminazione."));
        }
    } catch (err) {
        alert("❌ Errore di rete. Riprova.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Sì, elimina";
    }
}

/* ══════════════════════════════════════════
   BUILD MODALS (injected once at load)
══════════════════════════════════════════ */
function buildModals() {
    /* ── EDIT MODAL ── */
    const editHTML = `
    <div class="modal-overlay" id="editModal">
        <div class="modal-box">
            <div class="modal-header">
                <span>✏️ Modifica Squadra</span>
                <button class="modal-close" id="edit-close-btn">✕</button>
            </div>
            <div class="modal-body">
                <div class="modal-field">
                    <label>Nome e Cognome Caposquadra *</label>
                    <input type="text" id="edit-caposquadra" placeholder="Es. Mario Rossi">
                </div>
                <div class="modal-field">
                    <label>Corso *</label>
                    <select id="edit-corso">
                        ${CORSI.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <div class="modal-divider"><span>Giocatori</span></div>
                <div class="modal-players">
                    ${[1,2,3,4,5].map(i => `
                    <div class="modal-player-row">
                        <span class="modal-player-num">${i}</span>
                        <div class="modal-field flex1">
                            <input type="text" id="edit-pname-${i}" placeholder="Nome e Cognome">
                        </div>
                        <div class="modal-field mmr-field">
                            <input type="number" id="edit-pmmr-${i}" placeholder="MMR" min="0" max="20000" class="edit-mmr-input">
                        </div>
                    </div>`).join('')}
                </div>
                <div class="modal-mmr-bar">
                    <span>MMR Totale</span>
                    <span id="edit-mmr-total">0</span>
                </div>
                <div class="edit-feedback" id="edit-feedback"></div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn cancel" id="edit-cancel-btn">Annulla</button>
                <button class="modal-btn save" id="edit-save-btn">Salva modifiche</button>
            </div>
        </div>
    </div>`;

    /* ── DELETE MODAL ── */
    const deleteHTML = `
    <div class="modal-overlay" id="deleteModal">
        <div class="modal-box modal-box--sm">
            <div class="modal-header modal-header--danger">
                <span>🗑️ Elimina Squadra</span>
                <button class="modal-close" id="delete-close-btn">✕</button>
            </div>
            <div class="modal-body">
                <p class="delete-message">
                    Stai per eliminare la squadra di<br>
                    <strong id="delete-captain-name"></strong>.<br><br>
                    Questa azione è <em>irreversibile</em>. Continuare?
                </p>
            </div>
            <div class="modal-footer">
                <button class="modal-btn cancel" id="delete-cancel-btn">Annulla</button>
                <button class="modal-btn danger" id="delete-confirm-btn">Sì, elimina</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", editHTML + deleteHTML);

    /* Events */
    document.getElementById("edit-close-btn").addEventListener("click", closeEditModal);
    document.getElementById("edit-cancel-btn").addEventListener("click", closeEditModal);
    document.getElementById("edit-save-btn").addEventListener("click", saveEdit);

    document.getElementById("delete-close-btn").addEventListener("click", closeDeleteModal);
    document.getElementById("delete-cancel-btn").addEventListener("click", closeDeleteModal);
    document.getElementById("delete-confirm-btn").addEventListener("click", executeDelete);

    document.getElementById("editModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeEditModal();
    });
    document.getElementById("deleteModal").addEventListener("click", e => {
        if (e.target === e.currentTarget) closeDeleteModal();
    });

    document.addEventListener("input", e => {
        if (e.target.classList.contains("edit-mmr-input")) updateEditMMRTotal();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") { closeEditModal(); closeDeleteModal(); }
    });
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
buildModals();
loadSquadre();
/*ciao ivan */
