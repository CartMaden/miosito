document.addEventListener("DOMContentLoaded", () => {
    fetch("../check_admin.php")
        .then(response => response.json())
        .then(data => {
            if (data.admin === true) {
                const dashboardBtn = document.getElementById("linkDashboard");
                if (!dashboardBtn) return;

                // Replace the plain link with the full dropdown
                const dropdown = document.createElement("div");
                dropdown.className = "nav-dropdown";
                dropdown.id = "navDropdown";
                dropdown.innerHTML = `
                    <a href="../admin_area/dashboard.php" class="nav-dropdown-toggle">Dashboard <span class="dropdown-arrow">▾</span></a>
                    <div class="nav-dropdown-menu">
                        <a href="../admin_area/matchmaking.php"> Matchmaking</a>
                        <a href="../admin_area/squadre.php"> Squadre</a>
                        <a href="../admin_area/logout.php" class="dropdown-logout">⏻ Logout</a>
                    </div>`;

                dashboardBtn.replaceWith(dropdown);

                // Mobile: toggle dropdown open/closed on click
                const toggle = dropdown.querySelector(".nav-dropdown-toggle");
                toggle.addEventListener("click", function (e) {
                    if (window.getComputedStyle(document.getElementById("hamburger")).display !== "none") {
                        e.preventDefault();
                        dropdown.classList.toggle("open");
                    }
                });

                // Close when clicking outside
                document.addEventListener("click", function (e) {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove("open");
                    }
                });
            }
        })
        .catch(error => console.error("Errore controllo admin:", error));
});