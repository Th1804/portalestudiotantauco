(function () {
  const KEY = 'tantauco-foco-v1';
  const MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
  const MODE_LABEL = { work: 'Estudio', short: 'Pausa', long: 'Pausa larga' };
  const SOUNDS = ['off', 'lluvia', 'cafe', 'bosque'];
  const SOUND_LABEL = { off: 'Silencio', lluvia: 'Lluvia', cafe: 'Café', bosque: 'Bosque' };
  const PDNS = [
    { iso: '2026-11-06', materia: 'Matemática', href: 'matematica_guia.html#notables', bloque: 'un cuadrado de binomio y un sistema por reducción' },
    { iso: '2026-11-09', materia: 'Lengua y Literatura', href: 'prueba_nivel_lenguaje_2.html#narrativo', bloque: 'un texto: qué está dicho, qué se infiere y cuál es el tema' },
    { iso: '2026-11-13', materia: 'Inglés', href: 'ingles_guia.html#unit3', bloque: 'el vocabulario de Unit 3 y la lectura del agua' },
    { iso: '2026-11-16', materia: 'Ciencias Naturales', href: 'prueba_nivel_ciencias_naturales.html#bio', bloque: 'selección natural y un ecosistema de Chile' },
    { iso: '2026-11-18', materia: 'Historia', href: 'historia_guia.html#economia', bloque: 'escasez, el precio de equilibrio y un instrumento financiero' }
  ];

  const page = (location.pathname.split('/').pop() || 'index.html').split('?')[0] || 'index.html';
  const pageName = {
    'index.html': 'Portal',
    'matematica_guia.html': 'Matemática',
    'prueba_nivel_lenguaje_2.html': 'Lengua',
    'ingles_guia.html': 'Inglés',
    'juegos.html': 'Juegos',
    'prueba_nivel_ciencias_naturales.html': 'Ciencias',
    'historia_guia.html': 'Historia'
  }[page] || 'Estudio';

  function chileToday() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  }

  function daysUntil(iso) {
    const today = chileToday().split('-').map(Number);
    const target = iso.split('-').map(Number);
    const a = Date.UTC(today[0], today[1] - 1, today[2]);
    const b = Date.UTC(target[0], target[1] - 1, target[2]);
    return Math.round((b - a) / 86400000);
  }

  function whenLabel(days) {
    if (days < 0) return 'Ya pasó';
    if (days === 0) return 'Es hoy';
    if (days === 1) return 'Mañana';
    return 'En ' + days + ' días';
  }

  function nextPdn() {
    const upcoming = PDNS.map(function (item) { return Object.assign({ days: daysUntil(item.iso) }, item); });
    const future = upcoming.filter(function (item) { return item.days >= 0; });
    return future[0] || upcoming[upcoming.length - 1];
  }

  function defaultState() {
    return {
      mode: 'work',
      remaining: MODES.work,
      endsAt: null,
      sound: 'off',
      volume: 0.35,
      focus: false,
      day: chileToday(),
      sessions: 0,
      checks: [false, false, false]
    };
  }

  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (err) { raw = null; }
    const state = defaultState();
    if (!raw || typeof raw !== 'object') return state;
    if (raw.mode === 'work' || raw.mode === 'short' || raw.mode === 'long') state.mode = raw.mode;
    if (typeof raw.remaining === 'number' && raw.remaining >= 0) state.remaining = raw.remaining;
    if (typeof raw.endsAt === 'number') state.endsAt = raw.endsAt;
    if (SOUNDS.indexOf(raw.sound) !== -1) state.sound = raw.sound;
    if (typeof raw.volume === 'number') state.volume = Math.min(1, Math.max(0, raw.volume));
    state.focus = raw.focus === true;
    if (raw.day === chileToday()) {
      state.day = raw.day;
      state.sessions = Number(raw.sessions) || 0;
      if (Array.isArray(raw.checks) && raw.checks.length === 3) state.checks = raw.checks.map(Boolean);
    }
    if (typeof state.endsAt === 'number') {
      state.remaining = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
    }
    return state;
  }

  let state = load();
  if (state.endsAt && state.remaining <= 0) {
    finishBlock(state);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* modo privado */ }
  }
  let toastTimer = null;
  let audio = null;
  let listeners = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* modo privado */ }
  }

  function emit() {
    render();
    listeners.forEach(function (fn) { fn(state); });
  }

  function clock(seconds) {
    const safe = Math.max(0, seconds);
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function toast(text) {
    const el = document.getElementById('foco-toast');
    if (!el) return;
    el.hidden = false;
    el.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 7000);
  }

  function chime() {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(function () { ctx.close(); }, 800);
    } catch (err) { /* sin audio */ }
  }

  function finishBlock(target) {
    const finished = target.mode;
    target.endsAt = null;
    target.remaining = 0;
    if (finished === 'work') {
      target.sessions += 1;
      target.mode = target.sessions % 4 === 0 ? 'long' : 'short';
      target.remaining = MODES[target.mode];
    } else {
      target.mode = 'work';
      target.remaining = MODES.work;
    }
  }

  function complete() {
    const finished = state.mode;
    const sessionsBefore = state.sessions;
    finishBlock(state);
    save();
    chime();
    if (finished === 'work') {
      const done = sessionsBefore + 1;
      const eyes = done % 2 === 0 ? ' Mira algo lejano durante 20 segundos.' : '';
      toast(done % 4 === 0
        ? 'Cuatro bloques. Pausa larga de 15 minutos, lejos de la pantalla.' + eyes
        : 'Bloque listo. Cinco minutos sin mirar la guía.' + eyes);
    } else {
      toast('Pausa cumplida. Otro bloque de 25 minutos, una sola cosa.');
    }
    emit();
  }

  function setMode(mode, minutes) {
    if (!MODES[mode]) return;
    state.mode = mode;
    state.remaining = minutes ? minutes * 60 : MODES[mode];
    state.endsAt = null;
    save();
    emit();
  }

  function toggle() {
    if (state.endsAt) {
      state.remaining = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
      state.endsAt = null;
    } else if (state.remaining > 0) {
      state.endsAt = Date.now() + state.remaining * 1000;
    } else {
      state.remaining = MODES[state.mode];
      state.endsAt = Date.now() + state.remaining * 1000;
    }
    save();
    emit();
  }

  function reset() {
    state.endsAt = null;
    state.remaining = MODES[state.mode];
    save();
    emit();
  }

  function setFocus(on) {
    state.focus = on;
    document.body.classList.toggle('foco-on', on);
    save();
    emit();
  }

  function noiseBuffer(ctx, seconds, color) {
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (color === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 3.2;
      } else {
        data[i] = white;
      }
    }
    return buffer;
  }

  function loop(ctx, buffer, destination) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();
    audio.nodes.push(source);
    return source;
  }

  function stopSound() {
    if (!audio) return;
    audio.nodes.forEach(function (node) {
      try { if (node.stop) node.stop(); } catch (err) { /* ya detenido */ }
      try { node.disconnect(); } catch (err) { /* ya suelto */ }
    });
    audio.nodes = [];
    if (audio.drops) clearInterval(audio.drops);
    audio.drops = null;
  }

  function masterGain() {
    const ctx = audio.ctx;
    const gain = ctx.createGain();
    gain.gain.value = state.volume;
    gain.connect(ctx.destination);
    audio.nodes.push(gain);
    audio.master = gain;
    return gain;
  }

  function startRain() {
    const ctx = audio.ctx;
    const out = masterGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.6;
    filter.connect(out);
    loop(ctx, noiseBuffer(ctx, 2, 'white'), filter);
    audio.drops = setInterval(function () {
      if (!audio || !audio.ctx || state.sound !== 'lluvia') return;
      const blip = audio.ctx.createBufferSource();
      blip.buffer = noiseBuffer(audio.ctx, 0.08, 'white');
      const g = audio.ctx.createGain();
      g.gain.value = state.volume * 0.15;
      blip.connect(g);
      g.connect(audio.ctx.destination);
      blip.start();
      blip.onended = function () { blip.disconnect(); g.disconnect(); };
    }, 700);
  }

  function startCafe() {
    const ctx = audio.ctx;
    const out = masterGain();
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 400;
    low.connect(out);
    loop(ctx, noiseBuffer(ctx, 2, 'brown'), low);
  }

  function startForest() {
    const ctx = audio.ctx;
    const out = masterGain();
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 700;
    low.connect(out);
    loop(ctx, noiseBuffer(ctx, 2, 'brown'), low);
    const air = ctx.createBiquadFilter();
    air.type = 'highpass';
    air.frequency.value = 1800;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.08;
    air.connect(airGain);
    airGain.connect(out);
    loop(ctx, noiseBuffer(ctx, 2, 'white'), air);
  }

  const ENGINES = { lluvia: startRain, cafe: startCafe, bosque: startForest };

  function applySound(kind) {
    if (SOUNDS.indexOf(kind) === -1) return;
    state.sound = kind;
    stopSound();
    if (kind !== 'off') {
      if (!audio) audio = { ctx: new AudioContext(), nodes: [], drops: null, master: null };
      const engine = ENGINES[kind];
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      engine();
    }
    save();
    emit();
  }

  function setVolume(value) {
    state.volume = value;
    if (audio && audio.master) audio.master.gain.value = value;
    save();
  }

  function beginBlock(pdn) {
    setFocus(true);
    setMode('work', 25);
    toggle();
    const file = pdn.href.split('#')[0];
    if (page !== file) location.href = pdn.href;
  }

  function render() {
    const running = Boolean(state.endsAt);
    const toggleBtn = document.getElementById('foco-toggle');
    const soundBtn = document.getElementById('foco-sound');
    const focusBtn = document.getElementById('foco-focus');
    if (toggleBtn) {
      toggleBtn.textContent = (running ? '❚❚  ' : '▶  ') + clock(state.remaining) + '  ' + MODE_LABEL[state.mode];
      toggleBtn.setAttribute('aria-label', (running ? 'Pausar' : 'Iniciar') + ' temporizador, ' + clock(state.remaining));
    }
    if (soundBtn) {
      soundBtn.setAttribute('aria-pressed', state.sound === 'off' ? 'false' : 'true');
      soundBtn.textContent = state.sound === 'off' ? '◌' : '♫';
      soundBtn.title = SOUND_LABEL[state.sound];
    }
    if (focusBtn) focusBtn.setAttribute('aria-pressed', state.focus ? 'true' : 'false');
    document.querySelectorAll('[data-foco-mode]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-foco-mode') === state.mode ? 'true' : 'false');
    });
    document.querySelectorAll('[data-foco-sound]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-foco-sound') === state.sound ? 'true' : 'false');
    });
    document.querySelectorAll('[data-foco-check]').forEach(function (btn) {
      const on = state.checks[Number(btn.getAttribute('data-foco-check'))];
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const vol = document.getElementById('foco-vol');
    if (vol && document.activeElement !== vol) vol.value = String(state.volume);
    paintIndex();
  }

  function paintIndex() {
    const clockEl = document.getElementById('pom-clock');
    if (!clockEl) return;
    clockEl.textContent = clock(state.remaining);
    const label = document.getElementById('pom-label');
    if (label) label.textContent = MODE_LABEL[state.mode].toUpperCase();
    const start = document.getElementById('pom-start-btn');
    if (start) start.textContent = state.endsAt ? '⏸ Pausar' : '▶ Iniciar';
    const ring = document.getElementById('pom-ring-fill');
    if (ring) {
      const total = MODES[state.mode];
      const circ = 408.41;
      ring.style.strokeDashoffset = String(circ - circ * (state.remaining / total));
    }
    document.querySelectorAll('.pom-mode-btn').forEach(function (btn) {
      const text = btn.textContent || '';
      const active = (state.mode === 'work' && text.indexOf('Estudio') !== -1)
        || (state.mode === 'short' && text.indexOf('corta') !== -1)
        || (state.mode === 'long' && text.indexOf('larga') !== -1);
      btn.classList.toggle('active', active);
    });
    const dots = document.getElementById('pom-dots');
    if (dots) {
      dots.innerHTML = '';
      for (let i = 0; i < 4; i += 1) {
        const dot = document.createElement('div');
        dot.className = 'pom-dot' + (i < state.sessions ? ' filled' : '');
        dots.appendChild(dot);
      }
    }
  }

  function mount() {
    const pdn = nextPdn();
    const root = document.createElement('div');
    root.id = 'foco-root';
    root.innerHTML = ''
      + '<div id="foco-toast" hidden></div>'
      + '<section id="foco-panel" hidden>'
      + '<div class="foco-kicker">' + whenLabel(pdn.days) + '</div>'
      + '<div class="foco-plan-title">' + pdn.materia + '</div>'
      + '<p class="foco-plan-text">Un bloque alcanza para ' + pdn.bloque + '.</p>'
      + '<div class="foco-row"><button type="button" class="foco-go" id="foco-begin">Empezar 25 min</button></div>'
      + '<div class="foco-kicker">Reloj</div>'
      + '<div class="foco-row">'
      + '<button type="button" class="foco-chip" data-foco-mode="work">25 min</button>'
      + '<button type="button" class="foco-chip" data-foco-mode="short">Pausa 5</button>'
      + '<button type="button" class="foco-chip" data-foco-mode="long">Pausa 15</button>'
      + '</div>'
      + '<div class="foco-kicker">Sonido de fondo</div>'
      + '<div class="foco-row">'
      + '<button type="button" class="foco-chip" data-foco-sound="off">Silencio</button>'
      + '<button type="button" class="foco-chip" data-foco-sound="lluvia">Lluvia</button>'
      + '<button type="button" class="foco-chip" data-foco-sound="cafe">Café</button>'
      + '<button type="button" class="foco-chip" data-foco-sound="bosque">Bosque</button>'
      + '</div>'
      + '<label class="foco-vol">Volumen <input id="foco-vol" type="range" min="0" max="1" step="0.05" value="0.35"></label>'
      + '<div class="foco-kicker">Dentro del bloque</div>'
      + '<button type="button" class="foco-check" data-foco-check="0">Leí una idea y la puedo decir sin mirar</button>'
      + '<button type="button" class="foco-check" data-foco-check="1">Resolví un ejercicio sin copiar el ejemplo</button>'
      + '<button type="button" class="foco-check" data-foco-check="2">Anoté el error que casi cometo</button>'
      + '<div class="foco-row" id="foco-practice-row"></div>'
      + '</section>'
      + '<div id="foco-bar">'
      + '<button type="button" id="foco-task">' + (page === 'index.html' ? pdn.materia : pageName) + '</button>'
      + '<button type="button" id="foco-toggle">▶  25:00</button>'
      + '<button type="button" id="foco-sound" aria-pressed="false" title="Sonido">◌</button>'
      + '<button type="button" id="foco-focus" aria-pressed="false" title="Modo foco">◎</button>'
      + '<button type="button" id="foco-more" aria-expanded="false" title="Más opciones">▴</button>'
      + '</div>';
    document.body.appendChild(root);

    const panel = document.getElementById('foco-panel');
    document.getElementById('foco-more').addEventListener('click', function () {
      const open = panel.hidden;
      panel.hidden = !open;
      document.getElementById('foco-more').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('foco-toggle').addEventListener('click', toggle);
    document.getElementById('foco-task').addEventListener('click', function () {
      panel.hidden = false;
      document.getElementById('foco-more').setAttribute('aria-expanded', 'true');
    });
    document.getElementById('foco-sound').addEventListener('click', function () {
      const index = SOUNDS.indexOf(state.sound);
      applySound(SOUNDS[(index + 1) % SOUNDS.length]);
    });
    document.getElementById('foco-focus').addEventListener('click', function () {
      setFocus(!state.focus);
    });
    document.getElementById('foco-begin').addEventListener('click', function () { beginBlock(pdn); });
    root.addEventListener('click', function (event) {
      const modeBtn = event.target.closest('[data-foco-mode]');
      if (modeBtn) setMode(modeBtn.getAttribute('data-foco-mode'));
      const soundBtn = event.target.closest('[data-foco-sound]');
      if (soundBtn) applySound(soundBtn.getAttribute('data-foco-sound'));
      const check = event.target.closest('[data-foco-check]');
      if (check) {
        const i = Number(check.getAttribute('data-foco-check'));
        state.checks[i] = !state.checks[i];
        save();
        emit();
      }
    });
    document.getElementById('foco-vol').addEventListener('input', function (event) {
      setVolume(Number(event.target.value));
    });

    const practice = document.querySelector('[data-tab="practica"]');
    if (practice) {
      const row = document.getElementById('foco-practice-row');
      const jump = document.createElement('button');
      jump.type = 'button';
      jump.className = 'foco-go';
      jump.textContent = 'Ir a la práctica';
      jump.addEventListener('click', function () { practice.click(); panel.hidden = true; });
      row.appendChild(jump);
    }

    const grid = document.querySelector('.materias-grid');
    if (grid) {
      const home = document.createElement('section');
      home.className = 'foco-home';
      home.innerHTML = '<div><div class="foco-kicker">' + whenLabel(pdn.days) + ' · PDN</div><h3>' + pdn.materia + '</h3><p>Un bloque de 25 minutos: ' + pdn.bloque + '. Después, cinco minutos sin pantalla.</p></div>';
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'foco-go';
      go.textContent = 'Empezar bloque';
      go.addEventListener('click', function () { beginBlock(pdn); });
      home.appendChild(go);
      grid.parentNode.insertBefore(home, grid);
    }

    if (state.focus) document.body.classList.add('foco-on');
    render();
  }

  function bindIndex() {
    if (!document.getElementById('pom-clock')) return;
    window.pomToggle = toggle;
    window.pomReset = reset;
    window.pomSetMode = function (mode) { setMode(mode); };
    listeners.push(paintIndex);
    paintIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); bindIndex(); });
  } else {
    mount();
    bindIndex();
  }

  setInterval(function () {
    if (!state.endsAt) return;
    const left = Math.max(0, Math.round((state.endsAt - Date.now()) / 1000));
    if (left <= 0) complete();
    else if (left !== state.remaining) {
      state.remaining = left;
      emit();
    }
  }, 250);

  window.TantaucoFoco = { toggle: toggle, reset: reset, setMode: setMode, setFocus: setFocus };
})();
