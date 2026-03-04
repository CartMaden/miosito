<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Torneo Esport</title>
<style>
body {
    font-family: Arial, sans-serif;
    background: #0f172a;
    color: white;
    text-align: center;
}

h1 {
    margin: 20px 0;
}

button {
    padding: 8px 15px;
    margin: 5px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.start { background: #22c55e; }
.reset { background: #ef4444; }

.bracket {
    display: flex;
    justify-content: center;
    gap: 50px;
    margin-top: 30px;
}

.round {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.match {
    background: #1e293b;
    padding: 10px;
    border-radius: 8px;
}

.player {
    padding: 5px;
    cursor: pointer;
    border-radius: 5px;
}

.player:hover {
    background: #334155;
}

.winner {
    background: #22c55e;
}

</style>
</head>
<body>

<h1>🏆 Torneo Esport</h1>
<button class="start" onclick="startTournament()">Inizia Torneo</button>
<button class="reset" onclick="resetTournament()">Reset</button>

<div class="bracket" id="bracket"></div>

<script src="matchmaking.js"></script>



</body>
</html>