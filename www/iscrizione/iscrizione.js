/* ── GAME PICKER ── */
const GAME_META = {
    valorant: { label: 'Valorant',              color: '#ff4655',  },
    r6:       { label: 'Rainbow Six Siege',      color: '#f0a500',  },
    lol:      { label: 'League of Legends',      color: '#c89b3c',  },
};

let selectedGame = null;

document.querySelectorAll(".game-pick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        selectedGame = btn.dataset.gioco;

        /* aggiorna stile bottoni */
        document.querySelectorAll(".game-pick-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        /* mostra form */
        document.getElementById("formSection").style.display = "flex";
        document.getElementById("gamePickerHint").style.display = "none";
        document.getElementById("giocoHidden").value = selectedGame;

        /* aggiorna badge nel form */
        const meta = GAME_META[selectedGame];
        const badge = document.getElementById("selectedGameBadge");
        badge.textContent = ` ${meta.label}`;
        badge.style.setProperty('--game-color', meta.color);
        badge.className = `selected-game-badge game-${selectedGame}`;

        /* aggiorna submit button color */
        const submitBtn = document.getElementById("submitBtn");
        submitBtn.className = `submit-btn submit-${selectedGame}`;

        /* scroll al form */
        document.getElementById("formSection").scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

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
const form     = document.getElementById("registrationForm");
const feedback = document.getElementById("form-feedback");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    feedback.className = "";

    /* verifica gioco selezionato */
    if (!selectedGame) {
        document.getElementById("gamePickerHint").style.display = "block";
        document.querySelector(".game-picker-section").scrollIntoView({ behavior: "smooth" });
        return;
    }

    /* validazione campi */
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

    /* costruisci payload */
    const data = {
        caposquadra: form.caposquadra.value.trim(),
        corso:       form.corso.value,
        gioco:       selectedGame,
        giocatori:   [],
    };

    for (let i = 1; i <= NUM_PLAYERS; i++) {
        data.giocatori.push({
            nome: form[`player_name_${i}`].value.trim(),
            mmr:  parseInt(form[`player_mmr_${i}`].value) || 0,
        });
    }

    const btn = form.querySelector(".submit-btn");
    btn.disabled = true;
    btn.textContent = "Invio in corso…";

    try {
        const response = await fetch("submit_iscrizione.php", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const meta = GAME_META[selectedGame];
            feedback.textContent = `✅ Iscrizione a ${meta.label} inviata con successo! Buona fortuna campione!`;
            feedback.className = "success";
            form.reset();
            document.getElementById("mmrTotal").textContent = "0";

            /* reset selezione gioco */
            selectedGame = null;
            document.querySelectorAll(".game-pick-btn").forEach(b => b.classList.remove("active"));
            setTimeout(() => {
                document.getElementById("formSection").style.display = "none";
            }, 3000);
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
