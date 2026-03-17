<?php
// check_admin.php
session_start();
header('Content-Type: application/json');

// Controlla se l'admin è loggato
$isAdmin = isset($_SESSION['admin_loggato']) && $_SESSION['admin_loggato'] === true;

// Risponde con un JSON { "admin": true } oppure { "admin": false }
echo json_encode(['admin' => $isAdmin]);