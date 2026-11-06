// aprender.js — ✍️ Aprender jugando: Mili repasa con el dedo su nombre, las
// letras y los números (la letra aparece grande y clarita; cuando la cubre
// bien con su trazo, ¡estrellita!), y cuenta cosas tocándolas. Todo con voz
// ("A de abeja"). Se puede elegir MAYÚSCULAS o minúsculas, y el nombre
// (MILI o EMILIA). Las estrellas ganadas se guardan en este celular.

const Aprender = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t, op) => (typeof Voz !== 'undefined' ? Voz.decir(t, op) : Promise.resolve());
  const CLAVE = 'ojitos-aprender';
  const LETRAS = [
    ['A', 'abeja', '🐝'], ['B', 'ballena', '🐋'], ['C', 'casa', '🏠'], ['D', 'dado', '🎲'], ['E', 'elefante', '🐘'], ['F', 'flor', '🌸'],
    ['G', 'gato', '🐱'], ['H', 'helado', '🍦'], ['I', 'isla', '🏝️'], ['J', 'jirafa', '🦒'], ['K', 'koala', '🐨'], ['L', 'león', '🦁'],
    ['M', 'manzana', '🍎'], ['N', 'nube', '☁️'], ['Ñ', 'ñandú', '🐦'], ['O', 'oso', '🐻'], ['P', 'pato', '🦆'], ['Q', 'queso', '🧀'],
    ['R', 'ratón', '🐭'], ['S', 'sol', '☀️'], ['T', 'tortuga', '🐢'], ['U', 'uva', '🍇'], ['V', 'vaca', '🐮'], ['W', 'waffle', '🧇'],
    ['X', 'xilófono', '🎶'], ['Y', 'yoyó', '🪀'], ['Z', 'zapato', '👟'],
  ];
  const NUMEROS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'];
  const COSAS = ['🍎', '🐥', '⭐', '🌸', '🐟', '🍓', '🎈', '🦋', '🍪', '🐞'];
  const COLORES = ['#e8578a', '#7e57c2', '#4a78c2', '#3fb8b0', '#f0a04b'];

  let op = { modo: 'nombre', nombre: 'MILI', minus: false, letra: 0, numero: 1, estrellas: 0 };
  try { op = { ...op, ...(JSON.parse(localStorage.getItem(CLAVE)) || {}) }; } catch (e) {}
  const guardarOp = () => { try { localStorage.setItem(CLAVE, JSON.stringify(op)); } catch (e) {} };
  let pasoNombre = 0, color = COLORES[0];

  // ================= TRAZAR =================
  let cv, tinta, mascara, tam = 300, puntos = [], dibujando = false, glifo = '', listo = false, alTerminar = null;
  function preparar() {
    cv = $('apLienzo');
    const caja = cv.parentElement.getBoundingClientRect();
    tam = Math.max(200, Math.min(caja.width, caja.height || caja.width));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = tam * dpr; cv.height = tam * dpr;
    cv.style.width = tam + 'px'; cv.style.height = tam + 'px';
    tinta = document.createElement('canvas'); tinta.width = tam; tinta.height = tam;
    mascara = document.createElement('canvas'); mascara.width = tam; mascara.height = tam;
  }
  const fuente = (g) => `800 ${Math.round(tam * (g.length > 1 ? 0.62 : 0.8))}px "Baloo 2", "Figtree", system-ui, sans-serif`;
  // la letra guía (clarita, con borde punteado) + lo que lleva dibujado
  function pintar() {
    const c = cv.getContext('2d'), dpr = cv.width / tam;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, tam, tam);
    c.font = fuente(glifo); c.textAlign = 'center'; c.textBaseline = 'middle';
    const y = tam * 0.54;
    c.fillStyle = '#ece6f7'; c.fillText(glifo, tam / 2, y);
    c.setLineDash([6, 7]); c.lineWidth = 3; c.strokeStyle = '#b8acd6'; c.strokeText(glifo, tam / 2, y); c.setLineDash([]);
    c.drawImage(tinta, 0, 0, tam, tam);
  }
  function nuevoTrazo(g, fin) {
    glifo = g; listo = false; alTerminar = fin;
    preparar();
    const m = mascara.getContext('2d');
    m.clearRect(0, 0, tam, tam);
    m.font = fuente(g); m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#000';
    m.fillText(g, tam / 2, tam * 0.54);
    // puntos de muestra dentro de la letra
    const d = m.getImageData(0, 0, tam, tam).data, paso = Math.max(4, Math.round(tam / 60));
    puntos = [];
    for (let y = 0; y < tam; y += paso) for (let x = 0; x < tam; x += paso) if (d[(y * tam + x) * 4 + 3] > 128) puntos.push([x, y]);
    pintar();
  }
  function borrar() { tinta.getContext('2d').clearRect(0, 0, tam, tam); listo = false; pintar(); }
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * tam / r.width, (e.clientY - r.top) * tam / r.height]; }
  let ultimo = null;
  function trazar(e) {
    if (!dibujando || listo) return;
    const [x, y] = pos(e), t = tinta.getContext('2d');
    t.strokeStyle = color; t.lineWidth = tam * 0.085; t.lineCap = 'round'; t.lineJoin = 'round';
    t.beginPath(); t.moveTo(...(ultimo || [x, y])); t.lineTo(x, y); t.stroke();
    ultimo = [x, y];
    pintar();
  }
  // ¿cubrió bien la letra (y no rayó todo afuera)?
  function revisar() {
    if (listo || !puntos.length) return;
    const td = tinta.getContext('2d').getImageData(0, 0, tam, tam).data;
    const dentro = puntos.filter(([x, y]) => td[(y * tam + x) * 4 + 3] > 0).length / puntos.length;
    const md = mascara.getContext('2d').getImageData(0, 0, tam, tam).data;
    let tintaTotal = 0, tintaFuera = 0;
    const paso = Math.max(4, Math.round(tam / 60));
    for (let y = 0; y < tam; y += paso) for (let x = 0; x < tam; x += paso) {
      const i = (y * tam + x) * 4;
      if (td[i + 3] > 0) { tintaTotal++; if (md[i + 3] < 128) tintaFuera++; }
    }
    const fuera = tintaTotal ? tintaFuera / tintaTotal : 0;
    if (dentro >= 0.62 && fuera < 0.62) { listo = true; ganarEstrella(); if (alTerminar) setTimeout(alTerminar, 900); }
    else if (fuera >= 0.62 && tintaTotal > 40) aviso(dentro >= 0.62 ? '¡Uy, te saliste mucho! Toca 🧽 Borrar y sigue la letra clarita' : 'Intenta seguir la letra clarita 😊');
  }
  function aviso(t) { $('apMsg').textContent = t; decir(t); }
  function ganarEstrella() {
    op.estrellas = (op.estrellas || 0) + 1; guardarOp();
    $('apEstrellas').textContent = `⭐ ${op.estrellas}`;
    const f = $('apFx'); f.textContent = '⭐'; f.classList.remove('ver'); void f.offsetWidth; f.classList.add('ver');
  }

  // ================= MODOS =================
  const conCaso = (s) => (op.minus ? s.toLocaleLowerCase('es') : s);
  function modoNombre() {
    const letras = [...op.nombre];
    if (pasoNombre >= letras.length) pasoNombre = 0;
    $('apArriba').innerHTML = letras.map((l, i) => `<span class="${i < pasoNombre ? 'ok' : i === pasoNombre ? 'ahora' : ''}">${conCaso(l)}</span>`).join('');
    $('apMsg').textContent = `Repasa la letra ${conCaso(letras[pasoNombre])} con tu dedito ✍️`;
    decir(pasoNombre === 0 ? `¡Vamos a escribir tu nombre! ${op.nombre}. Empieza con la ${letras[0]}` : `Ahora la ${letras[pasoNombre]}`);
    nuevoTrazo(conCaso(letras[pasoNombre]), () => {
      pasoNombre++;
      if (pasoNombre < letras.length) { modoNombre(); return; }
      $('apArriba').innerHTML = letras.map((l) => `<span class="ok">${conCaso(l)}</span>`).join('');
      $('apMsg').textContent = `¡Escribiste tu nombre: ${conCaso(op.nombre)}! 🎉`;
      decir(`¡Bravo! ¡Escribiste tu nombre: ${op.nombre}!`);
      if (typeof confetiPantallaGlobal === 'function') confetiPantallaGlobal();
      pasoNombre = 0;
      setTimeout(() => { if (op.modo === 'nombre' && !$('aprender').classList.contains('hidden')) modoNombre(); }, 4500);
    });
  }
  function modoLetra() {
    const [L, palabra, e] = LETRAS[op.letra];
    $('apArriba').innerHTML = `<span class="ap-grande">${conCaso(L)}</span><span class="ap-emoji">${e}</span><span class="ap-palabra">${conCaso(palabra.toUpperCase())}</span>`;
    $('apMsg').textContent = `${L} de ${palabra} ${e}. ¡Repásala con tu dedito!`;
    decir(`${L}, de ${palabra}`);
    nuevoTrazo(conCaso(L), () => { decir(`¡Muy bien! La ${L}`); op.letra = (op.letra + 1) % LETRAS.length; guardarOp(); setTimeout(modoLetra, 1300); });
  }
  function modoNumero() {
    const n = op.numero;
    $('apArriba').innerHTML = `<span class="ap-grande">${n}</span><span class="ap-cosas">${COSAS[n % COSAS.length].repeat(n) || '🫙'}</span>`;
    $('apMsg').textContent = `El número ${NUMEROS[n]}. ¡Repásalo con tu dedito!`;
    decir(`El número ${NUMEROS[n]}`);
    nuevoTrazo(String(n), () => { decir(`¡Bien! ${NUMEROS[n]}`); op.numero = (n + 1) % 11; guardarOp(); setTimeout(modoNumero, 1300); });
  }
  // contar: toca cada cosa (la voz cuenta) y después elige el número
  function modoContar() {
    const n = 1 + Math.floor(Math.random() * 10), e = COSAS[Math.floor(Math.random() * COSAS.length)];
    let contadas = 0;
    $('apArriba').innerHTML = '';
    $('apMsg').textContent = `¿Cuántos ${e} hay? Tócalos para contarlos`;
    decir('¿Cuántos hay? Tócalos para contarlos');
    const opciones = new Set([n]);
    while (opciones.size < 3) opciones.add(1 + Math.floor(Math.random() * 10));
    $('apContar').innerHTML = `<div class="ap-cosas-grid">${Array.from({ length: n }, (_, i) => `<button class="ap-cosa" data-i="${i}">${e}</button>`).join('')}</div>` +
      `<div class="ap-opciones">${[...opciones].sort(() => Math.random() - 0.5).map((v) => `<button class="ap-op" data-v="${v}">${v}</button>`).join('')}</div>`;
    $('apContar').onclick = (ev) => {
      const c = ev.target.closest('.ap-cosa');
      if (c && !c.classList.contains('contada')) { contadas++; c.classList.add('contada'); c.dataset.n = contadas; decir(NUMEROS[contadas], { rapidez: 1.1 }); return; }
      const b = ev.target.closest('.ap-op');
      if (!b) return;
      if (Number(b.dataset.v) === n) {
        b.classList.add('bien'); ganarEstrella(); decir(`¡Sí! ¡Hay ${NUMEROS[n]}!`);
        setTimeout(() => { if (op.modo === 'contar') modoContar(); }, 1800);
      } else { b.classList.add('mal'); decir('Mmm, cuéntalos otra vez 😊'); setTimeout(() => b.classList.remove('mal'), 700); }
    };
  }

  function render() {
    document.querySelectorAll('#apModos [data-modo]').forEach((b) => b.classList.toggle('activo', b.dataset.modo === op.modo));
    const contar = op.modo === 'contar';
    $('apTrazar').classList.toggle('hidden', contar);
    $('apContar').classList.toggle('hidden', !contar);
    $('apOpciones').innerHTML =
      (op.modo === 'nombre' ? ['MILI', 'EMILIA'].map((nm) => `<button class="ta-chip${op.nombre === nm ? ' activo' : ''}" data-nombre="${nm}">${conCaso(nm)}</button>`).join('') : '') +
      (op.modo !== 'contar' && op.modo !== 'numeros' ? `<button class="ta-chip" data-caso="1">${op.minus ? 'ABC Mayúsculas' : 'abc minúsculas'}</button>` : '') +
      (op.modo === 'letras' ? '<button class="ta-chip" data-ant="1">◀</button><button class="ta-chip" data-sig="1">▶</button>' : '') +
      (op.modo === 'numeros' ? '<button class="ta-chip" data-ant="1">◀</button><button class="ta-chip" data-sig="1">▶</button>' : '');
    $('apColores').innerHTML = COLORES.map((c) => `<button class="ta-color${c === color ? ' activo' : ''}" data-color="${c}" style="background:${c}" aria-label="Color"></button>`).join('');
    $('apEstrellas').textContent = `⭐ ${op.estrellas || 0}`;
    if (op.modo === 'nombre') modoNombre();
    else if (op.modo === 'letras') modoLetra();
    else if (op.modo === 'numeros') modoNumero();
    else modoContar();
  }

  let cableado = false;
  function cablear() {
    $('apCerrar').addEventListener('click', cerrar);
    $('apModos').addEventListener('click', (e) => { const b = e.target.closest('[data-modo]'); if (!b) return; op.modo = b.dataset.modo; pasoNombre = 0; guardarOp(); render(); });
    $('apOpciones').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.nombre) { op.nombre = b.dataset.nombre; pasoNombre = 0; }
      if (b.dataset.caso) op.minus = !op.minus;
      if (b.dataset.ant) { if (op.modo === 'letras') op.letra = (op.letra + LETRAS.length - 1) % LETRAS.length; else op.numero = (op.numero + 10) % 11; }
      if (b.dataset.sig) { if (op.modo === 'letras') op.letra = (op.letra + 1) % LETRAS.length; else op.numero = (op.numero + 1) % 11; }
      guardarOp(); render();
    });
    $('apColores').addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (!b) return; color = b.dataset.color; $('apColores').querySelectorAll('.ta-color').forEach((x) => x.classList.toggle('activo', x === b)); });
    $('apBorrar').addEventListener('click', borrar);
    $('apOir').addEventListener('click', () => decir($('apMsg').textContent));
    const c = $('apLienzo');
    c.addEventListener('pointerdown', (e) => { dibujando = true; ultimo = null; c.setPointerCapture(e.pointerId); trazar(e); });
    c.addEventListener('pointermove', trazar);
    const soltar = () => { if (!dibujando) return; dibujando = false; ultimo = null; revisar(); };
    c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
  }
  function abrir() {
    if (!cableado) { cablear(); cableado = true; }
    $('aprender').classList.remove('hidden');
    document.body.classList.add('jugando');
    // espera a que la pantalla tenga tamaño (y la letra Baloo esté cargada)
    const listoFuente = document.fonts && document.fonts.load ? document.fonts.load('800 40px "Baloo 2"').catch(() => {}) : Promise.resolve();
    listoFuente.then(() => requestAnimationFrame(render));
  }
  function cerrar() { $('aprender').classList.add('hidden'); document.body.classList.remove('jugando'); if (typeof Voz !== 'undefined') Voz.callar(); }
  return { abrir, cerrar };
})();
