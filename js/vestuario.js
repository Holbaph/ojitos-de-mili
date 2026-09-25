// vestuario.js — el "motor" que dibuja a una persona completa: pelo, cara,
// ropa, zapatos, gorros/coronas, joyas y lentes. Lo usan el avatar de Mili
// (js/mili.js) y los personajes del juego de vestir (js/juego.js), así los dos
// comparten el mismo guardarropa.
//
// Coordenadas (viewBox 0 0 320 440): la cabeza es un círculo en (160,176) de
// radio 118; los ojos están en (112,168) y (208,168); el cuerpo va debajo, con
// los pies en x 142 y 178.
//
// Estado de una persona (todo lo de ropa/accesorios es { t: tipo, c: '#rrggbb' } o null):
//   ojos, peloEstilo, peloColor, flequillo,
//   arriba, abajo, vestido, encima, zapatos,
//   cabeza (accesorio del pelo), sombrero (gorros y coronas), cara (lentes),
//   pendientes, collar, muneca (reloj/pulsera), anillo

const Vestuario = (function () {
  // ---------- colores ----------
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function hex(r, g, b) { return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join(''); }
  function mezclar(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
  function oscurecer(c, t) { return mezclar(c, '#000000', t); }
  function aclarar(c, t) { return mezclar(c, '#ffffff', t); }
  function esClaro(c) { const [r, g, b] = rgb(c); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62; }
  function contraste(c) { return esClaro(c) ? oscurecer(c, 0.3) : aclarar(c, 0.7); }

  // ---------- catálogo: qué tipos existen en cada lugar ----------
  const TIPOS = {
    arriba: {
      polera: 'Polera', 'manga-larga': 'Polera manga larga', musculosa: 'Musculosa', top: 'Top', camisa: 'Camisa',
      sueter: 'Suéter', poleron: 'Polerón', blusa: 'Blusa bordada', 'top-concha': 'Top de conchitas',
    },
    abajo: {
      jeans: 'Jeans', calzas: 'Calzas', falda: 'Falda', tutu: 'Tutú', short: 'Short', 'short-botones': 'Short con botones', jardinera: 'Jardinera',
      'falda-larga': 'Falda larga', bombacho: 'Pantalón bombacho', 'cola-sirena': 'Cola de sirena',
    },
    vestido: {
      vestido: 'Vestido', 'vestido-lunares': 'Vestido de lunares', 'vestido-tutu': 'Vestido de ballet', 'vestido-largo': 'Vestido largo',
      'vestido-princesa': 'Vestido de princesa', enterito: 'Enterito',
    },
    encima: { chaqueta: 'Chaqueta', chaleco: 'Chaleco', abrigo: 'Abrigo', ruana: 'Ruana', capa: 'Capa' },
    zapatos: {
      zapatillas: 'Zapatillas', botas: 'Botas', 'botas-lluvia': 'Botas de lluvia', botines: 'Botines',
      balerinas: 'Balerinas', guillerminas: 'Guillerminas', sandalias: 'Sandalias', pantuflas: 'Pantuflas', patines: 'Patines',
    },
    cabeza: { moño: 'Moño', 'moño-lunares': 'Moño de lunares', collet: 'Collet', pinches: 'Pinches', flor: 'Flor', cintillo: 'Cintillo', tiara: 'Tiara' },
    sombrero: {
      corona: 'Corona', 'corona-flores': 'Corona de flores', 'corona-estrellas': 'Corona de estrellas',
      'gorro-lana': 'Gorro de lana', jockey: 'Jockey', sombrero: 'Sombrero', orejitas: 'Orejitas de gato', unicornio: 'Cuerno de unicornio',
    },
    cara: { lentes: 'Lentes de sol', 'lentes-corazon': 'Lentes de corazón', 'lentes-estrella': 'Lentes de estrella', 'lentes-redondos': 'Lentes redondos' },
    pendientes: { aros: 'Aros', perlas: 'Perlitas', corazones: 'Aros de corazón', estrellas: 'Aros de estrella', largos: 'Aros largos' },
    collar: { cadena: 'Cadena', perlas: 'Collar de perlas', corazon: 'Collar de corazón', estrella: 'Collar de estrella', mostacillas: 'Collar de mostacillas', concha: 'Collar de conchita', humita: 'Humita' },
    muneca: { reloj: 'Reloj', 'reloj-digital': 'Reloj inteligente', pulsera: 'Pulsera', brazaletes: 'Brazaletes' },
    anillo: { anillo: 'Anillo', 'anillo-gema': 'Anillo con piedra', 'anillo-corazon': 'Anillo de corazón', 'anillo-flor': 'Anillo de flor' },
  };
  const SLOTS = Object.keys(TIPOS);

  const PEINADOS = [
    { v: 'melena', n: 'Melena' }, { v: 'largo', n: 'Pelo largo' }, { v: 'ondas', n: 'Ondas' }, { v: 'muy-largo', n: 'Larguísimo' },
    { v: 'corto', n: 'Cortito' }, { v: 'pixie', n: 'Muy cortito' }, { v: 'afro', n: 'Afro' }, { v: 'crespo', n: 'Crespo largo' },
    { v: 'colitas', n: 'Dos colitas' }, { v: 'colitas-altas', n: 'Colitas altas' }, { v: 'cola', n: 'Cola al lado' },
    { v: 'cola-alta', n: 'Cola alta' }, { v: 'cola-baja', n: 'Cola larga' }, { v: 'tomate', n: 'Tomate' },
    { v: 'moños-dobles', n: 'Dos moñitos' }, { v: 'trenza', n: 'Trenza' }, { v: 'dos-trenzas', n: 'Dos trenzas' },
  ];
  const FLEQUILLOS = [
    { v: 'ondas', n: 'Ondulado' }, { v: 'recto', n: 'Recto' }, { v: 'lado', n: 'De lado' },
    { v: 'cortina', n: 'Abierto al medio' }, { v: 'sin', n: 'Sin flequillo' },
  ];

  // ---------- validación (lo guardado se mete dentro del SVG) ----------
  const HEX = /^#[0-9a-f]{6}$/i;
  function pieza(slot, v) {
    return v && typeof v === 'object' && typeof v.t === 'string' && Object.prototype.hasOwnProperty.call(TIPOS[slot], v.t) &&
      HEX.test(v.c || '') ? { t: v.t, c: v.c.toLowerCase() } : null;
  }
  function esPeinado(v) { return PEINADOS.some((p) => p.v === v); }
  function esFlequillo(v) { return FLEQUILLOS.some((p) => p.v === v); }

  // ================= PELO =================
  const CASQUETE = 'M35.6 200 A128 128 0 1 1 284.4 200 Z';
  function peloAtras(st) {
    const h = st.peloColor, o = oscurecer(h, 0.18);
    const casquete = `<path d="${CASQUETE}" fill="${h}"/>`;
    switch (st.peloEstilo) {
      case 'melena':
        return `<path d="M30 172 A130 130 0 0 1 290 172 L292 262 Q278 278 256 268 L64 268 Q42 278 28 262 Z" fill="${h}"/>`;
      case 'largo':
        return `<path d="M30 172 A130 130 0 0 1 290 172 L298 306 Q302 342 270 340 Q246 326 232 300 L88 300 Q74 326 50 340 Q18 342 22 306 Z" fill="${h}"/>`;
      case 'ondas':
        return `<path d="M30 172 A130 130 0 0 1 290 172 Q306 210 292 240 Q280 270 298 300 Q312 334 276 344 Q252 330 240 304 L80 304 Q68 330 44 344 Q8 334 22 300 Q40 270 28 240 Q14 210 30 172 Z" fill="${h}"/>` +
          `<path d="M40 230 Q52 262 36 292 M280 230 Q268 262 284 292" fill="none" stroke="${o}" stroke-width="3" opacity=".5"/>`;
      case 'muy-largo':
        return `<path d="M30 172 A130 130 0 0 1 290 172 L300 330 Q308 414 274 438 L46 438 Q12 414 20 330 Z" fill="${h}"/>` +
          `<path d="M36 250 Q30 330 50 420 M284 250 Q290 330 270 420" fill="none" stroke="${o}" stroke-width="3" opacity=".5"/>`;
      case 'pixie':
        return `<path d="M40 188 A122 122 0 1 1 280 188 Q274 168 262 160 L58 160 Q46 168 40 188 Z" fill="${h}"/>`;
      case 'afro': {
        let s = `<circle cx="160" cy="160" r="142" fill="${h}"/>`;
        for (let a = 0; a < 360; a += 24) {
          const r = (a * Math.PI) / 180;
          s += `<circle cx="${(160 + 138 * Math.cos(r)).toFixed(1)}" cy="${(160 + 132 * Math.sin(r)).toFixed(1)}" r="26" fill="${h}"/>`;
        }
        return s;
      }
      case 'crespo': {
        let s = `<path d="M24 190 A136 136 0 0 1 296 190 L296 316 Q160 350 24 316 Z" fill="${h}"/>`;
        for (let a = -25; a <= 205; a += 23) {
          const r = (a * Math.PI) / 180;
          s += `<circle cx="${(160 + 146 * Math.cos(r)).toFixed(1)}" cy="${(196 - 150 * Math.sin(r)).toFixed(1)}" r="30" fill="${h}"/>`;
        }
        [[36, 300], [284, 300], [60, 330], [260, 330]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="28" fill="${h}"/>`; });
        return s;
      }
      case 'colitas':
        return casquete +
          `<ellipse cx="30" cy="200" rx="22" ry="50" transform="rotate(16 30 200)" fill="${h}"/>` +
          `<ellipse cx="290" cy="200" rx="22" ry="50" transform="rotate(-16 290 200)" fill="${h}"/>`;
      case 'colitas-altas':
        return casquete +
          `<path d="M70 70 Q14 40 10 110 Q8 170 36 206 Q30 140 52 100 Z" fill="${h}"/>` +
          `<path d="M250 70 Q306 40 310 110 Q312 170 284 206 Q290 140 268 100 Z" fill="${h}"/>`;
      case 'cola':
        return casquete + `<path d="M250 90 Q318 104 308 196 Q302 240 276 258 Q290 204 274 152 Q264 120 240 106 Z" fill="${h}"/>`;
      case 'cola-alta':
        return casquete + `<path d="M176 52 Q252 18 294 90 Q320 162 290 254 Q282 182 258 132 Q234 92 190 82 Z" fill="${h}"/>`;
      case 'cola-baja':
        return casquete +
          `<path d="M250 196 Q302 236 296 312 Q292 372 270 424 Q256 364 250 304 Q244 252 232 214 Z" fill="${h}"/>` +
          [260, 318, 376].map((y, i) => `<ellipse cx="${277 - i * 3}" cy="${y}" rx="${12 - i * 2}" ry="4" fill="${oscurecer(h, 0.3)}"/>`).join('');
      case 'tomate':
        return casquete + `<circle cx="160" cy="40" r="28" fill="${h}"/>`;
      case 'moños-dobles':
        return casquete + `<circle cx="86" cy="56" r="30" fill="${h}"/><circle cx="234" cy="56" r="30" fill="${h}"/>` +
          `<path d="M70 44 Q86 34 100 48 M218 48 Q234 34 250 44" fill="none" stroke="${o}" stroke-width="3" opacity=".6"/>`;
      default: // corto, trenza, dos-trenzas
        return casquete;
    }
  }

  function trenza(x0, dx, largo, grosor, h) {
    const o = oscurecer(h, 0.2);
    let s = '';
    for (let i = 0; i < largo; i++) {
      const cx = x0 + dx * i, cy = 216 + i * 22, rx = grosor - i * 0.8;
      s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="14" transform="rotate(${i % 2 ? 22 : -22} ${cx} ${cy})" fill="${h}" stroke="${o}" stroke-width="1.2"/>`;
    }
    const fx = x0 + dx * largo, fy = 216 + largo * 22 - 4;
    return s + `<path d="M${fx - 7} ${fy} Q${fx} ${fy + 26} ${fx + 7} ${fy} Z" fill="${h}"/>` +
      `<ellipse cx="${fx}" cy="${fy - 2}" rx="7" ry="4.5" fill="${o}"/>`;
  }
  // lo que cae por delante del cuerpo (las trenzas)
  function peloDelante(st) {
    if (st.peloEstilo === 'trenza') return trenza(274, -3, 7, 18, st.peloColor);
    if (st.peloEstilo === 'dos-trenzas') return trenza(46, 2.5, 6, 15, st.peloColor) + trenza(274, -2.5, 6, 15, st.peloColor);
    return '';
  }

  // dónde se amarra el pelo (para poner ahí el moño / collet / flor)
  function amarres(estilo) {
    switch (estilo) {
      case 'colitas': return [{ x: 44, y: 150, s: 0.7 }, { x: 276, y: 150, s: 0.7 }];
      case 'colitas-altas': return [{ x: 66, y: 78, s: 0.65 }, { x: 254, y: 78, s: 0.65 }];
      case 'cola': return [{ x: 252, y: 98, s: 0.75 }];
      case 'cola-alta': return [{ x: 190, y: 66, s: 0.75 }];
      case 'cola-baja': return [{ x: 250, y: 206, s: 0.6 }];
      case 'tomate': return [{ x: 160, y: 66, s: 0.8 }];
      case 'moños-dobles': return [{ x: 98, y: 82, s: 0.6 }, { x: 222, y: 82, s: 0.6 }];
      case 'trenza': return [{ x: 272, y: 206, s: 0.6 }];
      case 'dos-trenzas': return [{ x: 48, y: 206, s: 0.55 }, { x: 272, y: 206, s: 0.55 }];
      default: return [];
    }
  }

  function flequillo(st) {
    const h = st.peloColor, o = oscurecer(h, 0.25);
    const mechas = `<path d="M160 62 Q150 82 146 100 M120 70 Q106 88 100 104 M200 70 Q214 88 220 104" fill="none" stroke="${o}" stroke-width="2.5" stroke-linecap="round" opacity=".45"/>`;
    switch (st.flequillo) {
      case 'recto':
        return `<path d="M42 152 A121 121 0 0 1 278 152 Q270 124 262 112 Q160 104 58 112 Q50 124 42 152 Z" fill="${h}"/>` +
          `<path d="M100 72 L96 108 M140 64 L138 106 M180 64 L182 106 M220 72 L224 108" stroke="${o}" stroke-width="2" opacity=".35"/>`;
      case 'lado':
        return `<path d="M42 152 A121 121 0 0 1 278 152 Q270 118 250 98 Q180 70 70 128 Q54 136 42 152 Z" fill="${h}"/>` +
          `<path d="M90 110 Q160 76 240 96 M120 90 Q180 70 230 80" fill="none" stroke="${o}" stroke-width="2.5" opacity=".4"/>`;
      case 'cortina':
        return `<path d="M42 152 A121 121 0 0 1 278 152 Q268 116 232 104 Q190 92 162 70 Q130 92 88 104 Q52 116 42 152 Z" fill="${h}"/>` + mechas;
      case 'sin':
        return `<path d="M44 150 A121 121 0 0 1 276 150 Q262 104 214 80 Q160 64 106 80 Q58 104 44 150 Z" fill="${h}"/>`;
      default: // ondas
        return `<path d="M42 152 A121 121 0 0 1 278 152 Q266 118 238 106 Q220 122 196 104 Q176 120 160 102 Q144 120 124 104 Q100 122 82 106 Q54 118 42 152 Z" fill="${h}"/>` + mechas;
    }
  }

  // ================= CARA =================
  // rasgos = { pecas, pestanas, cejas: 'marcadas' } (para parecerse a cada personaje)
  function cara(piel, peloColor, rasgos) {
    rasgos = rasgos || {};
    const linea = oscurecer(piel, 0.12);
    const rubor = mezclar(piel, '#ee6f6f', 0.45);
    const ceja = oscurecer(peloColor, rasgos.cejas === 'marcadas' ? 0.25 : 0.1);
    const gCeja = rasgos.cejas === 'marcadas' ? 7 : 4;
    const pecas = rasgos.pecas
      ? [[82, 204], [92, 198], [100, 208], [88, 214], [106, 200], [238, 204], [228, 198], [220, 208], [232, 214], [214, 200]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${oscurecer(piel, 0.3)}" opacity=".6"/>`).join('')
      : '';
    return `<circle cx="160" cy="176" r="118" fill="${piel}" stroke="${linea}" stroke-width="2"/>` +
      `<ellipse cx="94" cy="212" rx="19" ry="11" fill="${rubor}" opacity="${rasgos.cejas === 'marcadas' ? '.3' : '.55'}"/>` +
      `<ellipse cx="226" cy="212" rx="19" ry="11" fill="${rubor}" opacity="${rasgos.cejas === 'marcadas' ? '.3' : '.55'}"/>` + pecas +
      `<path d="M92 130 q20 -14 40 -2" fill="none" stroke="${ceja}" stroke-width="${gCeja}" stroke-linecap="round" opacity=".75"/>` +
      `<path d="M188 128 q20 -12 40 2" fill="none" stroke="${ceja}" stroke-width="${gCeja}" stroke-linecap="round" opacity=".75"/>` +
      `<path d="M158 168 q-4 20 -10 26 q6 6 14 2" fill="none" stroke="${linea}" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M136 232 q24 22 48 0" fill="none" stroke="#c9607a" stroke-width="6" stroke-linecap="round"/>`;
  }
  function ojos(color, pestanas) {
    return [112, 208].map((x) => {
      const afuera = x < 160 ? -1 : 1;
      const p = pestanas
        ? `<path d="M${x + afuera * 18} ${148} l${afuera * 8} -8 M${x + afuera * 24} ${155} l${afuera * 10} -5 M${x + afuera * 27} ${163} l${afuera * 10} -1" stroke="#2a2740" stroke-width="3" stroke-linecap="round"/>`
        : '';
      return `<circle cx="${x}" cy="168" r="27" fill="#fff"/><circle cx="${x}" cy="168" r="13" fill="${color}"/>` +
        `<circle cx="${x}" cy="168" r="5.5" fill="#2a2740"/><circle cx="${x - 5}" cy="163" r="3" fill="#fff"/>` + p;
    }).join('');
  }

  // ================= PIEZAS CHICAS (reutilizables) =================
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
  function estrella(x, y, r, c, borde) {
    const p = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      p.push((x + rr * Math.cos(a)).toFixed(1) + ',' + (y + rr * Math.sin(a)).toFixed(1));
    }
    return `<polygon points="${p.join(' ')}" fill="${c}"${borde ? ` stroke="${borde}" stroke-width="1.2" stroke-linejoin="round"` : ''}/>`;
  }
  // corazón centrado en (x,y) de "radio" k
  function pathCorazon(x, y, k) {
    const p = (dx, dy) => `${(x + dx * k).toFixed(1)} ${(y + dy * k).toFixed(1)}`;
    return `M${p(0, 1)} C${p(-0.33, 0.73)} ${p(-1.33, 0.2)} ${p(-1.27, -0.4)} C${p(-1.2, -1)} ${p(-0.4, -1.07)} ${p(0, -0.53)} ` +
      `C${p(0.4, -1.07)} ${p(1.2, -1)} ${p(1.27, -0.4)} C${p(1.33, 0.2)} ${p(0.33, 0.73)} ${p(0, 1)} Z`;
  }

  // ================= ACCESORIOS DEL PELO =================
  function cabeza(acc, st) {
    if (!acc) return amarres(st.peloEstilo).map((p) => `<ellipse cx="${p.x}" cy="${p.y}" rx="${9 * p.s}" ry="${6 * p.s}" fill="${oscurecer(st.peloColor, 0.35)}"/>`).join('');
    const c = acc.c, puntos = amarres(st.peloEstilo);
    switch (acc.t) {
      case 'moño': return puntos.length ? puntos.map((p) => moño(p.x, p.y, p.s, c)).join('') : moño(160, 46, 1, c);
      case 'moño-lunares': {
        const conLunares = (x, y, sc) => moño(x, y, sc, c) +
          [[-22, -6], [-14, 8], [-28, 6], [22, -6], [14, 8], [28, 6]].map(([dx, dy]) => `<circle cx="${x + dx * sc}" cy="${y + dy * sc}" r="${3 * sc}" fill="#fff"/>`).join('');
        return puntos.length ? puntos.map((p) => conLunares(p.x, p.y, p.s)).join('') : conLunares(160, 40, 1.35);
      }
      case 'collet':
        if (puntos.length) return puntos.map((p) => collet(p.x, p.y, p.s + 0.2, c)).join('');
        return `<path d="M160 54 Q138 22 148 10 Q157 28 160 30 Q163 28 172 10 Q182 22 160 54 Z" fill="${st.peloColor}"/>` + collet(160, 52, 1, c);
      case 'flor': return puntos.length ? puntos.map((p) => flor(p.x, p.y, p.s, c)).join('') : flor(222, 72, 1, c);
      case 'pinches': {
        const o = oscurecer(c, 0.2);
        return [[76, 104, -30], [92, 90, -24], [244, 104, 30]].map(([x, y, g]) =>
          `<rect x="${x - 14}" y="${y - 4}" width="28" height="8" rx="4" fill="${c}" stroke="${o}" stroke-width="1" transform="rotate(${g} ${x} ${y})"/>`).join('') +
          estrella(244, 104, 7, '#fff');
      }
      case 'cintillo': return `<path d="M42 140 A124 124 0 0 1 278 140" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`;
      case 'tiara':
        return `<path d="M118 76 L126 46 L142 64 L160 34 L178 64 L194 46 L202 76 Q160 66 118 76 Z" fill="${c}" stroke="${oscurecer(c, 0.25)}" stroke-width="1.5"/>` +
          `<circle cx="160" cy="54" r="4.5" fill="#e8578a"/><circle cx="127" cy="60" r="3" fill="#7cc4ea"/><circle cx="193" cy="60" r="3" fill="#7cc4ea"/>`;
      default: return '';
    }
  }

  // ================= GORROS Y CORONAS =================
  function sombrero(s) {
    if (!s) return '';
    const c = s.c, o = oscurecer(c, 0.22), l = aclarar(c, 0.45);
    const arco = (n, fn) => [...Array(n).keys()].map((i) => {
      const a = Math.PI * (1.12 + 0.76 * i / (n - 1));
      return fn(160 + 124 * Math.cos(a), 176 + 124 * Math.sin(a), i);
    }).join('');
    switch (s.t) {
      case 'corona':
        return `<path d="M108 82 L102 30 L132 54 L160 18 L188 54 L218 30 L212 82 Z" fill="${c}" stroke="${o}" stroke-width="2" stroke-linejoin="round"/>` +
          `<rect x="106" y="70" width="108" height="14" rx="4" fill="${o}"/>` +
          `<circle cx="160" cy="77" r="5" fill="#e8578a"/><circle cx="132" cy="77" r="4" fill="#7cc4ea"/><circle cx="188" cy="77" r="4" fill="#6fbf73"/>` +
          `<circle cx="102" cy="30" r="5" fill="${l}"/><circle cx="160" cy="18" r="6" fill="${l}"/><circle cx="218" cy="30" r="5" fill="${l}"/>`;
      case 'corona-flores':
        return arco(9, (x, y, i) => `<ellipse cx="${x.toFixed(1)}" cy="${(y + 10).toFixed(1)}" rx="10" ry="5" fill="#6fbf73" transform="rotate(${i * 20 - 80} ${x.toFixed(1)} ${(y + 10).toFixed(1)})"/>`) +
          arco(8, (x, y, i) => flor(x, y, 0.75, i % 2 ? c : l));
      case 'corona-estrellas':
        return `<path d="M44 132 A124 124 0 0 1 276 132" fill="none" stroke="${o}" stroke-width="5" stroke-linecap="round"/>` +
          arco(7, (x, y, i) => estrella(x, y - 6, i === 3 ? 18 : 12, i % 2 ? l : c, o));
      case 'gorro-lana': {
        let rayas = '';
        for (let x = 60; x <= 260; x += 12) rayas += `M${x} ${x < 160 ? 118 - (x - 60) * 0.26 : 92 + (x - 160) * 0.26} l0 22 `;
        return `<path d="M32 124 Q36 22 160 18 Q284 22 288 124 Z" fill="${c}"/>` +
          `<path d="M92 60 Q160 40 228 60 M70 88 Q160 64 250 88" fill="none" stroke="${l}" stroke-width="6" stroke-linecap="round" opacity=".8"/>` +
          `<path d="M28 118 Q160 86 292 118 L294 142 Q160 112 26 142 Z" fill="${o}"/>` +
          `<path d="${rayas}" stroke="${oscurecer(c, 0.35)}" stroke-width="2" opacity=".5"/>` +
          `<circle cx="160" cy="18" r="22" fill="${l}"/><circle cx="152" cy="12" r="6" fill="#fff" opacity=".5"/>`;
      }
      case 'jockey':
        return `<path d="M44 124 Q48 30 160 26 Q272 30 276 124 Z" fill="${c}"/>` +
          `<path d="M160 28 L160 120 M100 40 Q118 80 112 122 M220 40 Q202 80 208 122" fill="none" stroke="${o}" stroke-width="2" opacity=".6"/>` +
          `<circle cx="160" cy="30" r="6" fill="${o}"/>` +
          `<circle cx="160" cy="84" r="16" fill="${l}"/>` + estrella(160, 85, 10, c) +
          `<path d="M60 118 Q160 96 260 118 Q254 140 160 136 Q66 140 60 118 Z" fill="${o}"/>`;
      case 'sombrero':
        return `<ellipse cx="160" cy="92" rx="152" ry="26" fill="${c}" stroke="${o}" stroke-width="2"/>` +
          `<path d="M94 92 Q96 24 160 22 Q224 24 226 92 Z" fill="${c}" stroke="${o}" stroke-width="2"/>` +
          `<path d="M96 78 Q160 90 224 78 L225 90 Q160 102 95 90 Z" fill="${contraste(c)}"/>` + flor(206, 82, 0.7, '#e8578a');
      case 'orejitas':
        return `<path d="M44 132 A124 124 0 0 1 276 132" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>` +
          `<path d="M70 86 L78 18 L128 60 Z" fill="${c}"/><path d="M84 70 L88 38 L114 60 Z" fill="#f4a9c0"/>` +
          `<path d="M250 86 L242 18 L192 60 Z" fill="${c}"/><path d="M236 70 L232 38 L206 60 Z" fill="#f4a9c0"/>`;
      case 'unicornio':
        return `<path d="M44 132 A124 124 0 0 1 276 132" fill="none" stroke="${l}" stroke-width="9" stroke-linecap="round"/>` +
          `<path d="M144 62 L160 -8 L176 62 Z" fill="#f6d26b" stroke="#d9a93a" stroke-width="1.5"/>` +
          `<path d="M148 46 L172 38 M151 30 L169 24 M154 14 L166 10" stroke="#d9a93a" stroke-width="2"/>` +
          `<path d="M104 70 Q100 40 118 30 Q128 52 122 72 Z M216 70 Q220 40 202 30 Q192 52 198 72 Z" fill="${c}"/>` +
          flor(124, 76, 0.55, '#f4a9c0') + flor(196, 76, 0.55, '#b392d6');
      default: return '';
    }
  }

  // ================= LENTES =================
  function lentes(acc) {
    if (!acc) return '';
    const c = acc.c, o = oscurecer(c, 0.3);
    const patillas = `<path d="M82 158 L46 148 M238 158 L274 148" stroke="${o}" stroke-width="4" stroke-linecap="round"/>`;
    const puente = `<path d="M143 164 Q160 154 177 164" fill="none" stroke="${o}" stroke-width="4"/>`;
    switch (acc.t) {
      case 'lentes-redondos':
        return patillas +
          `<circle cx="112" cy="168" r="31" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="5"/>` +
          `<circle cx="208" cy="168" r="31" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="5"/>` +
          `<path d="M143 164 Q160 154 177 164" fill="none" stroke="${c}" stroke-width="5"/>`;
      case 'lentes-corazon': {
        const cor = (x, y) => `<path d="M${x} ${y + 18} L${x - 24} ${y - 4} A12 12 0 0 1 ${x} ${y - 14} A12 12 0 0 1 ${x + 24} ${y - 4} Z" fill="${c}" opacity=".92" stroke="${o}" stroke-width="2.5" stroke-linejoin="round"/>`;
        return patillas + cor(112, 168) + cor(208, 168) + `<path d="M136 160 Q160 152 184 160" fill="none" stroke="${o}" stroke-width="4"/>`;
      }
      case 'lentes-estrella':
        return patillas + estrella(112, 170, 36, c, o).replace('/>', ' opacity=".92"/>') + estrella(208, 170, 36, c, o).replace('/>', ' opacity=".92"/>') + puente;
      default:
        return patillas +
          `<rect x="80" y="146" width="64" height="44" rx="18" fill="${c}" opacity=".94" stroke="${o}" stroke-width="3"/>` +
          `<rect x="176" y="146" width="64" height="44" rx="18" fill="${c}" opacity=".94" stroke="${o}" stroke-width="3"/>` +
          `<path d="M144 160 Q160 152 176 160" fill="none" stroke="${o}" stroke-width="4"/>` +
          `<path d="M92 156 L104 152 M188 156 L200 152" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
    }
  }

  // ================= JOYAS =================
  function pendientes(p) {
    if (!p) return '';
    const c = p.c, o = oscurecer(c, 0.25);
    return [[54, 1], [266, -1]].map(([x]) => {
      switch (p.t) {
        case 'perlas': return `<circle cx="${x}" cy="232" r="7" fill="#fbf6ee" stroke="${c}" stroke-width="2"/><circle cx="${x - 2}" cy="230" r="2" fill="#fff"/>`;
        case 'corazones': return `<path d="M${x} 226 L${x} 232" stroke="${o}" stroke-width="2"/><path d="${pathCorazon(x, 240, 9)}" fill="${c}" stroke="${o}" stroke-width="1"/>`;
        case 'estrellas': return `<path d="M${x} 226 L${x} 232" stroke="${o}" stroke-width="2"/>` + estrella(x, 241, 10, c, o);
        case 'largos': return `<path d="M${x} 226 L${x} 252" stroke="${o}" stroke-width="2"/><ellipse cx="${x}" cy="258" rx="6" ry="9" fill="${c}" stroke="${o}" stroke-width="1"/><circle cx="${x}" cy="232" r="3" fill="${c}"/>`;
        default: return `<circle cx="${x}" cy="240" r="10" fill="none" stroke="${c}" stroke-width="3.5"/>`;
      }
    }).join('');
  }

  function collar(p) {
    if (!p) return '';
    const c = p.c, o = oscurecer(c, 0.25);
    // curva bajo la barbilla: de (124,288) a (196,288) colgando hasta ~y 316
    const punto = (t) => [(1 - t) * (1 - t) * 124 + 2 * t * (1 - t) * 160 + t * t * 196, (1 - t) * (1 - t) * 288 + 2 * t * (1 - t) * 344 + t * t * 288];
    const cuentas = (n, r, color) => [...Array(n + 1).keys()].map((i) => { const [x, y] = punto(i / n); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${typeof color === 'function' ? color(i) : color}"/>`; }).join('');
    const cadena = `<path d="M124 288 Q160 344 196 288" fill="none" stroke="${c}" stroke-width="2.6"/>`;
    switch (p.t) {
      case 'perlas': return cuentas(12, 4.4, '#fbf6ee') + cuentas(12, 1.5, '#fff');
      case 'corazon': return cadena + `<path d="${pathCorazon(160, 326, 10)}" fill="${c}" stroke="${o}" stroke-width="1.2"/>`;
      case 'estrella': return cadena + estrella(160, 326, 12, c, o);
      case 'concha':
        return `<path d="M124 288 Q160 344 196 288" fill="none" stroke="#6b4428" stroke-width="2.4"/>` +
          `<circle cx="160" cy="326" r="11" fill="#3fb8b0" stroke="#1f7a74" stroke-width="1.5"/>` +
          `<path d="M160 326 m0 -6 a6 6 0 1 1 -6 6 a4 4 0 1 1 4 -4" fill="none" stroke="#e8fbf8" stroke-width="1.6"/>`;
      case 'humita':
        return `<path d="M160 306 L136 294 L136 318 Z M160 306 L184 294 L184 318 Z" fill="${c}" stroke="${o}" stroke-width="1.5" stroke-linejoin="round"/>` +
          `<rect x="153" y="299" width="14" height="14" rx="4" fill="${o}"/>`;
      case 'mostacillas': {
        const cols = ['#e8605a', '#f2cf5b', '#6fbf73', '#7cc4ea', '#b392d6', c];
        return cuentas(14, 3.6, (i) => cols[i % cols.length]);
      }
      default: return cadena + cuentas(16, 1.4, o);
    }
  }

  // muñeca y mano de cada brazo según la pose
  // (un brazo es [hombro, (codo), mano]; lo que cuenta para la muñeca es el último tramo)
  function puntosBrazo(pose, lado) {
    const pts = pose[lado];
    const [sx, sy] = pts[pts.length - 2], [hx, hy] = pts[pts.length - 1];
    const dx = hx - sx, dy = hy - sy, largo = Math.hypot(dx, dy);
    return {
      muneca: [sx + dx * 0.86, sy + dy * 0.86], mano: [hx, hy],
      giro: -Math.atan2(dx, dy) * 180 / Math.PI, // para que la banda quede cruzada al brazo
      u: [dx / largo, dy / largo], perp: [dy / largo, -dx / largo],
    };
  }
  const f1 = (n) => n.toFixed(1);

  // reloj en la muñeca izquierda de la pantalla; pulseras en la derecha
  function muneca(p, pose) {
    if (!p) return { izq: '', der: '' };
    const c = p.c, o = oscurecer(c, 0.25);
    const L = puntosBrazo(pose, 'izq'), R = puntosBrazo(pose, 'der');
    const [lx, ly] = L.muneca, [rx, ry] = R.muneca;
    const banda = `<rect x="${f1(lx - 10)}" y="${f1(ly - 4.5)}" width="20" height="9" rx="3" fill="${c}" transform="rotate(${f1(L.giro)} ${f1(lx)} ${f1(ly)})"/>`;
    switch (p.t) {
      case 'reloj':
        return { izq: banda + `<circle cx="${f1(lx)}" cy="${f1(ly)}" r="6.5" fill="#fff" stroke="${o}" stroke-width="2"/><path d="M${f1(lx)} ${f1(ly)} l0 -4 M${f1(lx)} ${f1(ly)} l3 1" stroke="#2a2740" stroke-width="1.2"/>`, der: '' };
      case 'reloj-digital':
        return { izq: banda + `<rect x="${f1(lx - 7)}" y="${f1(ly - 6)}" width="14" height="12" rx="3" fill="#2a2740" transform="rotate(${f1(L.giro)} ${f1(lx)} ${f1(ly)})"/><rect x="${f1(lx - 4.5)}" y="${f1(ly - 3.5)}" width="9" height="7" rx="1.5" fill="${aclarar(c, 0.3)}" transform="rotate(${f1(L.giro)} ${f1(lx)} ${f1(ly)})"/>`, der: '' };
      case 'brazaletes':
        return { izq: '', der: [0, 1, 2].map((i) => { const x = rx - R.u[0] * i * 5, y = ry - R.u[1] * i * 5; return `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="10" ry="3.2" fill="none" stroke="${i === 1 ? aclarar(c, 0.3) : c}" stroke-width="2.6" transform="rotate(${f1(R.giro)} ${f1(x)} ${f1(y)})"/>`; }).join('') };
      default: // pulsera de cuentas
        return { izq: '', der: [...Array(6).keys()].map((i) => { const k = (i - 2.5) * 3.8; return `<circle cx="${f1(rx + R.perp[0] * k)}" cy="${f1(ry + R.perp[1] * k)}" r="2.8" fill="${i % 2 ? c : aclarar(c, 0.45)}"/>`; }).join('') };
    }
  }

  function anillo(p, pose) {
    if (!p) return '';
    const c = p.c, [x, y] = puntosBrazo(pose, 'der').mano;
    const aro = `<rect x="${f1(x - 6.5)}" y="${f1(y - 1)}" width="13" height="4" rx="2" fill="#e2b64a"/>`;
    switch (p.t) {
      case 'anillo-gema': return aro + `<circle cx="${f1(x)}" cy="${f1(y - 2)}" r="3.6" fill="${c}" stroke="#fff" stroke-width="1"/>`;
      case 'anillo-corazon': return aro + `<path d="${pathCorazon(x, y - 2, 4)}" fill="${c}"/>`;
      case 'anillo-flor': return aro + flor(x, y - 3, 0.3, c);
      default: return `<rect x="${f1(x - 6.5)}" y="${f1(y - 1)}" width="13" height="4" rx="2" fill="${c}"/>`;
    }
  }

  // ================= POSES =================
  // Hombro -> (codo) -> mano de cada brazo (izq = a la izquierda de la
  // pantalla). Los brazos levantados salen hacia el lado con el codo doblado,
  // para que no queden pegados a la cara.
  const POSES = {
    normal: { izq: [[118, 298], [102, 362]], der: [[202, 298], [218, 362]] },
    saludo: { izq: [[118, 298], [102, 362]], der: [[202, 298], [264, 304], [296, 236]] },
    abrazo: { izq: [[118, 298], [44, 306]], der: [[202, 298], [276, 306]] },
    victoria: { izq: [[118, 298], [102, 362]], der: [[202, 298], [262, 306], [290, 246]] },
    corazon: { izq: [[118, 298], [146, 316]], der: [[202, 298], [174, 316]] },
    hurra: { izq: [[118, 298], [56, 304], [24, 236]], der: [[202, 298], [264, 304], [296, 236]] },
  };
  const NOMBRES_POSES = [
    { v: 'normal', n: '🙂 Normal' }, { v: 'saludo', n: '👋 Saludo' }, { v: 'abrazo', n: '👐 Brazos abiertos' },
    { v: 'victoria', n: '✌️ La V' }, { v: 'corazon', n: '💗 Corazón' }, { v: 'hurra', n: '🙌 ¡Hurra!' },
  ];

  // Una manga ({ tipo, c }) sobre el brazo de un lado.
  function manga(m, lado, pose) {
    if (!m) return '';
    const pts = pose[lado];
    const [sx, sy] = pts[0];
    const afuera = lado === 'izq' ? -1 : 1;
    if (m.tipo === 'corta') return `<ellipse cx="${sx}" cy="${sy}" rx="15" ry="13" fill="${m.c}"/>`;
    if (m.tipo === 'globo') return `<ellipse cx="${sx + afuera * 2}" cy="${sy}" rx="20" ry="16" fill="${m.c}"/>`;
    // manga larga: por todo el brazo, hasta un poco antes de la mano
    const [ax, ay] = pts[pts.length - 2], [hx, hy] = pts[pts.length - 1];
    const ex = ax + (hx - ax) * 0.875, ey = ay + (hy - ay) * 0.875;
    const medio = pts.slice(1, -1).map(([x, y]) => ` L${x} ${y}`).join('');
    const op = m.tipo === 'velo' ? ' opacity=".75"' : '';
    return `<g${op}><path d="M${sx} ${sy}${medio} L${f1(ex)} ${f1(ey)}" fill="none" stroke="${m.c}" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${sx}" cy="${sy}" rx="14" ry="12" fill="${m.c}"/></g>`;
  }

  // ================= ROPA =================
  const TORSO = 'M120 284 L200 284 Q210 296 212 312 L212 350 L108 350 L108 312 Q110 296 120 284 Z';
  // piernas del pantalón centradas sobre los pies (x 142 y 178)
  const PANTALON = 'M110 342 L210 342 L198 424 L162 424 L160 380 L158 424 L122 424 Z';
  const PANTALONES = ['jeans', 'calzas', 'bombacho'];
  const BOTAS = ['botas', 'botas-lluvia'];

  function mangas(tipo, c) { return { tipo, c }; }

  // Cada prenda devuelve { svg, manga, atras?, sobre? }. `relleno` (opcional)
  // reemplaza el color de la parte principal (para los estampados de Mili).
  function prenda(cat, p, relleno) {
    const c = p.c, f = relleno || c, o = oscurecer(c, 0.18), d = contraste(c);
    switch (cat + ':' + p.t) {
      // ---------- arriba ----------
      case 'arriba:polera':
        return {
          svg: `<path d="${TORSO}" fill="${f}"/>` + (relleno ? '' : `<path d="M160 306 l4 8.5 9.5 1 -7 6.5 2 9.5 -8.5 -5 -8.5 5 2 -9.5 -7 -6.5 9.5 -1z" fill="${d}"/>`),
          manga: mangas('corta', f),
        };
      case 'arriba:manga-larga':
        return { svg: `<path d="${TORSO}" fill="${f}"/><path d="M110 344 L210 344" stroke="${o}" stroke-width="4"/>`, manga: mangas('larga', f) };
      case 'arriba:musculosa':
        return {
          svg: `<path d="M128 290 L192 290 Q206 304 208 318 L208 350 L112 350 L112 318 Q114 304 128 290 Z" fill="${f}"/>` +
            `<path d="M132 292 L128 282 M188 292 L192 282" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
          manga: '',
        };
      case 'arriba:top':
        return {
          svg: `<path d="M122 290 L198 290 Q206 302 208 314 L208 326 L112 326 L112 314 Q114 302 122 290 Z" fill="${f}"/>` +
            `<path d="M126 292 L122 282 M194 292 L198 282" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
          manga: '',
        };
      case 'arriba:camisa':
        return {
          svg: `<path d="${TORSO}" fill="${f}"/>` +
            `<path d="M160 292 L160 350" stroke="${o}" stroke-width="2"/>` +
            [306, 320, 334].map((y) => `<circle cx="164" cy="${y}" r="2.4" fill="${d}"/>`).join('') +
            `<path d="M136 288 L160 296 L148 308 Z M184 288 L160 296 L172 308 Z" fill="${aclarar(c, 0.55)}" stroke="${o}" stroke-width="1"/>`,
          manga: mangas('larga', f),
        };
      case 'arriba:sueter':
        return {
          svg: `<path d="${TORSO}" fill="${f}"/>` +
            `<path d="M110 326 L210 326" stroke="${aclarar(c, 0.45)}" stroke-width="6"/>` +
            `<path d="${pathCorazon(160, 308, 9)}" fill="${d}"/>` +
            `<rect x="108" y="344" width="104" height="7" rx="2" fill="${o}"/>`,
          manga: mangas('larga', f),
        };
      case 'arriba:poleron':
        return {
          svg: `<path d="M116 284 L204 284 Q214 296 216 314 L216 356 L104 356 L104 314 Q106 296 116 284 Z" fill="${f}"/>` +
            `<path d="M134 334 L186 334 L190 352 L130 352 Z" fill="${o}"/>` +
            `<path d="M150 292 L148 316 M170 292 L172 316" stroke="${d}" stroke-width="2.5" stroke-linecap="round"/>`,
          manga: mangas('larga', f),
        };
      case 'arriba:blusa': {
        const flores = [[136, 296, '#e8578a'], [148, 304, '#f2cf5b'], [160, 298, '#3fb8b0'], [172, 304, '#f2cf5b'], [184, 296, '#e8578a']]
          .map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${col}"/><circle cx="${x}" cy="${y}" r="1.3" fill="#fff"/>`).join('');
        return { svg: `<path d="${TORSO}" fill="${f}"/>` + flores, manga: mangas('globo', f) };
      }
      case 'arriba:top-concha': {
        const concha = (x, g) => `<path d="M${x - 15} 306 Q${x} 288 ${x + 15} 306 Q${x + 12} 320 ${x} 320 Q${x - 12} 320 ${x - 15} 306 Z" fill="${c}" transform="rotate(${g} ${x} 306)"/>` +
          `<path d="M${x} 294 L${x} 318 M${x - 8} 297 L${x - 5} 318 M${x + 8} 297 L${x + 5} 318" stroke="${o}" stroke-width="1.4" transform="rotate(${g} ${x} 306)"/>`;
        return { svg: `<path d="M140 296 L124 284 M180 296 L196 284" stroke="${c}" stroke-width="4" stroke-linecap="round"/>` + concha(143, -8) + concha(177, 8), manga: '' };
      }
      // ---------- abajo ----------
      case 'abajo:jeans':
        return {
          svg: `<path d="${PANTALON}" fill="${c}"/>` +
            `<path d="M160 344 L160 378 M116 352 Q128 358 140 352 M180 352 Q192 358 204 352 M123 416 L157 416 M163 416 L197 416" fill="none" stroke="${aclarar(c, 0.35)}" stroke-width="1.6" stroke-dasharray="3 3"/>`,
        };
      case 'abajo:calzas':
        return { svg: `<path d="M112 342 L208 342 L196 426 L165 426 L160 382 L155 426 L124 426 Z" fill="${c}"/><path d="M112 347 L208 347" stroke="${o}" stroke-width="4"/>` };
      case 'abajo:bombacho':
        return {
          svg: `<path d="M108 342 L212 342 Q230 384 204 414 L198 426 L164 426 L160 382 L156 426 L122 426 L116 414 Q90 384 108 342 Z" fill="${c}"/>` +
            `<rect x="121" y="416" width="38" height="10" rx="4" fill="${o}"/><rect x="161" y="416" width="38" height="10" rx="4" fill="${o}"/>` +
            `<path d="M108 348 L212 348" stroke="${o}" stroke-width="6"/>`,
        };
      case 'abajo:cola-sirena': {
        const escamas = [];
        for (let y = 356; y <= 404; y += 12) {
          for (let x = 122 + ((y / 12) % 2) * 8; x <= 198; x += 16) escamas.push(`M${x - 7} ${y} Q${x} ${y + 8} ${x + 7} ${y}`);
        }
        return {
          svg: `<path d="M112 342 L208 342 Q216 382 194 410 L184 420 Q214 424 230 446 Q196 440 160 430 Q124 440 90 446 Q106 424 136 420 L126 410 Q104 382 112 342 Z" fill="${c}"/>` +
            `<path d="${escamas.join(' ')}" fill="none" stroke="${aclarar(c, 0.4)}" stroke-width="1.6" opacity=".8"/>` +
            `<path d="M136 420 Q160 426 184 420" fill="none" stroke="${o}" stroke-width="3"/>`,
        };
      }
      case 'abajo:falda':
        return { svg: `<path d="M106 342 L214 342 L236 388 Q160 402 84 388 Z" fill="${c}"/><path d="M106 346 L214 346" stroke="${o}" stroke-width="5"/>` };
      case 'abajo:tutu':
        return {
          svg: `<ellipse cx="160" cy="364" rx="78" ry="22" fill="${c}" opacity=".75"/><ellipse cx="160" cy="358" rx="70" ry="18" fill="${aclarar(c, 0.3)}" opacity=".85"/>` +
            `<ellipse cx="160" cy="352" rx="60" ry="12" fill="${c}"/><rect x="108" y="340" width="104" height="9" rx="4" fill="${o}"/>`,
        };
      case 'abajo:short-botones':
        return {
          svg: `<path d="M108 340 L212 340 L214 378 L166 378 L160 362 L154 378 L106 378 Z" fill="${c}"/>` +
            `<ellipse cx="138" cy="352" rx="7" ry="9" fill="#fff"/><ellipse cx="182" cy="352" rx="7" ry="9" fill="#fff"/>`,
        };
      case 'abajo:short':
        return { svg: `<path d="M108 340 L212 340 L214 378 L166 378 L160 362 L154 378 L106 378 Z" fill="${c}"/>` };
      case 'abajo:jardinera':
        return {
          svg: `<path d="M108 338 L212 338 L214 380 L166 380 L160 364 L154 380 L106 380 Z" fill="${c}"/>`,
          sobre: `<rect x="130" y="302" width="60" height="40" rx="4" fill="${c}"/>` +
            `<path d="M134 306 L124 286 M186 306 L196 286" stroke="${c}" stroke-width="7" stroke-linecap="round"/>` +
            `<rect x="146" y="314" width="28" height="16" rx="3" fill="${o}"/>` +
            `<circle cx="137" cy="311" r="3" fill="#f7f5f2"/><circle cx="183" cy="311" r="3" fill="#f7f5f2"/>`,
        };
      case 'abajo:falda-larga':
        return {
          svg: `<path d="M106 342 L214 342 L230 416 Q160 428 90 416 Z" fill="${c}"/>` +
            `<path d="M96 396 Q160 408 224 396" fill="none" stroke="${d}" stroke-width="6"/>` +
            `<path d="M94 406 Q160 418 226 406" fill="none" stroke="${o}" stroke-width="3" stroke-dasharray="6 5"/>`,
        };
      // ---------- vestidos ----------
      case 'vestido:vestido-lunares': {
        const id = 'lun' + c.slice(1);
        return {
          svg: `<defs><pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${c}"/><circle cx="6" cy="6" r="3.6" fill="#fff"/><circle cx="17" cy="17" r="3.6" fill="#fff"/></pattern></defs>` +
            `<path d="M122 284 L198 284 Q206 300 210 318 L236 388 Q160 404 84 388 L110 318 Q114 300 122 284 Z" fill="url(#${id})"/>`,
          manga: mangas('globo', c),
        };
      }
      case 'vestido:vestido':
        return {
          svg: `<path d="M122 284 L198 284 Q206 300 210 318 L236 388 Q160 404 84 388 L110 318 Q114 300 122 284 Z" fill="${f}"/>` +
            `<path d="M110 322 Q160 332 210 322" fill="none" stroke="${esClaro(c) && !relleno ? d : '#f7f5f2'}" stroke-width="7" stroke-linecap="round"/>`,
          manga: mangas('corta', f),
        };
      case 'vestido:vestido-tutu':
        return {
          svg: `<ellipse cx="160" cy="352" rx="84" ry="26" fill="${c}" opacity=".7"/><ellipse cx="160" cy="344" rx="76" ry="20" fill="${aclarar(c, 0.35)}" opacity=".85"/>` +
            `<path d="M124 290 L196 290 Q204 304 206 318 L206 338 L114 338 L114 318 Q116 304 124 290 Z" fill="${f}"/>` +
            `<path d="M128 292 L124 282 M192 292 L196 282" stroke="${c}" stroke-width="5" stroke-linecap="round"/>` +
            `<ellipse cx="160" cy="338" rx="60" ry="10" fill="${c}"/>`,
          manga: '',
        };
      case 'vestido:vestido-largo': {
        const brillos = [[132, 350], [184, 364], [150, 394], [206, 402], [114, 408], [170, 414], [196, 336]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity=".85"/>`).join('');
        return {
          svg: `<path d="M122 284 L198 284 Q206 300 208 318 L240 418 Q160 430 80 418 L112 318 Q114 300 122 284 Z" fill="${f}"/>` +
            `<path d="M120 300 L200 300" stroke="${aclarar(c, 0.5)}" stroke-width="3" opacity=".7"/>` + (relleno ? '' : brillos),
          manga: mangas('velo', aclarar(c, 0.35)),
        };
      }
      case 'vestido:vestido-princesa':
        return {
          svg: `<path d="M112 322 L208 322 Q252 360 248 404 Q160 420 72 404 Q68 360 112 322 Z" fill="${f}"/>` +
            `<path d="M96 380 Q160 394 224 380" fill="none" stroke="${o}" stroke-width="3" opacity=".6"/>` +
            `<path d="M124 284 L196 284 L204 326 L116 326 Z" fill="${o}"/>` +
            `<path d="M140 296 L180 296 M142 306 L178 306 M144 316 L176 316" stroke="${aclarar(c, 0.6)}" stroke-width="2"/>`,
          manga: mangas('globo', c),
        };
      case 'vestido:enterito':
        return {
          svg: `<path d="${PANTALON}" fill="${f}"/><path d="${TORSO}" fill="${f}"/>` +
            `<rect x="108" y="336" width="104" height="8" rx="3" fill="${d}"/><circle cx="160" cy="340" r="4" fill="${o}"/>`,
          manga: mangas('corta', f),
        };
      // ---------- encima ----------
      case 'encima:chaqueta':
        return {
          svg: `<path d="M116 286 L148 290 L144 358 L104 358 L104 314 Q106 298 116 286 Z" fill="${c}"/>` +
            `<path d="M204 286 L172 290 L176 358 L216 358 L216 314 Q214 298 204 286 Z" fill="${c}"/>` +
            `<path d="M130 288 L148 290 L138 312 Z M190 288 L172 290 L182 312 Z" fill="${o}"/>` +
            `<circle cx="206" cy="330" r="2.6" fill="${d}"/>`,
          manga: mangas('larga', c),
        };
      case 'encima:chaleco':
        return {
          svg: `<path d="M118 286 L148 290 L144 352 L108 352 L108 314 Q110 298 118 286 Z" fill="${c}"/>` +
            `<path d="M202 286 L172 290 L176 352 L212 352 L212 314 Q210 298 202 286 Z" fill="${c}"/>` +
            `<path d="M114 330 L140 330 M180 330 L206 330" stroke="${o}" stroke-width="2" stroke-dasharray="3 3"/>`,
          manga: '',
        };
      case 'encima:abrigo':
        return {
          svg: `<path d="M116 286 L152 290 L150 404 L98 404 L100 314 Q104 298 116 286 Z" fill="${c}"/>` +
            `<path d="M204 286 L168 290 L170 404 L222 404 L220 314 Q216 298 204 286 Z" fill="${c}"/>` +
            `<path d="M128 288 L152 290 L140 316 Z M192 288 L168 290 L180 316 Z" fill="${o}"/>` +
            [320, 346, 372].map((y) => `<circle cx="142" cy="${y}" r="3.2" fill="${d}"/><circle cx="178" cy="${y}" r="3.2" fill="${d}"/>`).join('') +
            `<path d="M100 346 L150 346 M170 346 L220 346" stroke="${o}" stroke-width="5"/>`,
          manga: mangas('larga', c),
        };
      case 'encima:ruana': {
        // la ruana (poncho) de los Madrigal: con franjas y flecos
        const franja = contraste(c);
        return {
          svg: `<path d="M110 292 Q160 280 210 292 L238 364 L82 364 Z" fill="${c}"/>` +
            `<path d="M100 330 L220 330 M94 346 L226 346" stroke="${franja}" stroke-width="5" opacity=".8"/>` +
            `<path d="${[...Array(14).keys()].map((i) => `M${88 + i * 11} 364 l0 10`).join(' ')}" stroke="${o}" stroke-width="3" stroke-linecap="round"/>` +
            `<path d="M146 290 L160 306 L174 290" fill="none" stroke="${o}" stroke-width="3"/>`,
          manga: '',
        };
      }
      case 'encima:capa':
        return { atras: `<path d="M118 288 L202 288 L252 432 Q160 444 68 432 Z" fill="${c}" opacity=".88"/>`, svg: '' };
      default:
        return { svg: '' };
    }
  }

  // ================= ZAPATOS =================
  function unZapato(cx, z, piel) {
    const c = z.c, o = oscurecer(c, 0.25), l = aclarar(c, 0.45);
    switch (z.t) {
      case 'zapatillas':
        return `<path d="M${cx - 14} 432 L${cx - 14} 421 Q${cx - 14} 411 ${cx} 411 Q${cx + 14} 411 ${cx + 14} 421 L${cx + 14} 432 Z" fill="${c}"/>` +
          `<rect x="${cx - 15}" y="428" width="30" height="5" rx="2.5" fill="#f7f5f2" stroke="${o}" stroke-width=".8"/>` +
          `<path d="M${cx - 5} 417 L${cx + 5} 417 M${cx - 5} 421.5 L${cx + 5} 421.5" stroke="#f7f5f2" stroke-width="1.8" stroke-linecap="round"/>`;
      case 'botines':
        return `<path d="M${cx - 12} 392 L${cx + 12} 392 L${cx + 13} 424 Q${cx + 14} 433 ${cx + 7} 433 L${cx - 7} 433 Q${cx - 14} 433 ${cx - 13} 424 Z" fill="${c}"/>` +
          `<rect x="${cx - 13.5}" y="389" width="27" height="8" rx="3.5" fill="${l}"/>` +
          `<rect x="${cx - 13}" y="430" width="26" height="3.5" rx="1.5" fill="${o}"/>`;
      case 'sandalias':
        return `<ellipse cx="${cx}" cy="428" rx="11" ry="5" fill="${piel}"/>` +
          `<rect x="${cx - 13}" y="429" width="26" height="4" rx="2" fill="${o}"/>` +
          `<path d="M${cx - 10} 427 L${cx + 10} 419 M${cx - 10} 419 L${cx + 10} 427" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`;
      case 'guillerminas':
        return `<path d="M${cx - 13} 433 L${cx - 13} 425 Q${cx} 417 ${cx + 13} 425 L${cx + 13} 433 Z" fill="${c}"/>` +
          `<path d="M${cx - 12} 420 L${cx + 12} 420" stroke="${c}" stroke-width="3"/><circle cx="${cx + 7}" cy="420" r="2.2" fill="#e2b64a"/>`;
      case 'pantuflas':
        return `<ellipse cx="${cx}" cy="427" rx="16" ry="9" fill="${c}"/>` +
          `<ellipse cx="${cx - 6}" cy="413" rx="3.5" ry="9" fill="${c}"/><ellipse cx="${cx + 6}" cy="413" rx="3.5" ry="9" fill="${c}"/>` +
          `<ellipse cx="${cx - 6}" cy="414" rx="1.5" ry="6" fill="#f4a9c0"/><ellipse cx="${cx + 6}" cy="414" rx="1.5" ry="6" fill="#f4a9c0"/>` +
          `<circle cx="${cx - 4}" cy="424" r="1.5" fill="#2a2740"/><circle cx="${cx + 4}" cy="424" r="1.5" fill="#2a2740"/><circle cx="${cx}" cy="428" r="1.8" fill="#f4a9c0"/>`;
      case 'patines':
        return `<path d="M${cx - 13} 400 L${cx + 11} 400 L${cx + 13} 424 Q${cx + 14} 431 ${cx + 7} 431 L${cx - 7} 431 Q${cx - 14} 431 ${cx - 13} 424 Z" fill="${c}"/>` +
          `<path d="M${cx - 6} 406 L${cx + 6} 406 M${cx - 6} 412 L${cx + 6} 412" stroke="#f7f5f2" stroke-width="1.8"/>` +
          `<rect x="${cx - 14}" y="430" width="28" height="4" rx="2" fill="${o}"/>` +
          `<circle cx="${cx - 8}" cy="437" r="4" fill="#f2cf5b" stroke="${o}" stroke-width="1"/><circle cx="${cx + 8}" cy="437" r="4" fill="#f2cf5b" stroke="${o}" stroke-width="1"/>`;
      default: // balerinas
        return `<path d="M${cx - 12} 433 L${cx - 12} 426 Q${cx} 419 ${cx + 12} 426 L${cx + 12} 433 Z" fill="${c}"/>` +
          `<circle cx="${cx}" cy="424" r="2.6" fill="${l}"/>`;
    }
  }

  // metidas = botas sobre un pantalón: caña más ancha, que tapa la basta.
  function zapatos(z, piel, metidas) {
    if (!z) return `<ellipse cx="142" cy="429" rx="10" ry="5" fill="${piel}"/><ellipse cx="178" cy="429" rx="10" ry="5" fill="${piel}"/>`;
    if (BOTAS.includes(z.t)) {
      const o = oscurecer(z.c, 0.25), l = aclarar(z.c, 0.18);
      const lluvia = z.t === 'botas-lluvia';
      const brillo = (x, y1, y2) => lluvia ? `<path d="M${x} ${y1} L${x} ${y2}" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>` : '';
      if (metidas) {
        return [[117, 158.5, 130, 154], [161.5, 203, 166, 190]].map(([x1, x2, p1, p2]) =>
          `<path d="M${x1} 398 L${x2} 398 L${p2 + 1} 424 Q${p2 + 2} 433 ${p2 - 5} 433 L${p1 + 5} 433 Q${p1 - 2} 433 ${p1 - 1} 424 Z" fill="${z.c}"/>` +
          `<rect x="${x1 - 1}" y="394" width="${x2 - x1 + 2}" height="8" rx="3.5" fill="${lluvia ? o : l}"/>` +
          `<rect x="${p1 - 1}" y="430" width="${p2 - p1 + 2}" height="3.5" rx="1.5" fill="${o}"/>` + brillo(x1 + 8, 406, 422)
        ).join('');
      }
      return [142, 178].map((cx) =>
        `<path d="M${cx - 12} 384 L${cx + 12} 384 L${cx + 13} 424 Q${cx + 14} 433 ${cx + 7} 433 L${cx - 7} 433 Q${cx - 14} 433 ${cx - 13} 424 Z" fill="${z.c}"/>` +
        `<rect x="${cx - 13.5}" y="381" width="27" height="8" rx="3.5" fill="${lluvia ? o : l}"/>` +
        `<rect x="${cx - 13}" y="430" width="26" height="3.5" rx="1.5" fill="${o}"/>` + brillo(cx - 6, 392, 420)
      ).join('');
    }
    return unZapato(142, z, piel) + unZapato(178, z, piel);
  }

  // ================= CABEZA DE RATÓN (Mickey y Minnie) =================
  // Va sobre el cuerpo normal, así que se pueden vestir como cualquiera.
  const CARITA_RATON = '#f3cfa6';
  function ratonOrejas(piel) {
    return `<circle cx="66" cy="70" r="58" fill="${piel}"/><circle cx="254" cy="70" r="58" fill="${piel}"/>`;
  }
  function ratonCara(piel) {
    return `<circle cx="160" cy="176" r="118" fill="${piel}"/>` +
      `<g fill="${CARITA_RATON}"><ellipse cx="116" cy="170" rx="46" ry="60"/><ellipse cx="204" cy="170" rx="46" ry="60"/><ellipse cx="160" cy="240" rx="100" ry="62"/></g>` +
      `<ellipse cx="160" cy="222" rx="22" ry="15" fill="#1f1a1c"/><ellipse cx="153" cy="217" rx="6" ry="3.5" fill="#fff" opacity=".5"/>` +
      `<path d="M112 246 Q160 300 208 246" fill="#7a2a2a" stroke="#1f1a1c" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M140 272 Q160 290 180 272 Q160 262 140 272 Z" fill="#e8605a"/>`;
  }
  function ratonOjos(pestanas) {
    return [112, 208].map((x) => {
      const afuera = x < 160 ? -1 : 1;
      return `<ellipse cx="${x}" cy="164" rx="20" ry="30" fill="#fff" stroke="#1f1a1c" stroke-width="2"/>` +
        `<ellipse cx="${x + 3}" cy="174" rx="9" ry="16" fill="#1f1a1c"/><circle cx="${x + 5}" cy="166" r="3" fill="#fff"/>` +
        (pestanas ? `<path d="M${x + afuera * 12} 138 l${afuera * 9} -10 M${x + afuera * 18} 146 l${afuera * 11} -6 M${x + afuera * 21} 156 l${afuera * 11} -2" stroke="#1f1a1c" stroke-width="3.5" stroke-linecap="round"/>` : '');
    }).join('');
  }

  // ================= PERSONA COMPLETA =================
  // opts: { piel, relleno (estampado de la prenda principal), sinOjos,
  //         pose (ver POSES), sobreOjos (algo justo encima de los ojos: el parche),
  //         sinBrazo ('izq' | 'der' | 'ambos': ese brazo no se dibuja; lo dibuja la cámara
  //         con realidad aumentada, p. ej. para abrazar),
  //         raton (cabeza de ratón, sin pelo: Mickey y Minnie), manos (color de
  //         las manos, p. ej. guantes blancos) }
  // Devuelve { figura, delante, brazo }: `delante` va por encima de los ojos
  // (lentes); `brazo` = { piel, contorno, manga } para dibujar un brazo aparte.
  function persona(st, opts) {
    const piel = opts.piel;
    const pose = POSES[opts.pose] || POSES.normal;
    const partes = {};
    const principal = st.vestido ? 'vestido' : 'arriba';
    ['vestido', 'arriba', 'abajo', 'encima'].forEach((k) => {
      if (st[k] && !(st.vestido && (k === 'arriba' || k === 'abajo'))) partes[k] = prenda(k, st[k], k === principal ? opts.relleno : null);
    });

    const raton = !!opts.raton;
    let s = raton ? ratonOrejas(piel) : peloAtras(st);
    if (partes.encima && partes.encima.atras) s += partes.encima.atras;

    // Piernas y zapatos van bajo la ropa (así la falda tapa la caña de las
    // botas); solo con pantalón largo las botas van "metidas", encima.
    const abajo = st.vestido ? null : st.abajo;
    const sirena = !!abajo && abajo.t === 'cola-sirena';
    const pantalonLargo = (!!abajo && PANTALONES.includes(abajo.t)) || (!!st.vestido && st.vestido.t === 'enterito');
    const botasMetidas = pantalonLargo && !!st.zapatos && BOTAS.includes(st.zapatos.t);
    if (!sirena) {
      s += `<rect x="134" y="366" width="16" height="64" rx="7" fill="${piel}"/><rect x="170" y="366" width="16" height="64" rx="7" fill="${piel}"/>`;
      if (!botasMetidas) s += zapatos(st.zapatos, piel);
    }
    s += `<path d="${TORSO}" fill="${piel}"/>`;

    // ropa (o la ropa interior blanca si no tiene nada puesto)
    const blanco = '#f4f1ee';
    if (partes.vestido) s += partes.vestido.svg;
    else {
      // (Mickey y Minnie van sin ropa interior: sin polera se les ve el cuerpo)
      s += partes.abajo ? partes.abajo.svg : raton ? '' : `<path d="M110 338 L210 338 L210 362 L166 362 L160 356 L154 362 L110 362 Z" fill="${blanco}"/>`;
      s += partes.arriba ? partes.arriba.svg : raton ? ''
        : `<path d="M126 292 L194 292 L200 342 L120 342 Z" fill="${blanco}"/><path d="M130 294 L126 284 M190 294 L194 284" stroke="${blanco}" stroke-width="5" stroke-linecap="round"/>`;
      if (partes.abajo && partes.abajo.sobre) s += partes.abajo.sobre; // la pechera de la jardinera, sobre la polera
    }
    if (botasMetidas) s += zapatos(st.zapatos, piel, true);
    if (partes.encima) s += partes.encima.svg;

    // brazos (cada uno en su grupo, para poder animarlo), con su manga (la
    // chaqueta tapa la de abajo), reloj/pulsera y anillo
    const deArriba = partes.vestido || partes.arriba;
    const mangaEncima = partes.encima && partes.encima.manga;
    const mangaVisible = mangaEncima || (deArriba && deArriba.manga) || null;
    const joyasMuneca = muneca(st.muneca, pose);
    s += collar(st.collar);
    const contorno = oscurecer(piel, 0.14);
    const colorMano = opts.manos || piel, bordeMano = opts.manos ? '#b9b9c0' : contorno;
    ['izq', 'der'].forEach((lado) => {
      if (opts.sinBrazo === lado || opts.sinBrazo === 'ambos') return;
      const pts = pose[lado];
      const [hx, hy] = pts[pts.length - 1];
      const d = 'M' + pts.map(([x, y]) => `${x} ${y}`).join(' L');
      let b = `<path d="${d}" fill="none" stroke="${contorno}" stroke-width="17.5" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="${d}" fill="none" stroke="${piel}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<circle cx="${hx}" cy="${hy}" r="${opts.manos ? 11 : 9}" fill="${colorMano}" stroke="${bordeMano}" stroke-width="1.2"/>`;
      if (opts.pose === 'victoria' && lado === 'der') {
        b += `<path d="M${hx - 3} ${hy - 6} l-5 -15 M${hx + 3} ${hy - 6} l5 -15" stroke="${piel}" stroke-width="5.5" stroke-linecap="round"/>`;
      }
      b += manga(mangaVisible, lado, pose) + joyasMuneca[lado] + (lado === 'der' ? anillo(st.anillo, pose) : '');
      s += `<g class="brazo brazo-${lado}">${b}</g>`;
    });
    if (opts.pose === 'corazon') {
      s += `<g class="corazon-manos"><path d="${pathCorazon(160, 300, 16)}" fill="#e8578a" stroke="#c23f6f" stroke-width="2"/></g>`;
    }

    // cabeza
    const rasgos = opts.rasgos || {};
    s += (raton ? ratonCara(piel) : peloDelante(st) + cara(piel, st.peloColor, rasgos)) + pendientes(st.pendientes);
    const arribaDeLosOjos = (raton ? cabeza(st.cabeza, { peloEstilo: 'corto', peloColor: piel }) : flequillo(st) + cabeza(st.cabeza, st)) + sombrero(st.sombrero);
    // para dibujar un brazo aparte (en canvas no sirve un estampado url(#…): va el color base)
    const prendaPrincipal = st.vestido || st.arriba;
    const brazo = {
      piel, contorno, mano: opts.manos || null,
      manga: mangaVisible ? { tipo: mangaVisible.tipo, c: String(mangaVisible.c).startsWith('url') ? ((prendaPrincipal && prendaPrincipal.c) || piel) : mangaVisible.c } : null,
      // para dibujar piernas aparte (p. ej. sentada en un hombro)
      pierna: { c: pantalonLargo ? (st.vestido || st.abajo).c : piel, zapato: st.zapatos ? st.zapatos.c : null },
    };
    if (opts.sinOjos) return { figura: s + arribaDeLosOjos, delante: lentes(st.cara), brazo };
    return { figura: s + (raton ? ratonOjos(rasgos.pestanas) : ojos(st.ojos, rasgos.pestanas)) + (opts.sobreOjos || '') + arribaDeLosOjos + lentes(st.cara), delante: '', brazo };
  }

  // ================= PERSONAJES QUE NO SON PERSONAS =================
  // Olaf, Sven, Stitch y Ángel tienen su propio cuerpo (la ropa no les calza):
  // solo usan accesorios. Su cabeza ocupa el mismo lugar que la de una persona
  // (centro ~160,176), así que coronas, gorros, lentes y collares les quedan.
  const ESPECIES = ['olaf', 'sven', 'stitch', 'angel'];
  const SLOTS_ESPECIE = ['cabeza', 'sombrero', 'cara', 'collar'];

  function ojosGrandes(color, brillo) {
    return [112, 208].map((x) =>
      `<ellipse cx="${x}" cy="170" rx="30" ry="34" fill="${color}"/>` +
      `<circle cx="${x - 9}" cy="158" r="8" fill="#fff" opacity="${brillo}"/><circle cx="${x + 8}" cy="182" r="3.5" fill="#fff" opacity="${brillo}"/>`
    ).join('');
  }

  function especie(tipo, st, opts) {
    opts = opts || {};
    let s = '', color = '#f7fafd', contorno = '#b8cadf';
    const conOjos = (o) => (opts.sinOjos ? '' : o);
    switch (tipo) {
      case 'olaf': {
        const nieve = '#f7fafd', rama = '#6b4428', carbon = '#2a2527';
        color = nieve; contorno = '#b8cadf';
        s = `<path d="M160 64 L160 18 M160 36 L146 16 M160 36 L176 12 M136 70 L120 34 M184 70 L202 36" stroke="${rama}" stroke-width="4.5" stroke-linecap="round"/>` +
          `<ellipse cx="160" cy="400" rx="84" ry="50" fill="${nieve}" stroke="${contorno}" stroke-width="2"/>` +
          `<ellipse cx="160" cy="318" rx="66" ry="52" fill="${nieve}" stroke="${contorno}" stroke-width="2"/>` +
          `<circle cx="160" cy="302" r="6.5" fill="${carbon}"/><circle cx="160" cy="326" r="6.5" fill="${carbon}"/><circle cx="160" cy="400" r="7" fill="${carbon}"/>` +
          `<path d="M100 310 L38 264 M58 279 L50 256 M52 276 L28 280 M220 310 L282 264 M262 279 L270 256 M268 276 L292 280" stroke="${rama}" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="M160 62 C232 62 266 112 266 172 C266 238 222 272 160 272 C98 272 54 238 54 172 C54 112 88 62 160 62 Z" fill="${nieve}" stroke="${contorno}" stroke-width="2"/>` +
          `<path d="M70 210 Q160 290 250 210 Q230 262 160 266 Q90 262 70 210 Z" fill="#dce8f4" opacity=".7"/>` +
          `<path d="M84 128 q26 -16 50 -4 M186 124 q26 -12 50 4" fill="none" stroke="${carbon}" stroke-width="5" stroke-linecap="round"/>` +
          `<path d="M110 214 Q160 262 210 214 Q160 230 110 214 Z" fill="#3a2a2a"/><rect x="150" y="219" width="20" height="14" rx="3" fill="#fff"/>` +
          conOjos([112, 208].map((x) => `<ellipse cx="${x}" cy="168" rx="24" ry="27" fill="#fff" stroke="${contorno}" stroke-width="1.5"/><circle cx="${x}" cy="172" r="10" fill="${carbon}"/><circle cx="${x - 3}" cy="168" r="3" fill="#fff"/>`).join('')) +
          `<path d="M156 186 L236 196 L156 206 Z" fill="#f08a3c"/><path d="M178 190 l0 12 M198 193 l0 7" stroke="#d06a26" stroke-width="2"/>`;
        break;
      }
      case 'sven': {
        const cafe = '#a8744a', oscuro = '#6b4428', claro = '#ecd9c0', asta = '#cfae84';
        color = cafe; contorno = oscuro;
        s = `<path d="M112 96 Q82 44 92 6 M94 52 Q70 42 60 20 M92 26 Q78 18 74 4 M208 96 Q238 44 228 6 M226 52 Q250 42 260 20 M228 26 Q242 18 246 4" fill="none" stroke="${asta}" stroke-width="11" stroke-linecap="round"/>` +
          `<ellipse cx="160" cy="352" rx="94" ry="72" fill="${cafe}"/><ellipse cx="160" cy="330" rx="52" ry="42" fill="${claro}"/>` +
          `<rect x="116" y="378" width="28" height="54" rx="12" fill="${cafe}"/><rect x="176" y="378" width="28" height="54" rx="12" fill="${cafe}"/>` +
          `<ellipse cx="130" cy="432" rx="17" ry="8" fill="${oscuro}"/><ellipse cx="190" cy="432" rx="17" ry="8" fill="${oscuro}"/>` +
          `<ellipse cx="62" cy="132" rx="38" ry="16" transform="rotate(-24 62 132)" fill="${cafe}"/><ellipse cx="258" cy="132" rx="38" ry="16" transform="rotate(24 258 132)" fill="${cafe}"/>` +
          `<path d="M160 70 C224 70 252 120 248 172 C246 212 226 238 216 266 L104 266 C94 238 74 212 72 172 C68 120 96 70 160 70 Z" fill="${cafe}"/>` +
          `<ellipse cx="160" cy="240" rx="72" ry="44" fill="${claro}"/>` +
          `<ellipse cx="160" cy="212" rx="32" ry="19" fill="#2a2527"/><ellipse cx="150" cy="206" rx="8" ry="4" fill="#fff" opacity=".45"/>` +
          `<path d="M128 256 Q160 274 192 256" fill="none" stroke="${oscuro}" stroke-width="4" stroke-linecap="round"/>` +
          `<ellipse cx="174" cy="270" rx="12" ry="15" fill="#e8578a"/>` +
          `<path d="M86 132 q24 -14 46 -2 M188 130 q24 -12 46 2" fill="none" stroke="${oscuro}" stroke-width="5" stroke-linecap="round"/>` +
          conOjos([112, 208].map((x) => `<circle cx="${x}" cy="168" r="23" fill="#fff"/><circle cx="${x}" cy="170" r="12" fill="#4a3222"/><circle cx="${x - 4}" cy="165" r="3.5" fill="#fff"/>`).join(''));
        break;
      }
      default: { // stitch y ángel
        const esAngel = tipo === 'angel';
        const piel = esAngel ? '#ec8fbf' : '#4f7fc9', oscuro = esAngel ? '#b85b8d' : '#2f4f8f', panza = esAngel ? '#f8cde2' : '#a9c9f2', oreja = esAngel ? '#b85b8d' : '#e889b5';
        color = piel; contorno = oscuro;
        const orejas = esAngel
          ? `<path d="M62 168 C12 180 0 250 22 302 C52 282 80 232 82 192 Z" fill="${piel}" stroke="${oscuro}" stroke-width="2"/><path d="M258 168 C308 180 320 250 298 302 C268 282 240 232 238 192 Z" fill="${piel}" stroke="${oscuro}" stroke-width="2"/>` +
            `<path d="M140 88 Q116 22 150 10 Q172 6 162 32 M180 88 Q204 22 170 10 Q148 6 158 32" fill="none" stroke="${oscuro}" stroke-width="5" stroke-linecap="round"/>`
          : `<path d="M72 152 C20 122 0 60 10 16 C52 38 92 90 104 132 Z" fill="${piel}" stroke="${oscuro}" stroke-width="2"/><path d="M66 138 C36 114 24 76 28 50 C52 66 78 100 88 126 Z" fill="${oreja}"/>` +
            `<path d="M248 152 C300 122 320 60 310 16 C268 38 228 90 216 132 Z" fill="${piel}" stroke="${oscuro}" stroke-width="2"/><path d="M254 138 C284 114 296 76 292 50 C268 66 242 100 232 126 Z" fill="${oreja}"/>`;
        s = orejas +
          `<ellipse cx="160" cy="354" rx="78" ry="62" fill="${piel}"/><ellipse cx="160" cy="364" rx="46" ry="40" fill="${panza}"/>` +
          `<ellipse cx="86" cy="342" rx="16" ry="32" transform="rotate(24 86 342)" fill="${piel}"/><ellipse cx="234" cy="342" rx="16" ry="32" transform="rotate(-24 234 342)" fill="${piel}"/>` +
          `<ellipse cx="124" cy="420" rx="28" ry="14" fill="${piel}"/><ellipse cx="196" cy="420" rx="28" ry="14" fill="${piel}"/>` +
          `<path d="M104 424 l-6 8 M114 428 l-4 8 M216 424 l6 8 M206 428 l4 8" stroke="${oscuro}" stroke-width="3" stroke-linecap="round"/>` +
          `<ellipse cx="160" cy="178" rx="128" ry="102" fill="${piel}" stroke="${oscuro}" stroke-width="2"/>` +
          (esAngel ? '' : `<path d="M148 80 L154 56 L160 78 L168 58 L172 82 Z" fill="${piel}" stroke="${oscuro}" stroke-width="1.5"/>`) +
          `<ellipse cx="160" cy="118" rx="54" ry="22" fill="${panza}" opacity=".55"/>` +
          `<ellipse cx="160" cy="208" rx="26" ry="16" fill="${esAngel ? '#8f3f6a' : '#26386a'}"/>` +
          `<path d="M100 228 Q160 268 220 228" fill="none" stroke="${oscuro}" stroke-width="5" stroke-linecap="round"/>` +
          conOjos(ojosGrandes('#15161d', 0.9) + (esAngel ? `<path d="M84 140 l-10 -12 M96 134 l-6 -14 M236 140 l10 -12 M224 134 l6 -14" stroke="#15161d" stroke-width="3" stroke-linecap="round"/>` : ''));
      }
    }
    // accesorios que sí les calzan
    const sinPelo = { peloEstilo: 'corto', peloColor: contorno };
    const brazo = { piel: color, contorno, manga: null, pierna: { c: color, zapato: null } };
    const figura = s + collar(st.collar) + (opts.sobreOjos || '') + cabeza(st.cabeza, sinPelo) + sombrero(st.sombrero);
    if (opts.sinOjos) return { figura, delante: lentes(st.cara), brazo };
    return { figura: figura + lentes(st.cara), delante: '', brazo };
  }

  // Ícono de una cosa del guardarropa (la pieza sola, recortada con el viewBox).
  const CAJAS = {
    arriba: '94 270 132 96', abajo: '78 334 164 114', vestido: '66 274 188 170', encima: '62 272 196 172',
    zapatos: '120 366 80 76', cabeza: '86 4 208 100', sombrero: '0 -14 320 170', cara: '40 124 240 92',
    pendientes: '36 216 36 52', collar: '116 282 88 60', muneca: '84 336 40 36', anillo: '206 352 26 22',
  };
  function icono(slot, valor) {
    let caja = CAJAS[slot], dentro;
    switch (slot) {
      case 'zapatos': dentro = zapatos(valor, '#f1c9a5'); if (BOTAS.includes(valor.t)) caja = '120 362 80 80'; break;
      case 'cabeza':
        dentro = cabeza(valor, { peloEstilo: 'melena', peloColor: '#b9a597' });
        caja = { moño: '122 14 76 64', 'moño-lunares': '112 6 96 72', collet: '124 2 72 70', tiara: '110 28 100 54', flor: '194 44 56 56', cintillo: '30 40 260 110', pinches: '56 76 208 50' }[valor.t] || caja;
        break;
      case 'sombrero': dentro = `<circle cx="160" cy="176" r="118" fill="#f1c9a5" opacity=".35"/>` + sombrero(valor); break;
      case 'cara': dentro = lentes(valor); break;
      case 'pendientes': dentro = pendientes(valor); break;
      case 'collar': dentro = collar(valor); break;
      case 'muneca': { const m = muneca(valor, POSES.normal); dentro = `<path d="M118 298 L102 362" stroke="#f1c9a5" stroke-width="15" stroke-linecap="round"/><path d="M202 298 L218 362" stroke="#f1c9a5" stroke-width="15" stroke-linecap="round"/>` + m.izq + m.der; }
        if (valor.t === 'pulsera' || valor.t === 'brazaletes') caja = '196 332 40 36';
        break;
      case 'anillo': dentro = `<circle cx="219" cy="366" r="9" fill="#f1c9a5"/>` + anillo(valor, POSES.normal); break;
      default: { const pr = prenda(slot, valor); dentro = (pr.atras || '') + pr.svg + (pr.sobre || '') + manga(pr.manga, 'izq', POSES.normal) + manga(pr.manga, 'der', POSES.normal); }
    }
    return `<svg viewBox="${caja}" preserveAspectRatio="xMidYMid meet">${dentro}</svg>`;
  }

  // Ícono de un peinado (cabeza con ese pelo).
  function iconoPeinado(st, piel) {
    return `<svg viewBox="-4 -10 328 370" preserveAspectRatio="xMidYMid meet">` +
      peloAtras(st) + peloDelante(st) + cara(piel, st.peloColor) + ojos(st.ojos || '#8b5e3c') + flequillo(st) + '</svg>';
  }

  return {
    TIPOS, SLOTS, PEINADOS, FLEQUILLOS, HEX, POSES: NOMBRES_POSES,
    pieza, esPeinado, esFlequillo, persona, icono, iconoPeinado, flor, sombrero,
    ESPECIES, SLOTS_ESPECIE, especie,
    color: { oscurecer, aclarar, mezclar, contraste, esClaro },
  };
})();
