
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