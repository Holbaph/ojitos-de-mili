// mili.js — dibuja a Mili (cuerpo entero) según su apariencia personalizable:
// piel, ojos, peinado, accesorio, ropa y zapatos. Los ojos NO se dibujan aquí
// en la pantalla principal: son los grupos fijos #eyeDerecho / #eyeIzquierdo
// de index.html (los que se tocan para registrar el parche), que toman su
// color de la variable --iris que se fija en el <svg>.
//
// Coordenadas (viewBox 0 0 320 440): la cabeza es un círculo en (160,176) de
// radio 118 y los ojos están en (112,168) y (208,168). El cuerpo va debajo.

const Mili = (function () {
  // ---------- opciones ----------
  const PIELES = [
    { c: '#fde6d4', n: 'Muy clara' }, { c: '#fbe3ce', n: 'Clara' }, { c: '#f1c9a5', n: 'Clara cálida' },
    { c: '#dfa77c', n: 'Media' }, { c: '#b97d52', n: 'Morena' }, { c: '#8a5634', n: 'Morena oscura' },
    { c: '#5e3a24', n: 'Oscura' },
  ];
  const OJOS = [
    { c: '#8b5e3c', n: 'Café' }, { c: '#b07a3a', n: 'Miel' }, { c: '#4a3222', n: 'Café oscuro' },
    { c: '#5f8a4c', n: 'Verde' }, { c: '#4f7fb5', n: 'Azul' }, { c: '#7d8a93', n: 'Gris' },
    { c: '#2e2622', n: 'Negro' },
  ];
  const PELOS = [
    { c: '#2b2220', n: 'Negro' }, { c: '#4a3222', n: 'Castaño oscuro' }, { c: '#6b4428', n: 'Castaño' },
    { c: '#a8744a', n: 'Castaño claro' }, { c: '#d9b46a', n: 'Rubio' }, { c: '#efd9a0', n: 'Rubio claro' },
    { c: '#b5522b', n: 'Pelirrojo' },
  ];
  const COLORES = [
    { c: '#e88fae', n: 'Rosado' }, { c: '#d0487e', n: 'Fucsia' }, { c: '#d9534f', n: 'Rojo' },
    { c: '#f0a04b', n: 'Naranjo' }, { c: '#f2cf5b', n: 'Amarillo' }, { c: '#6fbf73', n: 'Verde' },
    { c: '#8fd8c4', n: 'Menta' }, { c: '#7cc4ea', n: 'Celeste' }, { c: '#4a78c2', n: 'Azul' },
    { c: '#b392d6', n: 'Lila' }, { c: '#7e57c2', n: 'Morado' }, { c: '#f7f5f2', n: 'Blanco' },
    { c: '#9aa0a6', n: 'Gris' }, { c: '#3a3540', n: 'Negro' },
  ];

  const PEINADOS = [
    { v: 'melena', n: 'Melena' }, { v: 'largo', n: 'Pelo largo' }, { v: 'corto', n: 'Cortito' },
    { v: 'colitas', n: 'Dos colitas' }, { v: 'cola', n: 'Cola de caballo' }, { v: 'tomate', n: 'Tomate' },
  ];
  const ACCESORIOS = [
    { v: 'moño', n: '🎀 Moño' }, { v: 'collet', n: '🍩 Collet' }, { v: 'cintillo', n: '👑 Cintillo' },
    { v: 'flor', n: '🌸 Flor' }, { v: 'ninguno', n: 'Sin accesorio' },
  ];
  const ROPAS = [
    { v: 'vestido', n: '👗 Vestido', c2: 'Color del cinturón' },
    { v: 'falda', n: '👚 Polera y falda', c2: 'Color de la falda' },
    { v: 'pantalon', n: '👖 Polera y pantalón', c2: 'Color del pantalón' },
    { v: 'jardinera', n: '🩳 Jardinera', c2: 'Color de la polera' },
  ];
  const ESTAMPADOS = [
    { v: 'liso', n: 'Liso' }, { v: 'lunares', n: 'Lunares' }, { v: 'rayas', n: 'Rayas' }, { v: 'corazones', n: 'Corazones' },
  ];
  const ZAPATOS = [
    { v: 'balerinas', n: 'Balerinas' }, { v: 'zapatillas', n: 'Zapatillas' },
    { v: 'botitas', n: 'Botitas' }, { v: 'sandalias', n: 'Sandalias' },
  ];

  // El parche: forma, estampado, color y un adornito.
  const PARCHE_COLORES = [
    { c: '#4b3b36', n: 'Café oscuro (el original)' }, { c: '#e9c9a8', n: 'Color piel' },
  ].concat(COLORES);
  const PARCHE_FORMAS = [
    { v: 'ovalado', n: '🥚 Ovalado' }, { v: 'redondo', n: '⚪ Redondo' },
    { v: 'corazon', n: '💗 Corazón' }, { v: 'nube', n: '☁️ Nube' },
  ];
  const PARCHE_ESTAMPADOS = [
    { v: 'liso', n: 'Liso' }, { v: 'lunares', n: 'Lunares' }, { v: 'corazones', n: 'Corazones' },
    { v: 'estrellas', n: 'Estrellas' }, { v: 'rayas', n: 'Rayas' }, { v: 'arcoiris', n: '🌈 Arcoíris' },
  ];
  const PARCHE_ADORNOS = [
    { v: 'ninguno', n: 'Sin adorno' }, { v: 'estrella', n: '⭐ Estrella' }, { v: 'corazon', n: '❤️ Corazón' },
    { v: 'flor', n: '🌼 Flor' }, { v: 'carita', n: '🙂 Carita' },
  ];

  const DEFAULT = {
    piel: '#fbe3ce', ojos: '#8b5e3c',
    peloEstilo: 'melena', peloColor: '#6b4428',
    accesorio: 'moño', accesorioColor: '#c96f8f',
    ropa: 'vestido', ropaColor: '#e88fae', ropaColor2: '#f7f5f2', estampado: 'lunares',
    zapatos: 'balerinas', zapatosColor: '#c96f8f',
    parcheForma: 'ovalado', parcheEstampado: 'liso', parcheColor: '#4b3b36', parcheAdorno: 'ninguno',
  };

  // La apariencia viene de la base de datos (compartida) y se mete dentro del
  // SVG: por eso se valida todo — solo colores #rrggbb y opciones conocidas.
  const HEX = /^#[0-9a-f]{6}$/i;
  const VALIDOS = {
    peloEstilo: PEINADOS, accesorio: ACCESORIOS, ropa: ROPAS, estampado: ESTAMPADOS, zapatos: ZAPATOS,
    parcheForma: PARCHE_FORMAS, parcheEstampado: PARCHE_ESTAMPADOS, parcheAdorno: PARCHE_ADORNOS,
  };
  function normalizar(ap) {
    const out = { ...DEFAULT };
    if (!ap || typeof ap !== 'object') return out;
    Object.keys(DEFAULT).forEach((k) => {
      const v = ap[k];
      if (typeof v !== 'string') return;
      if (VALIDOS[k]) { if (VALIDOS[k].some((o) => o.v === v)) out[k] = v; }
      else if (HEX.test(v)) out[k] = v.toLowerCase();
    });
    return out;
  }

  // ---------- colores ----------
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hex(r, g, b) { return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''); }
  function mezclar(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  function oscurecer(c, t) { return mezclar(c, '#000000', t); }
  function aclarar(c, t) { return mezclar(c, '#ffffff', t); }
  function esClaro(c) { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62; }
  function contraste(c) { return esClaro(c) ? oscurecer(c, 0.3) : aclarar(c, 0.7); }

  // ---------- piezas ----------
  function estampado(pfx, ap) {
    const c = ap.ropaColor, d = contraste(c);
    let dibujo = '';
    if (ap.estampado === 'lunares') dibujo = `<circle cx="5" cy="5" r="2.6" fill="${d}"/><circle cx="14" cy="14" r="2.6" fill="${d}"/>`;
    else if (ap.estampado === 'rayas') dibujo = `<rect y="0" width="18" height="6" fill="${d}"/>`;
    else if (ap.estampado === 'corazones') dibujo = `<path d="M9 13 L4.6 8.6 A2.6 2.6 0 0 1 9 5.6 A2.6 2.6 0 0 1 13.4 8.6 Z" fill="${d}"/>`;
    if (!dibujo) return { defs: '', fill: c };
    return {
      defs: `<pattern id="${pfx}-est" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c}"/>${dibujo}</pattern>`,
      fill: `url(#${pfx}-est)`,
    };
  }

  // Dónde se amarra el pelo, para poner ahí el moño / collet / flor.
  function amarres(estilo) {
    if (estilo === 'colitas') return [{ x: 44, y: 150, s: 0.7 }, { x: 276, y: 150, s: 0.7 }];
    if (estilo === 'cola') return [{ x: 252, y: 98, s: 0.75 }];
    if (estilo === 'tomate') return [{ x: 160, y: 66, s: 0.8 }];
    return [];
  }

  function peloAtras(ap) {
    const h = ap.peloColor;
    const casquete = `<path d="M35.6 200 A128 128 0 1 1 284.4 200 Z" fill="${h}"/>`;
    switch (ap.peloEstilo) {
      case 'melena':
        return `<path d="M30 172 A130 130 0 0 1 290 172 L292 262 Q278 278 256 268 L64 268 Q42 278 28 262 Z" fill="${h}"/>`;
      case 'largo':
        return `<path d="M30 172 A130 130 0 0 1 290 172 L298 306 Q302 342 270 340 Q246 326 232 300 L88 300 Q74 326 50 340 Q18 342 22 306 Z" fill="${h}"/>`;
      case 'colitas':
        return casquete +
          `<ellipse cx="30" cy="200" rx="22" ry="50" transform="rotate(16 30 200)" fill="${h}"/>` +
          `<ellipse cx="290" cy="200" rx="22" ry="50" transform="rotate(-16 290 200)" fill="${h}"/>`;
      case 'cola':
        return casquete + `<path d="M250 90 Q318 104 308 196 Q302 240 276 258 Q290 204 274 152 Q264 120 240 106 Z" fill="${h}"/>`;
      case 'tomate':
        return casquete + `<circle cx="160" cy="40" r="28" fill="${h}"/>`;
      default:
        return casquete;
    }
  }

  function flequillo(ap) {
    const h = ap.peloColor, o = oscurecer(h, 0.25);
    return `<path d="M42 152 A121 121 0 0 1 278 152 Q266 118 238 106 Q220 122 196 104 Q176 120 160 102 Q144 120 124 104 Q100 122 82 106 Q54 118 42 152 Z" fill="${h}"/>` +
      `<path d="M160 62 Q150 82 146 100 M120 70 Q106 88 100 104 M200 70 Q214 88 220 104" fill="none" stroke="${o}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>`;
  }

  function moño(x, y, s, c) {
    const o = oscurecer(c, 0.18);
    return `<g transform="translate(${x} ${y}) scale(${s})">` +
      `<path d="M-3 0 Q-18 -26 -32 -14 Q-38 0 -32 14 Q-18 26 -3 0 Z" fill="${c}"/>` +
      `<path d="M3 0 Q18 -26 32 -14 Q38 0 32 14 Q18 26 3 0 Z" fill="${c}"/>` +
      `<circle r="9" fill="${o}"/></g>`;
  }

  function collet(x, y, s, c) {
    const o = oscurecer(c, 0.2);
    const bolitas = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      bolitas.push({ cx: x + Math.cos(a) * 15 * s, cy: y + Math.sin(a) * 8 * s, atras: Math.sin(a) < 0 });
    }
    // primero las de atrás, después las de adelante, para que se vea "inflado"
    return bolitas.sort((a, b) => (b.atras - a.atras))
      .map((b) => `<circle cx="${b.cx.toFixed(1)}" cy="${b.cy.toFixed(1)}" r="${(7.5 * s).toFixed(1)}" fill="${c}" stroke="${o}" stroke-width="1"/>`)
      .join('');
  }

  function flor(x, y, s, c) {
    let petalos = '';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      petalos += `<circle cx="${(Math.cos(a) * 10).toFixed(1)}" cy="${(Math.sin(a) * 10).toFixed(1)}" r="8" fill="${c}"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s})">${petalos}<circle r="6" fill="#f6d26b"/></g>`;
  }

  function accesorios(ap) {
    const c = ap.accesorioColor, puntos = amarres(ap.peloEstilo);
    const liga = (p) => `<ellipse cx="${p.x}" cy="${p.y}" rx="${9 * p.s}" ry="${6 * p.s}" fill="${oscurecer(ap.peloColor, 0.35)}"/>`;

    switch (ap.accesorio) {
      case 'moño':
        return puntos.length ? puntos.map((p) => moño(p.x, p.y, p.s, c)).join('') : moño(160, 46, 1, c);
      case 'collet':
        if (puntos.length) return puntos.map((p) => collet(p.x, p.y, p.s + 0.2, c)).join('');
        // sin amarre: una "palmerita" arriba, tomada con el collet
        return `<path d="M160 54 Q138 22 148 10 Q157 28 160 30 Q163 28 172 10 Q182 22 160 54 Z" fill="${ap.peloColor}"/>` + collet(160, 52, 1, c);
      case 'cintillo':
        return puntos.map(liga).join('') +
          `<path d="M42 140 A124 124 0 0 1 278 140" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`;
      case 'flor':
        return puntos.length ? puntos.map((p) => flor(p.x, p.y, p.s, c)).join('') : flor(222, 72, 1, c);
      default:
        return puntos.map(liga).join('');
    }
  }

  function cara(ap) {
    const linea = oscurecer(ap.piel, 0.12);
    const rubor = mezclar(ap.piel, '#ee6f6f', 0.45);
    const ceja = oscurecer(ap.peloColor, 0.1);
    return `<circle cx="160" cy="176" r="118" fill="${ap.piel}" stroke="${linea}" stroke-width="2"/>` +
      `<ellipse cx="94" cy="212" rx="19" ry="11" fill="${rubor}" opacity=".55"/>` +
      `<ellipse cx="226" cy="212" rx="19" ry="11" fill="${rubor}" opacity=".55"/>` +
      `<path d="M92 130 q20 -14 40 -2" fill="none" stroke="${ceja}" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M188 128 q20 -12 40 2" fill="none" stroke="${ceja}" stroke-width="4" stroke-linecap="round" opacity=".7"/>` +
      `<path d="M158 168 q-4 20 -10 26 q6 6 14 2" fill="none" stroke="${linea}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M136 232 q24 22 48 0" fill="none" stroke="#c9607a" stroke-width="6" stroke-linecap="round"/>`;
  }

  function zapato(cx, ap) {
    const c = ap.zapatosColor, o = oscurecer(c, 0.25), l = aclarar(c, 0.45);
    switch (ap.zapatos) {
      case 'zapatillas':
        return `<path d="M${cx - 14} 432 L${cx - 14} 421 Q${cx - 14} 411 ${cx} 411 Q${cx + 14} 411 ${cx + 14} 421 L${cx + 14} 432 Z" fill="${c}"/>` +
          `<rect x="${cx - 15}" y="428" width="30" height="5" rx="2.5" fill="#f7f5f2" stroke="${o}" stroke-width=".8"/>` +
          `<path d="M${cx - 5} 417 L${cx + 5} 417 M${cx - 5} 421.5 L${cx + 5} 421.5" stroke="#f7f5f2" stroke-width="1.8" stroke-linecap="round"/>`;
      case 'botitas':
        return `<path d="M${cx - 12} 392 L${cx + 12} 392 L${cx + 13} 424 Q${cx + 14} 433 ${cx + 7} 433 L${cx - 7} 433 Q${cx - 14} 433 ${cx - 13} 424 Z" fill="${c}"/>` +
          `<rect x="${cx - 13.5}" y="389" width="27" height="8" rx="3.5" fill="${l}"/>` +
          `<rect x="${cx - 13}" y="430" width="26" height="3.5" rx="1.5" fill="${o}"/>`;
      case 'sandalias':
        return `<ellipse cx="${cx}" cy="428" rx="11" ry="5" fill="${ap.piel}"/>` +
          `<rect x="${cx - 13}" y="429" width="26" height="4" rx="2" fill="${o}"/>` +
          `<path d="M${cx - 10} 427 L${cx + 10} 419 M${cx - 10} 419 L${cx + 10} 427" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`;
      default: // balerinas
        return `<path d="M${cx - 12} 433 L${cx - 12} 426 Q${cx} 419 ${cx + 12} 426 L${cx + 12} 433 Z" fill="${c}"/>` +
          `<circle cx="${cx}" cy="424" r="2.6" fill="${l}"/>`;
    }
  }

  function cuerpo(pfx, ap) {
    const piel = ap.piel, c2 = ap.ropaColor2;
    const est = estampado(pfx, ap);
    const polera = (fill) => `<path d="M120 284 L200 284 Q210 296 212 312 L212 348 L108 348 L108 312 Q110 296 120 284 Z" fill="${fill}"/>`;

    let piernas = `<rect x="134" y="366" width="16" height="64" rx="7" fill="${piel}"/><rect x="170" y="366" width="16" height="64" rx="7" fill="${piel}"/>`;
    let ropa = '', manga = est.fill;

    switch (ap.ropa) {
      case 'falda':
        ropa = `<path d="M106 342 L214 342 L236 388 Q160 402 84 388 Z" fill="${c2}"/>` + polera(est.fill);
        break;
      case 'pantalon':
        piernas = '';
        ropa = `<path d="M110 342 L210 342 L198 424 L162 424 L160 380 L158 424 L122 424 Z" fill="${c2}"/>` + polera(est.fill);
        break;
      case 'jardinera':
        manga = c2;
        ropa = polera(c2) +
          `<path d="M108 338 L212 338 L214 380 L166 380 L160 364 L154 380 L106 380 Z" fill="${est.fill}"/>` +
          `<rect x="130" y="302" width="60" height="40" rx="4" fill="${est.fill}"/>` +
          `<path d="M134 306 L124 286 M186 306 L196 286" stroke="${ap.ropaColor}" stroke-width="7" stroke-linecap="round"/>` +
          `<circle cx="137" cy="311" r="3" fill="#f7f5f2"/><circle cx="183" cy="311" r="3" fill="#f7f5f2"/>`;
        break;
      default: // vestido
        ropa = `<path d="M122 284 L198 284 Q206 300 210 318 L236 388 Q160 404 84 388 L110 318 Q114 300 122 284 Z" fill="${est.fill}"/>` +
          `<path d="M110 322 Q160 332 210 322" fill="none" stroke="${c2}" stroke-width="7" stroke-linecap="round"/>`;
    }

    const brazos =
      `<path d="M118 298 L102 362 M202 298 L218 362" stroke="${piel}" stroke-width="15" stroke-linecap="round"/>` +
      `<circle cx="101" cy="366" r="9" fill="${piel}"/><circle cx="219" cy="366" r="9" fill="${piel}"/>`;
    const mangas = `<ellipse cx="118" cy="298" rx="15" ry="13" fill="${manga}"/><ellipse cx="202" cy="298" rx="15" ry="13" fill="${manga}"/>`;

    return {
      defs: est.defs,
      svg: piernas + zapato(142, ap) + zapato(178, ap) + ropa + brazos + mangas,
    };
  }

  // ---------- el parche ----------
  // Relleno del parche (siempre un <pattern>, aunque sea liso, para que el
  // parche use siempre url(#…-parche)).
  function parcheEstampado(pfx, ap) {
    const c = ap.parcheColor, d = contraste(c);
    let dibujo = '', w = 14, h = 14;
    switch (ap.parcheEstampado) {
      case 'lunares': dibujo = `<circle cx="4" cy="4" r="2.2" fill="${d}"/><circle cx="11" cy="11" r="2.2" fill="${d}"/>`; break;
      case 'corazones': dibujo = `<path d="M7 11 L3.4 7.4 A2.2 2.2 0 0 1 7 4.8 A2.2 2.2 0 0 1 10.6 7.4 Z" fill="${d}"/>`; break;
      case 'estrellas': dibujo = `<path d="M7 2.5 l1.3 2.8 3 .3 -2.3 2 .7 3 -2.7 -1.6 -2.7 1.6 .7 -3 -2.3 -2 3 -.3z" fill="${d}"/>`; break;
      case 'rayas': dibujo = `<rect width="14" height="5" fill="${d}"/>`; break;
      case 'arcoiris':
        h = 42;
        dibujo = ['#e8605a', '#f0a04b', '#f2cf5b', '#6fbf73', '#7cc4ea', '#9b7fd6']
          .map((col, i) => `<rect y="${i * 7}" width="14" height="7" fill="${col}"/>`).join('');
        break;
    }
    return `<pattern id="${pfx}-parche" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${h}" fill="${c}"/>${dibujo}</pattern>`;
  }

  // Corazón centrado en (x,y), de "radio" k (sirve para el parche y su borde).
  function pathCorazon(x, y, k) {
    const p = (dx, dy) => `${(x + dx * k).toFixed(1)} ${(y + dy * k).toFixed(1)}`;
    return `M${p(0, 1)} C${p(-0.33, 0.73)} ${p(-1.33, 0.2)} ${p(-1.27, -0.4)} C${p(-1.2, -1)} ${p(-0.4, -1.07)} ${p(0, -0.53)} ` +
      `C${p(0.4, -1.07)} ${p(1.2, -1)} ${p(1.27, -0.4)} C${p(1.33, 0.2)} ${p(0.33, 0.73)} ${p(0, 1)} Z`;
  }

  function adorno(tipo, x, y) {
    switch (tipo) {
      case 'estrella':
        return `<path d="M${x} ${y - 10} l3 6.4 7 .7 -5.3 4.7 1.6 6.9 -6.3 -3.7 -6.3 3.7 1.6 -6.9 -5.3 -4.7 7 -.7z" fill="#f6d26b" stroke="#d9a93a" stroke-width="1.2" stroke-linejoin="round"/>`;
      case 'corazon':
        return `<path d="${pathCorazon(x, y, 10)}" fill="#e8578a" stroke="#c23f6f" stroke-width="1.2"/>`;
      case 'flor':
        return flor(x, y, 0.55, '#ffffff');
      case 'carita':
        return `<circle cx="${x}" cy="${y}" r="9.5" fill="#f6d26b" stroke="#d9a93a" stroke-width="1.2"/>` +
          `<circle cx="${x - 3.2}" cy="${y - 2}" r="1.3" fill="#5a4030"/><circle cx="${x + 3.2}" cy="${y - 2}" r="1.3" fill="#5a4030"/>` +
          `<path d="M${x - 4} ${y + 2.5} q4 3.5 8 0" fill="none" stroke="#5a4030" stroke-width="1.4" stroke-linecap="round"/>`;
      default: return '';
    }
  }

  // El parche de un ojo. lado = -1 para el derecho de Mili (a la izquierda de
  // la pantalla, x=112) y +1 para el izquierdo (x=208).
  function parche(ap, pfx, lado) {
    ap = normalizar(ap);
    const x = lado < 0 ? 112 : 208, y = 168, giro = lado < 0 ? -8 : 8;
    const relleno = `url(#${pfx}-parche)`, borde = contraste(ap.parcheColor), tira = oscurecer(ap.parcheColor, 0.12);
    const punteado = `fill="none" stroke="${borde}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".8"`;
    let forma;
    switch (ap.parcheForma) {
      case 'redondo':
        forma = `<circle cx="${x}" cy="${y}" r="32" fill="${relleno}"/><circle cx="${x}" cy="${y}" r="26" ${punteado}/>`;
        break;
      case 'corazon':
        forma = `<path d="${pathCorazon(x, y + 2, 40)}" fill="${relleno}"/><path d="${pathCorazon(x, y + 2, 33)}" ${punteado}/>`;
        break;
      case 'nube':
        forma = `<g fill="${relleno}"><circle cx="${x - 20}" cy="${y + 6}" r="20"/><circle cx="${x + 20}" cy="${y + 6}" r="20"/>` +
          `<circle cx="${x - 6}" cy="${y - 12}" r="22"/><circle cx="${x + 14}" cy="${y - 8}" r="18"/><rect x="${x - 20}" y="${y}" width="40" height="26" rx="10"/></g>`;
        break;
      default:
        forma = `<ellipse cx="${x}" cy="${y}" rx="33" ry="24" transform="rotate(${giro} ${x} ${y})" fill="${relleno}"/>` +
          `<ellipse cx="${x}" cy="${y}" rx="27" ry="18" transform="rotate(${giro} ${x} ${y})" ${punteado}/>`;
    }
    const cinta = lado < 0 ? `M84 150 q-14 -30 6 -58` : `M236 150 q14 -30 -6 -58`;
    return `<path d="${cinta}" fill="none" stroke="${tira}" stroke-width="7" stroke-linecap="round"/>` + forma +
      adorno(ap.parcheAdorno, x - lado * 24, y - 20);
  }

  // Todo menos los ojos (que en la pantalla principal son elementos fijos).
  function figura(ap, pfx) {
    ap = normalizar(ap);
    const cu = cuerpo(pfx, ap);
    return `<defs>${cu.defs}${parcheEstampado(pfx, ap)}</defs>` +
      peloAtras(ap) + cu.svg + cara(ap) + flequillo(ap) + accesorios(ap);
  }

  // Ojos solo decorativos (para la vista previa del editor). Con `ap`, el
  // ojo derecho aparece con el parche puesto, para ver cómo queda.
  function ojos(ap, pfx) {
    return [112, 208].map((x) =>
      `<circle cx="${x}" cy="168" r="27" fill="#fff"/><circle cx="${x}" cy="168" r="13" fill="var(--iris)"/>` +
      `<circle cx="${x}" cy="168" r="5.5" fill="#2a2740"/><circle cx="${x - 5}" cy="163" r="3" fill="#fff"/>`
    ).join('') + (ap ? parche(ap, pfx, -1) : '');
  }

  // Dibuja a Mili dentro de un <svg>: el grupo `grupo` recibe la figura, el
  // svg recibe el color de ojos (--iris) y, si el svg tiene los grupos de
  // parche de la pantalla principal (.eye-patch[data-lado]), se rellenan.
  function dibujar(svg, grupo, ap, pfx) {
    ap = normalizar(ap);
    svg.style.setProperty('--iris', ap.ojos);
    grupo.innerHTML = figura(ap, pfx);
    svg.querySelectorAll('.eye-patch[data-lado]').forEach((g) => {
      g.innerHTML = parche(ap, pfx, Number(g.dataset.lado));
    });
  }

  return {
    DEFAULT, PIELES, OJOS, PELOS, COLORES, PEINADOS, ACCESORIOS, ROPAS, ESTAMPADOS, ZAPATOS,
    PARCHE_COLORES, PARCHE_FORMAS, PARCHE_ESTAMPADOS, PARCHE_ADORNOS,
    normalizar, dibujar, ojos,
    // piezas sueltas que reutiliza el juego de vestir (js/juego.js)
    color: { oscurecer, aclarar, mezclar, contraste },
    piezas: { peloAtras, flequillo, cara, zapato, moño, collet, flor, amarres },
  };
})();
