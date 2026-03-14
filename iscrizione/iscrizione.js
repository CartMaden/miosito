
/* ── BUILD PLAYER CARDS ── */
const playersGrid = document.getElementById("playersGrid");
const NUM_PLAYERS = 5;

for (let i = 1; i <= NUM_PLAYERS; i++) {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
        <div class="player-label">Giocatore ${i}</div>
        <div class="field">
            <label for="player_name_${i}">Nome e Cognome *</label>
            <input type="text" id="player_name_${i}" name="player_name_${i}"
                   placeholder="Es. Luigi Verdi" required>
        </div>
        <div class="field">
            <label for="player_mmr_${i}">MMR *</label>
            <input type="number" id="player_mmr_${i}" name="player_mmr_${i}"
                   placeholder="Es. 3500" min="0" max="20000" required
                   class="mmr-input">
        </div>
    `;
    playersGrid.appendChild(card);
}

/* ── MMR TOTAL ── */
document.addEventListener("input", (e) => {
    if (!e.target.classList.contains("mmr-input")) return;
    let total = 0;
    document.querySelectorAll(".mmr-input").forEach(inp => {
        total += parseInt(inp.value) || 0;
    });
    document.getElementById("mmrTotal").textContent = total.toLocaleString("it-IT");
});

/* ── FORM SUBMIT ── */
const form = document.getElementById("registrationForm");
const feedback = document.getElementById("form-feedback");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.className = "";
    feedback.style.display = "none";

    // Client-side validation
    let valid = true;
    form.querySelectorAll("[required]").forEach(field => {
        field.classList.remove("error");
        if (!field.value.trim()) {
            field.classList.add("error");
            valid = false;
        }
    });

    if (!valid) {
        feedback.textContent = "⚠ Compila tutti i campi obbligatori.";
        feedback.className = "error";
        return;
    }

    // Build payload
    const data = {
        caposquadra: form.caposquadra.value.trim(),
        corso:       form.corso.value,
        giocatori:   []
    };

    for (let i = 1; i <= NUM_PLAYERS; i++) {
        data.giocatori.push({
            nome: form[`player_name_${i}`].value.trim(),
            mmr:  parseInt(form[`player_mmr_${i}`].value) || 0
        });
    }

    // Disable button while sending
    const btn = form.querySelector(".submit-btn");
    btn.disabled = true;
    btn.textContent = "Invio in corso…";

    try {
        const response = await fetch("submit_iscrizione.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            feedback.textContent = "✅ Iscrizione inviata con successo! Ti contatteremo a breve.";
            feedback.className = "success";
            form.reset();
            document.getElementById("mmrTotal").textContent = "0";
        } else {
            feedback.textContent = "❌ Errore: " + (result.message || "Riprova più tardi.");
            feedback.className = "error";
        }
    } catch (err) {
        feedback.textContent = "❌ Errore di rete. Controlla la connessione e riprova.";
        feedback.className = "error";
    } finally {
        btn.disabled = false;
        btn.textContent = "Invia Iscrizione";
        feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
});
