let players = [
    { name: "Ivan il terribile", mmr: 1500 },
    { name: "Demon slayer", mmr: 1300 },
    { name: "Player3", mmr: 1700 },
    { name: "Player4", mmr: 1200 },
    { name: "Player5", mmr: 1600 },
    { name: "Player6", mmr: 1400 },
    { name: "Player7", mmr: 1800 },
    { name: "Player8", mmr: 1250 }
];

let rounds = [];

function startTournament() {
    // Seeding: ordina per MMR decrescente
    players.sort((a, b) => b.mmr - a.mmr);

    rounds = [];
    rounds.push(createMatches(players));
    renderBracket();
}

function createMatches(playerList) {
    let matches = [];
    for (let i = 0; i < playerList.length; i += 2) {
        matches.push({
            p1: playerList[i],
            p2: playerList[i + 1],
            winner: null
        });
    }
    return matches;
}

function renderBracket() {
    const bracket = document.getElementById("bracket");
    bracket.innerHTML = "";

    rounds.forEach((round, roundIndex) => {
        const roundDiv = document.createElement("div");
        roundDiv.classList.add("round");

        round.forEach((match, matchIndex) => {
            const matchDiv = document.createElement("div");
            matchDiv.classList.add("match");

            ["p1", "p2"].forEach(playerKey => {
                if (!match[playerKey]) return;

                const playerDiv = document.createElement("div");
                playerDiv.textContent = match[playerKey].name + " (" + match[playerKey].mmr + ")";
                playerDiv.classList.add("player");

                if (match.winner === match[playerKey]) {
                    playerDiv.classList.add("winner");
                }

                playerDiv.onclick = () => selectWinner(roundIndex, matchIndex, playerKey);
                matchDiv.appendChild(playerDiv);
            });

            roundDiv.appendChild(matchDiv);
        });

        bracket.appendChild(roundDiv);
    });
}

function selectWinner(roundIndex, matchIndex, playerKey) {
    let match = rounds[roundIndex][matchIndex];
    if (match.winner) return;

    match.winner = match[playerKey];

    if (!rounds[roundIndex + 1]) {
        rounds[roundIndex + 1] = [];
    }

    let nextRound = rounds[roundIndex + 1];

    if (matchIndex % 2 === 0) {
        nextRound.push({ p1: match.winner, p2: null, winner: null });
    } else {
        nextRound[nextRound.length - 1].p2 = match.winner;
    }

    renderBracket();
}

function resetTournament() {
    rounds = [];
    document.getElementById("bracket").innerHTML = "";
}