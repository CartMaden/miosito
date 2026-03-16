<?php
// get_bracket.php — Legge lo stato del bracket dal file JSON
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$file = __DIR__ . "/bracket_state.json";

if (!file_exists($file)) {
    echo json_encode(["success" => false, "message" => "Nessun bracket salvato"]);
    exit;
}

$raw = file_get_contents($file);
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(["success" => false, "message" => "File bracket_state.json corrotto"]);
    exit;
}

echo json_encode(["success" => true] + $data);
