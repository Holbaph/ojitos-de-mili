// taller.js — ✨ Taller de personajes: Mili crea sus propios personajes.
//   • A mano: elige qué es (niña/niño, animalito, muñeco de nieve…), la piel,
//     el peinado, los colores y la ropa, y le pone nombre.
//   • Con magia: escribe o dice quién quiere crear ("Bluey", "un hada") y la
//     función crear-personaje (Supabase + Claude) lo arma con las piezas de la
//     app. Pide el PIN de padres (cuesta un poquito cada vez) y no baja
//     imágenes de internet: siempre se dibuja con el estilo de la app.
// Los personajes creados aparecen en el juego de vestir, los cuentos, la
// fiesta y los juegos con el parche (se guardan con js/juego.js).

const Taller = (function () {
  const $ = (id) => document.getElementById(id);
  const TIPOS = [
    { v: 'persona', e: '🧒', n: 'Niña o niño' }, { v: 'raton', e: '🐭', n: 'Animalito' },
    { v: 'olaf', e: '⛄', n: 'Muñeco de nieve' }, { v: 'sven', e: '🦌', n: 'Renito' },
    { v: 'stitch', e: '👽', n: 'Extraterrestre' }, { v: 'pua', e: '🐷', n: 'Chanchito' },
    { v: 'heihei', e: '🐔', n: 'Gallito' }, { v: 'bruni', e: '🦎', n: 'Lagartija' },
  ];
  const PIELES = ['#fbe6da', '#fbe3ce', '#f6d7bd', '#e9c3a0', '#d9a57c', '#c98e64', '#b97d52', '#a86b45', '#8a5634', '#6b4428'];
  const PELAJES = ['#1f1a1c', '#6b4428', '#a8744a', '#d9b46a', '#f7f5f2', '#9aa0a6', '#e88fae', '#7cc4ea', '#b392d6', '#f0a04b'];
  const PELOS = ['#1f1a1c', '#4a3222', '#6b4428', '#a8744a', '#d9b46a', '#f1e6c8', '#b5522b', '#d2432f', '#8e2c48', '#6a3fa0', '#e88fae', '#4a78c2', '#8fd8c4'];
  const OJOS = ['#8b5e3c', '#3a2a22', '#c79a3a', '#5f8a4c', '#4f7fb5', '#7d8a93', '#7e57c2'];
  const ROPA_COLORES = ['#e88fae', '#d0487e', '#d9534f', '#f0a04b', '#f2cf5b', '#6fbf73', '#8fd8c4', '#7cc4ea', '#4a78c2', '#b392d6', '#7e57c2', '#f7f5f2', '#3a3540'];
  const ROPAS = [
    { v: 'princesa', e: '👸', n: 'Vestido de princesa', r: (c) => ({ vestido: { t: 'vestido-princesa', c }, zapatos: { t: 'balerinas', c } }) },
    { v: 'vestido', e: '👗', n: 'Vestido', r: (c) => ({ vestido: { t: 'vestido', c }, zapatos: { t: 'zapatillas', c: '#f7f5f2' } }) },
    { v: 'largo', e: '✨', n: 'Vestido largo', r: (c) => ({ vestido: { t: 'vestido-largo', c }, zapatos: { t: 'balerinas', c } }) },
    { v: 'falda', e: '🩰', n: 'Polera y falda', r: (c) => ({ arriba: { t: 'polera', c: '#f7f5f2' }, abajo: { t: 'falda', c }, zapatos: { t: 'zapatillas', c } }) },
    { v: 'jeans', e: '👖', n: 'Polera y jeans', r: (c) => ({ arriba: { t: 'polera', c }, abajo: { t: 'jeans', c: '#5b7fb0' }, zapatos: { t: 'zapatillas', c: '#f7f5f2' } }) },
    { v: 'short', e: '🩳', n: 'Polera y short', r: (c) => ({ arriba: { t: 'polera', c }, abajo: { t: 'short', c: '#3a3540' }, zapatos: { t: 'sandalias', c } }) },
    { v: 'abrigo', e: '🧥', n: 'Abrigado', r: (c) => ({ arriba: { t: 'sueter', c: '#f3e3c3' }, abajo: { t: 'jeans', c: '#3a3540' }, encima: { t: 'abrigo', c }, zapatos: { t: 'botas', c: '#8a5a3a' } }) },
    { v: 'ninguna', e: '🚫', n: 'Sin ropa (la elijo después)', r: () => ({}) },
  ];
  const esEspecie = (t) => t !== 'persona' && t !== 'raton';

  let st = null, ropaSel = 'princesa', ropaColor = '#e88fae', cableado = false, pidiendo = false;
  // si la magia todavía no está activada, se avisa altiro (sin pedir el PIN) por un rato
  const SIN_MAGIA = 'ojitos-magia-no';
  const NO_ACTIVADA = '🪄 La magia todavía no está activada: un adulto tiene que conectarla. Mientras, ¡créalo tú eligiendo abajo! 👇';
  const magiaApagada = () => { try { return Date.now() - Number(localStorage.getItem(SIN_MAGIA) || 0) < 60 * 60 * 1000; } catch (e) { return false; } };
  const marcarSinMagia = () => { try { localStorage.setItem(SIN_MAGIA, String(Date.now())); } catch (e) {} };

  function nuevo() {
    st = { id: null, tipo: 'persona', nombre: '', piel: '#fbe3ce', ojos: '#8b5e3c', peloEstilo: 'largo', peloColor: '#6b4428', flequillo: 'ondas', pestanas: true, pecas: false, ropa: {} };
    ropaSel = 'princesa'; ropaColor = '#e88fae';
    aplicarRopa();
  }
  function aplicarRopa() { const r = ROPAS.find((x) => x.v === ropaSel); st.ropa = r ? r.r(ropaColor) : st.ropa; }

  const chips = (lista, actual, attr) => lista.map((o) =>
    `<button class="ta-chip${o.v === actual ? ' activo' : ''}" data-${attr}="${o.v}" aria-label="${o.n}">${o.e ? `<span>${o.e}</span>` : ''}${o.n}</button>`).join('');
  const colores = (lista, actual, attr) => lista.map((c) =>
    `<button class="ta-color${c === actual ? ' activo' : ''}" data-${attr}="${c}" style="background:${c}" aria-label="Color"></button>`).join('');

  function render() {
    const t = st.tipo, persona = t === 'persona';
    $('taSvg').innerHTML = `<g class="pj-cuerpo">${Juego.vistaPrevia(st)}</g>`;
    $('taTipo').innerHTML = chips(TIPOS, t, 'tipo');
    $('taPielTitulo').textContent = t === 'raton' ? 'Color del pelaje' : 'Piel';
    $('taPiel').innerHTML = colores(t === 'raton' ? PELAJES : PIELES, st.piel, 'piel');
    $('taPeinado').innerHTML = chips(Vestuario.PEINADOS.map((p) => ({ v: p.v, n: p.n })), st.peloEstilo, 'peinado');
    $('taPelo').innerHTML = colores(PELOS, st.peloColor, 'pelo');
    $('taOjos').innerHTML = colores(OJOS, st.ojos, 'ojos');
    $('taDetalles').innerHTML = [['pestanas', '👁️', 'Pestañas'], ['pecas', '🌟', 'Pecas']].map(([v, e, n]) =>
      `<button class="ta-chip${st[v] ? ' activo' : ''}" data-detalle="${v}" aria-pressed="${!!st[v]}"><span>${e}</span>${n}</button>`).join('');
    $('taRopa').innerHTML = chips(ROPAS, ropaSel, 'ropa');
    $('taRopaColor').innerHTML = colores(ROPA_COLORES, ropaColor, 'ropacolor');
    document.querySelectorAll('#taller [data-solo="persona"]').forEach((el) => el.classList.toggle('hidden', !persona));
    document.querySelectorAll('#taller [data-solo="cuerpo"]').forEach((el) => el.classList.toggle('hidden', esEspecie(t)));
    $('taGuardar').textContent = st.id ? '💾 Guardar cambios' : '✨ ¡Crear personaje!';
    renderLista();
  }
  function renderLista() {
    const l = Juego.creados();
    $('taLista').innerHTML = l.length ? l.map((c) =>
      `<div class="ta-item"><button class="ta-editar" data-editar="${c.id}" aria-label="Cambiar a ${c.nombre}"><svg viewBox="22 18 276 276">${Juego.vistaPrevia(c)}</svg><span>${c.nombre}</span></button>` +
      `<button class="ta-borrar" data-borrar="${c.id}" aria-label="Borrar a ${c.nombre}">🗑️</button></div>`).join('')
      : '<p class="ta-vacio">Todavía no creas ninguno. ¡Inventa el primero! 💖</p>';
  }

  function decir(t) { if (typeof Voz !== 'undefined') Voz.decir(t); }
  function estado(t) { $('taMagiaEstado').textContent = t || ''; }

  // ---------- ✨ con magia ----------
  async function magia() {
    const pedido = $('taPedido').value.trim();
    if (!pedido) { estado('Escribe o dime a quién quieres crear 🎤'); decir('¿A quién quieres crear?'); return; }
    if (pidiendo) return;
    if (typeof supabaseClient === 'undefined' || !supabaseClient) { estado('La magia necesita internet'); return; }
    if (magiaApagada()) { estado(NO_ACTIVADA); decir('La magia todavía no está activada. ¡Créalo tú!'); return; }
    if (!navigator.onLine) { estado('La magia necesita internet 📶'); return; }
    const ok = await Candado.pedir('Para crear con magia');
    if (ok !== 'ok' && ok !== 'olvido') return;
    pidiendo = true;
    $('taMagia').disabled = true;
    $('taller').classList.add('magia');
    estado('✨ Haciendo magia…');
    decir('¡Abracadabra!');
    try {
      // si en 25 segundos no responde, se avisa (no se queda pensando para siempre)
      const tiempo = new Promise((res) => setTimeout(() => res({ data: null, error: { name: 'Tiempo' } }), 25000));
      const { data, error } = await Promise.race([supabaseClient.functions.invoke('crear-personaje', { body: { pedido } }), tiempo]);
      const status = error && error.context && error.context.status;
      // la función no está subida (404 / error de red) o le falta la clave
      if ((error && (status === 404 || error.name === 'FunctionsFetchError' || error.name === 'FunctionsRelayError')) ||
          (data && data.error === 'La magia todavía no está configurada')) {
        marcarSinMagia(); estado(NO_ACTIVADA); decir('La magia todavía no está activada. ¡Créalo tú!'); return;
      }
      if (error && error.name === 'Tiempo') { estado('La magia se demoró mucho. Prueba otra vez 🙏'); return; }
      if (error || !data || !data.ok) { estado((data && data.error) || 'La magia falló, prueba otra vez'); return; }
      const p = data.personaje;
      st = { id: null, tipo: p.tipo, nombre: p.nombre, piel: p.piel, ojos: p.ojos, peloEstilo: p.peloEstilo, peloColor: p.peloColor, flequillo: p.flequillo, pestanas: p.pestanas, pecas: p.pecas, ropa: p.ropa || {}, magia: true };
      ropaSel = null;
      $('taNombre').value = st.nombre;
      render();
      estado(`¡Listo! Así quedó ${st.nombre}. Si te gusta, tócalo en "¡Crear personaje!"`);
      decir(`¡Mira! ¡Es ${st.nombre}!`);
    } catch (e) {
      estado('La magia falló, prueba otra vez');
    } finally {
      pidiendo = false;
      $('taMagia').disabled = false;
      $('taller').classList.remove('magia');
    }
  }

  // 🎤 dictar a quién crear (si el celular lo permite)
  function dictar() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'es-CL'; r.interimResults = false; r.maxAlternatives = 1;
    $('taMicro').classList.add('escuchando');
    estado('🎤 Te escucho…');
    r.onresult = (e) => { $('taPedido').value = e.results[0][0].transcript.slice(0, 60); estado(''); };
    r.onerror = () => estado('No te escuché bien, prueba otra vez');
    r.onend = () => $('taMicro').classList.remove('escuchando');
    try { r.start(); } catch (e) { $('taMicro').classList.remove('escuchando'); }
  }

  function guardar() {
    st.nombre = $('taNombre').value.replace(/[<>&"'`]/g, '').trim().slice(0, 18);
    if (!st.nombre) { $('taNombre').focus(); estado(''); decir('¿Cómo se llama tu personaje?'); $('taNombre').classList.add('falta'); return; }
    const id = Juego.guardarCreado(st);
    if (!id) { decir('Ya tienes muchos personajes. Borra uno para crear otro.'); return; }
    decir(`¡Hola, ${st.nombre}!`);
    cerrar();
  }

  function cablear() {
    $('taCerrar').addEventListener('click', cerrar);
    $('taGuardar').addEventListener('click', guardar);
    $('taMagia').addEventListener('click', magia);
    $('taPedido').addEventListener('keydown', (e) => { if (e.key === 'Enter') magia(); });
    $('taNombre').addEventListener('input', () => $('taNombre').classList.remove('falta'));
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) $('taMicro').addEventListener('click', dictar); else $('taMicro').classList.add('hidden');
    $('taller').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !$('taller').contains(b)) return;
      const d = b.dataset;
      if (d.tipo) {
        st.tipo = d.tipo;
        if (d.tipo === 'raton' && !PELAJES.includes(st.piel)) st.piel = '#a8744a';
        if (d.tipo === 'persona' && !PIELES.includes(st.piel)) st.piel = '#fbe3ce';
      } else if (d.piel) st.piel = d.piel;
      else if (d.peinado) st.peloEstilo = d.peinado;
      else if (d.pelo) st.peloColor = d.pelo;
      else if (d.ojos) st.ojos = d.ojos;
      else if (d.detalle) st[d.detalle] = !st[d.detalle];
      else if (d.ropa) { ropaSel = d.ropa; aplicarRopa(); }
      else if (d.ropacolor) { ropaColor = d.ropacolor; if (!ropaSel) ropaSel = 'vestido'; aplicarRopa(); }
      else if (d.editar) {
        const c = Juego.creados().find((x) => x.id === d.editar);
        if (!c) return;
        st = c; ropaSel = null; $('taNombre').value = c.nombre;
        $('taller').querySelector('.ta-cuerpo').scrollTop = 0;
      } else if (d.borrar) {
        if (!b.classList.contains('confirmar')) {
          b.classList.add('confirmar'); b.textContent = '¿Seguro?';
          setTimeout(() => { b.classList.remove('confirmar'); b.textContent = '🗑️'; }, 3000);
          return;
        }
        Juego.borrarCreado(d.borrar);
        if (st.id === d.borrar) { nuevo(); $('taNombre').value = ''; }
      } else return;
      render();
    });
  }

  function abrir() {
    if (!cableado) { cablear(); cableado = true; }
    nuevo();
    $('taNombre').value = ''; $('taPedido').value = ''; estado('');
    $('taller').classList.remove('hidden');
    $('taller').querySelector('.ta-cuerpo').scrollTop = 0;
    render();
    decir('¡Vamos a crear un personaje nuevo!');
  }
  function cerrar() { $('taller').classList.add('hidden'); }
  return { abrir, cerrar };
})();
