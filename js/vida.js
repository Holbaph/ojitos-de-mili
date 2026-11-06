// vida.js — el avatar de la pantalla principal "vive": respira, pestañea (a
// veces dos veces seguidas), mira para los lados, mueve la boca como si
// conversara y reacciona cuando lo tocan (salta, se ríe y dice algo). Todo con
// animaciones suaves; con "reducir movimiento" del celular, se queda quieta.
// Los ojos siguen siendo los botones para registrar el parche (js/app.js).

const Vida = (function () {
  const azar = (a, b) => a + Math.random() * (b - a);
  const pick = (l) => l[Math.floor(Math.random() * l.length)];
  const FRASES_TOQUE = ['¡Hola! 👋', '¡Jijiji, cosquillas!', '¡Me gusta mi parche! 🩹', '¿Jugamos? 🎮', '¡Te quiero! 💗', '¡Uy, qué divertido!', '¡Soy Mili! ✨'];
  const FRASES_SOLA = ['¡Hola! 👋', '¿Me pones el parche? 🩹', '¡Qué lindo día! ☀️', '¿Bailamos? 💃', 'La la la 🎵', '¿Vamos a la cocinita? 🍰'];
  const quieta = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let svg = null, globo = null, timers = [], activo = false, hablaT = null;

  function despues(ms, fn) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clase(c, ms) {
    svg.classList.remove(c); void svg.getBoundingClientRect(); svg.classList.add(c);
    despues(ms, () => svg.classList.remove(c));
  }

  // ---------- pestañear ----------
  function pestanear() {
    if (!activo) return;
    clase('vi-parpadeo', 200);
    if (Math.random() < 0.25) despues(280, () => clase('vi-parpadeo', 200)); // a veces, doble
    despues(azar(2600, 6000), pestanear);
  }
  // ---------- mirar para los lados ----------
  function mirar() {
    if (!activo) return;
    const dx = pick([-5, -3, 0, 0, 3, 5]), dy = pick([-2, 0, 0, 2]);
    svg.style.setProperty('--mira-x', dx + 'px');
    svg.style.setProperty('--mira-y', dy + 'px');
    despues(azar(4000, 8000), mirar);
  }
  // ---------- hablar (boca que se abre y se cierra) ----------
  function hablar(texto, ms) {
    clearTimeout(hablaT);
    svg.classList.add('vi-habla');
    hablaT = setTimeout(() => svg.classList.remove('vi-habla'), ms || 1400);
    if (texto) decir(texto, (ms || 1400) + 900);
  }
  function decir(texto, ms) {
    if (!globo) return;
    globo.textContent = texto;
    globo.classList.remove('ver'); void globo.offsetWidth; globo.classList.add('ver');
    clearTimeout(globo._t); globo._t = setTimeout(() => globo.classList.remove('ver'), ms || 2200);
  }
  function solita() {
    if (!activo) return;
    // de vez en cuando sonríe, mueve la boca o dice algo cortito
    const r = Math.random();
    if (r < 0.35) hablar(pick(FRASES_SOLA), 1300);
    else if (r < 0.7) hablar('', 900);
    else clase('vi-sonrisa', 1600);
    despues(azar(14000, 26000), solita);
  }
  // ---------- tocarla ----------
  function alTocar() {
    clase('vi-salto', 700);
    hablar(pick(FRASES_TOQUE), 1500);
  }

  // svg: el <svg> del avatar; contenedor: dónde va el globo de diálogo;
  // figura: la parte que se puede tocar (no los ojos)
  function iniciar(opts) {
    svg = opts.svg;
    if (!svg || activo) return;
    globo = document.createElement('div');
    globo.className = 'vi-globo';
    globo.setAttribute('aria-live', 'polite');
    opts.contenedor.appendChild(globo);
    opts.figura.addEventListener('click', alTocar);
    if (quieta()) return; // sin animaciones: igual responde a los toques con el globo
    activo = true;
    svg.classList.add('vi-viva');
    despues(azar(1200, 2500), pestanear);
    despues(azar(3000, 5000), mirar);
    despues(1800, () => hablar('¡Hola! 👋', 1200));
    despues(azar(14000, 22000), solita);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) despues(500, () => clase('vi-parpadeo', 200)); });
  }
  // para que reaccione desde afuera (por ejemplo, al registrar el parche)
  function celebrar(texto) { if (svg) { clase('vi-salto', 700); hablar(texto, 1600); } }

  return { iniciar, celebrar, decir };
})();
