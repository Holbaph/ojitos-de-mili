// mili.js — el avatar de Mili (cuerpo entero) según su apariencia
// personalizable: piel, ojos, peinado y flequillo, ropa, zapatos, accesorios
// del pelo, gorros y coronas, lentes, joyas y el parche. El dibujo lo hace
// js/vestuario.js (el mismo guardarropa del juego de vestir).
//
// Los ojos NO se dibujan aquí en la pantalla principal: son los grupos fijos
// #eyeDerecho / #eyeIzquierdo de index.html (los que se tocan para registrar
// el parche), que toman su color de la variable --iris del <svg>. Lo que va
// por encima de los ojos (los lentes) se dibuja en .mili-delante.
//
// La apariencia se guarda "plana" (claves de texto) en configuracion.apariencia
// y se valida entera antes de dibujarla.

const Mili = (function () {
  const T = Vestuario.TIPOS;
  const { oscurecer, contraste } = Vestuario.color;

  // ---------- opciones de color ----------
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
    { c: '#b5522b', n: 'Pelirrojo' }, { c: '#8e2c48', n: 'Burdeo' }, { c: '#6a3fa0', n: 'Morado' },
    { c: '#e88fae', n: 'Rosado' }, { c: '#4a78c2', n: 'Azul' }, { c: '#8fd8c4', n: 'Menta' },
  ];
  const COLORES = [
    { c: '#e88fae', n: 'Rosado' }, { c: '#d0487e', n: 'Fucsia' }, { c: '#d9534f', n: 'Rojo' },
    { c: '#f0a04b', n: 'Naranjo' }, { c: '#f2cf5b', n: 'Amarillo' }, { c: '#6fbf73', n: 'Verde' },
    { c: '#8fd8c4', n: 'Menta' }, { c: '#7cc4ea', n: 'Celeste' }, { c: '#4a78c2', n: 'Azul' },
    { c: '#5b7fb0', n: 'Mezclilla' }, { c: '#b392d6', n: 'Lila' }, { c: '#7e57c2', n: 'Morado' },
    { c: '#f7f5f2', n: 'Blanco' }, { c: '#9aa0a6', n: 'Gris' }, { c: '#3a3540', n: 'Negro' },
  ];
  const METALES = [
    { c: '#e2b64a', n: 'Dorado' }, { c: '#c9ced6', n: 'Plateado' }, { c: '#e8b4a0', n: 'Oro rosa' },
  ];
  const JOYAS_COLORES = METALES.concat(COLORES);

  // ---------- opciones de cada lugar (para el editor) ----------
  const EMOJI = {
    vestido: '👗', 'vestido-tutu': '🩰', 'vestido-largo': '✨', 'vestido-princesa': '👑', enterito: '🧷',
    polera: '👕', 'manga-larga': '👚', musculosa: '🎽', top: '🩱', camisa: '👔', sueter: '🧶', poleron: '🧥', blusa: '🌺', 'top-concha': '🐚',
    jeans: '👖', calzas: '🦵', falda: '💃', tutu: '🩰', short: '🩳', jardinera: '👩‍🌾', 'falda-larga': '🌸', bombacho: '🧞', 'cola-sirena': '🧜',
    chaqueta: '🧥', chaleco: '🦺', abrigo: '🧣', capa: '🦸',
    zapatillas: '👟', botas: '👢', 'botas-lluvia': '☔', botines: '🥾', balerinas: '🩰', guillerminas: '👞', sandalias: '🩴', pantuflas: '🐰', patines: '🛼',
    moño: '🎀', collet: '🍩', pinches: '📎', flor: '🌸', cintillo: '〰️', tiara: '👸',
    corona: '👑', 'corona-flores': '💐', 'corona-estrellas': '⭐', 'gorro-lana': '🧶', jockey: '🧢', sombrero: '👒', orejitas: '🐱', unicornio: '🦄',
    lentes: '🕶️', 'lentes-corazon': '💗', 'lentes-estrella': '🌟', 'lentes-redondos': '👓',
    aros: '⭕', perlas: '🤍', corazones: '💕', estrellas: '✨', largos: '💧',
    cadena: '⛓️', corazon: '💖', estrella: '⭐', mostacillas: '🌈',
    reloj: '⌚', 'reloj-digital': '📱', pulsera: '📿', brazaletes: '💫',
    anillo: '💍', 'anillo-gema': '💎', 'anillo-corazon': '💗', 'anillo-flor': '🌼',
  };
  function opciones(slot, nada) {
    const out = Object.keys(T[slot]).map((v) => ({ v, n: (EMOJI[v] ? EMOJI[v] + ' ' : '') + T[slot][v] }));
    return nada ? [{ v: 'ninguno', n: nada }].concat(out) : out;
  }
  // clave de la apariencia -> lugar del vestuario
  const LUGAR = {
    vestido: 'vestido', arriba: 'arriba', abajo: 'abajo', encima: 'encima', zapatos: 'zapatos',
    accesorio: 'cabeza', sombrero: 'sombrero', lentes: 'cara',
    pendientes: 'pendientes', collar: 'collar', muneca: 'muneca', anillo: 'anillo',
  };
  const OPC = {
    vestido: opciones('vestido', '👚 Sin vestido (polera y abajo)'),
    arriba: opciones('arriba'), abajo: opciones('abajo'),
    encima: opciones('encima', 'Nada encima'),
    zapatos: opciones('zapatos', '🦶 Descalza'),
    accesorio: opciones('cabeza', 'Sin accesorio'),
    sombrero: opciones('sombrero', 'Nada en la cabeza'),
    lentes: opciones('cara', 'Sin lentes'),
    pendientes: opciones('pendientes', 'Sin aros'), collar: opciones('collar', 'Sin collar'),
    muneca: opciones('muneca', 'Nada en la muñeca'), anillo: opciones('anillo', 'Sin anillo'),
  };
  const PEINADOS = Vestuario.PEINADOS;
  const FLEQUILLOS = Vestuario.FLEQUILLOS;
  const ESTAMPADOS = [
    { v: 'liso', n: 'Liso' }, { v: 'lunares', n: 'Lunares' }, { v: 'rayas', n: 'Rayas' },
    { v: 'corazones', n: 'Corazones' }, { v: 'estrellas', n: 'Estrellas' }, { v: 'cuadros', n: 'Cuadrille' },
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
    peloEstilo: 'melena', peloColor: '#6b4428', flequillo: 'ondas',
    vestido: 'vestido', vestidoColor: '#e88fae', estampado: 'lunares',
    arriba: 'polera', arribaColor: '#f7f5f2', abajo: 'falda', abajoColor: '#e88fae',
    encima: 'ninguno', encimaColor: '#7cc4ea',
    zapatos: 'balerinas', zapatosColor: '#c96f8f',
    accesorio: 'moño', accesorioColor: '#c96f8f',
    sombrero: 'ninguno', sombreroColor: '#e2b64a',
    lentes: 'ninguno', lentesColor: '#e88fae',
    pendientes: 'ninguno', pendientesColor: '#e2b64a',
    collar: 'ninguno', collarColor: '#e2b64a',
    muneca: 'ninguno', munecaColor: '#e88fae',
    anillo: 'ninguno', anilloColor: '#e8578a',
    parcheForma: 'ovalado', parcheEstampado: 'liso', parcheColor: '#4b3b36', parcheAdorno: 'ninguno',
  };

  // ---------- validación ----------
  // La apariencia viene de la base de datos (compartida) y se mete dentro del
  // SVG: por eso se valida todo — solo colores #rrggbb y opciones conocidas.
  const HEX = Vestuario.HEX;
  const VALIDOS = {
    peloEstilo: PEINADOS, flequillo: FLEQUILLOS, estampado: ESTAMPADOS,
    parcheForma: PARCHE_FORMAS, parcheEstampado: PARCHE_ESTAMPADOS, parcheAdorno: PARCHE_ADORNOS,
  };
  Object.keys(OPC).forEach((k) => { VALIDOS[k] = OPC[k]; });

  // Apariencias guardadas antes de este guardarropa (ropa: vestido/falda/
  // pantalon/jardinera + ropaColor/ropaColor2) se pasan al formato nuevo.
  function migrar(ap) {
    if (!ap || typeof ap !== 'object' || !('ropa' in ap) || ('vestido' in ap)) return ap;
    const m = { ...ap };
    const c1 = ap.ropaColor, c2 = ap.ropaColor2;
    if (ap.ropa === 'vestido') { m.vestido = 'vestido'; m.vestidoColor = c1; }
    else {
      m.vestido = 'ninguno';
      if (ap.ropa === 'falda') { m.arriba = 'polera'; m.arribaColor = c1; m.abajo = 'falda'; m.abajoColor = c2; }
      if (ap.ropa === 'pantalon') { m.arriba = 'polera'; m.arribaColor = c1; m.abajo = 'jeans'; m.abajoColor = c2; }
      if (ap.ropa === 'jardinera') { m.arriba = 'polera'; m.arribaColor = c2; m.abajo = 'jardinera'; m.abajoColor = c1; }
    }
    if (ap.zapatos === 'botitas') m.zapatos = 'botines';
    return m;
  }

  function normalizar(ap) {
    const out = { ...DEFAULT };
    ap = migrar(ap);
    if (!ap || typeof ap !== 'object') return out;
    Object.keys(DEFAULT).forEach((k) => {
      const v = ap[k];
      if (typeof v !== 'string') return;
      if (VALIDOS[k]) { if (VALIDOS[k].some((o) => o.v === v)) out[k] = v; }
      else if (HEX.test(v)) out[k] = v.toLowerCase();
    });
    return out;
  }

  // apariencia plana -> estado de persona del vestuario
  function aPersona(ap) {
    ap = normalizar(ap);
    const st = { ojos: ap.ojos, peloEstilo: ap.peloEstilo, peloColor: ap.peloColor, flequillo: ap.flequillo };
    Object.keys(LUGAR).forEach((k) => { st[LUGAR[k]] = ap[k] === 'ninguno' ? null : { t: ap[k], c: ap[k + 'Color'] }; });
    if (st.vestido) { st.arriba = null; st.abajo = null; }
    return st;
  }

  // ---------- estampado de la prenda principal ----------
  function estampado(pfx, ap) {
    const c = ap.vestido !== 'ninguno' ? ap.vestidoColor : ap.arribaColor, d = contraste(c);
    let dibujo = '';
    switch (ap.estampado) {
      case 'lunares': dibujo = `<circle cx="5" cy="5" r="2.6" fill="${d}"/><circle cx="14" cy="14" r="2.6" fill="${d}"/>`; break;
      case 'rayas': dibujo = `<rect y="0" width="18" height="6" fill="${d}"/>`; break;
      case 'corazones': dibujo = `<path d="M9 13 L4.6 8.6 A2.6 2.6 0 0 1 9 5.6 A2.6 2.6 0 0 1 13.4 8.6 Z" fill="${d}"/>`; break;
      case 'estrellas': dibujo = `<path d="M9 3 l1.7 3.6 3.9 .4 -2.9 2.6 .9 3.8 -3.6 -2 -3.6 2 .9 -3.8 -2.9 -2.6 3.9 -.4z" fill="${d}"/>`; break;
      case 'cuadros': dibujo = `<rect width="9" height="18" fill="${d}" opacity=".45"/><rect width="18" height="9" fill="${d}" opacity=".45"/>`; break;
    }
    if (!dibujo) return { defs: '', relleno: null };
    return {
      defs: `<pattern id="${pfx}-est" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c}"/>${dibujo}</pattern>`,
      relleno: `url(#${pfx}-est)`,
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
        return Vestuario.flor(x, y, 0.55, '#ffffff');
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

  // ---------- dibujo ----------
  function partes(ap, pfx) {
    ap = normalizar(ap);
    const est = estampado(pfx, ap);
    const p = Vestuario.persona(aPersona(ap), { piel: ap.piel, relleno: est.relleno, sinOjos: true });
    return { figura: `<defs>${est.defs}${parcheEstampado(pfx, ap)}</defs>` + p.figura, delante: p.delante };
  }

  // Ojos solo decorativos (para la vista previa del editor). Con `ap`, el
  // ojo derecho aparece con el parche puesto (y encima, los lentes).
  function ojos(ap, pfx) {
    const base = [112, 208].map((x) =>
      `<circle cx="${x}" cy="168" r="27" fill="#fff"/><circle cx="${x}" cy="168" r="13" fill="var(--iris)"/>` +
      `<circle cx="${x}" cy="168" r="5.5" fill="#2a2740"/><circle cx="${x - 5}" cy="163" r="3" fill="#fff"/>`
    ).join('');
    return ap ? base + parche(ap, pfx, -1) + partes(ap, pfx).delante : base;
  }

  // Dibuja a Mili dentro de un <svg>: el grupo `grupo` recibe la figura, el
  // svg recibe el color de ojos (--iris); si el svg tiene los grupos de parche
  // (.eye-patch[data-lado]) y de "delante" (.mili-delante), se rellenan.
  function dibujar(svg, grupo, ap, pfx) {
    ap = normalizar(ap);
    const p = partes(ap, pfx);
    svg.style.setProperty('--iris', ap.ojos);
    grupo.innerHTML = p.figura;
    svg.querySelectorAll('.eye-patch[data-lado]').forEach((g) => {
      g.innerHTML = parche(ap, pfx, Number(g.dataset.lado));
    });
    const delante = svg.querySelector('.mili-delante');
    if (delante) delante.innerHTML = p.delante;
  }

  // Parche para las fotos: 'derecho' | 'izquierdo' | 'ninguno' (con sus <defs>).
  function parcheFoto(ap, pfx, cual) {
    if (cual !== 'derecho' && cual !== 'izquierdo') return '';
    ap = normalizar(ap);
    return `<defs>${parcheEstampado(pfx, ap)}</defs>` + parche(ap, pfx, cual === 'derecho' ? -1 : 1);
  }

  // Mili completa (con ojos) para la cámara: tal cual su avatar, en la pose
  // pedida y con o sin parche. o = { pose, parche }
  function figuraFoto(ap, pfx, o) {
    ap = normalizar(ap);
    const est = estampado(pfx, ap);
    const p = Vestuario.persona(aPersona(ap), {
      piel: ap.piel, relleno: est.relleno, pose: o && o.pose, sobreOjos: parcheFoto(ap, pfx, o && o.parche),
    });
    return (est.defs ? `<defs>${est.defs}</defs>` : '') + p.figura;
  }

  // Para la Mili del juego de vestir: si lleva puesta la prenda principal de
  // su avatar (mismo tipo y color), se le pone también su estampado.
  function estampadoEn(ap, pfx, st) {
    ap = normalizar(ap);
    const lugar = ap.vestido !== 'ninguno' ? 'vestido' : 'arriba';
    const pieza = st[lugar];
    if (!pieza || pieza.t !== ap[lugar] || pieza.c !== ap[lugar + 'Color']) return { defs: '', relleno: null };
    return estampado(pfx, ap);
  }

  return {
    DEFAULT, PIELES, OJOS, PELOS, COLORES, JOYAS_COLORES, PEINADOS, FLEQUILLOS, ESTAMPADOS, OPC,
    PARCHE_COLORES, PARCHE_FORMAS, PARCHE_ESTAMPADOS, PARCHE_ADORNOS,
    normalizar, aPersona, dibujar, ojos, figuraFoto, parcheFoto, estampadoEn,
  };
})();
