
document.addEventListener("DOMContentLoaded", () => {
    // Fai attenzione che il percorso punti correttamente al file check_admin.php!
    // Se sei in /calendario/, il percorso sarà ../admin_area/check_admin.php
    fetch("check_admin.php")
        .then(response => response.json())
        .then(data => {
            if (data.admin === true) {
                // Se è admin, mostra il link!
                const dashboardBtn = document.getElementById("linkDashboard");
                if (dashboardBtn) {
                    dashboardBtn.style.display = "inline-block"; // o "block" a seconda del tuo CSS
                }
            }
        })
        .catch(error => console.error("Errore controllo admin:", error));
});
