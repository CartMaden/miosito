// ── DARK MODE ──
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

// ── HAMBURGER MENU ──
(function () {
  var btn  = document.getElementById('hamburger');
  var menu = document.getElementById('navLinks');
  if (!btn || !menu) return;

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var isOpen = menu.classList.toggle('open');
    btn.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });

  menu.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  document.addEventListener('click', function () {
    menu.classList.remove('open');
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
})();