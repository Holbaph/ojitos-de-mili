// mascota.js — 🐶 Mi mascota: un perrito de Mili (pug por defecto) con nombre
// y raza a elegir. Hay que darle comida, bañarlo (frotándolo con el dedo) y
// jugar con él; si no, se pone triste de a poquito. Los días que Mili usa su
// parche, el perrito también usa uno ("¡yo también uso parche, como tú!") y
// está más contento. Se guarda con la ropa del juego (en todos los celulares).

const Mascota = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t) => { if (typeof Voz !== 'undefined') Voz.decir(t); };
  const HEX = /^#[0-9a-f]{6}$/i;

  // ---------- razas ----------
  //   c: pelaje · h: hocico · o: orejas · oj: ojos · tipo de oreja y cola
  const RAZAS = {
    pug: { n: 'Pug', c: '#e6c79c', h: '#3a2e2a', o: '#3a2e2a', oreja: 'boton', cola: 'rulo', pug: true },
    'pug-negro': { n: 'Pug negro', c: '#3a3434', h: '#2a2424', o: '#2a2424', oreja: 'boton', cola: 'rulo', pug: true },
    poodle: { n: 'Poodle', c: '#f7f2ea', h: '#f7f2ea', o: '#efe6d8', oreja: 'rizada', cola: 'pompon', poodle: true },
    golden: { n: 'Golden', c: '#e8b86a', h: '#f0cc8a', o: '#d79e4e', oreja: 'caida', cola: 'larga' },
    dalmata: { n: 'Dálmata', c: '#faf8f4', h: '#faf8f4', o: '#2a2627', oreja: 'caida', cola: 'larga', manchas: true },
    salchicha: { n: 'Salchicha', c: '#9a5530', h: '#b8703f', o: '#7a3f22', oreja: 'larga', cola: 'larga' },
    chihuahua: { n: 'Chihuahua', c: '#e0aa6e', h: '#f1cf9f', o: '#e0aa6e', oreja: 'grande', cola: 'fina' },
    husky: { n: 'Husky', c: '#7d8590', h: '#ffffff', o: '#6a7179', oreja: 'parada', cola: 'esponja', husky: true },
    beagle: { n: 'Beagle', c: '#c98a4a', h: '#ffffff', o: '#8a5426', oreja: 'caida', cola: 'larga', beagle: true },
  };
  // ---------- 🛍️ tiendita de estrellas ----------
  // Se ganan 3 ⭐ por cada día con parche y 1 ⭐ por cada letra/número en Aprender.
  const COSAS = [
    { id: 'pelota', e: '⚽', n: 'Pelota', p: 5 }, { id: 'hueso', e: '🦴', n: 'Hueso', p: 5 }, { id: 'pato', e: '🦆', n: 'Patito de goma', p: 8 },
    { id: 'moño', e: '🎀', n: 'Moño', p: 8 }, { id: 'gorro', e: '🥳', n: 'Gorro de fiesta', p: 10 }, { id: 'lentes', e: '🕶️', n: 'Lentes de sol', p: 10 },
    { id: 'corona', e: '👑', n: 'Corona', p: 15 }, { id: 'capa', e: '🦸', n: 'Capa de héroe', p: 15 },
    { id: 'cama', e: '🛏️', n: 'Camita', p: 20 }, { id: 'casa', e: '🏠', n: 'Casita', p: 30 },
  ];
  const ESCENA = { pelota: [8, 4, 34], hueso: [78, 3, 34], pato: [86, 18, 30], cama: [72, 0, 64], casa: [2, 14, 90] }; // izq%, abajo%, tamaño
  let dias = 0;
  function tienda() {
    const t = Juego.extra('tienda') || {};
    const ok = (l) => (Array.isArray(l) ? l.filter((id) => COSAS.some((c) => c.id === id)) : []);
    return { gastado: Math.max(0, Math.floor(Number(t.gastado) || 0)), compradas: ok(t.compradas), puestas: ok(t.puestas) };
  }
  const saldo = () => dias * 3 + Math.max(0, Math.floor(Number(Juego.extra('estrellas')) || 0)) - tienda().gastado;

  const COLLARES = ['#e8578a', '#d9534f', '#4a78c2', '#7cc4ea', '#6fbf73', '#f2cf5b', '#b392d6', '#f0a04b'];
  const HORAS = 3600 * 1000;
  const DURA = { comida: 10 * HORAS, bano: 36 * HORAS, juego: 8 * HORAS };

  // ---------- estado (se valida: viene de la base de datos compartida) ----------
  function leer() {
    const m = Juego.extra('mascota');
    if (!m || typeof m !== 'object' || !RAZAS[m.raza]) return null;
    const n = (v) => (Number.isFinite(Number(v)) ? Math.min(Date.now(), Number(v)) : 0);
    return {
      raza: m.raza, nombre: String(m.nombre || '').replace(/[<>&"'`]/g, '').trim().slice(0, 14) || 'Pancho',
      collar: HEX.test(m.collar || '') ? m.collar : COLLARES[0], comida: n(m.comida), bano: n(m.bano), juego: n(m.juego),
    };
  }
  let m = null, parche = false;
  const guardar = () => Juego.guardarExtra('mascota', m);
  const nivel = (k) => Math.max(0, Math.min(100, Math.round(100 - (100 * (Date.now() - m[k])) / DURA[k])));
  function animo() {
    const v = (nivel('comida') + nivel('bano') + nivel('juego')) / 3 + (parche ? 15 : 0);
    return v >= 60 ? 'feliz' : v >= 30 ? 'normal' : 'triste';
  }

  // ================= DIBUJO =================
  const SPOTS = [[118, 210, 9], [196, 228, 11], [150, 262, 8], [210, 196, 7], [104, 248, 7], [176, 186, 6], [112, 84, 7], [206, 92, 6], [146, 60, 5]];
  function perro(raza, o) {
    o = o || {};
    const r = RAZAS[raza] || RAZAS.pug, c = r.c;
    const oscuro = Vestuario.color.oscurecer(c, 0.2), claro = Vestuario.color.aclarar(c, 0.35);
    const triste = o.animo === 'triste', feliz = o.animo === 'feliz';
    let s = '';
    // cola (detrás)
    const colas = {
      rulo: `<path d="M226 226 q34 -6 30 -32 q-4 -20 -22 -14 q-14 6 -4 18" fill="none" stroke="${c}" stroke-width="16" stroke-linecap="round"/>`,
      pompon: `<path d="M222 236 q20 -14 28 -40" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/><circle cx="252" cy="190" r="18" fill="${c}"/>`,
      larga: `<path d="M222 246 q34 -10 40 -52" fill="none" stroke="${c}" stroke-width="14" stroke-linecap="round"/>` + (r.manchas || r.beagle ? `<path d="M258 206 q3 -8 4 -14" stroke="${r.beagle ? '#fff' : '#2a2627'}" stroke-width="12" stroke-linecap="round"/>` : ''),
      fina: `<path d="M222 246 q30 -8 34 -46" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>`,
      esponja: `<path d="M220 246 q44 -4 40 -56 q-2 -14 -14 -10" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/><path d="M252 194 q8 -4 8 4" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`,
    };
    s += `<g class="ma-cola${feliz ? ' rapida' : ''}${triste ? ' quieta' : ''}">${colas[r.cola]}</g>`;
    const lleva = (id) => (o.cosas || []).includes(id);
    if (lleva('capa')) s += `<path d="M104 178 Q160 200 216 178 L254 298 Q160 322 66 298 Z" fill="#d9534f"/><path d="M104 178 Q160 200 216 178" fill="none" stroke="#f2cf5b" stroke-width="6"/>`;
    // cuerpo sentado
    s += `<ellipse cx="96" cy="282" rx="34" ry="22" fill="${oscuro}"/><ellipse cx="224" cy="282" rx="34" ry="22" fill="${oscuro}"/>`;
    s += `<ellipse cx="160" cy="232" rx="72" ry="64" fill="${c}"/>`;
    if (r.poodle) s += [[100, 210], [220, 210], [96, 250], [224, 250], [130, 286], [190, 286]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22" fill="${c}"/>`).join('');
    if (r.beagle) s += `<path d="M110 200 Q160 176 210 200 L206 236 Q160 220 114 236 Z" fill="#2a2627" opacity=".85"/>`;
    s += `<ellipse cx="160" cy="246" rx="38" ry="40" fill="${r.husky || r.beagle ? '#ffffff' : claro}"/>`;
    if (r.manchas) s += SPOTS.slice(0, 6).map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#2a2627"/>`).join('');
    // patitas delanteras (la derecha se levanta para el truco)
    s += `<g class="ma-pata-izq"><rect x="118" y="246" width="30" height="60" rx="15" fill="${c}"/><ellipse cx="133" cy="304" rx="19" ry="11" fill="${claro}"/></g>`;
    s += `<g class="ma-pata-der"><rect x="172" y="246" width="30" height="60" rx="15" fill="${c}"/><ellipse cx="187" cy="304" rx="19" ry="11" fill="${claro}"/></g>`;
    // collar con placa
    s += `<path d="M104 178 Q160 204 216 178" fill="none" stroke="${o.collar || COLLARES[0]}" stroke-width="12" stroke-linecap="round"/>` +
      `<circle cx="160" cy="200" r="10" fill="#f2cf5b" stroke="#c9a23a" stroke-width="2"/><path d="M160 196 l2.5 5 5 .5 -4 3.5 1 5 -4.5 -2.5 -4.5 2.5 1 -5 -4 -3.5 5 -.5z" fill="#fff6c8"/>`;
    // cabeza
    const orejas = {
      boton: `<path d="M86 66 Q70 58 64 84 Q78 96 98 84 Z" fill="${r.o}"/><path d="M234 66 Q250 58 256 84 Q242 96 222 84 Z" fill="${r.o}"/>`,
      rizada: [[74, 104], [66, 128], [78, 150], [246, 104], [254, 128], [242, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${r.o}"/>`).join(''),
      caida: `<ellipse cx="80" cy="116" rx="24" ry="50" transform="rotate(${triste ? 22 : 14} 80 116)" fill="${r.o}"/><ellipse cx="240" cy="116" rx="24" ry="50" transform="rotate(${triste ? -22 : -14} 240 116)" fill="${r.o}"/>`,
      larga: `<ellipse cx="78" cy="128" rx="24" ry="60" transform="rotate(10 78 128)" fill="${r.o}"/><ellipse cx="242" cy="128" rx="24" ry="60" transform="rotate(-10 242 128)" fill="${r.o}"/>`,
      grande: `<path d="M98 72 L52 ${triste ? 40 : 4} L120 52 Z" fill="${r.o}"/><path d="M94 64 L66 ${triste ? 42 : 22} L110 52 Z" fill="#f4b4b4"/>` +
        `<path d="M222 72 L268 ${triste ? 40 : 4} L200 52 Z" fill="${r.o}"/><path d="M226 64 L254 ${triste ? 42 : 22} L210 52 Z" fill="#f4b4b4"/>`,
      parada: `<path d="M96 70 L80 ${triste ? 40 : 14} L132 52 Z" fill="${r.o}"/><path d="M98 64 L90 32 L122 54 Z" fill="#f4d4d4"/>` +
        `<path d="M224 70 L240 ${triste ? 40 : 14} L188 52 Z" fill="${r.o}"/><path d="M222 64 L230 32 L198 54 Z" fill="#f4d4d4"/>`,
    };
    const orejasAtras = r.oreja === 'grande' || r.oreja === 'parada';
    if (orejasAtras) s += orejas[r.oreja];
    s += `<ellipse cx="160" cy="118" rx="80" ry="72" fill="${c}"/>`;
    if (r.poodle) s += [[124, 52], [160, 42], [196, 52], [140, 34], [180, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="20" fill="${c}"/>`).join('');
    if (r.husky) s += `<path d="M160 70 C134 86 106 96 100 132 C104 172 136 186 160 186 C184 186 216 172 220 132 C214 96 186 86 160 70 Z" fill="#ffffff"/>`;
    if (r.beagle) s += `<path d="M150 50 L170 50 L176 120 L144 120 Z" fill="#ffffff"/>`;
    if (r.manchas) s += SPOTS.slice(6).map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#2a2627"/>`).join('');
    if (r.pug) s += `<path d="M132 64 q28 -10 56 0 M138 76 q22 -8 44 0" fill="none" stroke="${Vestuario.color.oscurecer(c, 0.3)}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    if (!orejasAtras) s += orejas[r.oreja];
    // hocico
    s += `<ellipse cx="160" cy="${r.pug ? 148 : 152}" rx="${r.pug ? 44 : 38}" ry="${r.pug ? 30 : 28}" fill="${r.h}"/>`;
    // ojos (en su grupo para pestañear)
    const iris = r.husky ? '#5aa6e0' : '#2a1f1c';
    const ojo = (x) => triste
      ? `<path d="M${x - 13} ${114} q13 10 26 0" fill="none" stroke="#2a1f1c" stroke-width="5" stroke-linecap="round"/>`
      : `<circle cx="${x}" cy="112" r="${r.pug ? 15 : 13}" fill="${r.husky ? '#fff' : '#2a1f1c'}"/>` + (r.husky ? `<circle cx="${x}" cy="112" r="9" fill="${iris}"/><circle cx="${x}" cy="112" r="4.5" fill="#1f1a24"/>` : '') +
        `<circle cx="${x - 4}" cy="107" r="4.5" fill="#fff"/><circle cx="${x + 5}" cy="117" r="2" fill="#fff"/>`;
    s += `<g class="pj-ojos">${ojo(126)}${ojo(194)}</g>`;
    if (o.parche) {
      // el mismo parche de Mili, en su ojo izquierdo (a la derecha de la pantalla)
      s += `<g><path d="M174 100 L214 96 Q222 112 214 128 L176 130 Q168 114 174 100 Z" fill="#f3d9c4" stroke="#d9b89d" stroke-width="2"/>` +
        `<path d="${'M194 106 l3 6 6.5 .6 -5 4.3 1.6 6.4 -6.1 -3.5 -6.1 3.5 1.6 -6.4 -5 -4.3 6.5 -.6z'}" fill="#e8578a"/></g>`;
    }
    // nariz y boca
    s += `<path d="M146 ${r.pug ? 132 : 138} Q160 ${r.pug ? 124 : 130} 174 ${r.pug ? 132 : 138} Q172 ${r.pug ? 146 : 152} 160 ${r.pug ? 148 : 154} Q148 ${r.pug ? 146 : 152} 146 ${r.pug ? 132 : 138} Z" fill="#2a1f1c"/>` +
      `<circle cx="154" cy="${r.pug ? 132 : 138}" r="3" fill="#fff" opacity=".5"/>`;
    const by = r.pug ? 152 : 158;
    if (feliz || o.comiendo) s += `<path d="M146 ${by + 6} Q153 ${by + 30} 160 ${by + 26} Q167 ${by + 30} 174 ${by + 6} Z" fill="#e8605a"/>`;
    s += triste
      ? `<path d="M144 ${by + 14} q16 -10 32 0" fill="none" stroke="#2a1f1c" stroke-width="3.5" stroke-linecap="round"/>`
      : `<path d="M160 ${by - 4} l0 6 M142 ${by + 4} q9 8 18 0 q9 8 18 0" fill="none" stroke="#2a1f1c" stroke-width="3.5" stroke-linecap="round"/>`;
    if (lleva('lentes')) s += `<rect x="102" y="98" width="48" height="30" rx="12" fill="#2a2740" opacity=".92"/><rect x="170" y="98" width="48" height="30" rx="12" fill="#2a2740" opacity=".92"/>` +
      `<path d="M150 108 L170 108" stroke="#2a2740" stroke-width="5"/><path d="M110 104 l12 0" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`;
    if (lleva('gorro')) s += `<path d="M124 60 L160 -26 L198 62 Q160 52 124 60 Z" fill="#7cc4ea" stroke="#4a78c2" stroke-width="2"/><path d="M138 30 L184 28 M148 6 L174 4" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="160" cy="-28" r="12" fill="#f2cf5b"/>`;
    else if (lleva('corona')) s += `<path d="M118 58 L112 18 L138 38 L160 6 L182 38 L208 18 L202 58 Z" fill="#f2cf5b" stroke="#c9a23a" stroke-width="2.5" stroke-linejoin="round"/><circle cx="160" cy="44" r="6" fill="#e8578a"/><circle cx="134" cy="48" r="4" fill="#7cc4ea"/><circle cx="186" cy="48" r="4" fill="#6fbf73"/>`;
    if (lleva('moño')) s += `<g transform="translate(214 56) rotate(18)"><path d="M0 0 Q-24 -20 -30 0 Q-24 20 0 0 Z M0 0 Q24 -20 30 0 Q24 20 0 0 Z" fill="#e8578a"/><circle r="7" fill="#c23f6f"/></g>`;
    if (o.sucio) s += [[110, 230], [204, 250], [130, 80], [196, 70], [150, 280]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="7" fill="#8a6a4a" opacity=".45"/>`).join('');
    return s;
  }
  const svgPerro = (raza, o) => `<g class="pj-cuerpo">${perro(raza, o)}</g>`;

  // ================= PANTALLA =================
  function globo(texto) {
    const cont = $('maEscena');
    let g = cont.querySelector('.vi-globo');
    if (!g) { g = document.createElement('div'); g.className = 'vi-globo'; cont.appendChild(g); }
    g.textContent = texto;
    g.classList.remove('ver'); void g.offsetWidth; g.classList.add('ver');
    clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove('ver'), 2600);
    decir(texto);
  }
  function efecto(emoji, n, clase) {
    const cont = $('maEfectos');
    for (let i = 0; i < (n || 1); i++) {
      const e = document.createElement('span');
      e.className = 'ma-fx ' + (clase || '');
      e.textContent = emoji;
      e.style.left = (30 + Math.random() * 40) + '%';
      e.style.top = (25 + Math.random() * 40) + '%';
      e.style.animationDelay = (i * 0.12) + 's';
      cont.appendChild(e);
      setTimeout(() => e.remove(), 1800 + i * 120);
    }
  }
  function salto() {
    const svg = $('maSvg');
    svg.classList.remove('pj-salto'); void svg.getBoundingClientRect(); svg.classList.add('pj-salto');
    setTimeout(() => svg.classList.remove('pj-salto'), 900);
  }

  let comiendo = false;
  function dibujar() {
    const a = animo();
    const t = tienda();
    $('maSvg').innerHTML = svgPerro(m.raza, { animo: a, collar: m.collar, parche, comiendo, sucio: nivel('bano') < 25, cosas: t.puestas });
    // lo de la escena (casita, camita, juguetes)
    $('maDeco').innerHTML = t.puestas.filter((id) => ESCENA[id]).map((id) => { const [x, y, f] = ESCENA[id]; return `<span style="left:${x}%;bottom:${y}%;font-size:${f}px">${COSAS.find((c) => c.id === id).e}</span>`; }).join('');
    $('maTitulo').textContent = `🐶 ${m.nombre}`;
    $('maSub').textContent = a === 'feliz' ? '¡Está feliz! 💖' : a === 'triste' ? 'Está un poquito triste 🥺' : 'Está tranquilo 🙂';
    const barra = (e, n, v) => `<div class="ma-barra"><span>${e} ${n}</span><i><b style="width:${v}%;background:${v > 50 ? '#6fbf73' : v > 25 ? '#f2cf5b' : '#e8605a'}"></b></i></div>`;
    $('maBarras').innerHTML = barra('🍖', 'Comida', nivel('comida')) + barra('🛁', 'Limpieza', nivel('bano')) + barra('⚽', 'Juego', nivel('juego'));
  }
  function saludo() {
    const a = animo();
    if (parche) return `¡Guau! ¡Yo también uso parche, como tú! 🩹`;
    if (nivel('comida') < 30) return `¡Guau! Tengo hambre… ¿me das comida? 🍖`;
    if (nivel('bano') < 25) return `Estoy sucio… ¿me bañas? 🛁`;
    if (nivel('juego') < 30) return `¿Jugamos a la pelota? ⚽`;
    return a === 'feliz' ? `¡Guau, guau! ¡Te quiero, ${'Mili'}! 💖` : '¡Guau! 🐾';
  }

  // ---------- acciones ----------
  let banando = 0, frotando = false;
  function accion(acc) {
    if (acc === 'comer') {
      comiendo = true; m.comida = Date.now(); guardar(); dibujar();
      efecto('🍖', 1, 'cae'); setTimeout(() => efecto('💖', 4), 700);
      globo('¡Ñam, ñam! ¡Qué rico! 😋');
      setTimeout(() => { comiendo = false; dibujar(); }, 2200);
    } else if (acc === 'banar') {
      banando = 0;
      $('maEscena').classList.add('banando');
      globo(`¡Frota a ${m.nombre} con tu dedo para bañarlo! 🫧`);
    } else if (acc === 'jugar') {
      m.juego = Date.now(); guardar();
      const p = document.createElement('span'); p.className = 'ma-pelota'; p.textContent = '⚽';
      $('maEfectos').appendChild(p); setTimeout(() => p.remove(), 1600);
      setTimeout(() => { salto(); dibujar(); globo('¡La atrapé! ¡Otra vez! 🎾'); efecto('⭐', 3); }, 800);
    } else if (acc === 'truco') {
      const svg = $('maSvg');
      svg.classList.remove('ma-truco'); void svg.getBoundingClientRect(); svg.classList.add('ma-truco');
      setTimeout(() => svg.classList.remove('ma-truco'), 1600);
      globo(['¡Te doy la patita! 🐾', '¡Mira cómo me siento! 🐕', '¡Choca esos cinco! ✋'][Math.floor(Math.random() * 3)]);
    }
  }
  // bañar: cada vez que frota aparecen burbujas; al rato queda limpiecito
  function frotar(e) {
    if (!$('maEscena').classList.contains('banando') || !frotando) return;
    const r = $('maEscena').getBoundingClientRect();
    if (Math.random() < 0.5) {
      const b = document.createElement('span');
      b.className = 'ma-fx burbuja'; b.textContent = '🫧';
      b.style.left = ((e.clientX - r.left) / r.width * 100 - 4) + '%';
      b.style.top = ((e.clientY - r.top) / r.height * 100 - 6) + '%';
      $('maEfectos').appendChild(b); setTimeout(() => b.remove(), 1400);
    }
    if (++banando === 60) {
      $('maEscena').classList.remove('banando');
      m.bano = Date.now(); guardar(); dibujar();
      efecto('✨', 6); globo('¡Quedé limpiecito y con olor rico! ✨');
    }
  }

  function renderTienda() {
    const t = tienda(), s = saldo();
    $('maSaldo').textContent = `⭐ ${s}`;
    $('maCosas').innerHTML = COSAS.map((c) => {
      const tiene = t.compradas.includes(c.id), puesta = t.puestas.includes(c.id);
      const btn = tiene ? `<b>${puesta ? '✅ Puesto' : 'Ponérselo'}</b>` : `<b>⭐ ${c.p}</b>`;
      return `<button class="ma-cosa${tiene ? ' tiene' : ''}${puesta ? ' puesta' : ''}${!tiene && s < c.p ? ' falta' : ''}" data-cosa="${c.id}"><span>${c.e}</span><small>${c.n}</small>${btn}</button>`;
    }).join('');
  }
  function tocarCosa(id) {
    const c = COSAS.find((x) => x.id === id), t = tienda();
    if (!t.compradas.includes(id)) {
      if (saldo() < c.p) { globo(`¡Te faltan ${c.p - saldo()} estrellitas! Usa tu parche y aprende letras para ganar más ⭐`); return; }
      t.compradas.push(id); t.gastado += c.p; t.puestas.push(id);
      globo(`¡Gracias! ¡Me encanta ${c.n.toLowerCase()}! ${c.e}`); efecto('⭐', 4);
    } else if (t.puestas.includes(id)) t.puestas = t.puestas.filter((x) => x !== id);
    else {
      // el gorro y la corona no van juntos
      if (id === 'gorro') t.puestas = t.puestas.filter((x) => x !== 'corona');
      if (id === 'corona') t.puestas = t.puestas.filter((x) => x !== 'gorro');
      t.puestas.push(id);
    }
    Juego.guardarExtra('tienda', t);
    dibujar(); renderTienda(); salto();
  }
  function abrirTienda() {
    const p = $('maTiendaPanel');
    p.classList.toggle('hidden');
    $('mascota').classList.toggle('con-tienda', !p.classList.contains('hidden'));
    if (!p.classList.contains('hidden')) { renderTienda(); globo('¡Mira mi tiendita! ¿Me compras algo? 🛍️'); setTimeout(() => p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 50); }
  }

  // ---------- elegir raza y nombre ----------
  let eleccion = null;
  function mostrarElegir() {
    eleccion = m ? { raza: m.raza, nombre: m.nombre, collar: m.collar } : { raza: 'pug', nombre: '', collar: COLLARES[0] };
    $('maElegir').classList.remove('hidden'); $('maJugar').classList.add('hidden');
    $('maNombre').value = eleccion.nombre;
    $('maTitulo').textContent = '🐶 Mi perrito'; $('maSub').textContent = 'Elige cómo es y ponle nombre';
    renderElegir();
  }
  function renderElegir() {
    $('maRazas').innerHTML = Object.keys(RAZAS).map((k) =>
      `<button class="ma-raza${k === eleccion.raza ? ' activo' : ''}" data-raza="${k}"><svg viewBox="0 0 320 320">${perro(k, { animo: 'feliz', collar: eleccion.collar })}</svg><span>${RAZAS[k].n}</span></button>`).join('');
    $('maCollares').innerHTML = COLLARES.map((c) => `<button class="ta-color${c === eleccion.collar ? ' activo' : ''}" data-collar="${c}" style="background:${c}" aria-label="Color del collar"></button>`).join('');
  }
  function listo() {
    const nombre = $('maNombre').value.replace(/[<>&"'`]/g, '').trim().slice(0, 14);
    if (!nombre) { $('maNombre').classList.add('falta'); decir('¿Cómo se llama tu perrito?'); $('maNombre').focus(); return; }
    const nuevo = !m;
    const ahora = Date.now();
    m = { ...(m || { comida: ahora, bano: ahora, juego: ahora - 6 * HORAS }), raza: eleccion.raza, nombre, collar: eleccion.collar };
    guardar();
    $('maElegir').classList.add('hidden'); $('maJugar').classList.remove('hidden');
    dibujar();
    globo(nuevo ? `¡Guau! ¡Hola! Me llamo ${nombre} 🐶` : `¡Me gusta cómo quedé! 🐾`);
  }

  let cableado = false;
  function cablear() {
    $('maCerrar').addEventListener('click', cerrar);
    $('maAjustes').addEventListener('click', mostrarElegir);
    $('maTienda').addEventListener('click', abrirTienda);
    $('maCosas').addEventListener('click', (e) => { const b = e.target.closest('[data-cosa]'); if (b) tocarCosa(b.dataset.cosa); });
    $('maListo').addEventListener('click', listo);
    $('maNombre').addEventListener('input', () => $('maNombre').classList.remove('falta'));
    $('maElegir').addEventListener('click', (e) => {
      const b = e.target.closest('[data-raza],[data-collar]');
      if (!b) return;
      if (b.dataset.raza) { eleccion.raza = b.dataset.raza; decir(RAZAS[eleccion.raza].n); }
      if (b.dataset.collar) eleccion.collar = b.dataset.collar;
      renderElegir();
    });
    document.querySelector('#maJugar .ma-acciones').addEventListener('click', (e) => { const b = e.target.closest('[data-acc]'); if (b) accion(b.dataset.acc); });
    const esc = $('maEscena');
    esc.addEventListener('pointerdown', (e) => { frotando = true; if (!esc.classList.contains('banando') && e.target.closest('#maSvg')) { salto(); efecto('💖', 2); globo(Math.random() < 0.5 ? '¡Guau, guau! 🐶' : saludo()); } });
    esc.addEventListener('pointermove', frotar);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => esc.addEventListener(t, () => { frotando = false; }));
  }

  // parcheHoy: si Mili tiene registrado el parche de hoy
  // parcheHoy: si Mili tiene el parche de hoy; diasConParche: para las estrellas de la tienda
  function abrir(parcheHoy, diasConParche) {
    if (!cableado) { cablear(); cableado = true; }
    parche = !!parcheHoy;
    dias = Math.max(0, Number(diasConParche) || 0);
    $('maTiendaPanel').classList.add('hidden'); $('mascota').classList.remove('con-tienda');
    m = leer();
    $('mascota').classList.remove('hidden');
    document.body.classList.add('jugando');
    $('maEscena').classList.remove('banando');
    if (!m) { mostrarElegir(); decir('¡Vamos a elegir tu perrito!'); return; }
    $('maElegir').classList.add('hidden'); $('maJugar').classList.remove('hidden');
    dibujar();
    setTimeout(() => globo(saludo()), 400);
  }
  function cerrar() { $('mascota').classList.add('hidden'); document.body.classList.remove('jugando'); if (typeof Voz !== 'undefined') Voz.callar(); }
  // para el botón de la pantalla principal
  function resumen() { const x = leer(); return x ? x.nombre : null; }
  return { abrir, cerrar, resumen, RAZAS, perro };
})();
