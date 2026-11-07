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
  // Cada letra está dibujada con sus trazos EN ORDEN (como se enseñan en el
  // colegio), en una caja de 100 de ancho (y de -15 a 120 de alto; la línea de
  // abajo es y=90). Con eso se dibuja la letra clarita, la línea de rayitas por
  // el medio, los numeritos verdes donde empieza cada trazo y la animación
  // ("cómo se hace") con un dedito que la va dibujando.
  const MAYUS = {
    A: ['M50 10 L18 90', 'M50 10 L82 90', 'M30 62 L70 62'],
    B: ['M25 10 L25 90', 'M25 10 L55 10 Q75 10 75 30 Q75 50 55 50 L25 50', 'M25 50 L58 50 Q80 50 80 70 Q80 90 58 90 L25 90'],
    C: ['M80 22 Q68 10 52 10 Q20 10 20 50 Q20 90 52 90 Q68 90 80 78'],
    D: ['M25 10 L25 90', 'M25 10 L48 10 Q80 10 80 50 Q80 90 48 90 L25 90'],
    E: ['M25 10 L25 90', 'M25 10 L75 10', 'M25 50 L65 50', 'M25 90 L75 90'],
    F: ['M25 10 L25 90', 'M25 10 L75 10', 'M25 50 L65 50'],
    G: ['M80 22 Q68 10 52 10 Q20 10 20 50 Q20 90 52 90 Q80 90 80 60 L56 60'],
    H: ['M22 10 L22 90', 'M78 10 L78 90', 'M22 50 L78 50'],
    I: ['M50 10 L50 90'],
    J: ['M65 10 L65 68 Q65 90 45 90 Q28 90 25 74'],
    K: ['M25 10 L25 90', 'M75 10 L25 58', 'M40 44 L78 90'],
    L: ['M25 10 L25 90 L75 90'],
    M: ['M18 90 L18 10 L50 60 L82 10 L82 90'],
    N: ['M22 90 L22 10 L78 90 L78 10'],
    'Ñ': ['M22 90 L22 10 L78 90 L78 10', 'M30 -2 Q40 -10 50 -2 Q60 6 70 -2'],
    O: ['M50 10 Q18 10 18 50 Q18 90 50 90 Q82 90 82 50 Q82 10 50 10'],
    P: ['M25 10 L25 90', 'M25 10 L55 10 Q78 10 78 32 Q78 54 55 54 L25 54'],
    Q: ['M50 10 Q18 10 18 50 Q18 90 50 90 Q82 90 82 50 Q82 10 50 10', 'M58 70 L84 96'],
    R: ['M25 10 L25 90', 'M25 10 L55 10 Q78 10 78 32 Q78 54 55 54 L25 54', 'M48 54 L78 90'],
    S: ['M78 22 Q68 10 50 10 Q24 10 24 30 Q24 48 50 50 Q78 52 78 70 Q78 90 50 90 Q30 90 20 78'],
    T: ['M18 10 L82 10', 'M50 10 L50 90'],
    U: ['M22 10 L22 62 Q22 90 50 90 Q78 90 78 62 L78 10'],
    V: ['M18 10 L50 90 L82 10'],
    W: ['M10 10 L30 90 L50 32 L70 90 L90 10'],
    X: ['M20 10 L80 90', 'M80 10 L20 90'],
    Y: ['M20 10 L50 50', 'M80 10 L50 50 L50 90'],
    Z: ['M20 10 L80 10 L20 90 L80 90'],
  };
  const MINUS = {
    a: ['M74 54 Q66 45 50 45 Q26 45 26 68 Q26 90 50 90 Q66 90 74 80', 'M74 45 L74 90'],
    b: ['M28 10 L28 90', 'M28 68 Q28 45 52 45 Q76 45 76 68 Q76 90 52 90 Q28 90 28 68'],
    c: ['M74 54 Q64 45 52 45 Q26 45 26 68 Q26 90 52 90 Q64 90 74 82'],
    d: ['M74 68 Q74 45 50 45 Q26 45 26 68 Q26 90 50 90 Q74 90 74 68', 'M74 10 L74 90'],
    e: ['M28 68 L74 68 Q74 45 51 45 Q28 45 28 68 Q28 90 52 90 Q66 90 74 82'],
    f: ['M68 16 Q60 8 52 10 Q40 12 40 28 L40 90', 'M24 46 L60 46'],
    g: ['M74 66 Q74 45 50 45 Q26 45 26 66 Q26 88 50 88 Q74 88 74 66', 'M74 45 L74 98 Q74 116 50 116 Q34 116 28 106'],
    h: ['M28 10 L28 90', 'M28 64 Q30 45 50 45 Q72 45 72 64 L72 90'],
    i: ['M50 46 L50 90', 'M50 26 L50 27'],
    j: ['M56 46 L56 100 Q56 116 40 116 Q30 116 26 108', 'M56 26 L56 27'],
    k: ['M30 10 L30 90', 'M70 45 L30 72', 'M44 64 L72 90'],
    l: ['M50 10 L50 90'],
    m: ['M18 45 L18 90', 'M18 62 Q18 45 34 45 Q50 45 50 62 L50 90', 'M50 62 Q50 45 66 45 Q82 45 82 62 L82 90'],
    n: ['M28 45 L28 90', 'M28 64 Q30 45 50 45 Q72 45 72 64 L72 90'],
    'ñ': ['M28 45 L28 90', 'M28 64 Q30 45 50 45 Q72 45 72 64 L72 90', 'M32 30 Q41 22 50 30 Q59 38 68 30'],
    o: ['M50 45 Q26 45 26 68 Q26 90 50 90 Q74 90 74 68 Q74 45 50 45'],
    p: ['M28 45 L28 116', 'M28 68 Q28 45 52 45 Q76 45 76 68 Q76 90 52 90 Q28 90 28 68'],
    q: ['M72 68 Q72 45 48 45 Q24 45 24 68 Q24 90 48 90 Q72 90 72 68', 'M72 45 L72 116'],
    r: ['M34 45 L34 90', 'M34 64 Q38 45 56 45 Q66 45 70 50'],
    s: ['M70 50 Q62 45 50 45 Q30 45 30 57 Q30 67 50 68 Q72 69 72 80 Q72 90 50 90 Q36 90 28 84'],
    t: ['M46 22 L46 82 Q46 90 56 90 Q64 90 68 86', 'M28 46 L66 46'],
    u: ['M28 45 L28 72 Q28 90 50 90 Q72 90 72 72', 'M72 45 L72 90'],
    v: ['M26 45 L50 90 L74 45'],
    w: ['M14 45 L32 90 L50 52 L68 90 L86 45'],
    x: ['M28 45 L72 90', 'M72 45 L28 90'],
    y: ['M26 45 L50 88', 'M74 45 L44 116'],
    z: ['M28 45 L72 45 L28 90 L72 90'],
  };
  const DIGITOS = {
    0: ['M50 10 Q24 10 24 50 Q24 90 50 90 Q76 90 76 50 Q76 10 50 10'],
    1: ['M34 26 L54 10 L54 90'],
    2: ['M26 28 Q30 10 50 10 Q74 10 74 32 Q74 50 50 66 L26 90 L76 90'],
    3: ['M26 20 Q36 10 50 10 Q72 10 72 30 Q72 50 48 50 Q76 50 76 70 Q76 90 50 90 Q34 90 24 80'],
    4: ['M60 90 L60 10 L20 66 L80 66'],
    5: ['M72 10 L32 10 L28 46 Q38 40 50 40 Q76 40 76 64 Q76 90 50 90 Q34 90 24 80'],
    6: ['M70 16 Q62 10 52 10 Q24 10 24 54 Q24 90 50 90 Q76 90 76 66 Q76 44 50 44 Q30 44 24 58'],
    7: ['M22 10 L78 10 L40 90'],
    8: ['M50 50 Q26 46 26 29 Q26 10 50 10 Q74 10 74 29 Q74 46 50 50 Q22 54 22 71 Q22 90 50 90 Q78 90 78 71 Q78 54 50 50'],
    9: ['M76 34 Q76 10 50 10 Q24 10 24 33 Q24 56 50 56 Q76 56 76 34 L76 90'],
  };
  const trazosDe = (ch) => MAYUS[ch] || MINUS[ch] || DIGITOS[ch] || [];
  const GRUESO = 17; // ancho de la letra clarita (en unidades de la caja)

  // para recorrer los trazos (largo y puntos) se usa un <svg> escondido
  let svgOculto = null;
  function recorrer(d, paso) {
    if (!svgOculto) {
      svgOculto = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgOculto.setAttribute('width', '0'); svgOculto.setAttribute('height', '0');
      svgOculto.style.position = 'absolute'; svgOculto.style.visibility = 'hidden';
      document.body.appendChild(svgOculto);
    }
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); svgOculto.appendChild(p);
    const L = p.getTotalLength(), pts = [];
    for (let s = 0; s <= L; s += paso) { const q = p.getPointAtLength(s); pts.push([q.x, q.y]); }
    const f = p.getPointAtLength(L); pts.push([f.x, f.y]);
    p.remove();
    return pts;
  }

  let cv, tinta, mascara, tam = 300, puntos = [], dibujando = false, glifo = '', listo = false, alTerminar = null;
  let centro = [], trazosG = [], escala = 1, ox = 0, oy = 0, anim = null;
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
  // los trazos de una o más letras (p. ej. "10"), cada una en su cajita, centrados
  function armar(g) {
    const chars = [...g];
    escala = Math.min(tam * 0.84 / (100 * chars.length), tam * 0.84 / 135);
    ox = (tam - 100 * chars.length * escala) / 2;
    oy = (tam - 135 * escala) / 2 + 15 * escala;
    trazosG = [];
    chars.forEach((ch, i) => trazosDe(ch).forEach((d) => {
      const pts = recorrer(d, 1.5).map(([x, y]) => [ox + (x + i * 100) * escala, oy + y * escala]);
      trazosG.push(pts);
    }));
  }
  const linea = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  function pintar() {
    const c = cv.getContext('2d'), dpr = cv.width / tam;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, tam, tam);
    c.lineCap = 'round'; c.lineJoin = 'round';
    // la letra clarita, con su borde
    c.strokeStyle = '#cfc4ea'; c.lineWidth = (GRUESO + 3) * escala; trazosG.forEach((t) => linea(c, t));
    c.strokeStyle = '#efeaf9'; c.lineWidth = GRUESO * escala; trazosG.forEach((t) => linea(c, t));
    // la línea de rayitas por el medio
    c.setLineDash([5 * escala, 4.5 * escala]); c.strokeStyle = '#8a76c9'; c.lineWidth = Math.max(2.5, 2 * escala);
    trazosG.forEach((t) => linea(c, t));
    c.setLineDash([]);
    // lo que dibujó Mili
    c.drawImage(tinta, 0, 0, tam, tam);
    // los numeritos verdes donde empieza cada trazo (y una flechita hacia dónde va)
    trazosG.forEach((t, i) => {
      const [x, y] = t[0], [x2, y2] = t[Math.min(t.length - 1, 6)];
      const ang = Math.atan2(y2 - y, x2 - x), r = Math.max(9, 5.5 * escala);
      c.fillStyle = '#56b04a';
      c.beginPath(); c.moveTo(x + Math.cos(ang) * r * 2.1, y + Math.sin(ang) * r * 2.1);
      c.lineTo(x + Math.cos(ang + 2.5) * r * 1.1, y + Math.sin(ang + 2.5) * r * 1.1); c.lineTo(x + Math.cos(ang - 2.5) * r * 1.1, y + Math.sin(ang - 2.5) * r * 1.1); c.fill();
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff'; c.font = `800 ${Math.round(r * 1.3)}px "Baloo 2", system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(i + 1), x, y + r * 0.08);
    });
    // la animación de "cómo se hace": un dedito que va dibujando la letra
    if (anim) {
      c.strokeStyle = '#f28bb0'; c.lineWidth = Math.max(6, 6 * escala);
      let quedan = anim.n, punta = null;
      for (const t of trazosG) {
        if (quedan <= 0) break;
        const parte = t.slice(0, Math.min(t.length, quedan));
        if (parte.length > 1) linea(c, parte);
        punta = parte[parte.length - 1];
        quedan -= t.length;
      }
      if (punta) { c.font = `${Math.round(tam * 0.13)}px system-ui`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('👆', punta[0] - tam * 0.035, punta[1] - tam * 0.01); }
    }
  }
  // ▶️ "cómo se hace": se ve solo al aparecer la letra y con el botón
  function mostrarComo() {
    pararComo();
    const total = trazosG.reduce((a, t) => a + t.length, 0);
    if (!total) return;
    const vel = Math.max(1, total / 150); // ~2,5 segundos, sin importar el tamaño de la letra
    anim = { n: 0 };
    const paso = () => {
      if (!anim) return;
      anim.n += vel;
      pintar();
      if (anim.n < total) anim.raf = requestAnimationFrame(paso);
      else anim.fin = setTimeout(() => { anim = null; pintar(); }, 700);
    };
    anim.raf = requestAnimationFrame(paso);
  }
  function pararComo() { if (anim) { cancelAnimationFrame(anim.raf); clearTimeout(anim.fin); anim = null; } }

  function nuevoTrazo(g, fin) {
    glifo = g; listo = false; alTerminar = fin; trazos = 0;
    pararComo();
    preparar();
    armar(g);
    // la letra (para ver cuánto cubrió) y un margen ancho alrededor (para ver si se salió mucho)
    const m = mascara.getContext('2d');
    m.clearRect(0, 0, tam, tam);
    m.lineCap = 'round'; m.lineJoin = 'round'; m.strokeStyle = '#000';
    m.lineWidth = GRUESO * escala; trazosG.forEach((t) => linea(m, t));
    const d = m.getImageData(0, 0, tam, tam).data, paso = Math.max(4, Math.round(tam / 60));
    puntos = [];
    for (let y = 0; y < tam; y += paso) for (let x = 0; x < tam; x += paso) if (d[(y * tam + x) * 4 + 3] > 128) puntos.push([x, y]);
    centro = [].concat(...trazosG.map((t) => t.filter((_, i) => i % 3 === 0)));
    m.lineWidth = GRUESO * escala + tam * 0.18; trazosG.forEach((t) => linea(m, t));
    pintar();
    setTimeout(() => { if (glifo === g && !listo) mostrarComo(); }, 500);
  }
  function borrar() { tinta.getContext('2d').clearRect(0, 0, tam, tam); listo = false; trazos = 0; pintar(); }
  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * tam / r.width, (e.clientY - r.top) * tam / r.height]; }
  let ultimo = null, trazos = 0;
  function trazar(e) {
    if (!dibujando || listo || !cv || !tinta) return;
    pararComo();
    const [x, y] = pos(e), t = tinta.getContext('2d');
    t.strokeStyle = color; t.lineWidth = tam * 0.1; t.lineCap = 'round'; t.lineJoin = 'round';
    t.beginPath(); t.moveTo(...(ultimo || [x, y])); t.lineTo(x, y); t.stroke();
    ultimo = [x, y];
    pintar();
  }
  // ¿siguió la línea de rayitas? Se revisa CADA trazo de la letra (p. ej. las 4
  // rayitas de la M): cada uno tiene que estar recorrido casi entero. El dedito
  // tiene un margen cómodo (un punto cuenta si pasó cerca), pero una sola raya
  // no alcanza: hay que hacer la letra completa.
  function revisar() {
    if (listo || !trazosG.length || !tinta) return;
    const td = tinta.getContext('2d').getImageData(0, 0, tam, tam).data;
    const hay = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < tam && y < tam && td[(y * tam + x) * 4 + 3] > 0; };
    const r = tam * 0.035;
    const cerca = ([x, y]) => hay(x, y) || hay(x + r, y) || hay(x - r, y) || hay(x, y + r) || hay(x, y - r);
    // de cada trazo se mira solo "su" parte: no lo que queda pegado a otro trazo
    // (si no, la rayita del medio de la A quedaría hecha con solo hacer los lados)
    const D = tam * 0.1;
    const propios = trazosG.map((t, k) => t.filter((q, i) => i % 2 === 0 &&
      !trazosG.some((o, j) => j !== k && o.some((w) => Math.hypot(w[0] - q[0], w[1] - q[1]) < D))));
    const cubierto = propios.map((m, k) => {
      const lista = m.length >= 2 ? m : trazosG[k];
      return lista.filter(cerca).length / lista.length;
    });
    const md = mascara.getContext('2d').getImageData(0, 0, tam, tam).data;
    let tintaTotal = 0, tintaFuera = 0;
    const paso = Math.max(4, Math.round(tam / 60));
    for (let y = 0; y < tam; y += paso) for (let x = 0; x < tam; x += paso) {
      const i = (y * tam + x) * 4;
      if (td[i + 3] > 0) { tintaTotal++; if (md[i + 3] < 128) tintaFuera++; }
    }
    const fuera = tintaTotal ? tintaFuera / tintaTotal : 0;
    trazos++;
    // tras varios intentos se pide un poquito menos (pero siempre la letra entera)
    const minimo = trazos >= 6 ? 0.55 : 0.7;
    const falta = cubierto.findIndex((c) => c < minimo);
    if (falta === -1 && fuera < 0.55) { listo = true; ganarEstrella(); if (alTerminar) setTimeout(alTerminar, 900); return; }
    if (fuera >= 0.55 && tintaTotal > 30) { aviso('Te saliste mucho de la letra 😊 Toca 🧽 Borrar y sigue las rayitas'); return; }
    if (falta === -1) return;
    const hechas = cubierto.filter((c) => c >= minimo).length;
    if (trazosG.length > 1 && hechas > 0) aviso(`¡Muy bien! Ahora sigue la rayita número ${falta + 1} 🟢`);
    else aviso(cubierto[falta] > 0.3 ? '¡Casi! Sigue la línea de rayitas hasta el final ✍️' : 'Empieza en el puntito verde y sigue las rayitas ✍️');
  }
  function aviso(t) { $('apMsg').textContent = t; decir(t); }
  function ganarEstrella() {
    op.estrellas = (op.estrellas || 0) + 1; guardarOp();
    // también cuentan para la tiendita del perrito (se comparten entre los celulares)
    try { Juego.guardarExtra('estrellas', Math.max(0, Math.floor(Number(Juego.extra('estrellas')) || 0)) + 1); } catch (e) {}
    $('apEstrellas').textContent = `⭐ ${op.estrellas}`;
    const f = $('apFx'); f.textContent = '⭐'; f.classList.remove('ver'); void f.offsetWidth; f.classList.add('ver');
  }

  // ================= MODOS =================
  const conCaso = (s) => (op.minus ? s.toLocaleLowerCase('es') : s);
  function modoNombre() {
    const letras = [...op.nombre];
    if (pasoNombre >= letras.length) pasoNombre = 0;
    $('apArriba').innerHTML = letras.map((l, i) => `<span class="${i < pasoNombre ? 'ok' : i === pasoNombre ? 'ahora' : ''}">${conCaso(l)}</span>`).join('');
    $('apMsg').textContent = `Sigue la línea de rayitas de la ${conCaso(letras[pasoNombre])} con tu dedito ✍️`;
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
    $('apComo').addEventListener('click', () => { borrar(); mostrarComo(); decir('Mira cómo se hace'); });
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
  function cerrar() { pararComo(); $('aprender').classList.add('hidden'); document.body.classList.remove('jugando'); if (typeof Voz !== 'undefined') Voz.callar(); }
  return { abrir, cerrar };
})();
