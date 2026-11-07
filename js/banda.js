// banda.js — 🥁 Mi banda: tambores, xilófono y maracas para tocar con los
// dedos. Todos los sonidos los hace el propio celular (Web Audio), sin
// grabaciones. Las maracas suenan tocándolas o moviendo el celular.

const Banda = (function () {
  const $ = (id) => document.getElementById(id);
  let ctx = null;
  function audio() {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
    return ctx;
  }
  // ruido blanco (para platillo, caja y maracas)
  let ruido = null;
  function bufferRuido(c) {
    if (ruido) return ruido;
    ruido = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = ruido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ruido;
  }
  function soplo(c, t, dur, vol, filtro, frec) {
    const s = c.createBufferSource(); s.buffer = bufferRuido(c);
    const f = c.createBiquadFilter(); f.type = filtro; f.frequency.value = frec;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(c.destination); s.start(t); s.stop(t + dur);
  }
  function tono(c, t, frec, hasta, dur, vol, tipo) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(frec, t);
    if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur);
  }
  const SONIDOS = {
    bombo: (c, t) => tono(c, t, 150, 45, 0.45, 0.9),
    caja: (c, t) => { soplo(c, t, 0.18, 0.5, 'highpass', 1500); tono(c, t, 220, 160, 0.12, 0.3, 'triangle'); },
    platillo: (c, t) => soplo(c, t, 0.9, 0.35, 'highpass', 6000),
    tom: (c, t) => tono(c, t, 260, 120, 0.3, 0.6),
    pandero: (c, t) => { soplo(c, t, 0.25, 0.3, 'bandpass', 7000); tono(c, t, 400, 300, 0.08, 0.15, 'triangle'); },
    aplauso: (c, t) => { for (let i = 0; i < 3; i++) soplo(c, t + i * 0.012, 0.12, 0.4, 'bandpass', 1800); },
    maraca: (c, t) => soplo(c, t, 0.12, 0.4, 'highpass', 5000),
  };
  function sonar(nombre) { const c = audio(); if (c) SONIDOS[nombre](c, c.currentTime + 0.01); }
  // xilófono: notas Do mayor con un poquito de "madera"
  const NOTAS = [523.25, 587.33, 659.25, 698.46, 783.99, 880, 987.77, 1046.5];
  const COLORES = ['#e5412f', '#f28a2e', '#f2cf5b', '#56b04a', '#3fb8b0', '#4a78c2', '#9b6fd6', '#f28bb0'];
  function nota(i) {
    const c = audio(); if (!c) return;
    const t = c.currentTime + 0.01;
    tono(c, t, NOTAS[i], 0, 1.1, 0.35); tono(c, t, NOTAS[i] * 4, 0, 0.15, 0.08);
  }

  const TAMBORES = [
    { s: 'bombo', e: '🥁', n: 'Bombo', c: '#e5412f' }, { s: 'caja', e: '🪘', n: 'Caja', c: '#4a78c2' },
    { s: 'platillo', e: '📀', n: 'Platillo', c: '#f2cf5b' }, { s: 'tom', e: '🥁', n: 'Tambor', c: '#56b04a' },
    { s: 'pandero', e: '🪇', n: 'Pandero', c: '#9b6fd6' }, { s: 'aplauso', e: '👏', n: 'Aplauso', c: '#f28bb0' },
  ];
  let modo = 'tambores';
  function render() {
    document.querySelectorAll('#baModos [data-modo]').forEach((b) => b.classList.toggle('activo', b.dataset.modo === modo));
    const z = $('baZona');
    if (modo === 'tambores') {
      z.className = 'ba-zona ba-tambores';
      z.innerHTML = TAMBORES.map((t) => `<button class="ba-pad" data-son="${t.s}" style="--c:${t.c}"><span>${t.e}</span>${t.n}</button>`).join('');
    } else if (modo === 'xilofono') {
      z.className = 'ba-zona ba-xilofono';
      z.innerHTML = NOTAS.map((_, i) => `<button class="ba-barra" data-nota="${i}" style="--c:${COLORES[i]};height:${100 - i * 7}%" aria-label="Nota ${i + 1}"><i></i><i></i></button>`).join('');
    } else {
      z.className = 'ba-zona ba-maracas';
      z.innerHTML = '<button class="ba-maraca" data-son="maraca">🪇</button><button class="ba-maraca otra" data-son="maraca">🪇</button>' +
        '<p>¡Tócalas o mueve el celular para que suenen! 📳</p>';
      pedirMovimiento();
    }
  }
  function golpe(b) {
    b.classList.remove('suena'); void b.offsetWidth; b.classList.add('suena');
    if (b.dataset.son) sonar(b.dataset.son); else nota(Number(b.dataset.nota));
  }
  // maracas con el movimiento del celular
  let ultimoMov = 0, escuchando = false;
  function alMover(e) {
    if (modo !== 'maracas' || $('banda').classList.contains('hidden')) return;
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const f = Math.abs(a.x || 0) + Math.abs(a.y || 0) + Math.abs(a.z || 0);
    if (f > 28 && Date.now() - ultimoMov > 120) {
      ultimoMov = Date.now(); sonar('maraca');
      document.querySelectorAll('.ba-maraca').forEach((m) => { m.classList.remove('suena'); void m.offsetWidth; m.classList.add('suena'); });
    }
  }
  function pedirMovimiento() {
    if (escuchando) return;
    const activar = () => { window.addEventListener('devicemotion', alMover); escuchando = true; };
    // en iPhone hay que pedir permiso, y solo dentro de un toque
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then((r) => { if (r === 'granted') activar(); }).catch(() => {});
    } else if (window.DeviceMotionEvent) activar();
  }

  let cableado = false;
  function abrir() {
    if (!cableado) {
      cableado = true;
      $('baCerrar').addEventListener('click', cerrar);
      $('baModos').addEventListener('click', (e) => { const b = e.target.closest('[data-modo]'); if (b) { modo = b.dataset.modo; render(); } });
      // pointerdown (no click): suena al instante y permite tocar con varios dedos
      $('baZona').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-son],[data-nota]'); if (b) { e.preventDefault(); golpe(b); } });
      // deslizar el dedo por el xilófono
      $('baZona').addEventListener('pointermove', (e) => {
        if (modo !== 'xilofono' || !e.buttons) return;
        const b = document.elementFromPoint(e.clientX, e.clientY);
        const barra = b && b.closest('[data-nota]');
        if (barra && barra !== $('baZona')._ultima) { $('baZona')._ultima = barra; golpe(barra); }
      });
      $('baZona').addEventListener('pointerup', () => { $('baZona')._ultima = null; });
    }
    audio();
    $('banda').classList.remove('hidden');
    document.body.classList.add('jugando');
    render();
  }
  function cerrar() { $('banda').classList.add('hidden'); document.body.classList.remove('jugando'); }
  return { abrir, cerrar };
})();
