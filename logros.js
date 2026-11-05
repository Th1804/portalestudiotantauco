(function () {
  var DEFS = [
    { id: 'first_step', name: 'Primer paso', desc: 'Abre el portal por primera vez.', icon: '🚀' },
    { id: 'constancy_3', name: 'Hábito formado', desc: 'Racha de 3 días.', icon: '🔥' },
    { id: 'materia_master', name: 'Progreso activo', desc: 'Marca tu primer tema estudiado.', icon: '⚡' },
    { id: 'explorer', name: 'Explorador', desc: 'Usa el buscador.', icon: '🔍' },
    { id: 'pom_done', name: 'Modo foco', desc: 'Completa un bloque de estudio.', icon: '⏱' },
    { id: 'chat_sent', name: 'Compañerismo', desc: 'Envía un mensaje en el chat.', icon: '💬' },
    { id: 'sala', name: 'Sala de juegos', desc: 'Entra a la sala de juegos.', icon: '🎮' },
    { id: 'puzzle_one', name: 'Primera pieza', desc: 'Arma un rompecabezas.', icon: '🧩' },
    { id: 'puzzle_all', name: 'Cinco ideas', desc: 'Arma los cinco rompecabezas.', icon: '🧠' },
    { id: 'memoria', name: 'Buena memoria', desc: 'Encuentra todos los pares.', icon: '🃏' },
    { id: 'rayo', name: 'Reflejos', desc: 'Acierta 6 en el relámpago.', icon: '⚡' },
    { id: 'rayo_full', name: 'Sin fallar', desc: 'Relámpago perfecto.', icon: '🌟' }
  ];

  var KEY = 'tantauco-ach';
  var toastTimer = 0;

  function read() {
    try {
      var list = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }

  function unlock(id) {
    var def = null;
    for (var i = 0; i < DEFS.length; i++) if (DEFS[i].id === id) def = DEFS[i];
    if (!def) return false;
    var unlocked = read();
    if (unlocked.indexOf(id) !== -1) return false;
    unlocked.push(id);
    localStorage.setItem(KEY, JSON.stringify(unlocked));
    showToast(def);
    document.dispatchEvent(new CustomEvent('tantauco-logro', { detail: def }));
    return true;
  }

  function showToast(def) {
    var toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.innerHTML = '<div class="ach-toast-inner"><div class="ach-toast-icon"></div><div class="ach-toast-body"><div class="ach-toast-label">Logro</div><div class="ach-toast-title" id="ach-toast-title"></div></div></div>';
      document.body.appendChild(toast);
    }
    var icon = toast.querySelector('.ach-toast-icon');
    var title = document.getElementById('ach-toast-title');
    if (icon) icon.textContent = def.icon;
    if (title) title.textContent = def.name;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('show'); }, 3600);
  }

  function render(container) {
    if (!container) return;
    var unlocked = read();
    container.replaceChildren();
    DEFS.forEach(function (def) {
      var on = unlocked.indexOf(def.id) !== -1;
      var card = document.createElement('article');
      card.className = 'ach-card' + (on ? ' unlocked' : '');
      var icon = document.createElement('div');
      icon.className = 'ach-card-icon';
      icon.textContent = def.icon;
      var name = document.createElement('div');
      name.className = 'ach-card-name';
      name.textContent = def.name;
      var desc = document.createElement('div');
      desc.className = 'ach-card-desc';
      desc.textContent = def.desc;
      card.appendChild(icon);
      card.appendChild(name);
      card.appendChild(desc);
      container.appendChild(card);
    });
  }

  window.TantaucoLogros = {
    defs: DEFS,
    read: read,
    unlock: unlock,
    render: render
  };
})();
