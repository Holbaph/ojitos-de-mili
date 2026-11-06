// noche.js — 🌙 Rutina de la noche: pasitos con dibujos (bañito, dientes,
// pijama, baño, cuento y a dormir). Cada paso hecho prende una estrellita en
// la luna. "Lavarse los dientes" trae un reloj de 2 minutos que va diciendo
// qué dientes lavar; "A dormir" pone una lucecita de noche con estrellas y
// una canción de cuna suave ("Estrellita", melodía tradicional) tocada por el
// propio celular. Lo hecho se guarda solo en este celular, y se reinicia cada día.

const Noche = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t, op) => (typeof Voz !== 'undefined' ? Voz.decir(t, op) : Promise.resolve());
  const CLAVE = 'ojitos-noche';
  const PASOS = [
    { id: 'bano', e: '🛁', n: 'Bañito', d: '¡A bañarse con espumita!' },
    { id: 'dientes', e: '🪥', n: 'Lavarse los dientes', d: 'Dos minutos, con el relojito' },
    { id: 'pijama', e: '👚', n: 'Ponerse el pijama', d: '¡El más lindo!' },
    { id: 'wc', e: '🚽', n: 'Ir al baño', d: 'Pipí antes de dormir' },
    { id: 'cuento', e: '📖', n: 'Un cuento', d: 'Te leo un cuento nuevo' },
    { id: 'dormir', e: '😴', n: '¡A dormir!', d: 'Lucecita y canción de cuna' },
  ];
  const leer = () => {
    try { const j = JSON.parse(localStorage.getItem(CLAVE)); if (j && j.dia === Utils.todayId() && Array.isArray(j.hechos)) return j.hechos.filter((h) => PASOS.some((p) => p.id === h)); } catch (e) {}
    return [];
  };
  const escribir = (h) => { try { localStorage.setItem(CLAVE, JSON.stringify({ dia: Utils.todayId(), hechos: h })); } catch (e) {} };
  let hechos = [];

  function render() {
    $('noPasos').innerHTML = PASOS.map((p, i) => {
      const ok = hechos.includes(p.id);
      return `<button class="no-paso${ok ? ' hecho' : ''}" data-paso="${p.id}"><span class="no-num">${ok ? '⭐' : i + 1}</span>` +
        `<span class="no-e">${p.e}</span><span class="no-txt"><strong>${p.n}</strong><small>${p.d}</small></span></button>`;
    }).join('');
    const n = hechos.length;
    $('noLuna').innerHTML = '🌙' + PASOS.map((p, i) => `<span class="${i < n ? 'on' : ''}">⭐</span>`).join('');
    $('noSub').textContent = n === PASOS.length ? '¡Lista para soñar bonito! 💤' : `Llevas ${n} de ${PASOS.length} estrellitas`;
  }
  function marcar(id) {
    if (!hechos.includes(id)) { hechos.push(id); escribir(hechos); }
    render();
  }

  // ---------- 🪥 reloj de los dientes ----------
  let dientesT = null;
  function dientes() {
    const caja = $('noDientes');
    caja.classList.remove('hidden');
    let falta = 120;
    const partes = ['¡Los dientes de arriba, de un lado!', '¡Ahora arriba, del otro lado!', '¡Los de abajo, de un lado!', '¡Y los de abajo, del otro lado!'];
    decir('¡A lavarse los dientes! ' + partes[0]);
    const pintar = () => {
      $('noDiReloj').textContent = `${Math.floor(falta / 60)}:${String(falta % 60).padStart(2, '0')}`;
      $('noDiBarra').style.width = ((120 - falta) / 120 * 100) + '%';
    };
    pintar();
    clearInterval(dientesT);
    dientesT = setInterval(() => {
      falta--;
      pintar();
      if (falta > 0 && falta % 30 === 0) decir(partes[(120 - falta) / 30]);
      if (falta <= 0) {
        clearInterval(dientesT); dientesT = null;
        caja.classList.add('hidden');
        marcar('dientes');
        decir('¡Dientes limpiecitos y brillantes! ✨');
      }
    }, 1000);
  }
  function pararDientes() { clearInterval(dientesT); dientesT = null; $('noDientes').classList.add('hidden'); }

  // ---------- 😴 lucecita y canción de cuna ----------
  // "Estrellita, ¿dónde estás?" (melodía tradicional), como cajita de música
  const NOTAS = { C: 523.25, D: 587.33, E: 659.25, F: 698.46, G: 783.99, A: 880 };
  const MELODIA = 'C C G G A A G- F F E E D D C- G G F F E E D- G G F F E E D- C C G G A A G- F F E E D D C-';
  let ctx = null, tocando = false, lucesT = null;
  function cancion(vueltas) {
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { return; }
    tocando = true;
    let t = ctx.currentTime + 0.2;
    const negra = 0.62;
    for (let v = 0; v < vueltas; v++) {
      MELODIA.split(' ').forEach((nota) => {
        const largo = nota.endsWith('-') ? negra * 2 : negra, f = NOTAS[nota[0]];
        [1, 2].forEach((arm, k) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = f * arm;
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(k ? 0.03 : 0.12, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + largo * 1.6);
          o.connect(g).connect(ctx.destination);
          o.start(t); o.stop(t + largo * 1.7);
        });
        t += largo;
      });
      t += 0.8;
    }
    return (t - ctx.currentTime) * 1000;
  }
  function dormir() {
    const luz = $('noLuz');
    luz.classList.remove('hidden', 'apagando');
    let est = '';
    for (let i = 0; i < 40; i++) est += `<span style="left:${Math.random() * 100}%;top:${Math.random() * 80}%;animation-delay:-${(Math.random() * 3).toFixed(1)}s;font-size:${8 + Math.random() * 14}px">✦</span>`;
    $('noEstrellas').innerHTML = est;
    marcar('dormir');
    decir('Buenas noches, Mili. Que sueñes bonito.', { rapidez: 0.8, tono: 1.1 }).then(() => {
      if (luz.classList.contains('hidden')) return;
      const ms = cancion(3) || 0;
      clearTimeout(lucesT);
      // al terminar la canción, la lucecita se apaga de a poquito
      lucesT = setTimeout(() => { luz.classList.add('apagando'); }, ms + 1000);
    });
  }
  function despertar() {
    $('noLuz').classList.add('hidden');
    clearTimeout(lucesT);
    if (ctx && tocando) { try { ctx.close(); } catch (e) {} ctx = null; tocando = false; }
  }

  function tocarPaso(id) {
    const p = PASOS.find((x) => x.id === id);
    if (id === 'dientes') { dientes(); return; }
    if (id === 'cuento') { marcar('cuento'); if (typeof Cuentos !== 'undefined') Cuentos.abrir(); return; }
    if (id === 'dormir') { dormir(); return; }
    const ya = hechos.includes(id);
    marcar(id);
    if (!ya) decir(`¡Muy bien! ${p.n}, listo ⭐`);
  }

  let cableado = false;
  function abrir() {
    if (!cableado) {
      cableado = true;
      $('noCerrar').addEventListener('click', cerrar);
      $('noPasos').addEventListener('click', (e) => { const b = e.target.closest('[data-paso]'); if (b) tocarPaso(b.dataset.paso); });
      $('noDiParar').addEventListener('click', pararDientes);
      $('noLuz').addEventListener('click', despertar);
      $('noReiniciar').addEventListener('click', () => { hechos = []; escribir(hechos); render(); });
    }
    hechos = leer();
    $('noche').classList.remove('hidden');
    document.body.classList.add('jugando');
    render();
    decir(hechos.length ? '¡Sigamos con la rutina de la noche!' : '¡Es hora de prepararse para dormir! Vamos paso a paso');
  }
  function cerrar() {
    pararDientes(); despertar();
    $('noche').classList.add('hidden');
    document.body.classList.remove('jugando');
    if (typeof Voz !== 'undefined') Voz.callar();
  }
  return { abrir, cerrar };
})();
