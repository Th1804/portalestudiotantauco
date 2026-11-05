(function () {
  var KEY = 'tantauco-theme';
  try {
    if (localStorage.getItem(KEY) === 'dark') document.documentElement.classList.add('dark-mode');
  } catch (error) {}

  function paint() {
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    var dark = document.documentElement.classList.contains('dark-mode');
    button.textContent = dark ? '☀️' : '🌙';
    button.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }

  function toggleTheme() {
    var dark = document.documentElement.classList.toggle('dark-mode');
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (error) {}
    paint();
  }

  window.toggleTheme = toggleTheme;
  document.addEventListener('DOMContentLoaded', function () {
    paint();
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    button.addEventListener('click', function (event) {
      event.preventDefault();
      toggleTheme();
    });
  });
})();
