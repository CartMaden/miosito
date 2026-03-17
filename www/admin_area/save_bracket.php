<?php
// save_bracket.php — Salva lo stato del bracket su file JSON
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Metodo non consentito"]);
    exit;
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE || !isset($data["bracket"])) {
    echo json_encode(["success" => false, "message" => "Dati non validi"]);
    exit;
}

$file = __DIR__ . "/classifica_pubblica.json";

$payload = [
    "saved_at" => date("c"),          // ISO 8601 timestamp
    "bracket"  => $data["bracket"],
    "rounds"   => $data["rounds"] ?? [],   // nomi dei round
];

$ok = file_put_contents($file, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($ok === false) {
    echo json_encode(["success" => false, "message" => "Impossibile scrivere classifica_pubblica.json"]);
} else {
    echo json_encode(["success" => true, "saved_at" => $payload["saved_at"]]);
}
