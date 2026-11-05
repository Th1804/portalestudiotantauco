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
  var mode = 'rest';
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
  var stepPressed = false;
  var lastNudge = 0;
  var fingerDown = false;
  var reactedAt = 0;
  var punchUntil = 0;
  if (window.speechSynthesis) {
    speechSynthesis.getVoices();
    speechSynthesis.addEventListener('voiceschanged', function () { speechSynthesis.getVoices(); });
  }

  var fingerTimer = 0;
  actor.addEventListener('pointerdown', function (event) {
    if (event.button && event.button !== 0) return;
    fingerDown = true;
    window.clearTimeout(fingerTimer);
    fingerTimer = window.setTimeout(function () { fingerDown = false; }, 380);
    try { actor.setPointerCapture(event.pointerId); } catch (error) {}
  });
  actor.addEventListener('pointerup', function () {
    fingerDown = false;
    react();
  });
  actor.addEventListener('pointercancel', function () { fingerDown = false; });
  actor.addEventListener('click', react);
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
    if (learning) return;
    say('Presióname y te explico la materia.', true);
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

    var quietGame = pageName() === 'juegos.html';
    if (learning && document.body.classList.contains('foco-on')) stopLesson();
    var chasing = !fingerDown && learning && stepEl;
    if (chasing) {
      var point = targetPoint(stepEl);
      if (!point) {
        var rect = stepEl.getBoundingClientRect();
        point = {
          x: rect.left < width ? minX : maxX,
          y: rect.top < 120 ? 72 : floor
        };
        if (now - lastNudge > 1800) {
          lastNudge = now;
          stepEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }
      var dx = point.x - x;
      var dy = point.y - y;
      var dist = Math.hypot(dx, dy) || 1;
      dir = Math.abs(dx) < 6 ? dir : (dx < 0 ? -1 : 1);
      if (dist > 22) {
        var pace = Math.min(dist, 0.12 * dt);
        x += dx / dist * pace;
        y += dy / dist * pace;
        mode = 'walk';
      } else {
        x = point.x;
        y = point.y;
        mode = 'rest';
        if (!stepPressed && lesson[step]) tapControl(stepEl, lesson[step]);
      }
    } else {
      mode = 'rest';
      if (!fingerDown && document.body.classList.contains('foco-on')) {
        x = 12;
        y = floor;
      } else if (!fingerDown && quietGame && !learning) {
        x = Math.max(12, window.innerWidth - width - 8);
        y = 72;
      }
    }

    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(8, Math.min(y, Math.max(floor, 8)));

    var moving = mode === 'walk' && !fingerDown;
    var wave = Math.sin(now / 220);
    var lift = moving ? Math.abs(wave) * 4 : Math.sin(now / 900) * 1.5;
    var squash = 1;
    var punch = now < punchUntil ? 1 + Math.sin(((punchUntil - now) / 420) * Math.PI) * 0.22 : 1;
    actor.classList.toggle('walk', moving);
    actor.classList.remove('rest');
    var voiceOn = window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.pending);
    actor.classList.toggle('talk', !!voiceOn || (learning && !think.hidden));
    actor.style.left = Math.round(x) + 'px';
    actor.style.top = Math.round(y) + 'px';
    actor.style.transform = 'translateY(' + (-lift).toFixed(1) + 'px) scale(' + punch.toFixed(3) + ') scaleX(' + dir + ') scaleY(' + squash.toFixed(3) + ')';
    if (!reduce && feet.length === 2) {
      feet[0].setAttribute('cy', String(96 - (moving ? Math.max(0, wave) * 4 : 0)));
      feet[1].setAttribute('cy', String(96 - (moving ? Math.max(0, -wave) * 4 : 0)));
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

  function react() {
    fingerDown = false;
    var now = performance.now();
    if (now - reactedAt < 500) return;
    reactedAt = now;
    punchUntil = now + 420;
    actor.classList.add('boop');
    window.setTimeout(function () { actor.classList.remove('boop'); }, 480);
    if (!learning) {
      startLesson();
      if (learning) return;
    }
    var text = learning && lesson[step] ? lesson[step].say : nextTip();
    if (!learning) openThought(text, graphicForPage());
    speak(text);
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
    var page = pageName();
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
    stepPressed = false;
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
    stepPressed = false;
    stepEl = findVisible(item.tap);
    document.getElementById('vicho-graphic').innerHTML = graphicSvg(item.graphic);
    document.getElementById('vicho-line').textContent = item.say;
    think.hidden = false;
    placeThink();
    var limit = Math.max(6500, Math.min(20000, item.say.length * 70));
    var heard = false;
    function goNext() {
      if (done || token !== stepToken || !learning) return;
      var elapsed = performance.now() - shownAt;
      if (!heard && elapsed < limit) return;
      if (elapsed < 1600) {
        window.setTimeout(goNext, 1600 - elapsed);
        return;
      }
      if (!stepPressed) {
        var late = stepEl && findVisible(item.tap) ? stepEl : findVisible(item.tap);
        if (late) tapControl(late, item);
      }
      done = true;
      if (step + 1 >= lesson.length) stopLesson();
      else { step += 1; startStep(); }
    }
    speak(item.say, function () {
      heard = true;
      goNext();
    });
    if (stepEl) {
      stepEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
    window.setTimeout(function () {
      heard = true;
      goNext();
    }, limit);
  }

  function speak(text, onend) {
    say(text, true);
    actor.classList.add('talk');
    if (!window.speechSynthesis) return;
    var utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-CL';
    utter.rate = 0.92;
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
    var page = pageName();
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

  function pageName() {
    var name = location.pathname.split('/').pop() || 'index.html';
    if (!name || name === 'portalestudiotantauco') return 'index.html';
    if (name.indexOf('.') === -1) name += '.html';
    return name;
  }

  function teachesHere() {
    var page = pageName();
    return page === 'matematica_guia.html' ||
      page === 'prueba_nivel_lenguaje_2.html' ||
      page === 'ingles_guia.html' ||
      page === 'prueba_nivel_ciencias_naturales.html' ||
      page === 'historia_guia.html' ||
      page === 'juegos.html';
  }

  function findVisible(selector) {
    var list = document.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (Number(style.opacity) === 0) continue;
      return el;
    }
    return null;
  }

  function tapControl(el, item) {
    if (stepPressed || !el) return;
    stepPressed = true;
    if (spotted && spotted !== el) spotted.classList.remove('vicho-spot');
    spotted = el;
    el.classList.add('vicho-spot');
    actor.classList.add('boop');
    window.setTimeout(function () { actor.classList.remove('boop'); }, 480);
    if (!item || item.press === false || el.tagName === 'A') return;
    var acc = el.closest('.acc-item');
    if (el.classList.contains('acc-trigger') && acc && acc.classList.contains('open')) return;
    el.click();
  }

  function targetPoint(el) {
    if (!el || !el.isConnected) return null;
    var rect = el.getBoundingClientRect();
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var left = Math.max(rect.left, 4);
    var top = Math.max(rect.top, 4);
    var right = Math.min(rect.right, vw - 4);
    var bottom = Math.min(rect.bottom, vh - 4);
    if (right - left < 8 || bottom - top < 8) return null;
    var cx = left + Math.min((right - left) / 2, 140);
    var cy = top + Math.min((bottom - top) / 2, 28);
    var width = actor.offsetWidth || 72;
    var height = actor.offsetHeight || 80;
    return {
      x: Math.round(Math.max(4, Math.min(cx - width * 0.42, vw - width - 4))),
      y: Math.round(Math.max(4, Math.min(cy - height * 0.2, floorY())))
    };
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
    var page = pageName();
    var map = {
      'index.html': [
        { say: 'Matemática, el 6 de noviembre, es productos notables, factorización y sistemas de dos ecuaciones. En el cuadrado de binomio el término del medio es el doble del producto.', tap: '.materia-card.matematicas', press: false, graphic: 'binomio' },
        { say: 'Lengua, el 9, pide leer: lo explícito está escrito, lo implícito se infiere, y hay que reconocer narrativo, lírico, dramático, texto expositivo e infografía.', tap: '.materia-card.lenguaje', press: false, graphic: 'lectura' },
        { say: 'Inglés, el 13, une salud y agua con pobreza. Waterborne viaja en el agua. Las necesidades básicas son comida, agua, techo, salud y escuela.', tap: '.materia-card.ingles', press: false, graphic: 'agua' },
        { say: 'Ciencias, el 16, junta evolución y ecosistemas, sonido y luz, sismos, el sistema solar, y las reacciones donde los átomos se conservan.', tap: '.materia-card.ciencias', press: false, graphic: 'seleccion' },
        { say: 'Historia, el 18, es escasez y las tres preguntas económicas, cómo se forma el precio, el riesgo del ahorro y del crédito, y la expansión del Estado en el siglo XIX.', tap: '.materia-card.historia', press: false, graphic: 'precio' }
      ],
      'matematica_guia.html': [
        { say: 'El cuadrado de un binomio tiene tres términos: el cuadrado del primero, el doble producto y el cuadrado del segundo. (a más b) al cuadrado es a cuadrado más 2 a b más b cuadrado. (x más 4) al cuadrado es x cuadrado más 8 x más 16. No alcanza con sumar los cuadrados.', tap: '.nav-tab[data-tab="notables"]', graphic: 'binomio' },
        { say: 'Si dos binomios comparten la x, (x más a) por (x más b) es x cuadrado más (a más b) x más a por b. En (x más 3) por (x más 5) el medio es 8 x y el independiente es 15. Si un número es negativo, el producto puede quedar negativo.', tap: '#acc-comun .acc-trigger', graphic: 'binomio' },
        { say: 'Suma por diferencia: (a más b) por (a menos b) es a cuadrado menos b cuadrado. El doble producto se anula. (x más 6) por (x menos 6) es x cuadrado menos 36. Y 27 por 33 es 30 al cuadrado menos 3 al cuadrado, o sea 891.', tap: '#acc-dif .acc-trigger', graphic: 'binomio' },
        { say: 'Factorizar es el camino inverso: el polinomio vuelve a ser una multiplicación. Busca en este orden: factor común, diferencia de cuadrados, trinomio cuadrado perfecto y, al final, x cuadrado más b x más c.', tap: '.nav-tab[data-tab="factorizacion"]', graphic: 'piezas' },
        { say: 'El factor común es el número y la letra que se repiten en todos los términos, con el menor exponente. 6 x cuadrado más 9 x es 3 x por (2 x más 3). Al multiplicar de vuelta tienen que aparecer los dos términos.', tap: '#tab-factorizacion .acc-item:nth-child(1) .acc-trigger', graphic: 'piezas' },
        { say: 'Diferencia de cuadrados: a cuadrado menos b cuadrado es (a más b) por (a menos b). x cuadrado menos 25 es (x más 5) por (x menos 5). Una suma de cuadrados, como x cuadrado más 25, no se factoriza de esta forma.', tap: '#tab-factorizacion .acc-item:nth-child(2) .acc-trigger', graphic: 'piezas' },
        { say: 'Un trinomio cuadrado perfecto tiene cuadrados en los extremos y, en el medio, el doble producto de sus raíces. x cuadrado más 10 x más 25 es (x más 5) al cuadrado. Si el medio es negativo, el binomio resta: (2 x menos 3) al cuadrado.', tap: '#tab-factorizacion .acc-item:nth-child(3) .acc-trigger', graphic: 'piezas' },
        { say: 'En x cuadrado más b x más c busca dos números que sumen b y multipliquen c. Para más 7 x más 12 sirven 3 y 4, así que es (x más 3) por (x más 4). Si el primer coeficiente no es 1, saca antes el factor común.', tap: '#tab-factorizacion .acc-item:nth-child(4) .acc-trigger', graphic: 'piezas' },
        { say: 'Un sistema tiene dos ecuaciones y dos incógnitas. La solución es el par x, y que cumple las dos a la vez. Si las rectas se cortan, hay una solución. Si son paralelas, ninguna. Si son la misma recta, hay infinitas.', tap: '.nav-tab[data-tab="sistemas"]', graphic: 'cruce' },
        { say: 'Igualación: despeja la misma letra en las dos ecuaciones e iguala esas expresiones. En x más y igual 5 y x menos y igual 1, queda 5 menos y igual 1 más y. Entonces y vale 2 y x vale 3. La solución es (3, 2).', tap: '#tab-sistemas .acc-item:nth-child(1) .acc-trigger', graphic: 'cruce' },
        { say: 'Sustitución: despeja una letra y reemplázala en la otra ecuación. En x menos y igual 2, x es y más 2. Al poner eso en 2 x más y igual 7, y vale 1 y x vale 3. Comprueba que el par cumpla las dos ecuaciones.', tap: '#tab-sistemas .acc-item:nth-child(2) .acc-trigger', graphic: 'cruce' },
        { say: 'Reducción: deja una letra con coeficientes opuestos y suma las ecuaciones para que desaparezca. En 3 x más 2 y igual 12 y 5 x menos 2 y igual 4, la y se anula, 8 x es 16 y x vale 2. Después y vale 3.', tap: '#tab-sistemas .acc-item:nth-child(3) .acc-trigger', graphic: 'cruce' },
        { say: 'En el método gráfico cada ecuación es una recta. El punto donde se cruzan es la solución. x más y igual 4 se escribe y igual 4 menos x, y junto con y igual x se cortan en (2, 2). Si no se cruzan, el sistema no tiene solución.', tap: '#tab-sistemas .acc-item:nth-child(4) .acc-trigger', graphic: 'cruce' }
      ],
      'prueba_nivel_lenguaje_2.html': [
        { say: 'Lo explícito está dicho con palabras: quién, dónde, qué cifra. Marca las palabras de la pregunta y búscalas, o un sinónimo, en el texto. No completes con lo que tú crees que pasó.', tap: '.nav-tab[data-tab="comprension"]', graphic: 'lectura' },
        { say: 'Lo implícito se concluye con una pista del texto. Si alguien cierra el cuaderno, apaga la lámpara y el pasillo queda en silencio, puedes inferir que se va a dormir. Si no puedes señalar la pista, es una invención.', tap: '#tab-comprension .acc-item:nth-child(2) .acc-trigger', graphic: 'lectura' },
        { say: 'Interpretar es decir el sentido con tus palabras. Relacionar conecta título, personajes o el texto con su época. Evaluar exige una cita o un dato: «me gustó» no fundamenta una respuesta.', tap: '#tab-comprension .acc-item:nth-child(3) .acc-trigger', graphic: 'lectura' },
        { say: 'El texto narrativo cuenta hechos de personajes. El mundo narrativo junta narrador, personajes, acciones, espacio y tiempo. El tema no es el resumen: una huida puede tener por tema el miedo o la libertad.', tap: '.nav-tab[data-tab="narrativo"]', graphic: 'lectura' },
        { say: 'En el poema, el hablante lírico no es siempre quien lo escribió. El motivo es de qué se habla y el temple es la emoción. La comparación usa «como». La metáfora identifica sin ese nexo. La personificación da acción humana a lo que no la tiene. La hipérbole exagera y la anáfora repite al inicio del verso.', tap: '.nav-tab[data-tab="lirico"]', graphic: 'lectura' },
        { say: 'El texto dramático está escrito para representarse. El diálogo es entre personajes, el monólogo es a solas y el aparte no lo oyen los demás. Las acotaciones no las dice el personaje: indican gesto, tono o escena. El conflicto puede ser entre personas, con el entorno o dentro de alguien.', tap: '.nav-tab[data-tab="dramatico"]', graphic: 'lectura' },
        { say: 'El texto expositivo explica un tema con idea principal y datos: ejemplos, cifras o definiciones. La infografía mezcla palabras e imágenes. El título da el tema, y el tamaño, el color o una flecha ordenan qué importa o marcan una causa.', tap: '.nav-tab[data-tab="nolit"]', graphic: 'lectura' },
        { say: 'En la lectura crítica, el mensaje explícito es la frase que el texto defiende. El implícito es la valoración que se cuela: quién queda bien y qué se da por sabido. El contexto es época, lugar, autor y destinatario. La opinión va después de la evidencia.', tap: '.nav-tab[data-tab="critica"]', graphic: 'lectura' }
      ],
      'ingles_guia.html': [
        { say: 'Waterborne means the disease travels in water. Cholera and typhoid spread by contaminated water and cause diarrhea, dehydration or high fever. The fecal-oral route carries germs from feces to the mouth by water, hands, flies or food. Boiling, filtering, sanitation and washing hands with soap prevent that.', tap: '.nav-tab[data-tab="unit3"]', graphic: 'agua' },
        { say: 'Foreign aid does not always end poverty, and not all aid is wasted. Vaccines, oral rehydration salts and protected wells save lives. Aid can be money, training, medicine or engineers. Should gives advice, must is an obligation, and can shows a possibility.', tap: '.nav-tab[data-tab="unit3"]', graphic: 'agua' },
        { say: 'Basic needs are food, safe water, shelter, health care and education. If one is missing, the others get harder. Extreme poverty means a family cannot cover that minimum, so children may leave school and work. Income, savings, credit and remittances are financial resources. Development is a long process of schools, clinics, jobs and services, not one donation.', tap: '.nav-tab[data-tab="unit4"]', graphic: 'agua' },
        { say: 'Because, so and therefore show cause and effect. The well was contaminated, so children got sick. They left school because they had to work. For comparisons, than, more, fewer and less only work if you compare the same kind of thing.', tap: '.nav-tab[data-tab="unit4"]', graphic: 'lectura' },
        { say: 'In the reading, the disease was waterborne: sewage reached the water people drank. The aid worked because the community also learned and worked. A machine without training is not a solution. Clean water was the first step, not the end of development.', tap: '.nav-tab[data-tab="reading"]', graphic: 'lectura' }
      ],
      'prueba_nivel_ciencias_naturales.html': [
        { say: 'La generación espontánea decía que la vida aparecía de la materia no viva. Redi, Spallanzani y Pasteur mostraron lo contrario: la biogénesis. Todo ser vivo proviene de otro. En el matraz de cuello de cisne entra aire, pero el caldo sigue estéril porque el polvo queda en la curva.', tap: '#tab-bio .acc-item:nth-of-type(1) .acc-trigger', graphic: 'seleccion' },
        { say: 'Lamarck pensó que lo que un cuerpo usa se hereda, como el cuello de la jirafa que se estira. Darwin y Wallace propusieron la selección natural: hay variación heredable, nacen más de los que caben, y quienes dejan más crías vuelven frecuentes sus rasgos. Eso, con el tiempo, es la adaptación.', tap: '#tab-bio .acc-item:nth-of-type(2) .acc-trigger', graphic: 'seleccion' },
        { say: 'Clasificar ordena de lo general a lo particular: reino, filo, clase, orden, familia, género y especie. Los grupos cercanos comparten un ancestro más reciente. La especie se escribe con dos nombres, como Puma concolor. Hoy también se usa el ADN, así que una clasificación puede cambiar.', tap: '#tab-bio .acc-item:nth-of-type(3) .acc-trigger', graphic: 'seleccion' },
        { say: 'Un organismo es un guanaco. La población son los guanacos de un valle. La comunidad suma las otras especies. El ecosistema agrega agua, suelo y clima. La población crece en forma exponencial si nada la frena, y en forma logística cerca de la capacidad de carga. Depredación y parasitismo son más y menos. La competencia perjudica a ambos. El mutualismo beneficia a los dos.', tap: '#tab-bio .acc-item:nth-of-type(4) .acc-trigger', graphic: 'seleccion' },
        { say: 'El sonido es una onda mecánica. La frecuencia se oye como grave o agudo, y la amplitud como intensidad. El oído externo lleva la onda al tímpano, el medio la amplifica con martillo, yunque y estribo, y la cóclea la vuelve señal nerviosa. El oído humano capta, aproximadamente, de 20 a 20 mil hertz.', tap: '.nav-tab[data-tab="fisica"]', graphic: 'estacion' },
        { say: 'La luz visible va, aproximadamente, del violeta al rojo, entre 400 y 700 nanómetros. El ojo no ve ultravioleta ni infrarrojo. Sin corrección, estudiar o ver una señal se dificulta. Lentes y audífonos cambian la participación de las personas.', tap: '#tab-fisica .acc-item:nth-of-type(2) .acc-trigger', graphic: 'estacion' },
        { say: 'En Chile, la placa de Nazca se hunde bajo la Sudamericana. El hipocentro es la ruptura en profundidad y el epicentro es el punto de la superficie justo encima. La onda P llega primero y atraviesa sólidos y líquidos. La S no atraviesa el núcleo externo líquido. Las superficiales suelen dañar más las construcciones. La magnitud es la energía del sismo. La intensidad son los efectos, y cambian de un lugar a otro.', tap: '#tab-fisica .acc-item:nth-of-type(3) .acc-trigger', graphic: 'estacion' },
        { say: 'El día y la noche vienen de la rotación de la Tierra. El año es su órbita. Las estaciones las produce la inclinación del eje, unos 23,5 grados, no la distancia al Sol. En diciembre el hemisferio sur queda más de frente al Sol y en Chile es verano. El eclipse solar es en luna nueva y el lunar en luna llena. No hay eclipse en cada fase porque la órbita de la Luna está inclinada.', tap: '#tab-fisica .acc-item:nth-of-type(4) .acc-trigger', graphic: 'estacion' },
        { say: 'En un cambio físico la sustancia sigue siendo la misma: el hielo sigue siendo agua. En un cambio químico aparecen sustancias nuevas, a veces con gas, color, olor o calor. La fermentación produce etanol y dióxido de carbono. La combustión del metano produce dióxido de carbono y agua. El óxido de hierro es una sustancia nueva.', tap: '.nav-tab[data-tab="quimica"]', graphic: 'atomos' },
        { say: 'Las partículas reaccionan si chocan con energía suficiente y buena orientación. Esa energía mínima es la de activación. Síntesis junta, descomposición separa, sustitución reemplaza. La combustión libera calor: es exotérmica. En la neutralización, ácido más base forman sal y agua. Quien pierde electrones se oxida y quien los gana se reduce.', tap: '#tab-quimica .acc-item:nth-of-type(2) .acc-trigger', graphic: 'atomos' },
        { say: 'Los átomos no desaparecen: se reordenan. Por eso la masa se conserva. 12 gramos de carbono más 32 de oxígeno forman 44 de dióxido de carbono. Un mol tiene el número de Avogadro de partículas, y la masa molar es la masa de un mol. Los coeficientes equilibran la ecuación; no se cambian las fórmulas para hacerlas calzar.', tap: '#tab-quimica .acc-item:nth-of-type(3) .acc-trigger', graphic: 'atomos' }
      ],
      'historia_guia.html': [
        { say: 'La escasez no es que un bien esté agotado hoy. Es que no alcanza para todos los usos que la gente quisiera. De ahí salen tres preguntas: qué producir, cómo producirlo y para quién. Elegir pan es dejar de producir otra cosa.', tap: '.nav-tab[data-tab="economia"]', graphic: 'precio' },
        { say: 'Las familias consumen y ofrecen trabajo. Las empresas producen y contratan. El Estado cobra impuestos y entrega servicios. El resto del mundo entra por importaciones y exportaciones. Una familia compra pan, la panadería paga sueldo, el Estado cobra IVA y el trigo puede cruzar la frontera.', tap: '#tab-economia .acc-trigger', graphic: 'precio' },
        { say: 'La demanda baja cuando el precio sube. La oferta sube cuando el precio sube. El equilibrio es el precio en que se ofrece y se pide la misma cantidad. Si sube la demanda y la oferta no alcanza, el precio sube.', tap: '.nav-tab[data-tab="mercado"]', graphic: 'precio' },
        { say: 'Un monopolio es un solo vendedor y puede mantener el precio alto. La colusión es un acuerdo entre vendedores para actuar como uno. La inflación sube el nivel general de precios. Un precio máximo muy bajo puede generar escasez, y un arancel encarece lo importado.', tap: '#tab-mercado .acc-trigger', graphic: 'precio' },
        { say: 'Cada instrumento financiero sirve para algo y tiene un riesgo. La libreta separa el ahorro, pero la inflación puede comerse el interés. El crédito y la tarjeta permiten pagar después, y la deuda crece si solo pagas el mínimo. La acción puede ganar o perder valor. La previsión protege el futuro solo si los aportes alcanzan.', tap: '.nav-tab[data-tab="finanzas"]', graphic: 'precio' },
        { say: 'La colonización instaló población para afirmar al Estado. En el sur, desde 1845, Vicente Pérez Rosales impulsó la llegada de inmigrantes alemanes a Valdivia y Llanquihue. También cambió la vida de quienes ya vivían ahí.', tap: '.nav-tab[data-tab="expansion"]', graphic: 'precio' },
        { say: 'La ocupación de la Araucanía avanzó con fuertes y después con radicación mapuche en tierras reducidas. Para el Estado era incorporar territorio. Para el pueblo mapuche fue pérdida de territorio, violencia y una reorganización forzada. En 1843, Fuerte Bulnes y luego Punta Arenas ocuparon el estrecho de Magallanes.', tap: '#tab-expansion .acc-item:nth-of-type(2) .acc-trigger', graphic: 'precio' },
        { say: 'La diplomacia fija límites por tratados. El de 1881 con Argentina reparte la Patagonia. La Guerra del Pacífico, entre 1879 y 1884, incorporó territorios salitreros: Tarapacá y, después, Antofagasta. Bolivia perdió su salida soberana al mar. Hay que relacionar la guerra con el salitre y con la nueva frontera.', tap: '#tab-expansion .acc-item:nth-of-type(3) .acc-trigger', graphic: 'precio' },
        { say: 'Expandir el territorio exigía conocerlo. Gay, Domeyko y Philippi lo recorrieron y lo describieron. Los censos contaron a la población para administrar. La Universidad de Chile, con Andrés Bello en 1842, formó profesionales. Mapas y estudios sirvieron para organizar provincias y defender límites.', tap: '#tab-expansion .acc-item:nth-of-type(4) .acc-trigger', graphic: 'precio' }
      ],
      'juegos.html': [
        { say: 'En el rompecabezas, cada ficha es una parte de la idea. El cuadrado de binomio es a cuadrado, más el doble producto, más b cuadrado. El hueco es el espacio por donde deslizas la pieza que falta.', tap: '#tab-rompecabezas', graphic: 'piezas' },
        { say: 'En la memoria, el par junta el concepto con su nombre. Por ejemplo, escasez con «no alcanza para todos los usos», o selección natural con «deja más descendencia».', tap: '#tab-memoria', graphic: 'piezas' },
        { say: 'En el relámpago, la pregunta trae el contenido de la PDN. Lee el verbo: si dice «infiere», la respuesta no está copiada; si dice «calcula», aplica la fórmula y comprueba.', tap: '#tab-rayo', graphic: 'lectura' }
      ]
    };
    return (map[page] || []).filter(function (item) {
      return document.querySelector(item.tap);
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
