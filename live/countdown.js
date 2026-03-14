//(anno, mese-1, giorno, ora, minuti)
var liveDate = new Date(2027, 2, 8, 16, 0, 0); 

var countdownElement = document.getElementById("countdown");
var titleElement = document.getElementById("live-title");

var timer = setInterval(function() {
  var now = new Date().getTime();
  var distance = liveDate - now;

  if (distance < 0) {
    clearInterval(timer);
    countdownElement.innerHTML = "Siamo Live!";
    titleElement.innerHTML = "🔴 Live in corso";
    return;
  }

  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);

  countdownElement.innerHTML = 
    days + "g " + hours + "h " + minutes + "m " + seconds + "s ";
}, 1000);

