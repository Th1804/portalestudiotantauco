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
    '<ellipse class="mouth" cx="60" cy="74" rx="7" ry="3.5" fill="#1a1208"/>',
    '</svg>'
  ].join('');

  var bubble = document.createElement('p');
  bubble.id = 'vicho-say';
  bubble.hidden = true;
  bubble.setAttribute('aria-live', 'polite');
  var think = document.createElement('div');
  think.id = 'vicho-think';
  think.hidden = true;
  think.innerHTML = '<div id="vicho-graphic"></div><p id="vicho-line"></p>';
  var learn = document.createElement('button');
  learn.id = 'vicho-learn';
  learn.type = 'button';
  learn.textContent = 'Enseña';
  learn.setAttribute('aria-label', 'El Vicho enseña en voz alta y recorre la página');
  learn.setAttribute('aria-pressed', 'false');
  document.body.appendChild(actor);
  document.body.appendChild(bubble);
  document.body.appendChild(think);
  document.body.appendChild(learn);

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
  var learning = false;
  var lesson = [];
  var step = 0;
  var stepToken = 0;
  var stepEl = null;
  var spotted = null;

  var eyes = actor.querySelector('.eyes');
  var mouth = actor.querySelector('.mouth');
  var feet = actor.querySelectorAll('.foot');
  var blinkUntil = 0;
  var heldUtterance = null;
  var thinkTimer = 0;
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener('voiceschanged', function () { speechSynthesis.getVoices(); });
  }

  actor.addEventListener('click', function () {
    actor.classList.add('boop');
    window.setTimeout(function () { actor.classList.remove('boop'); }, 480);
    var text = learning && lesson[step] ? lesson[step].say : nextTip();
    if (!learning) openThought(text, graphicForPage());
    speak(text);
  });
  learn.addEventListener('click', function () {
    if (learning) stopLesson();
    else startLesson();
  });

  document.addEventListener('click', function (event) {
    if (learning || event.target.closest('#vicho-learn')) return;
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
    if (learning && document.body.classList.contains('foco-on')) stopLesson();
    if (learning && stepEl) {
      var point = pointNear(stepEl);
      var dx = point.x - x;
      var dy = point.y - y;
      var dist = Math.hypot(dx, dy) || 1;
      dir = dx < 0 ? -1 : 1;
      if (dist > 16) {
        var pace = reduce ? dist : Math.min(dist, 0.22 * dt);
        x += dx / dist * pace;
        y += dy / dist * pace;
        mode = 'walk';
      } else {
        mode = 'rest';
      }
    } else if (reduce || document.body.classList.contains('foco-on')) {
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

    if (learning) {
      x = Math.max(minX, Math.min(x, maxX));
      y = Math.max(64, Math.min(y, floor));
    } else if (mode === 'walk') {
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

    var moving = mode === 'walk';
    var wave = Math.sin(now / 140);
    var lift = reduce ? 0 : (moving ? Math.abs(wave) * 12 : Math.sin(now / 500) * 5);
    var squash = !moving || reduce ? 1 : (0.9 + (1 - Math.abs(wave)) * 0.12);
    actor.classList.toggle('walk', moving);
    actor.classList.toggle('rest', mode === 'rest');
    var voiceOn = window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending);
    actor.classList.toggle('talk', !!voiceOn || (learning && !think.hidden));
    actor.style.left = Math.round(x) + 'px';
    actor.style.top = Math.round(y) + 'px';
    actor.style.transform = 'translateY(' + (-lift).toFixed(1) + 'px) scaleX(' + dir + ') scaleY(' + squash.toFixed(3) + ')';
    if (!reduce && feet.length === 2) {
      feet[0].setAttribute('cy', String(96 - (moving ? Math.max(0, wave) * 10 : 0)));
      feet[1].setAttribute('cy', String(96 - (moving ? Math.max(0, -wave) * 10 : 0)));
    }
    if (!blinkUntil && !reduce && Math.random() < 0.012) blinkUntil = now + 140;
    if (blinkUntil && now > blinkUntil) blinkUntil = 0;
    if (eyes) {
      eyes.style.transformBox = 'fill-box';
      eyes.style.transformOrigin = 'center';
      eyes.style.transform = blinkUntil ? 'scaleY(0.1)' : 'scaleY(1)';
    }
    if (mouth) {
      var open = actor.classList.contains('talk') ? (2.2 + Math.abs(Math.sin(now / 80)) * 5.5) : 2.2;
      mouth.setAttribute('ry', String(open));
    }
    if (!bubble.hidden) placeBubble();
    if (!think.hidden) placeThink();
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
    var selectors = ['.hero-title', '.header-title', '.hero-logo', '.logo-name', '.hero-eyebrow', '.header-eyebrow', '.section-desc', '.game-board', '#foco-root', '#chat-fab', '.foco-go', '.cta-btn', '#theme-toggle', '#gs-trigger', '#back-btn', '#vicho-learn', '.quiz-opt', '.quiz-feedback'];
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

  function startLesson() {
    lesson = lessonForPage();
    if (!lesson.length) return;
    learning = true;
    step = 0;
    learn.textContent = 'Parar';
    learn.setAttribute('aria-pressed', 'true');
    bubble.hidden = true;
    startStep();
  }

  function stopLesson() {
    learning = false;
    stepToken += 1;
    stepEl = null;
    learn.textContent = 'Enseña';
    learn.setAttribute('aria-pressed', 'false');
    think.hidden = true;
    actor.classList.remove('talk');
    if (spotted) spotted.classList.remove('vicho-spot');
    spotted = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function startStep() {
    var item = lesson[step];
    if (!item) { stopLesson(); return; }
    var token = ++stepToken;
    var shownAt = performance.now();
    var done = false;
    if (item.tab) {
      var tab = document.querySelector('.nav-tab[data-tab="' + item.tab + '"], #' + item.tab);
      if (tab) tab.click();
    }
    stepEl = document.querySelector(item.go);
    if (stepEl) {
      var acc = stepEl.closest('.acc-item');
      if (acc && !acc.classList.contains('open')) {
        var trigger = acc.querySelector('.acc-trigger');
        if (trigger) trigger.click();
      }
      if (spotted) spotted.classList.remove('vicho-spot');
      spotted = stepEl;
      stepEl.classList.add('vicho-spot');
      stepEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    }
    document.getElementById('vicho-graphic').innerHTML = graphicSvg(item.graphic);
    document.getElementById('vicho-line').textContent = item.say;
    think.hidden = false;
    placeThink();
    function goNext() {
      if (done || token !== stepToken || !learning) return;
      var elapsed = performance.now() - shownAt;
      if (elapsed < 5600) {
        window.setTimeout(goNext, 5600 - elapsed);
        return;
      }
      done = true;
      if (step + 1 >= lesson.length) stopLesson();
      else { step += 1; startStep(); }
    }
    speak(item.say, goNext);
    window.setTimeout(goNext, 9200);
  }

  function speak(text, onend) {
    say(text, true);
    if (learning) bubble.hidden = true;
    actor.classList.add('talk');
    if (!window.speechSynthesis) return;
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-CL';
    utter.rate = 0.95;
    utter.pitch = 1.15;
    var voices = speechSynthesis.getVoices();
    var picked = null;
    for (var i = 0; i < voices.length; i++) {
      var lang = voices[i].lang || '';
      if (/es[-_]CL/i.test(lang)) { picked = voices[i]; break; }
      if (!picked && /^es/i.test(lang)) picked = voices[i];
    }
    if (picked) {
      utter.voice = picked;
      utter.lang = picked.lang;
    }
    utter.onend = function () {
      if (!learning) actor.classList.remove('talk');
      if (onend) onend();
    };
    utter.onerror = function () {
      if (!learning) actor.classList.remove('talk');
    };
    heldUtterance = utter;
    var start = function () {
      try {
        speechSynthesis.resume();
        speechSynthesis.speak(heldUtterance);
      } catch (error) {}
    };
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      window.setTimeout(start, 80);
    } else {
      start();
    }
  }

  function openThought(text, graphic) {
    document.getElementById('vicho-graphic').innerHTML = graphicSvg(graphic);
    document.getElementById('vicho-line').textContent = text;
    think.hidden = false;
    placeThink();
    window.clearTimeout(thinkTimer);
    thinkTimer = window.setTimeout(function () {
      if (!learning) think.hidden = true;
    }, 4600);
  }

  function graphicForPage() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var map = {
      'index.html': 'piezas',
      'matematica_guia.html': 'binomio',
      'prueba_nivel_lenguaje_2.html': 'lectura',
      'ingles_guia.html': 'agua',
      'prueba_nivel_ciencias_naturales.html': 'seleccion',
      'historia_guia.html': 'precio',
      'juegos.html': 'piezas'
    };
    return map[page] || 'piezas';
  }

  function pointNear(el) {
    var rect = el.getBoundingClientRect();
    var width = actor.offsetWidth || 72;
    var floor = floorY();
    var left = rect.left - width - 14;
    if (left < 8) left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right + 10));
    var top = rect.top + Math.min(20, rect.height * 0.1);
    return { x: left, y: Math.max(64, Math.min(top, floor)) };
  }

  function placeThink() {
    var width = think.offsetWidth || 210;
    var height = think.offsetHeight || 160;
    var rect = actor.getBoundingClientRect();
    var spot = spotted ? spotted.getBoundingClientRect() : null;
    var spots = [
      [rect.left + (rect.width - width) / 2, rect.top - height - 10],
      [rect.right + 8, rect.top - height + 16],
      [rect.left - width - 8, rect.top - height + 16],
      [8, 64]
    ];
    var chosen = null;
    for (var i = 0; i < spots.length; i++) {
      var left = Math.max(8, Math.min(spots[i][0], window.innerWidth - width - 8));
      var top = Math.max(8, Math.min(spots[i][1], window.innerHeight - height - 8));
      if (!spot || !hits(left, top, width, height, spot)) { chosen = [left, top]; break; }
    }
    if (!chosen) chosen = [8, 64];
    think.style.left = Math.round(chosen[0]) + 'px';
    think.style.top = Math.round(chosen[1]) + 'px';
  }

  function hits(left, top, width, height, rect) {
    return !(left + width < rect.left || left > rect.right || top + height < rect.top || top > rect.bottom);
  }

  function lessonForPage() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var map = {
      'index.html': [
        { say: 'Si quieres practicar jugando, entra a la sala. Ahí se arman las ideas.', go: '.sala-card', graphic: 'piezas' },
        { say: 'Matemática es el 6 de noviembre. En el cuadrado de binomio, el del medio es el doble del producto.', go: '.materia-card.matematicas', graphic: 'binomio' },
        { say: 'Lengua es el 9. Lo explícito está escrito. Lo implícito se deduce.', go: '.materia-card.lenguaje', graphic: 'lectura' },
        { say: 'Inglés es el 13. Waterborne viaja en el agua.', go: '.materia-card.ingles', graphic: 'agua' },
        { say: 'Ciencias es el 16. Queda quien deja más descendencia.', go: '.materia-card.ciencias', graphic: 'seleccion' },
        { say: 'Historia es el 18. Si sube la demanda y la oferta no, el precio sube.', go: '.materia-card.historia', graphic: 'precio' }
      ],
      'matematica_guia.html': [
        { say: 'Mira el cuadrado de binomio. El término del medio es 2ab, el doble del producto.', go: '#tab-notables .formula-box', tab: 'notables', graphic: 'binomio' },
        { say: 'Factorizar es volver atrás: un factor que se repite se saca afuera.', go: '#tab-factorizacion .formula-box', tab: 'factorizacion', graphic: 'piezas' },
        { say: 'En un sistema, deja una letra sola y sustitúyela en la otra ecuación.', go: '#tab-sistemas .formula-box', tab: 'sistemas', graphic: 'cruce' }
      ],
      'prueba_nivel_lenguaje_2.html': [
        { say: 'Lo explícito está escrito. Lo implícito se deduce del texto.', go: '#tab-comprension .acc-item, #tab-comprension h2', tab: 'comprension', graphic: 'lectura' },
        { say: 'En el poema, mira quién habla y qué compara. El hablante no siempre es el autor.', go: '#tab-lirico .acc-item, #tab-lirico h2', tab: 'lirico', graphic: 'lectura' },
        { say: 'En el drama, el conflicto avanza en el diálogo y en las acotaciones.', go: '#tab-dramatico .acc-item, #tab-dramatico h2', tab: 'dramatico', graphic: 'lectura' }
      ],
      'ingles_guia.html': [
        { say: 'Waterborne: viaja en el agua. Hygiene y sanitation frenan los gérmenes.', go: '#tab-unit3 h2, #tab-unit3', tab: 'unit3', graphic: 'agua' },
        { say: 'Primero las necesidades básicas. Después se piensa en salir de la pobreza.', go: '#tab-unit4 h2, #tab-unit4', tab: 'unit4', graphic: 'agua' },
        { say: 'Lee el título y la primera oración antes de responder.', go: '#tab-reading h2, #tab-reading', tab: 'reading', graphic: 'lectura' }
      ],
      'prueba_nivel_ciencias_naturales.html': [
        { say: 'Darwin y Wallace: hay variación heredable y queda quien deja más crías.', go: '#tab-bio .acc-item', tab: 'bio', graphic: 'seleccion' },
        { say: 'Las estaciones son por la inclinación del eje, no por estar más cerca del Sol.', go: '#tab-fisica .acc-item', tab: 'fisica', graphic: 'estacion' },
        { say: 'En la reacción, los átomos se conservan. Cuéntalos a los dos lados.', go: '#tab-quimica .acc-item', tab: 'quimica', graphic: 'atomos' }
      ],
      'historia_guia.html': [
        { say: 'Escasez: queremos más de lo que hay.', go: '#tab-economia .acc-item, #tab-economia h2', tab: 'economia', graphic: 'precio' },
        { say: 'Si sube la demanda y la oferta no alcanza, el precio sube.', go: '#tab-mercado .acc-item, #tab-mercado h2', tab: 'mercado', graphic: 'precio' },
        { say: 'Las cajas vecinas son ahorro del barrio, no un banco.', go: '#tab-finanzas .acc-item, #tab-finanzas h2', tab: 'finanzas', graphic: 'precio' }
      ],
      'juegos.html': [
        { say: 'En el rompecabezas, el hueco es tu mano. Arma la idea en orden.', go: '#stage', tab: 'tab-rompecabezas', graphic: 'piezas' },
        { say: 'En la memoria, cada par es el concepto y su nombre.', go: '#stage', tab: 'tab-memoria', graphic: 'piezas' },
        { say: 'En el relámpago, lee el verbo de la pregunta antes de tocar.', go: '#stage', tab: 'tab-rayo', graphic: 'lectura' }
      ]
    };
    return (map[page] || map['index.html']).filter(function (item) {
      return document.querySelector(item.go);
    });
  }

  function graphicSvg(id) {
    var common = '<svg viewBox="0 0 180 96" aria-hidden="true">';
    var drawings = {
      binomio: common + '<text x="90" y="28" text-anchor="middle">(a+b)²<animate attributeName="opacity" values="0;1;1" dur="1.6s" repeatCount="indefinite"/></text><text x="34" y="74" text-anchor="middle" opacity="0">a²<animate attributeName="opacity" values="0;0;1;1" dur="1.6s" repeatCount="indefinite"/></text><text x="90" y="74" text-anchor="middle" opacity="0">2ab<animate attributeName="opacity" values="0;0;0;1;1" dur="1.6s" repeatCount="indefinite"/></text><text x="146" y="74" text-anchor="middle" opacity="0">b²<animate attributeName="opacity" values="0;0;0;0;1" dur="1.6s" repeatCount="indefinite"/></text></svg>',
      lectura: common + '<rect x="28" y="16" width="56" height="66" rx="6" fill="#fff6ea" stroke="#241c3a" stroke-width="2"><animate attributeName="y" values="24;16;16" dur="1.2s" fill="freeze"/></rect><rect x="96" y="16" width="56" height="66" rx="6" fill="#efe7ff" stroke="#241c3a" stroke-width="2"><animate attributeName="y" values="24;16;16" dur="1.2s" begin="0.25s" fill="freeze"/></rect><text x="56" y="54" text-anchor="middle" font-size="11">escrito</text><text x="124" y="54" text-anchor="middle" font-size="11">se deduce</text></svg>',
      agua: common + '<ellipse cx="90" cy="70" rx="34" ry="12" fill="#9fd4ff"/><circle cx="70" cy="18" r="6" fill="#3aa0ff"><animate attributeName="cy" values="10;68;10" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="90" cy="12" r="5" fill="#67c3ff"><animate attributeName="cy" values="8;66;8" dur="1.2s" begin="0.3s" repeatCount="indefinite"/></circle><circle cx="110" cy="20" r="6" fill="#1d7ed8"><animate attributeName="cy" values="12;68;12" dur="1.2s" begin="0.55s" repeatCount="indefinite"/></circle></svg>',
      seleccion: common + '<circle cx="40" cy="58" r="12" fill="#c4b5fd"><animate attributeName="opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="90" cy="52" r="12" fill="#ff8a14"><animate attributeName="r" values="12;20;12" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="140" cy="58" r="12" fill="#9fd4ff"><animate attributeName="opacity" values="1;0.2;1" dur="1.4s" begin="0.4s" repeatCount="indefinite"/></circle></svg>',
      precio: common + '<line x1="28" y1="16" x2="28" y2="80" stroke="#241c3a" stroke-width="3"/><line x1="28" y1="80" x2="160" y2="80" stroke="#241c3a" stroke-width="3"/><polyline points="40,68 86,48 150,22" fill="none" stroke="#ef6a12" stroke-width="4"/><circle cx="40" cy="68" r="6" fill="#6d5efc"><animate attributeName="cx" values="40;150;40" dur="1.8s" repeatCount="indefinite"/><animate attributeName="cy" values="68;22;68" dur="1.8s" repeatCount="indefinite"/></circle></svg>',
      piezas: common + '<rect x="18" y="40" width="40" height="40" rx="8" fill="#ffb15a"><animate attributeName="y" values="70;28;28" dur="0.8s" fill="freeze"/></rect><rect x="70" y="40" width="40" height="40" rx="8" fill="#ff8a14"><animate attributeName="y" values="70;28;28" dur="0.8s" begin="0.15s" fill="freeze"/></rect><rect x="122" y="40" width="40" height="40" rx="8" fill="#ef6a12"><animate attributeName="y" values="70;28;28" dur="0.8s" begin="0.3s" fill="freeze"/></rect></svg>',
      cruce: common + '<line x1="24" y1="78" x2="150" y2="20" stroke="#6d5efc" stroke-width="4"><animate attributeName="x2" values="24;150;150" dur="0.8s" fill="freeze"/><animate attributeName="y2" values="78;20;20" dur="0.8s" fill="freeze"/></line><line x1="24" y1="24" x2="156" y2="74" stroke="#ef6a12" stroke-width="4"><animate attributeName="x2" values="24;156;156" dur="0.8s" begin="0.2s" fill="freeze"/></line><circle cx="92" cy="48" r="7" fill="#241c3a"><animate attributeName="r" values="0;8;7" dur="0.8s" begin="0.45s" fill="freeze"/></circle></svg>',
      estacion: common + '<circle cx="90" cy="48" r="22" fill="#ffb15a"/><ellipse cx="90" cy="48" rx="22" ry="8" fill="none" stroke="#1d4ed8" stroke-width="3"><animateTransform attributeName="transform" type="rotate" values="-24 90 48;24 90 48;-24 90 48" dur="2.4s" repeatCount="indefinite"/></ellipse><circle cx="90" cy="48" r="4" fill="#241c3a"/></svg>',
      atomos: common + '<circle cx="78" cy="48" r="14" fill="#67c3ff"><animate attributeName="cx" values="58;96;58" dur="1.6s" repeatCount="indefinite"/></circle><circle cx="96" cy="36" r="10" fill="#ff8a14"><animate attributeName="cy" values="30;64;30" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="112" cy="62" r="12" fill="#c4b5fd"><animate attributeName="cx" values="120;70;120" dur="1.8s" repeatCount="indefinite"/></circle></svg>'
    };
    return drawings[id] || drawings.piezas;
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
