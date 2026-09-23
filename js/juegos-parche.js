// juegos-parche.js — "Juegos con el parche": actividades de visión fina para
// entretenerse MIENTRAS se usa el parche (así trabaja el ojo destapado).
// Solo se abren si el parche de hoy está registrado y todavía no se cumple su
// tiempo (el del temporizador). No son un tratamiento ni reemplazan las
// indicaciones del oftalmólogo; la pantalla lo dice.
//
// Cinco juegos, con niveles que se van poniendo más difíciles (cosas más
// chicas, más parecidas, caminos más angostos):
//   🔍 Diferencias  ⭐ Busca a…  ✏️ Une los puntos  〰️ Sigue el caminito  🫧 Burbujas
// Los personajes salen del juego de vestir (Juego.figura / Juego.original).

const JuegosParche = (function () {
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const mezclar = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  const COLORES = ['#e88fae', '#d9534f', '#f2cf5b', '#6fbf73', '#7cc4ea', '#4a78c2', '#b392d6', '#f0a04b', '#3a3540', '#f7f5f2', '#3fb8b0'];
  const OJOS = ['#8b5e3c', '#5f8a4c', '#4f7fb5', '#7e57c2', '#c79a3a', '#7d8a93'];
  const PELOS = ['#1f1a1c', '#6b4428', '#e8c66a', '#d2432f', '#6a3fa0', '#e88fae', '#f1e6c8'];
  // peinados donde los accesorios van en el amarre (no arriba de la cabeza)
  const CON_AMARRE = ['colitas', 'cola', 'tomate', 'cola-alta', 'trenza', 'dos-trenzas', 'cola-baja'];
  const otroColor = (lista, actual) => pick(lista.filter((c) => c !== actual));

  // ---------- estado general ----------
  let finMs = null;          // cuándo se cumple el tiempo del parche
  let vigilante = null;
  let enJuego = null;        // { id, limpiar }
  const NIVELES = 'ojitos-jp-niveles';
  const ESTRELLAS = 'ojitos-jp-estrellas';

  function leer(clave, def) { try { const v = JSON.parse(localStorage.getItem(clave)); return v == null ? def : v; } catch (e) { return def; } }
  function escribir(clave, v) { try { localStorage.setItem(clave, JSON.stringify(v)); } catch (e) {} }
  function nivelDe(id) { return leer(NIVELES, {})[id] || 1; }
  function subirNivel(id) { const n = leer(NIVELES, {}); n[id] = (n[id] || 1) + 1; escribir(NIVELES, n); }
  function renderEstrellas() { $('jpEstrellas').textContent = '⭐ ' + leer(ESTRELLAS, 0); }
  function sumarEstrellas(k) { escribir(ESTRELLAS, leer(ESTRELLAS, 0) + k); renderEstrellas(); }

  function svg(viewBox, clase) {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', viewBox);
    if (clase) s.setAttribute('class', clase);
    return s;
  }
  // punto de la pantalla -> coordenadas del viewBox del svg
  function aSvg(s, x, y) {
    const p = s.createSVGPoint(); p.x = x; p.y = y;
    return p.matrixTransform(s.getScreenCTM().inverse());
  }
  function aviso(texto) {
    const el = $('jpMensaje');
    el.textContent = texto;
    el.classList.remove('ver'); void el.offsetWidth; el.classList.add('ver');
  }

  // ================= 🔍 DIFERENCIAS =================
  // Dos dibujos del mismo personaje; el de la derecha tiene N cosas cambiadas.
  const REGIONES = {
    cabeza: [40, 0, 280, 132], ojos: [76, 136, 244, 200], arriba: [98, 282, 222, 346],
    abajo: [88, 348, 232, 414], zapatos: [114, 410, 206, 440],
  };
  function diferencias(area, nivel, ganar) {
    const n = Math.min(5, 2 + nivel);
    let lista = Juego.personajes();
    if (n > 4) lista = lista.filter((p) => !CON_AMARRE.includes(Juego.original(p.id).peloEstilo));
    const id = pick(lista).id;

    const base = Juego.original(id);
    Object.assign(base, {
      vestido: null, encima: null, cara: null,
      arriba: { t: pick(['polera', 'manga-larga', 'blusa']), c: pick(COLORES) },
      abajo: { t: pick(['falda', 'short', 'jeans']), c: pick(COLORES) },
      zapatos: { t: pick(['zapatillas', 'balerinas', 'botines']), c: pick(COLORES) },
    });
    const puedeCabeza = !CON_AMARRE.includes(base.peloEstilo);
    base.cabeza = puedeCabeza && Math.random() < 0.6 ? { t: pick(['moño', 'flor', 'tiara', 'cintillo']), c: pick(COLORES) } : null;

    const opciones = Object.keys(REGIONES).filter((k) => k !== 'cabeza' || puedeCabeza);
    const cambios = mezclar(opciones).slice(0, n);
    const mod = JSON.parse(JSON.stringify(base));
    cambios.forEach((k) => {
      if (k === 'ojos') mod.ojos = otroColor(OJOS, base.ojos);
      else if (k === 'cabeza') mod.cabeza = base.cabeza && Math.random() < 0.4 ? null
        : { t: base.cabeza ? base.cabeza.t : pick(['moño', 'flor', 'tiara']), c: otroColor(COLORES, base.cabeza && base.cabeza.c) };
      else mod[k] = { ...base[k], c: otroColor(COLORES, base[k].c) };
    });

    area.innerHTML =
      `<p class="jp-consigna">Encuentra <strong>${n} diferencias</strong> y tócalas en cualquiera de los dos dibujos <span class="jp-cuenta" id="jpCuenta">0/${n}</span></p>` +
      '<div class="jp-dif"><div class="jp-dif-caja" id="jpDifA"></div><div class="jp-dif-caja" id="jpDifB"></div></div>';
    const svgs = [[base, $('jpDifA')], [mod, $('jpDifB')]].map(([st, caja]) => {
      const s = svg('0 0 320 440');
      s.innerHTML = Juego.figura(id, st) + '<g class="jp-marcas"></g>';
      caja.appendChild(s);
      return s;
    });

    const encontradas = new Set();
    function tocar(e) {
      const s = e.currentTarget;
      const p = aSvg(s, e.clientX, e.clientY);
      const k = cambios.find((c) => {
        const [x1, y1, x2, y2] = REGIONES[c];
        return !encontradas.has(c) && p.x >= x1 && p.x <= x2 && p.y >= y1 && p.y <= y2;
      });
      if (!k) {
        const x = document.createElementNS(NS, 'text');
        x.setAttribute('x', p.x); x.setAttribute('y', p.y); x.setAttribute('class', 'jp-fallo');
        x.textContent = '✕';
        s.querySelector('.jp-marcas').appendChild(x);
        setTimeout(() => x.remove(), 700);
        return;
      }
      encontradas.add(k);
      const [x1, y1, x2, y2] = REGIONES[k];
      svgs.forEach((sv) => {
        const el = document.createElementNS(NS, 'ellipse');
        el.setAttribute('cx', (x1 + x2) / 2); el.setAttribute('cy', (y1 + y2) / 2);
        el.setAttribute('rx', (x2 - x1) / 2 + 6); el.setAttribute('ry', (y2 - y1) / 2 + 6);
        el.setAttribute('class', 'jp-marca');
        sv.querySelector('.jp-marcas').appendChild(el);
      });
      $('jpCuenta').textContent = encontradas.size + '/' + n;
      if (encontradas.size === n) setTimeout(() => ganar(`¡Encontraste las ${n} diferencias!`), 500);
    }
    svgs.forEach((s) => s.addEventListener('pointerdown', tocar));
    return () => {};
  }

  // ================= ⭐ BUSCA A… =================
  // Encontrar a un personaje entre muchos; en niveles altos hay "parecidos"
  // (el mismo personaje con un detalle distinto: pelo, ojos, accesorio).
  function busca(area, nivel, ganar) {
    const RONDAS = 3;
    let ronda = 0;
    const todos = Juego.personajes();

    function parecido(id) {
      const st = Juego.original(id);
      const cambio = pick(['pelo', 'ojos', 'cabeza', 'cara']);
      if (cambio === 'pelo') st.peloColor = otroColor(PELOS, st.peloColor);
      else if (cambio === 'ojos') st.ojos = otroColor(OJOS, st.ojos);
      else if (cambio === 'cabeza') st.cabeza = st.cabeza ? null : { t: 'moño', c: pick(COLORES) };
      else st.cara = st.cara ? null : { t: 'lentes-redondos', c: pick(['#6fbf73', '#3a3540', '#e88fae']) };
      return st;
    }
    const cara = (id, st) => { const s = svg('0 0 320 320', 'jp-cara'); s.innerHTML = Juego.figura(id, st); return s; };

    function nuevaRonda() {
      const obj = pick(todos).id;
      const cantidad = Math.min(30, 8 + nivel * 4);
      const parecidos = nivel >= 2 ? Math.min(Math.floor(cantidad / 3), (nivel - 1) * 2) : 0;
      const tam = Math.max(40, 78 - nivel * 7);

      area.innerHTML =
        '<div class="jp-busca-obj"><span>Busca a:</span><div id="jpObjetivo"></div><span class="jp-cuenta">' + (ronda + 1) + '/' + RONDAS + '</span></div>' +
        '<div class="jp-busca" id="jpBusca"></div>';
      $('jpObjetivo').appendChild(cara(obj, Juego.original(obj)));

      const zona = $('jpBusca');
      const W = zona.clientWidth, H = zona.clientHeight;
      const paso = tam * 1.12;
      const cols = Math.max(1, Math.floor(W / paso)), filas = Math.max(1, Math.floor(H / paso));
      const celdas = mezclar([...Array(cols * filas).keys()]).slice(0, Math.min(cantidad, cols * filas));
      const sobraX = (W - cols * paso) / cols, sobraY = (H - filas * paso) / filas;

      celdas.forEach((celda, i) => {
        let id, st, esObj = false;
        if (i === 0) { id = obj; st = Juego.original(obj); esObj = true; }
        else if (i <= parecidos) { id = obj; st = parecido(obj); }
        else { id = pick(todos.filter((p) => p.id !== obj)).id; st = Juego.original(id); }
        const b = document.createElement('button');
        b.className = 'jp-busca-item';
        b.style.width = b.style.height = tam + 'px';
        b.style.left = ((celda % cols) * (paso + sobraX) + Math.random() * sobraX * 0.8) + 'px';
        b.style.top = (Math.floor(celda / cols) * (paso + sobraY) + Math.random() * sobraY * 0.8) + 'px';
        b.setAttribute('aria-label', esObj ? 'Es este' : 'Otro');
        b.appendChild(cara(id, st));
        b.addEventListener('pointerdown', () => {
          if (esObj) {
            b.classList.add('bien');
            ronda++;
            setTimeout(() => (ronda >= RONDAS ? ganar('¡La encontraste las ' + RONDAS + ' veces!') : nuevaRonda()), 450);
          } else {
            b.classList.remove('mal'); void b.offsetWidth; b.classList.add('mal');
          }
        });
        zona.appendChild(b);
      });
    }
    nuevaRonda();
    return () => {};
  }

  // ================= ✏️ UNE LOS PUNTOS =================
  const FIGURAS = [
    { n: 'una estrella', e: '⭐', c: '#f2cf5b', p: [...Array(10).keys()].map((i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 19 : 44; return [50 + r * Math.cos(a), 54 + r * Math.sin(a)]; }) },
    { n: 'una casita', e: '🏠', c: '#f0a04b', p: [[22, 88], [22, 50], [50, 22], [78, 50], [78, 88], [58, 88], [58, 66], [42, 66], [42, 88]] },
    { n: 'un corazón', e: '💗', c: '#e88fae', p: [...Array(14).keys()].map((i) => { const t = i / 14 * Math.PI * 2; return [50 + 2.6 * 16 * Math.pow(Math.sin(t), 3), 48 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; }) },
    { n: 'un pececito', e: '🐟', c: '#7cc4ea', p: [[14, 50], [30, 32], [54, 26], [72, 38], [88, 24], [84, 50], [88, 76], [72, 62], [54, 74], [30, 68]] },
    { n: 'un diamante', e: '💎', c: '#b392d6', p: [[30, 22], [70, 22], [88, 42], [50, 90], [12, 42]] },
    { n: 'un solcito', e: '☀️', c: '#f2cf5b', p: [...Array(16).keys()].map((i) => { const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? 30 : 44; return [50 + r * Math.cos(a), 52 + r * Math.sin(a)]; }) },
  ];
  function puntos(area, nivel, ganar) {
    const fig = FIGURAS[(nivel - 1) % FIGURAS.length];
    const radio = Math.max(2.2, 5 - (nivel - 1) * 0.5);
    const letra = Math.max(3.6, 6.5 - (nivel - 1) * 0.5);
    area.innerHTML = '<p class="jp-consigna">Toca los puntos en orden: <strong>1, 2, 3…</strong></p><div class="jp-puntos" id="jpPuntos"></div>';
    const s = svg('0 0 100 100');
    s.innerHTML = `<polygon class="jp-relleno" points="${fig.p.map((q) => q.join(',')).join(' ')}" fill="${fig.c}"/><g class="jp-lineas"></g><g class="jp-dots"></g>`;
    $('jpPuntos').appendChild(s);
    const dots = s.querySelector('.jp-dots'), lineas = s.querySelector('.jp-lineas');
    fig.p.forEach(([x, y], i) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'jp-dot' + (i === 0 ? ' siguiente' : ''));
      const dx = x > 50 ? 1 : -1, dy = y > 52 ? 1 : -1;
      g.innerHTML = `<circle cx="${x}" cy="${y}" r="9" fill="transparent"/><circle class="v" cx="${x}" cy="${y}" r="${radio}"/>` +
        `<text x="${x + dx * (radio + 2.5)}" y="${y + dy * (radio + 2.5)}" font-size="${letra}" text-anchor="middle" dominant-baseline="middle">${i + 1}</text>`;
      dots.appendChild(g);
    });
    let siguiente = 0;
    s.addEventListener('pointerdown', (e) => {
      const p = aSvg(s, e.clientX, e.clientY);
      const [x, y] = fig.p[siguiente];
      if (Math.hypot(p.x - x, p.y - y) > 9) return;
      const g = dots.children[siguiente];
      g.classList.remove('siguiente'); g.classList.add('hecho');
      if (siguiente > 0) {
        const [px, py] = fig.p[siguiente - 1];
        lineas.insertAdjacentHTML('beforeend', `<line x1="${px}" y1="${py}" x2="${x}" y2="${y}"/>`);
      }
      siguiente++;
      if (siguiente < fig.p.length) { dots.children[siguiente].classList.add('siguiente'); return; }
      const [x0, y0] = fig.p[0];
      lineas.insertAdjacentHTML('beforeend', `<line x1="${x}" y1="${y}" x2="${x0}" y2="${y0}"/>`);
      s.classList.add('completa');
      setTimeout(() => ganar(`¡Dibujaste ${fig.n}! ${fig.e}`), 700);
    });
    return () => {};
  }

  // ================= 〰️ SIGUE EL CAMINITO =================
  // Llevar al personaje por un camino con el dedo, sin salirse.
  function caminito(area, nivel, ganar) {
    const ancho = Math.max(26, 68 - (nivel - 1) * 8);
    area.innerHTML = '<p class="jp-consigna">Lleva a tu personaje por el camino hasta la ⭐ <strong>sin salirte</strong></p>' +
      '<div class="jp-camino"><canvas id="jpCanvas"></canvas><svg id="jpViajero" viewBox="0 0 320 320" class="jp-viajero"></svg></div>';
    const cont = area.querySelector('.jp-camino');
    const canvas = $('jpCanvas'), ctx = canvas.getContext('2d');
    const W = cont.clientWidth, H = cont.clientHeight, dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const quien = pick(Juego.personajes()).id;
    const viajero = $('jpViajero');
    viajero.innerHTML = Juego.figura(quien, Juego.original(quien));
    const tamV = Math.max(40, ancho + 16);
    viajero.style.width = viajero.style.height = tamV + 'px';

    // puntos de paso de abajo-izquierda a arriba-derecha, suavizados (Catmull-Rom)
    const m = ancho / 2 + 20;
    const k = Math.min(6, 2 + nivel);
    const paso = [[m, H - m]];
    for (let i = 1; i <= k; i++) {
      const t = i / (k + 1);
      paso.push([m + Math.random() * (W - 2 * m), H - m - t * (H - 2 * m) + (Math.random() - 0.5) * (H / (k + 2))]);
    }
    paso.push([W - m, m]);
    const pts = [];
    for (let i = 0; i < paso.length - 1; i++) {
      const p0 = paso[Math.max(0, i - 1)], p1 = paso[i], p2 = paso[i + 1], p3 = paso[Math.min(paso.length - 1, i + 2)];
      for (let j = 0; j < 40; j++) {
        const t = j / 40, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    pts.push(paso[paso.length - 1]);

    let prog = 0, trazando = false, listo = false;
    const tol = ancho / 2 + 10;
    function trazo(desde, hasta, color, grosor, guiones) {
      ctx.beginPath();
      ctx.moveTo(pts[desde][0], pts[desde][1]);
      for (let i = desde + 1; i <= hasta; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.strokeStyle = color; ctx.lineWidth = grosor; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash(guiones || []); ctx.stroke(); ctx.setLineDash([]);
    }
    function dibujar() {
      ctx.clearRect(0, 0, W, H);
      trazo(0, pts.length - 1, '#e6dcf5', ancho);
      trazo(0, pts.length - 1, '#ffffff', 3, [8, 10]);
      if (prog > 0) trazo(0, prog, '#e88fae', ancho * 0.62);
      const [gx, gy] = pts[pts.length - 1];
      ctx.font = `${Math.round(ancho * 0.9)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('⭐', gx, gy);
      const [vx, vy] = pts[prog];
      viajero.style.left = (vx - tamV / 2) + 'px';
      viajero.style.top = (vy - tamV * 0.62) + 'px';
    }
    dibujar();

    const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    cont.addEventListener('pointerdown', (e) => {
      if (listo) return;
      if (dist(pos(e), pts[prog]) <= tol + 14) { trazando = true; try { cont.setPointerCapture(e.pointerId); } catch (er) {} }
      else aviso('Pon el dedo sobre tu personaje 👆');
    });
    cont.addEventListener('pointermove', (e) => {
      if (!trazando || listo) return;
      const q = pos(e);
      let mejor = -1, dMejor = Infinity;
      for (let i = prog; i < Math.min(pts.length, prog + 30); i++) {
        const d = dist(q, pts[i]);
        if (d < dMejor) { dMejor = d; mejor = i; }
      }
      if (dMejor > tol) { trazando = false; aviso('¡Ups! Te saliste. Sigue desde donde quedaste'); return; }
      if (mejor > prog) { prog = mejor; dibujar(); }
      if (prog >= pts.length - 2) { listo = true; trazando = false; setTimeout(() => ganar('¡Llegaste a la estrella!'), 400); }
    });
    const soltar = () => { trazando = false; };
    cont.addEventListener('pointerup', soltar);
    cont.addEventListener('pointercancel', soltar);
    return () => {};
  }

  // ================= 🫧 BURBUJAS =================
  function burbujas(area, nivel, ganar) {
    const meta = 10 + nivel * 3;
    const tam = Math.max(32, 80 - (nivel - 1) * 8);
    const dur = Math.max(3.2, 7 - (nivel - 1) * 0.6);
    let cuenta = 0, fin = false;
    area.innerHTML = `<p class="jp-consigna">¡Revienta <strong>${meta} burbujas</strong>! Las de ⭐ valen doble <span class="jp-cuenta" id="jpCuenta">0/${meta}</span></p><div class="jp-burbujas" id="jpBurbujas"></div>`;
    const zona = $('jpBurbujas');
    function soltar() {
      if (fin) return;
      const b = document.createElement('button');
      const estrella = Math.random() < 0.15;
      const t = tam * (0.8 + Math.random() * 0.4);
      b.className = 'jp-burbuja' + (estrella ? ' estrella' : '');
      b.setAttribute('aria-label', 'Burbuja');
      b.style.width = b.style.height = t + 'px';
      b.style.left = Math.random() * Math.max(0, zona.clientWidth - t) + 'px';
      b.style.setProperty('--alto', (zona.clientHeight + t) + 'px');
      b.style.animationDuration = dur * (0.85 + Math.random() * 0.3) + 's';
      if (estrella) b.textContent = '⭐';
      b.addEventListener('animationend', (e) => { if (e.animationName === 'jp-subir') b.remove(); });
      b.addEventListener('pointerdown', () => {
        if (b.classList.contains('pop')) return;
        b.classList.add('pop');
        setTimeout(() => b.remove(), 220);
        cuenta = Math.min(meta, cuenta + (estrella ? 2 : 1));
        $('jpCuenta').textContent = cuenta + '/' + meta;
        if (cuenta >= meta && !fin) { fin = true; setTimeout(() => ganar('¡Reventaste todas las burbujas!'), 400); }
      });
      zona.appendChild(b);
    }
    soltar();
    const t = setInterval(soltar, Math.max(380, 800 - nivel * 60));
    return () => { fin = true; clearInterval(t); };
  }

  const JUEGOS = [
    { id: 'diferencias', e: '🔍', n: 'Diferencias', d: 'Encuentra lo que cambió', f: diferencias },
    { id: 'busca', e: '⭐', n: 'Busca a…', d: 'Encuentra al personaje', f: busca },
    { id: 'puntos', e: '✏️', n: 'Une los puntos', d: 'Del 1 al último', f: puntos },
    { id: 'caminito', e: '〰️', n: 'Sigue el caminito', d: 'Sin salirte del camino', f: caminito },
    { id: 'burbujas', e: '🫧', n: 'Burbujas', d: 'Revienta las burbujas', f: burbujas },
  ];

  // ================= PANTALLAS =================
  function limpiarJuego() {
    if (enJuego) { try { enJuego.limpiar(); } catch (e) {} enJuego = null; }
    $('jpPremio').classList.add('hidden');
  }

  function restante() {
    if (!finMs) return '';
    const min = Math.max(0, Math.ceil((finMs - Date.now()) / 60000));
    return min >= 60 ? `Quedan ${Math.floor(min / 60)} h ${min % 60} min de parche` : `Quedan ${min} min de parche`;
  }

  function mostrarMenu() {
    limpiarJuego();
    $('jpTitulo').textContent = 'Juegos con el parche';
    $('jpSub').textContent = restante();
    $('jpCuerpo').innerHTML =
      '<div class="jp-menu">' + JUEGOS.map((j) =>
        `<button class="jp-tarjeta" data-juego="${j.id}"><span class="jp-emoji">${j.e}</span><strong>${j.n}</strong><small>${j.d}</small><span class="jp-nivel">Nivel ${nivelDe(j.id)}</span></button>`
      ).join('') + '</div>' +
      '<p class="jp-nota">🩹 Juegos para entretenerse mientras usas el parche: hacen trabajar al ojito destapado. No reemplazan las indicaciones de tu oftalmólogo.</p>';
  }

  function iniciar(id) {
    limpiarJuego();
    const j = JUEGOS.find((x) => x.id === id);
    const nivel = nivelDe(id);
    $('jpTitulo').textContent = j.e + ' ' + j.n;
    $('jpSub').textContent = 'Nivel ' + nivel + ' · ' + restante();
    $('jpCuerpo').innerHTML = '<div class="jp-area" id="jpArea"></div>';
    const limpiar = j.f($('jpArea'), nivel, (texto) => premio(id, texto));
    enJuego = { id, limpiar: limpiar || (() => {}) };
  }

  function premio(id, texto) {
    if (!enJuego || enJuego.id !== id) return;
    try { enJuego.limpiar(); } catch (e) {}
    sumarEstrellas(3);
    subirNivel(id);
    $('jpPremioTexto').textContent = texto;
    $('jpPremio').classList.remove('hidden');
  }

  function avisoPantalla(emoji, titulo, texto) {
    limpiarJuego();
    $('jpTitulo').textContent = 'Juegos con el parche';
    $('jpSub').textContent = '';
    $('jpCuerpo').innerHTML = `<div class="jp-aviso"><div class="big">${emoji}</div><h2>${titulo}</h2><p>${texto}</p></div>`;
  }

  function vigilar() {
    clearInterval(vigilante);
    vigilante = setInterval(() => {
      if (!finMs) return;
      if (Date.now() >= finMs) {
        clearInterval(vigilante);
        avisoPantalla('🎉', '¡Se cumplió el tiempo del parche!', 'Ya se puede sacar el parche. Mañana hay más juegos 💖');
        return;
      }
      const sub = $('jpSub');
      if (!enJuego) sub.textContent = restante();
      else sub.textContent = 'Nivel ' + nivelDe(enJuego.id) + ' · ' + restante();
    }, 15000);
  }

  let cableado = false;
  function cablear() {
    $('jpVolver').addEventListener('click', () => (enJuego || !$('jpPremio').classList.contains('hidden')) && finMs && Date.now() < finMs ? mostrarMenu() : cerrar());
    $('jpCuerpo').addEventListener('click', (e) => {
      const b = e.target.closest('.jp-tarjeta');
      if (b) iniciar(b.dataset.juego);
    });
    $('jpSiguiente').addEventListener('click', () => { const id = enJuego && enJuego.id; if (id) iniciar(id); });
    $('jpOtro').addEventListener('click', mostrarMenu);
  }

  // opts: { registrado: bool, finMs: número (ms) o null }
  function abrir(opts) {
    if (!cableado) { cablear(); cableado = true; }
    finMs = opts.finMs || null;
    $('jp').classList.remove('hidden');
    document.body.classList.add('jugando');
    renderEstrellas();
    if (!opts.registrado) {
      avisoPantalla('🩹', 'Primero, el parche', 'Estos juegos se abren cuando tienes el parche puesto. Registra el parche de hoy tocando el ojito donde lo tienes, y vuelve 💖');
      return;
    }
    if (Date.now() >= finMs) {
      avisoPantalla('🎉', '¡Ya se cumplió el tiempo de hoy!', 'Ya te puedes sacar el parche. Mañana hay más juegos 💖');
      return;
    }
    mostrarMenu();
    vigilar();
  }

  function cerrar() {
    limpiarJuego();
    clearInterval(vigilante); vigilante = null;
    const jp = $('jp');
    if (jp) jp.classList.add('hidden');
    document.body.classList.remove('jugando');
  }

  return { abrir, cerrar };
})();
