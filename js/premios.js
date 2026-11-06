// premios.js — lo que Mili gana por usar el parche:
//   🥚 Huevito sorpresa: un huevito por cada día con parche. Se abre tocándolo
//      (se va trizando) y trae un premio nuevo para el juego de vestir (la
//      lista está en js/juego.js → PREMIOS), que aparece en el armario con ⭐.
//   🌳 Mi jardín mágico: cada día con parche crece una plantita; con días
//      seguidos llegan mariposas, abejitas, un conejito, un pajarito…
// Todo sale de los registros del parche (los mismos del álbum); lo único que
// se guarda es cuántos huevitos abrió (con la ropa, en Supabase).

const Premios = (function () {
  const $ = (id) => document.getElementById(id);
  const decir = (t) => { if (typeof Voz !== 'undefined') Voz.decir(t); };
  let entries = {}, racha = 0, alCambiar = () => {}, alVestir = () => {};

  // ================= 🥚 HUEVITOS =================
  // La primera vez se parte con hasta 3 huevitos (no los de todos los días ya
  // registrados de una vez); después, uno por cada día nuevo con parche.
  function estadoHuevos() {
    const dias = Object.keys(entries).length;
    let h = Juego.extra('huevos');
    // (no se guarda hasta abrir el primero: así no se pisa lo de otro celular al entrar)
    if (!h || typeof h !== 'object') h = { base: Math.max(0, dias - 3), abiertos: 0 };
    const base = Math.max(0, Math.floor(Number(h.base) || 0)), abiertos = Math.max(0, Math.floor(Number(h.abiertos) || 0));
    return { base, abiertos, pendientes: Math.max(0, dias - base - abiertos) };
  }
  const pendientes = () => estadoHuevos().pendientes;

  let golpes = 0;
  const GRIETAS = [
    '',
    '<path d="M60 92 l12 10 l-8 10 l14 8" />',
    '<path d="M60 92 l12 10 l-8 10 l14 8" /><path d="M120 80 l-10 14 l10 8 l-6 14" /><path d="M86 70 l6 12 l-8 6" />',
  ];
  function dibujoHuevo() {
    return `<svg viewBox="0 0 180 220" aria-hidden="true"><ellipse cx="90" cy="206" rx="54" ry="9" fill="rgba(0,0,0,.12)"/>` +
      `<path d="M90 12 C140 12 166 92 166 132 C166 178 132 204 90 204 C48 204 14 178 14 132 C14 92 40 12 90 12 Z" fill="#fff6e6" stroke="#e2b64a" stroke-width="4"/>` +
      `<path d="M18 120 Q40 104 60 120 T100 120 T140 120 T166 116" fill="none" stroke="#f28bb0" stroke-width="10" stroke-linecap="round"/>` +
      `<path d="M22 154 Q44 140 64 154 T104 154 T144 154 T162 150" fill="none" stroke="#7cc4ea" stroke-width="10" stroke-linecap="round"/>` +
      [[52, 66, '#b392d6'], [124, 62, '#f2cf5b'], [90, 92, '#6fbf73'], [60, 184, '#f0a04b'], [122, 182, '#e88fae']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="8" fill="${c}"/>`).join('') +
      `<g fill="none" stroke="#7a5a2a" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${GRIETAS[Math.min(golpes, 2)]}</g></svg>`;
  }
  function mostrarHuevo() {
    const e = estadoHuevos();
    golpes = 0;
    $('huPremio').classList.add('hidden');
    $('huOtro').classList.add('hidden'); $('huVestir').classList.add('hidden');
    if (!e.pendientes) {
      $('huHuevo').classList.add('hidden');
      $('huTexto').textContent = Object.keys(entries)[0] || e.abiertos
        ? '¡Ya abriste todos tus huevitos! Mañana, con tu parche, te espera otro 🩹🥚'
        : 'Cuando te pongas el parche, aquí aparece un huevito sorpresa 🩹🥚';
      $('huSub').textContent = '';
      return;
    }
    $('huHuevo').classList.remove('hidden', 'abierto');
    $('huHuevo').innerHTML = dibujoHuevo();
    $('huTexto').textContent = '¡Toca el huevito para abrirlo! 👆';
    $('huSub').textContent = e.pendientes === 1 ? 'Tienes 1 huevito' : `Tienes ${e.pendientes} huevitos`;
  }
  function golpear() {
    if ($('huHuevo').classList.contains('abierto')) return;
    golpes++;
    const h = $('huHuevo');
    h.classList.remove('tiembla'); void h.offsetWidth; h.classList.add('tiembla');
    if (golpes < 3) { h.innerHTML = dibujoHuevo(); decir(golpes === 1 ? '¡Toc!' : '¡Toc, toc! ¡Otra vez!'); return; }
    abrirPremio();
  }
  function abrirPremio() {
    const e = estadoHuevos();
    if (!e.pendientes) return;
    const n = e.abiertos; // el premio que toca
    Juego.guardarExtra('huevos', { base: e.base, abiertos: n + 1 });
    const h = $('huHuevo');
    h.classList.add('abierto');
    const p = Juego.PREMIOS[n];
    if (p) {
      const st = Juego.vestido('mili');
      st[p.slot] = { t: p.t, c: p.c };
      if (p.slot === 'vestido') { st.arriba = null; st.abajo = null; }
      $('huSvg').innerHTML = `<g class="pj-cuerpo">${Juego.figura('mili', st)}</g>`;
      $('huNombre').textContent = `${p.e} ¡${p.nombre}!`;
      $('huTexto').textContent = '¡Ya está en tu armario del juego de vestir! ⭐';
      decir(`¡Wow! ¡Te salió: ${p.nombre}!`);
      $('huVestir').classList.remove('hidden');
    } else {
      $('huSvg').innerHTML = `<text x="160" y="250" text-anchor="middle" font-size="200">🌟</text>`;
      $('huNombre').textContent = '🌟 ¡Una estrella dorada!';
      $('huTexto').textContent = '¡Ya tienes todos los premios! Eres súper valiente 💖';
      decir('¡Una estrella dorada para ti!');
    }
    $('huPremio').classList.remove('hidden');
    if (typeof confetiPantallaGlobal === 'function') confetiPantallaGlobal();
    const quedan = estadoHuevos().pendientes;
    $('huSub').textContent = quedan ? (quedan === 1 ? 'Te queda 1 huevito' : `Te quedan ${quedan} huevitos`) : '';
    if (quedan) $('huOtro').classList.remove('hidden');
    alCambiar();
  }

  function abrirHuevo() {
    $('huevito').classList.remove('hidden');
    document.body.classList.add('jugando');
    mostrarHuevo();
    if (pendientes()) decir('¡Un huevito sorpresa! Tócalo para abrirlo');
  }

  // ================= 🌳 JARDÍN =================
  const FLORES = ['🌷', '🌻', '🌸', '🌼', '🌹', '🌺', '🪻', '🌷', '🍄', '🌻'];
  const ANIMALES = [
    { dias: 3, e: '🦋', n: 'mariposas' }, { dias: 5, e: '🐝', n: 'una abejita' }, { dias: 7, e: '🐰', n: 'un conejito' },
    { dias: 10, e: '🐦', n: 'un pajarito' }, { dias: 14, e: '🐞', n: 'una chinita' }, { dias: 21, e: '🦔', n: 'un erizo' },
    { dias: 30, e: '🦌', n: 'un venadito' }, { dias: 45, e: '🦄', n: '¡un unicornio!' },
  ];
  // número "al azar" pero siempre igual para el mismo día
  const semilla = (s) => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };

  function abrirJardin() {
    const dias = Object.keys(entries).sort();
    const hoy = Utils.todayId();
    const MAX = 40;
    const plantas = dias.slice(-MAX);
    const arboles = Math.min(10, Math.floor(Math.max(0, dias.length - MAX) / 4) + Math.floor(dias.length / 10));
    let html = '<div class="ja-sol">☀️</div>' + (dias.length >= 10 ? '<div class="ja-arcoiris">🌈</div>' : '') +
      '<div class="ja-nube" style="left:12%;top:8%">☁️</div><div class="ja-nube" style="left:64%;top:4%;animation-delay:-6s">☁️</div>';
    // árboles al fondo
    for (let i = 0; i < arboles; i++) html += `<span class="ja-arbol" style="left:${4 + (i * 37) % 90}%;bottom:${50 + (i % 3) * 3}%">🌳</span>`;
    // las plantitas, en filas (las de atrás más chicas)
    plantas.forEach((id, i) => {
      const fila = Math.floor(i / 8), col = i % 8, s = semilla(id);
      const x = 8 + col * 12 + (s % 5) - (fila % 2 ? 5 : 0), y = 6 + fila * 10 + (s % 3);
      const tam = 46 - fila * 4;
      const e = (dias.indexOf(id) + 1) % 10 === 0 ? '🌳' : FLORES[s % FLORES.length];
      html += `<span class="ja-planta${id === hoy ? ' nueva' : ''}" style="left:${x}%;bottom:${y}%;font-size:${tam}px;z-index:${20 - fila}">${e}</span>`;
    });
    // los animalitos que llegan con los días seguidos
    const vienen = ANIMALES.filter((a) => racha >= a.dias);
    vienen.forEach((a, i) => {
      const cuantos = a.e === '🦋' ? Math.min(5, 1 + Math.floor(racha / 3)) : 1;
      for (let k = 0; k < cuantos; k++) {
        const vuela = ['🦋', '🐝', '🐦'].includes(a.e);
        html += `<span class="ja-animal${vuela ? ' vuela' : ''}" style="left:${(10 + i * 23 + k * 17) % 86}%;bottom:${vuela ? 40 + ((k * 13 + i * 7) % 30) : 4 + (i % 3) * 5}%;animation-delay:-${(k + i) * 1.3}s">${a.e}</span>`;
      }
    });
    $('jaEscena').innerHTML = html;
    const sig = ANIMALES.find((a) => racha < a.dias);
    let txt = dias.length
      ? `Tienes ${dias.length} plantita${dias.length === 1 ? '' : 's'} 🌱. ${racha ? `Llevas ${racha} día${racha === 1 ? '' : 's'} seguido${racha === 1 ? '' : 's'} con tu parche.` : ''}`
      : '¡Tu jardín está esperando! Cada día que uses tu parche crece una plantita 🌱';
    if (sig) txt += ` Si sigues ${sig.dias - racha} día${sig.dias - racha === 1 ? '' : 's'} más, llega ${sig.n} ${sig.e}`;
    else txt += ' ¡Llegaron todos los animalitos! 🎉';
    $('jaTexto').textContent = txt;
    $('jardin').classList.remove('hidden');
    document.body.classList.add('jugando');
    decir(dias.includes(hoy) ? '¡Mira! Hoy creció una plantita nueva en tu jardín' : txt);
  }

  function cerrar(id) { $(id).classList.add('hidden'); document.body.classList.remove('jugando'); if (typeof Voz !== 'undefined') Voz.callar(); }

  let cableado = false;
  // opts: { alCambiar (para actualizar el botón), alVestir (abrir el juego de vestir) }
  function iniciar(opts) {
    alCambiar = opts.alCambiar || alCambiar;
    alVestir = opts.alVestir || alVestir;
    if (cableado) return;
    cableado = true;
    $('huCerrar').addEventListener('click', () => cerrar('huevito'));
    $('huHuevo').addEventListener('click', golpear);
    $('huOtro').addEventListener('click', () => { mostrarHuevo(); decir('¡Otro huevito!'); });
    $('huVestir').addEventListener('click', () => { cerrar('huevito'); alVestir(); });
    $('jaCerrar').addEventListener('click', () => cerrar('jardin'));
    $('jaEscena').addEventListener('click', (e) => {
      const p = e.target.closest('.ja-planta, .ja-animal');
      if (!p) return;
      p.classList.remove('salta'); void p.offsetWidth; p.classList.add('salta');
    });
  }
  // los datos los da la app cada vez que cambian
  function datos(e, r) { entries = e || {}; racha = r || 0; }
  return { iniciar, datos, pendientes, abrirHuevo, abrirJardin };
})();
