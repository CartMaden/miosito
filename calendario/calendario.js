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

const slides = document.querySelector(".slides");
const slide = document.querySelectorAll(".slide");

let index = 0;

document.querySelector(".next").onclick = () => {
    index++;
    if(index >= slide.length){
        index = 0;
    }
    updateSlider();
}

document.querySelector(".prev").onclick = () => {
    index--;
    if(index < 0){
        index = slide.length - 1;
    }
    updateSlider();
}

function updateSlider(){
    slides.style.transform = `translateX(-${index * 100}%)`;
}