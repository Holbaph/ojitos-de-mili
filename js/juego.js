// juego.js — "Jugar a vestir": elegir un personaje y cambiarle la ropa, los
// zapatos, el peinado, el color de pelo, los ojos y los accesorios, arrastrando
// (o tocando) las prendas del armario.
//
// - Los personajes son dibujos propios, en el mismo estilo que Mili, inspirados
//   en Huntrix, Frozen y Moana (no son imágenes oficiales).
// - Cada cambio se guarda solo: al instante en este dispositivo (localStorage)
//   y, un segundo después, en Supabase (configuracion.juego), así la ropa queda
//   igual en todos los celulares de la familia.
// - El tiempo de juego es UNO solo para este juego y los juegos con el parche
//   (js/tiempo-juego.js), el que se configura en Historial → Tiempo de juego.
//
// El dibujo y el guardarropa son los de js/vestuario.js (los mismos del avatar
// de Mili).

const Juego = (function () {

  // ---------- colores ----------
  const C = {
    rosado: '#e88fae', fucsia: '#d0487e', rojo: '#d9534f', burdeo: '#8e2c48', naranjo: '#f0a04b',
    amarillo: '#f2cf5b', dorado: '#e2b64a', verde: '#6fbf73', menta: '#8fd8c4', celeste: '#7cc4ea',
    hielo: '#bfe6f5', azul: '#4a78c2', mezclilla: '#5b7fb0', mezclillaClara: '#8fb0d6', lila: '#b392d6',
    morado: '#7e57c2', blanco: '#f7f5f2', crema: '#f3e3c3', gris: '#9aa0a6', negro: '#3a3540',
    cafe: '#8a5a3a', plateado: '#c9ced6', turquesa: '#3fb8b0', azulOscuro: '#2f4a7a',
  };
  const NOMBRE_COLOR = {};
  Object.keys(C).forEach((k) => { NOMBRE_COLOR[C[k]] = k.replace(/([A-Z])/g, ' $1').toLowerCase(); });
  NOMBRE_COLOR[C.mezclilla] = 'mezclilla'; NOMBRE_COLOR[C.mezclillaClara] = 'mezclilla clara';
  NOMBRE_COLOR[C.azulOscuro] = 'azul oscuro';

  const COLORES_PELO = [
    { c: '#1f1a1c', n: 'Negro' }, { c: '#4a3222', n: 'Castaño oscuro' }, { c: '#6b4428', n: 'Castaño' },
    { c: '#a8744a', n: 'Castaño claro' }, { c: '#d9b46a', n: 'Rubio' }, { c: '#f1e6c8', n: 'Rubio platinado' },
    { c: '#b5522b', n: 'Pelirrojo' }, { c: '#8e2c48', n: 'Burdeo' }, { c: '#6a3fa0', n: 'Morado' },
    { c: '#e88fae', n: 'Rosado' }, { c: '#4a78c2', n: 'Azul' }, { c: '#8fd8c4', n: 'Menta' },
    { c: '#e8c66a', n: 'Dorado' }, { c: '#d2432f', n: 'Rojo' }, { c: '#c9432a', n: 'Cobrizo' },
  ];
  const COLORES_OJOS = [
    { c: '#8b5e3c', n: 'Café' }, { c: '#3a2a22', n: 'Café oscuro' }, { c: '#c79a3a', n: 'Ámbar' },
    { c: '#5f8a4c', n: 'Verde' }, { c: '#4f7fb5', n: 'Azul' }, { c: '#7d8a93', n: 'Gris' }, { c: '#7e57c2', n: 'Morado' },
  ];
  const PEINADOS = Vestuario.PEINADOS;

  // ---------- armario: qué prendas hay y en qué colores ----------
  const TIPOS = Vestuario.TIPOS;
  const ARMARIO = {
    arriba: [
      ['polera', [C.rosado, C.blanco, C.celeste, C.amarillo, C.negro]],
      ['manga-larga', [C.lila, C.rojo, C.verde, C.blanco]],
      ['top', [C.negro, C.rojo, C.rosado, C.crema, C.morado, C.turquesa]],
      ['poleron', [C.lila, C.gris, C.rosado, C.celeste]],
      ['blusa', [C.blanco, C.rosado, C.amarillo]],
      ['top-concha', [C.morado, C.lila, C.rosado]],
      ['musculosa', [C.blanco, C.rosado, C.amarillo]],
      ['camisa', [C.blanco, C.celeste, C.mezclilla]],
      ['sueter', [C.rojo, C.crema, C.lila]],
    ],
    abajo: [
      ['jeans', [C.mezclilla, C.mezclillaClara, C.negro]],
      ['falda', [C.rosado, C.negro, C.rojo, C.celeste, C.morado]],
      ['short', [C.negro, C.mezclilla, C.rosado]],
      ['falda-larga', [C.rojo, C.verde, C.lila, C.azul, C.turquesa]],
      ['bombacho', [C.turquesa, C.rosado, C.lila]],
      ['cola-sirena', [C.turquesa, C.verde, C.lila]],
      ['calzas', [C.negro, C.rosado, C.lila]],
      ['tutu', [C.rosado, C.lila, C.celeste]],
      ['jardinera', [C.mezclilla, C.rosado, C.amarillo]],
    ],
    vestido: [
      ['vestido', [C.rosado, C.amarillo, C.celeste, C.rojo]],
      ['vestido-largo', [C.hielo, C.morado, C.rosado, C.verde, C.azulOscuro]],
      ['vestido-princesa', [C.verde, C.rosado, C.amarillo, C.celeste, C.dorado, C.lila]],
      ['vestido-tutu', [C.rosado, C.lila, C.celeste]],
      ['enterito', [C.mezclilla, C.amarillo, C.verde]],
    ],
    encima: [
      ['chaqueta', [C.negro, C.morado, C.rojo, C.mezclilla]],
      ['capa', [C.hielo, C.rojo, C.morado]],
      ['chaleco', [C.cafe, C.mezclilla, C.rosado]],
      ['abrigo', [C.rojo, C.cafe, C.celeste]],
    ],
    zapatos: [
      ['zapatillas', [C.blanco, C.rosado, C.negro]],
      ['botas', [C.negro, C.cafe, C.blanco]],
      ['botines', [C.cafe, C.rosado]],
      ['balerinas', [C.celeste, C.negro, C.rosado, C.dorado, C.plateado, C.turquesa]],
      ['sandalias', [C.cafe, C.rosado]],
      ['botas-lluvia', [C.amarillo, C.rosado, C.rojo]],
      ['guillerminas', [C.negro, C.rojo, C.rosado]],
      ['pantuflas', [C.rosado, C.blanco, C.lila]],
      ['patines', [C.rosado, C.celeste, C.lila]],
    ],
    cabeza: [
      ['moño', [C.rosado, C.rojo, C.celeste, C.morado]],
      ['collet', [C.amarillo, C.rosado, C.lila]],
      ['tiara', [C.dorado, C.plateado]],
      ['flor', [C.rojo, C.blanco, C.rosado, C.amarillo]],
      ['cintillo', [C.negro, C.rosado, C.dorado, C.celeste]],
      ['pinches', [C.rosado, C.amarillo, C.celeste]],
    ],
    sombrero: [
      ['corona', [C.dorado, C.plateado]],
      ['corona-flores', [C.rosado, C.amarillo, C.lila]],
      ['corona-estrellas', [C.dorado, C.celeste]],
      ['gorro-lana', [C.rojo, C.rosado, C.celeste, C.gris]],
      ['jockey', [C.azul, C.rosado, C.negro]],
      ['sombrero', [C.crema, C.rosado]],
      ['orejitas', [C.negro, C.rosado, C.blanco]],
      ['unicornio', [C.blanco, C.lila]],
    ],
    cara: [
      ['lentes', [C.negro, C.rosado]],
      ['lentes-corazon', [C.rojo, C.rosado]],
      ['lentes-redondos', [C.verde, C.negro, C.rosado]],
      ['lentes-estrella', [C.amarillo, C.rosado]],
    ],
    pendientes: [
      ['aros', [C.dorado, C.plateado]], ['perlas', [C.dorado]], ['corazones', [C.rosado, C.rojo]],
      ['estrellas', [C.dorado, C.celeste]], ['largos', [C.lila, C.celeste]],
    ],
    collar: [
      ['cadena', [C.dorado, C.plateado]], ['perlas', [C.dorado]], ['corazon', [C.rosado, C.dorado]],
      ['estrella', [C.dorado, C.celeste]], ['mostacillas', [C.rosado]],
    ],
    muneca: [
      ['reloj', [C.rosado, C.negro, C.celeste]], ['reloj-digital', [C.lila, C.rosado]],
      ['pulsera', [C.rosado, C.celeste, C.amarillo]], ['brazaletes', [C.dorado, C.plateado]],
    ],
    anillo: [
      ['anillo', [C.dorado, C.plateado]], ['anillo-gema', [C.rosado, C.celeste, C.verde]],
      ['anillo-corazon', [C.rojo, C.rosado]], ['anillo-flor', [C.amarillo, C.lila]],
    ],
  };

  const CATEGORIAS = [
    { id: 'arriba', e: '👚', n: 'Poleras' }, { id: 'abajo', e: '👖', n: 'Jeans y faldas' },
    { id: 'vestido', e: '👗', n: 'Vestidos' }, { id: 'encima', e: '🧥', n: 'Chaquetas' },
    { id: 'zapatos', e: '👟', n: 'Zapatos' }, { id: 'peinado', e: '💇', n: 'Peinado' },
    { id: 'pelo', e: '🎨', n: 'Color de pelo' }, { id: 'ojos', e: '👀', n: 'Ojos' },
    { id: 'cabeza', e: '🎀', n: 'Accesorios' }, { id: 'sombrero', e: '👑', n: 'Coronas y gorros' },
    { id: 'joyas', e: '💍', n: 'Joyas', slots: ['pendientes', 'collar', 'muneca', 'anillo'] },
    { id: 'cara', e: '🕶️', n: 'Lentes' },
  ];
  const PRENDAS = Vestuario.SLOTS;

  // ---------- personajes (dibujos propios, inspirados en…) ----------
  const PERSONAJES = [
    { id: 'mili', nombre: 'Mili', grupo: 'Mili' },
    {
      id: 'rumi', nombre: 'Rumi', grupo: 'Huntrix', piel: '#e9c3a0', ojos: '#c79a3a', peloEstilo: 'trenza', peloColor: '#6a3fa0',
      ropa: { arriba: { t: 'top', c: C.negro }, abajo: { t: 'jeans', c: C.negro }, encima: { t: 'chaqueta', c: C.morado }, zapatos: { t: 'botas', c: C.negro } },
    },
    {
      id: 'mira', nombre: 'Mira', grupo: 'Huntrix', piel: '#f0cfb0', ojos: '#3a2a22', peloEstilo: 'largo', peloColor: '#8e2c48',
      ropa: { arriba: { t: 'top', c: C.rojo }, abajo: { t: 'falda', c: C.negro }, encima: { t: 'chaqueta', c: C.negro }, zapatos: { t: 'botas', c: C.negro } },
    },
    {
      id: 'zoey', nombre: 'Zoey', grupo: 'Huntrix', piel: '#f3d2b5', ojos: '#3a2a22', peloEstilo: 'cola-alta', peloColor: '#1f1a1c',
      ropa: { arriba: { t: 'poleron', c: C.lila }, abajo: { t: 'short', c: C.negro }, zapatos: { t: 'zapatillas', c: C.blanco }, cara: { t: 'lentes-corazon', c: C.rosado } },
    },
    {
      id: 'elsa', nombre: 'Elsa', grupo: 'Frozen', piel: '#fbe6da', ojos: '#4f7fb5', peloEstilo: 'trenza', peloColor: '#f1e6c8',
      ropa: { vestido: { t: 'vestido-largo', c: C.hielo }, encima: { t: 'capa', c: C.hielo }, zapatos: { t: 'balerinas', c: C.celeste } },
    },
    {
      id: 'anna', nombre: 'Anna', grupo: 'Frozen', piel: '#fbe0cc', ojos: '#4f7fb5', peloEstilo: 'dos-trenzas', peloColor: '#b5522b',
      ropa: { vestido: { t: 'vestido-princesa', c: C.verde }, zapatos: { t: 'balerinas', c: C.negro } },
    },
    {
      id: 'moana', nombre: 'Moana', grupo: 'Moana', piel: '#a86b45', ojos: '#3a2a22', peloEstilo: 'crespo', peloColor: '#1f1a1c',
      ropa: { arriba: { t: 'top', c: C.crema }, abajo: { t: 'falda-larga', c: C.rojo }, cabeza: { t: 'flor', c: C.rojo } },
    },
    {
      id: 'rapunzel', nombre: 'Rapunzel', grupo: 'Enredados', piel: '#fbe3ce', ojos: '#5f8a4c', peloEstilo: 'muy-largo', peloColor: '#e8c66a',
      ropa: { vestido: { t: 'vestido-princesa', c: C.lila }, cabeza: { t: 'flor', c: C.rosado } },
    },
    {
      id: 'ariel', nombre: 'Ariel', grupo: 'La Sirenita', piel: '#fbe6da', ojos: '#4f7fb5', peloEstilo: 'largo', peloColor: '#d2432f',
      ropa: { arriba: { t: 'top-concha', c: C.morado }, abajo: { t: 'cola-sirena', c: C.turquesa } },
    },
    {
      id: 'bella', nombre: 'Bella', grupo: 'La Bella y la Bestia', piel: '#f6d7bd', ojos: '#8b5e3c', peloEstilo: 'largo', peloColor: '#6b4428',
      ropa: { vestido: { t: 'vestido-princesa', c: C.dorado }, zapatos: { t: 'balerinas', c: C.dorado } },
    },
    {
      id: 'cenicienta', nombre: 'Cenicienta', grupo: 'Cenicienta', piel: '#fbe6da', ojos: '#4f7fb5', peloEstilo: 'tomate', peloColor: '#e8c66a',
      ropa: { vestido: { t: 'vestido-princesa', c: C.celeste }, cabeza: { t: 'cintillo', c: C.celeste }, zapatos: { t: 'balerinas', c: C.plateado } },
    },
    {
      id: 'mirabel', nombre: 'Mirabel', grupo: 'Encanto', piel: '#b97d52', ojos: '#4a3222', peloEstilo: 'crespo', peloColor: '#1f1a1c',
      ropa: { arriba: { t: 'blusa', c: C.blanco }, abajo: { t: 'falda-larga', c: C.azul }, zapatos: { t: 'balerinas', c: C.negro }, cara: { t: 'lentes-redondos', c: C.verde } },
    },
    {
      id: 'merida', nombre: 'Mérida', grupo: 'Valiente', piel: '#fbe3ce', ojos: '#4f7fb5', peloEstilo: 'crespo', peloColor: '#c9432a',
      ropa: { vestido: { t: 'vestido-largo', c: C.azulOscuro } },
    },
    {
      id: 'tiana', nombre: 'Tiana', grupo: 'La princesa y el sapo', piel: '#8a5634', ojos: '#4a3222', peloEstilo: 'tomate', peloColor: '#1f1a1c',
      ropa: { vestido: { t: 'vestido-largo', c: C.verde }, cabeza: { t: 'tiara', c: C.dorado } },
    },
    {
      id: 'jasmine', nombre: 'Jasmine', grupo: 'Aladdín', piel: '#c98e64', ojos: '#4a3222', peloEstilo: 'cola-baja', peloColor: '#1f1a1c',
      ropa: { arriba: { t: 'top', c: C.turquesa }, abajo: { t: 'bombacho', c: C.turquesa }, cabeza: { t: 'cintillo', c: C.dorado }, zapatos: { t: 'balerinas', c: C.turquesa } },
    },
  ];

  // Mili toma su piel, ojos y pelo de su apariencia personalizada (js/mili.js).
  let aparienciaMili = Mili.DEFAULT;
  function base(p) {
    if (p.id !== 'mili') return p;
    const a = aparienciaMili, st = Mili.aPersona(a);
    const ropa = {};
    PRENDAS.forEach((k) => { ropa[k] = st[k]; });
    return { ...p, piel: a.piel, ojos: a.ojos, peloEstilo: a.peloEstilo, peloColor: a.peloColor, flequillo: a.flequillo, ropa };
  }
  function personaje(id) { return base(PERSONAJES.find((p) => p.id === id) || PERSONAJES[0]); }

  // "En blanco": sin ropa ni accesorios, con su peinado y ojos originales.
  function enBlanco(id) {
    const p = personaje(id);
    const st = { ojos: p.ojos, peloEstilo: p.peloEstilo, peloColor: p.peloColor, flequillo: p.flequillo || 'ondas' };
    PRENDAS.forEach((k) => { st[k] = null; });
    return st;
  }
  function inicial(id) { return { ...enBlanco(id), ...personaje(id).ropa }; }

  // Lo guardado viene de la base de datos compartida y se mete en el SVG: se
  // valida todo (solo colores #rrggbb y prendas/peinados conocidos).
  const HEX = /^#[0-9a-f]{6}$/i;
  function normalizar(id, raw) {
    const st = inicial(id);
    if (!raw || typeof raw !== 'object') return st;
    if (HEX.test(raw.ojos || '')) st.ojos = raw.ojos;
    if (HEX.test(raw.peloColor || '')) st.peloColor = raw.peloColor;
    if (Vestuario.esPeinado(raw.peloEstilo)) st.peloEstilo = raw.peloEstilo;
    if (Vestuario.esFlequillo(raw.flequillo)) st.flequillo = raw.flequillo;
    PRENDAS.forEach((k) => {
      const v = raw[k];
      if (v === null) st[k] = null;
      else if (v) { const ok = Vestuario.pieza(k, v); if (ok) st[k] = ok; }
    });
    return st;
  }

  // ================= DIBUJO (js/vestuario.js) =================
  // o = { pose, parche } (para la cámara). Mili lleva el estampado de su
  // avatar y, si se pide, su parche.
  function figura(id, st, o) {
    o = o || {};
    let defs = '', relleno = null, sobreOjos = '';
    if (id === 'mili') {
      const e = Mili.estampadoEn(aparienciaMili, 'jmili', st);
      if (e.defs) defs = `<defs>${e.defs}</defs>`;
      relleno = e.relleno;
      sobreOjos = Mili.parcheFoto(aparienciaMili, 'jmili', o.parche);
    }
    return defs + Vestuario.persona(st, { piel: personaje(id).piel, relleno, pose: o.pose, sobreOjos, sinBrazo: o.sinBrazo }).figura;
  }

  function icono(cat, valor, st, id) {
    if (cat === 'pelo') return `<span class="jcolor" style="background:${valor}"></span>`;
    if (cat === 'ojos') return `<svg viewBox="78 134 68 68"><circle cx="112" cy="168" r="30" fill="#fff" stroke="#ddd" stroke-width="2"/><circle cx="112" cy="168" r="15" fill="${valor}"/><circle cx="112" cy="168" r="6" fill="#2a2740"/><circle cx="107" cy="163" r="3.5" fill="#fff"/></svg>`;
    if (cat === 'peinado') return Vestuario.iconoPeinado({ ...st, peloEstilo: valor }, personaje(id).piel);
    return Vestuario.icono(cat, valor);
  }

  // ================= ESTADO Y GUARDADO =================
  const LOCAL = 'ojitos-juego';
  let estados = {};           // id -> estado
  let actual = 'mili';
  let cat = 'arriba';
  let guardarTimer = null;
  let toast = () => {};
  let parcheHoy = 'ninguno';
  // "firma" de la apariencia del avatar con la que se armó la Mili del juego:
  // si el avatar cambia, la Mili del juego vuelve a quedar igual a él.
  let miliFirma = null;

  function leerLocal() {
    try {
      const j = JSON.parse(localStorage.getItem(LOCAL));
      if (j && j.personajes) return j;
    } catch (e) {}
    return null;
  }
  function aplicarGuardado(j) {
    estados = {};
    PERSONAJES.forEach((p) => { estados[p.id] = normalizar(p.id, j && j.personajes && j.personajes[p.id]); });
    if (j && PERSONAJES.some((p) => p.id === j.actual)) actual = j.actual;
    miliFirma = (j && typeof j.miliFirma === 'string') ? j.miliFirma : null;
  }
  function paquete() { return { personajes: estados, actual, miliFirma }; }

  // Si el avatar cambió desde la última vez, la Mili del juego se pone igual a él.
  function sincronizarMili() {
    const firma = JSON.stringify(aparienciaMili);
    if (miliFirma === firma) return false;
    estados.mili = inicial('mili');
    miliFirma = firma;
    return true;
  }

  // La copia local lleva "pendiente: true" mientras no se haya podido subir a
  // Supabase (p. ej. sin internet). Así, al abrir, lo local no se pisa con una
  // copia remota más vieja: se sube lo local en vez de bajar lo remoto.
  let version = 0; // sube con cada cambio hecho en este dispositivo
  function guardarLocal(pendiente) {
    try { localStorage.setItem(LOCAL, JSON.stringify({ ...paquete(), pendiente })); } catch (e) {}
  }

  function guardar() {
    version++;
    guardarLocal(true);
    clearTimeout(guardarTimer);
    guardarTimer = setTimeout(guardarRemoto, 1000);
  }
  async function guardarRemoto() {
    clearTimeout(guardarTimer); guardarTimer = null;
    const v = version;
    try {
      await Config.guardarJuego(paquete());
      if (v === version) guardarLocal(false); // si hubo otro cambio mientras subía, sigue pendiente
    } catch (e) { /* queda pendiente en este dispositivo; se sube en el próximo cambio o al abrir */ }
  }

  function terminarTiempo() {
    TiempoJuego.detener();
    Camara.cerrar();
    guardarRemoto();
    document.getElementById('juegoFin').classList.remove('hidden');
  }

  // ================= PANTALLA =================
  const $ = (id) => document.getElementById(id);

  function renderPersonajes() {
    $('juegoPersonajes').innerHTML = PERSONAJES.map((p) =>
      `<button class="jpersonaje${p.id === actual ? ' activo' : ''}" data-id="${p.id}" aria-label="${p.nombre}">` +
      `<svg viewBox="22 18 276 276">${figura(p.id, estados[p.id])}</svg><span>${p.nombre}</span></button>`
    ).join('');
  }

  function renderEscenario(pop) {
    const svg = $('juegoSvg');
    svg.innerHTML = figura(actual, estados[actual]);
    const p = personaje(actual);
    $('juegoNombre').textContent = p.nombre;
    $('juegoGrupo').textContent = p.grupo === p.nombre ? '' : p.grupo;
    if (pop) { svg.classList.remove('pop'); void svg.getBoundingClientRect(); svg.classList.add('pop'); }
  }

  function renderCats() {
    $('juegoCats').innerHTML = CATEGORIAS.map((c) =>
      `<button data-cat="${c.id}"${c.id === cat ? ' class="activo"' : ''}><span>${c.e}</span>${c.n}</button>`
    ).join('');
  }

  // Lista de cosas de la categoría actual: [{ key, valor, nombre, puesto }]
  function itemsDeCategoria() {
    const st = estados[actual];
    if (cat === 'peinado') return PEINADOS.map((p) => ({ key: 'peinado|' + p.v, valor: p.v, nombre: p.n, puesto: st.peloEstilo === p.v }));
    if (cat === 'pelo') return COLORES_PELO.map((p) => ({ key: 'pelo|' + p.c, valor: p.c, nombre: 'Pelo ' + p.n.toLowerCase(), puesto: st.peloColor === p.c }));
    if (cat === 'ojos') return COLORES_OJOS.map((p) => ({ key: 'ojos|' + p.c, valor: p.c, nombre: 'Ojos ' + p.n.toLowerCase(), puesto: st.ojos === p.c }));
    const out = [];
    const slots = (CATEGORIAS.find((x) => x.id === cat) || {}).slots || [cat];
    slots.forEach((slot) => (ARMARIO[slot] || []).forEach(([t, colores]) => colores.forEach((c) => {
      const puesto = !!st[slot] && st[slot].t === t && st[slot].c === c;
      out.push({ key: slot + '|' + t + '|' + c, slot, valor: { t, c }, nombre: TIPOS[slot][t] + ' ' + (NOMBRE_COLOR[c] || ''), puesto });
    })));
    return out;
  }

  function renderItems() {
    const st = estados[actual];
    $('juegoItems').innerHTML = itemsDeCategoria().map((it) =>
      `<button class="jitem${it.puesto ? ' puesto' : ''}" data-key="${it.key}" title="${it.nombre}" aria-label="${it.nombre}">` +
      icono(it.slot || cat, it.valor, st, actual) + '</button>'
    ).join('');
  }

  function valorDeKey(key) {
    const [c, a, b] = key.split('|');
    if (c === 'peinado' || c === 'pelo' || c === 'ojos') return { cat: c, valor: a };
    return { cat: c, valor: { t: a, c: b } };
  }

  function equipar(key) {
    const { cat: c, valor } = valorDeKey(key);
    const st = estados[actual];
    if (c === 'peinado') st.peloEstilo = valor;
    else if (c === 'pelo') st.peloColor = valor;
    else if (c === 'ojos') st.ojos = valor;
    else {
      const igual = st[c] && st[c].t === valor.t && st[c].c === valor.c;
      st[c] = igual ? null : valor; // tocar lo que ya tiene puesto, se lo saca
      if (!igual && c === 'vestido') { st.arriba = null; st.abajo = null; }
      if (!igual && (c === 'arriba' || c === 'abajo')) st.vestido = null;
    }
    renderEscenario(true); renderItems(); renderPersonajes();
    guardar();
  }

  // ---------- arrastrar prendas hasta el personaje ----------
  let arrastre = null;
  let sinClick = false;
  function sobreEscenario(e) {
    const r = $('juegoEscenario').getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }
  function limpiarArrastre() {
    if (arrastre && arrastre.fantasma) arrastre.fantasma.remove();
    $('juegoEscenario').classList.remove('sobre');
    arrastre = null;
  }

  function cablear() {
    $('juegoSalir').addEventListener('click', cerrar);
    $('juegoFinOk').addEventListener('click', cerrar);

    $('juegoPersonajes').addEventListener('click', (e) => {
      const b = e.target.closest('.jpersonaje');
      if (!b) return;
      actual = b.dataset.id;
      renderPersonajes(); renderEscenario(true); renderItems();
      guardar();
    });

    $('juegoCats').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-cat]');
      if (!b) return;
      cat = b.dataset.cat;
      renderCats(); renderItems();
      $('juegoItems').scrollLeft = 0;
    });

    // "En blanco" y "Original" piden un segundo toque para confirmar (a prueba
    // de dedos chicos): cambian toda la ropa del personaje de una vez.
    function conConfirmacion(id, accion) {
      const b = $(id), txt = b.querySelector('.ja-txt');
      let espera = null;
      const volver = () => { clearTimeout(espera); espera = null; txt.textContent = b.dataset.txt; b.classList.remove('confirmar'); };
      b.addEventListener('click', () => {
        if (!espera) {
          txt.textContent = '¿Seguro?';
          b.classList.add('confirmar');
          espera = setTimeout(volver, 3000);
          return;
        }
        volver();
        accion();
        renderEscenario(true); renderItems(); renderPersonajes();
        guardar();
      });
    }
    conConfirmacion('juegoReset', () => { estados[actual] = enBlanco(actual); });
    conConfirmacion('juegoOriginal', () => { estados[actual] = inicial(actual); });

    $('juegoFoto').addEventListener('click', () => {
      const id = actual;
      Camara.abrir({
        dibujar: (o) => figura(id, estados[id], o),
        brazo: () => Vestuario.persona(estados[id], { piel: personaje(id).piel }).brazo,
        conParche: id === 'mili', parche: parcheHoy,
      });
    });

    const items = $('juegoItems');
    items.addEventListener('click', (e) => {
      if (sinClick) return;
      const b = e.target.closest('.jitem');
      if (b) equipar(b.dataset.key);
    });
    items.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.jitem');
      if (!b) return;
      arrastre = { key: b.dataset.key, boton: b, x0: e.clientX, y0: e.clientY, pid: e.pointerId, mouse: e.pointerType === 'mouse', fantasma: null };
    });
    document.addEventListener('pointermove', (e) => {
      if (!arrastre || e.pointerId !== arrastre.pid) return;
      const dx = e.clientX - arrastre.x0, dy = e.clientY - arrastre.y0;
      if (!arrastre.fantasma) {
        // con el dedo, moverse de lado es para recorrer el armario; hacia arriba, para arrastrar
        const empezar = arrastre.mouse ? Math.hypot(dx, dy) > 6 : (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx));
        if (!empezar) return;
        const f = arrastre.boton.cloneNode(true);
        f.classList.add('fantasma');
        $('juego').appendChild(f);
        arrastre.fantasma = f;
      }
      e.preventDefault();
      const f = arrastre.fantasma;
      f.style.left = (e.clientX - f.offsetWidth / 2) + 'px';
      f.style.top = (e.clientY - f.offsetHeight / 2) + 'px';
      $('juegoEscenario').classList.toggle('sobre', sobreEscenario(e));
    }, { passive: false });
    document.addEventListener('pointerup', (e) => {
      if (!arrastre || e.pointerId !== arrastre.pid) return;
      if (arrastre.fantasma) {
        if (sobreEscenario(e)) equipar(arrastre.key);
        sinClick = true; setTimeout(() => { sinClick = false; }, 60);
      }
      limpiarArrastre();
    });
    document.addEventListener('pointercancel', limpiarArrastre);
  }

  // ================= API =================
  let cableado = false;

  async function abrir(opts) {
    if (!cableado) { cablear(); cableado = true; }
    toast = opts.toast || toast;
    aparienciaMili = Mili.normalizar(opts.apariencia);
    parcheHoy = opts.parcheHoy || 'ninguno';
    TiempoJuego.configurar(opts.minutosDia);

    const local = leerLocal();
    aplicarGuardado(local);
    if (sincronizarMili()) guardar();
    $('juegoFin').classList.add('hidden');
    $('juego').classList.remove('hidden');
    document.body.classList.add('jugando');
    renderPersonajes(); renderEscenario(false); renderCats(); renderItems();

    if (!TiempoJuego.empezar($('juegoReloj'), terminarTiempo)) return;

    // Si quedaron cambios de este dispositivo sin subir, se suben (no se pisan).
    if (local && local.pendiente) { guardarRemoto(); return; }

    // Si no, lo de Supabase manda (puede venir de otro celular), salvo que
    // alguien haya empezado a jugar mientras llegaba: eso no se pisa.
    const v = version;
    const remoto = await Config.obtenerJuego();
    if (remoto && v === version && !$('juego').classList.contains('hidden')) {
      aplicarGuardado(remoto);
      if (sincronizarMili()) guardar(); else guardarLocal(false);
      renderPersonajes(); renderEscenario(false); renderItems();
    }
  }

  function cerrar() {
    TiempoJuego.detener();
    Camara.cerrar();
    limpiarArrastre();
    if (guardarTimer) guardarRemoto();
    $('juego').classList.add('hidden');
    document.body.classList.remove('jugando');
  }

  async function restablecerTodos(apariencia) {
    aparienciaMili = Mili.normalizar(apariencia);
    estados = {};
    PERSONAJES.forEach((p) => { estados[p.id] = enBlanco(p.id); });
    version++;
    guardarLocal(true);
    await guardarRemoto();
  }

  // Para los juegos con el parche (js/juegos-parche.js): la lista de
  // personajes y su ropa original, para dibujarlos con figura().
  function personajes() { return PERSONAJES.map((p) => ({ id: p.id, nombre: p.nombre })); }
  function original(id) { return JSON.parse(JSON.stringify(inicial(id))); }

  return { abrir, cerrar, restablecerTodos, figura, personajes, original };
})();
