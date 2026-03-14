/*dark mode*/

const toggleButton = document.getElementById("darkModeToggle");

/* Load saved mode */

if(localStorage.getItem("darkMode") === "enabled"){
document.body.classList.add("dark-mode");
toggleButton.textContent = "☀";
}

toggleButton.addEventListener("click", () => {

document.body.classList.toggle("dark-mode");

if(document.body.classList.contains("dark-mode")){
localStorage.setItem("darkMode","enabled");
toggleButton.textContent = "☀";
}else{
localStorage.setItem("darkMode","disabled");
toggleButton.textContent = "⏾";
}

})