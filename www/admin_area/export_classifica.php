<?php
// export_classifica.php
session_start();
header('Content-Type: application/json');

// Sicurezza: solo l'admin può esportare
if (!isset($_SESSION['admin_loggato']) || $_SESSION['admin_loggato'] !== true) {
    echo json_encode(["success" => false, "message" => "Non autorizzato"]);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if ($data && isset($data['classifica'])) {
    // Salva la classifica finale su un file JSON che la pagina pubblica "Live" o "Info" può leggere
    file_put_contents('classifica_pubblica.json', json_encode($data, JSON_PRETTY_PRINT));
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Dati mancanti"]);
}