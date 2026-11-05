(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.body.classList.add('vicho-skin');
  deepenLightColors();

  var actor = document.createElement('button');
  actor.id = 'vicho-actor';
  actor.type = 'button';
  actor.setAttribute('aria-label', 'Vicho, la mascota naranja. Tócalo para un consejo de estudio.');
  actor.innerHTML = [
    '<svg viewBox="0 0 120 120" aria-hidden="true">',
    '<ellipse cx="60" cy="108" rx="26" ry="6" fill="rgba(90,40,0,0.16)"/>',
    '<ellipse class="foot" cx="34" cy="96" rx="13" ry="9" fill="#e26500"/>',
    '<ellipse class="foot r" cx="86" cy="96" rx="13" ry="9" fill="#e26500"/>',
    '<ellipse cx="16" cy="62" rx="11" ry="15" fill="#ff9a32"/>',
    '<ellipse cx="104" cy="62" rx="11" ry="15" fill="#ff9a32"/>',
    '<rect x="20" y="28" width="80" height="66" rx="30" fill="#ff8a14"/>',
    '<rect x="20" y="28" width="80" height="66" rx="30" fill="none" stroke="#e56a00" stroke-width="3"/>',
    '<ellipse cx="46" cy="42" rx="12" ry="7" fill="#fff" opacity="0.35"/>',
    '<rect x="34" y="54" width="52" height="30" rx="15" fill="#ffb15a"/>',
    '<g class="eyes">',
    '<rect x="38" y="46" width="14" height="16" rx="3" fill="#1a1208"/>',
    '<rect x="68" y="46" width="14" height="16" rx="3" fill="#1a1208"/>',
    '<rect x="41" y="49" width="5" height="5" fill="#fff"/>',
    '<rect x="71" y="49" width="5" height="5" fill="#fff"/>',
    '</g>',
    '<ellipse cx="32" cy="70" rx="6" ry="3.5" fill="#ff6d8a" opacity="0.6"/>',
    '<ellipse cx="88" cy="70" rx="6" ry="3.5" fill="#ff6d8a" opacity="0.6"/>',
    '</svg>'
  ].join('');

  var bubble = document.createElement('p');
  bubble.id = 'vicho-say';
  bubble.hidden = true;
  bubble.setAttribute('aria-live', 'polite');
  document.body.appendChild(actor);
  document.body.appendChild(bubble);

  var tips = tipsForPage();
  var tipIndex = 0;
  var saidAt = 0;
  var hideTimer = 0;
  var x = Math.max(16, window.innerWidth - (narrow() ? 88 : 150));
  var y = narrow() ? window.innerHeight - 150 : Math.min(210, window.innerHeight * 0.34);
  var dir = -1;
  var mode = reduce ? 'rest' : (narrow() ? 'walk' : 'visit');
  var modeUntil = performance.now() + (narrow() ? 5000 : 2200);
  var last = performance.now();
  var raf = 0;
  var running = true;

  actor.addEventListener('click', function () {
    actor.classList.add('boop');
    window.setTimeout(function () { actor.classList.remove('boop'); }, 480);
    say(nextTip(), true);
  });

  document.addEventListener('click', function (event) {
    var opt = event.target.closest('.quiz-opt');
    if (opt) {
      if (opt.dataset.vichoSeen === '1') return;
      window.setTimeout(function () {
        if (opt.classList.contains('correct')) {
          opt.dataset.vichoSeen = '1';
          say('¡Bien! Esa queda.', true, true);
        } else if (opt.classList.contains('wrong')) {
          opt.dataset.vichoSeen = '1';
          say('Revisa el porqué. La próxima sale.', true, true);
        }
      }, 40);
      return;
    }
    var tab = event.target.closest('.nav-tab');
    if (tab) {
      if (tab.scrollIntoView) tab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      say('Otro tema. Una idea y después un ejercicio.');
    }
  });

  window.setTimeout(function () {
    if (!narrow()) say(nextTip(), true);
  }, 900);
  raf = window.requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      running = false;
      window.cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      last = performance.now();
      raf = window.requestAnimationFrame(frame);
    }
  });

  function frame(now) {
    if (!running) return;
    var dt = Math.min(34, now - last);
    last = now;
    var floor = floorY();
    var width = actor.offsetWidth || 90;
    var maxX = Math.max(12, window.innerWidth - width - 8);
    var minX = 8;

    var quietGame = (location.pathname.split('/').pop() || '') === 'juegos.html';
    if (reduce || document.body.classList.contains('foco-on')) {
      mode = 'rest';
      x = 12;
      y = floor;
      dir = 1;
    } else if (quietGame) {
      mode = 'rest';
      x = Math.max(12, window.innerWidth - width - 8);
      y = 72;
      dir = -1;
    } else if (now > modeUntil) {
      if (mode === 'visit' || narrow()) {
        mode = 'walk';
        modeUntil = now + 5200;
      } else if (mode === 'walk' && Math.random() < 0.45) {
        mode = 'visit';
        modeUntil = now + 2000;
      } else {
        mode = 'walk';
        modeUntil = now + 3200;
      }
    }

    if (mode === 'walk') {
      x += dir * (window.innerWidth < 700 ? 0.055 : 0.085) * dt;
      if (x >= maxX) { x = maxX; dir = -1; }
      if (x <= minX) { x = minX; dir = 1; }
      y += (floor - y) * 0.08;
    } else if (mode === 'visit') {
      var visitY = Math.max(78, Math.min(floor - 40, window.innerHeight * 0.28));
      y += (visitY - y) * 0.06;
      x += dir * 0.04 * dt;
      if (y < 140) {
        minX = 78;
        maxX = Math.max(minX, window.innerWidth - width - 78);
      }
      if (x >= maxX) { x = maxX; dir = -1; }
      if (x <= minX) { x = minX; dir = 1; }
    }

    actor.classList.toggle('walk', mode === 'walk');
    actor.classList.toggle('rest', mode === 'rest');
    actor.style.left = Math.round(x) + 'px';
    actor.style.top = Math.round(y) + 'px';
    actor.style.transform = 'scaleX(' + dir + ')';
    if (!bubble.hidden) placeBubble();
    raf = window.requestAnimationFrame(frame);
  }

  function floorY() {
    var bar = document.getElementById('foco-root');
    var top = bar ? bar.getBoundingClientRect().top : window.innerHeight - 80;
    var height = actor.offsetHeight || 78;
    var visible = Math.round(height * (narrow() ? 0.8 : 0.84));
    return Math.max(48, top - visible);
  }

  function say(text, force, pin) {
    var now = performance.now();
    if (!force && now - saidAt < 3500) return;
    saidAt = now;
    bubble.textContent = text;
    bubble.hidden = false;
    bubble.classList.toggle('pinned', !!pin);
    placeBubble();
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(function () { bubble.hidden = true; }, 3600);
  }

  function narrow() {
    return window.innerWidth < 760;
  }

  function placeBubble() {
    var width = bubble.offsetWidth || 180;
    var height = bubble.offsetHeight || 52;
    var rect = actor.getBoundingClientRect();
    var back = document.getElementById('back-btn');
    var pocketTop = back ? Math.round(back.getBoundingClientRect().bottom + 8) : 72;
    var spots = [];
    if (!bubble.classList.contains('pinned')) {
      spots.push([rect.right + 8, rect.top + 4, false]);
      spots.push([rect.left - width - 8, rect.top + 4, true]);
      spots.push([rect.left, rect.top - height - 10, false]);
    }
    if (!narrow() || bubble.classList.contains('pinned')) {
      spots.push([12, pocketTop, false]);
      spots.push([(window.innerWidth - width) / 2, pocketTop, false]);
    }
    var chosen = null;
    for (var i = 0; i < spots.length; i++) {
      var left = Math.max(8, Math.min(spots[i][0], window.innerWidth - width - 8));
      var top = Math.max(8, Math.min(spots[i][1], window.innerHeight - height - 8));
      if (!overlaps(left, top, width, height)) {
        chosen = [left, top, spots[i][2]];
        break;
      }
    }
    if (!chosen) {
      var fallbackLeft = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
      var fallbackTop = Math.max(8, rect.top - height - 10);
      chosen = [fallbackLeft, fallbackTop, false];
    }
    bubble.classList.toggle('from-right', !!chosen[2]);
    bubble.classList.toggle('docked', !chosen[2] && chosen[0] < 24);
    bubble.style.left = Math.round(chosen[0]) + 'px';
    bubble.style.top = Math.round(chosen[1]) + 'px';
  }

  function overlaps(left, top, width, height) {
    var box = { left: left, top: top, right: left + width, bottom: top + height };
    var selectors = ['.hero-title', '.header-title', '.hero-logo', '.logo-name', '.hero-eyebrow', '.header-eyebrow', '.section-desc', '.game-board', '#foco-root', '#chat-fab', '.foco-go', '.cta-btn', '#theme-toggle', '#gs-trigger', '#back-btn', '.quiz-opt', '.quiz-feedback'];
    return selectors.some(function (selector) {
      return Array.prototype.some.call(document.querySelectorAll(selector), function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return false;
        return !(box.right < rect.left || box.left > rect.right || box.bottom < rect.top || box.top > rect.bottom);
      });
    });
  }

  function nextTip() {
    var text = tips[tipIndex % tips.length];
    tipIndex += 1;
    return text;
  }

  function tipsForPage() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var map = {
      'index.html': [
        'Hola, soy el Vicho. Te acompaño mientras estudias.',
        'Matemática es la prueba más cerca. Un bloque de 25 minutos.',
        'Di una idea sin mirar el cuaderno. Ahí sabes si quedó.'
      ],
      'matematica_guia.html': [
        'En el cuadrado de binomio, el del medio es el doble del producto.',
        'Deja una letra sola y sustitúyela en la otra ecuación.',
        'Factoriza cuando veas un factor que se repite.'
      ],
      'prueba_nivel_lenguaje_2.html': [
        'Lo explícito está escrito. Lo implícito se deduce.',
        'En el poema, mira quién habla y qué compara.',
        'Cierra con una idea del texto, en tus palabras.'
      ],
      'ingles_guia.html': [
        'Waterborne: viaja en el agua. Piensa en hygiene y sanitation.',
        'Primero las necesidades básicas. Después, cómo salir de la pobreza.',
        'Lee el título y la primera oración antes de las preguntas.'
      ],
      'prueba_nivel_ciencias_naturales.html': [
        'Darwin y Wallace: queda quien deja más descendencia.',
        'Las estaciones son por la inclinación, no por estar más cerca del Sol.',
        'En la reacción, los átomos se conservan. Cuéntalos.'
      ],
      'historia_guia.html': [
        'Escasez: queremos más de lo que hay.',
        'Si sube la demanda y la oferta no, el precio sube.',
        'Las cajas vecinas son ahorro del barrio, no un banco.'
      ],
      'juegos.html': [
        'Arma la idea en orden. El hueco es tu mano.',
        'En la memoria, el par es el concepto y su nombre.',
        'En el relámpago, lee el verbo de la pregunta.'
      ]
    };
    return map[page] || map['index.html'];
  }

  function deepenLightColors() {
    var names = ['--accent', '--accent-2', '--green', '--red', '--amber', '--cyan', '--teal', '--purple', '--yellow', '--yellow-bright', '--yellow-light', '--blue-bright', '--red-light', '--green-light', '--brown-bright'];
    var style = getComputedStyle(document.documentElement);
    names.forEach(function (name) {
      var rgb = parseColor(style.getPropertyValue(name));
      if (!rgb || luminance(rgb) < 0.42) return;
      document.body.style.setProperty(name, mix(rgb, [28, 18, 52], 0.46));
    });
  }

  function parseColor(value) {
    var text = (value || '').trim();
    var hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(text);
    if (hex) {
      var raw = hex[1];
      if (raw.length === 3) raw = raw.replace(/./g, function (ch) { return ch + ch; });
      return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
    }
    var rgb = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(text);
    if (!rgb) return null;
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }

  function luminance(rgb) {
    var channels = rgb.map(function (channel) {
      var c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function mix(rgb, toward, amount) {
    var mixed = rgb.map(function (channel, index) {
      return Math.round(channel * (1 - amount) + toward[index] * amount);
    });
    return 'rgb(' + mixed[0] + ' ' + mixed[1] + ' ' + mixed[2] + ')';
  }
})();
