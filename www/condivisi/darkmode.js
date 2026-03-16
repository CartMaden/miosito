const toggle = document.getElementById('darkModeToggle');

if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode');
  toggle.checked = true;
}

toggle.addEventListener('change', () => {
  const dark = toggle.checked;
  document.body.classList.toggle('dark-mode', dark);
  localStorage.setItem('darkMode', dark ? 'enabled' : 'disabled');
});

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

menuToggle.addEventListener('click', () => {
    // Toggles the 'active' class on both button and nav
    menuToggle.classList.toggle('active');
    mainNav.classList.toggle('active');
});

// Close the menu when clicking a link
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('active');
    });
});