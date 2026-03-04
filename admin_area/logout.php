<?php
session_start();

// Cancella tutte le variabili di sessione
$_SESSION = array();

// Distrugge la sessione
session_destroy();

// Riporta alla pagina di login
header("Location: login.php");
exit;
?>