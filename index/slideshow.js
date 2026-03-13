let slideIndex = 0;
showSlides();

function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }

    slides[slideIndex - 1].style.display = "block";

    setTimeout(showSlides, 2000);
}

document.querySelectorAll(".media-container").forEach(container => {

    const video = container.querySelector("video");

    container.addEventListener("mouseenter", () => {
        video.play();
    });

    container.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
    });

});

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