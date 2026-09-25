// app.js — arranque, pantallas de acceso y toda la interacción de la app.
(function () {
  "use strict";

  // ---------- estado ----------
  let entries = {};        // fecha -> registro
  let perfil = null;       // { id, email, nombre, role }
  let pendingDelete = null;
  let realtimeChannel = null;
  let pendingAuthScreen = null; // 'setpassword' cuando el enlace de invitación/recuperación trae ese tipo
  let duracionMinutos = 120;    // cuánto dura el parche puesto (temporizador)
  let timerTick = null;
  let juegoMinutos = 20;        // minutos de juego por día (0 = sin límite)
  // indicación del oftalmólogo, premio, control y resumen (js/tratamiento.js)
  let conf = Tratamiento.desdeFila(null);
  let recordatorioHora = null;  // para el resumen de "Avisos" en Configuración
  let avisosEstado = '';

  if (location.hash.includes('type=invite') || location.hash.includes('type=recovery') ||
      location.search.includes('type=invite') || location.search.includes('type=recovery')) {
    pendingAuthScreen = 'setpassword';
  }

  // ---------- overlays de acceso ----------
  const OVERLAYS = ['authConfigError', 'authLoading', 'authLogin', 'authForgot', 'authSetPassword'];
  function showOverlay(id) {
    OVERLAYS.forEach(o => document.getElementById(o).classList.toggle('hidden', o !== id));
    document.getElementById('app').classList.add('hidden');
  }
  function showApp() {
    OVERLAYS.forEach(o => document.getElementById(o).classList.add('hidden'));
    document.getElementById('app').classList.remove('hidden');
  }

  function setBadge(mode) {
    const badge = document.getElementById('syncBadge'), txt = document.getElementById('syncText');
    if (mode === 'ok') { badge.classList.remove('local'); txt.textContent = 'Sincronizado'; }
    else { badge.classList.add('local'); txt.textContent = 'Reconectando…'; }
  }

  // ---------- toast ----------
  let toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // ================= LOGIN =================
  function wireLogin() {
    document.getElementById('btnLogin').addEventListener('click', async () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const err = document.getElementById('loginError');
      err.classList.add('hidden');
      if (!email || !password) { err.textContent = 'Completa correo y contraseña.'; err.classList.remove('hidden'); return; }
      try {
        await Auth.login(email, password);
        await arrancarSesion();
      } catch (e) {
        err.textContent = 'Correo o contraseña incorrectos.';
        err.classList.remove('hidden');
      }
    });
    document.getElementById('btnIrOlvide').addEventListener('click', () => showOverlay('authForgot'));
    document.getElementById('btnVolverLogin').addEventListener('click', () => showOverlay('authLogin'));

    document.getElementById('btnEnviarRecuperacion').addEventListener('click', async () => {
      const email = document.getElementById('forgotEmail').value.trim();
      const err = document.getElementById('forgotError');
      err.classList.add('hidden');
      if (!email) { err.textContent = 'Escribe tu correo.'; err.classList.remove('hidden'); return; }
      try {
        await Auth.pedirRecuperacion(email);
        showToast('Si el correo tiene cuenta, te llegará un enlace');
        showOverlay('authLogin');
      } catch (e) {
        err.textContent = 'No se pudo enviar el enlace. Intenta de nuevo.';
        err.classList.remove('hidden');
      }
    });

    document.getElementById('btnGuardarPassword').addEventListener('click', async () => {
      const p1 = document.getElementById('newPassword').value;
      const p2 = document.getElementById('newPassword2').value;
      const err = document.getElementById('setPasswordError');
      err.classList.add('hidden');
      if (p1.length < 8) { err.textContent = 'La contraseña debe tener al menos 8 caracteres.'; err.classList.remove('hidden'); return; }
      if (p1 !== p2) { err.textContent = 'Las contraseñas no coinciden.'; err.classList.remove('hidden'); return; }
      try {
        await Auth.fijarContrasena(p1);
        history.replaceState(null, '', location.pathname);
        pendingAuthScreen = null;
        await arrancarSesion();
      } catch (e) {
        err.textContent = 'No se pudo guardar la contraseña. Intenta de nuevo.';
        err.classList.remove('hidden');
      }
    });

    document.getElementById('btnLogout').addEventListener('click', async () => {
      if (realtimeChannel) { supabaseClient.removeChannel(realtimeChannel); realtimeChannel = null; }
      if (timerTick) { clearInterval(timerTick); timerTick = null; }
      Juego.cerrar();
      JuegosParche.cerrar();
      await Auth.logout();
      entries = {}; perfil = null;
      showOverlay('authLogin');
    });
  }

  // ================= SESIÓN =================
  async function arrancarSesion() {
    showOverlay('authLoading');
    const session = await Auth.getSession();
    if (!session) { showOverlay('authLogin'); return; }

    if (pendingAuthScreen === 'setpassword') {
      document.getElementById('setPasswordMuted').textContent = '¡Bienvenida! Elige tu contraseña para empezar.';
      showOverlay('authSetPassword');
      return;
    }

    perfil = await Auth.getPerfil(session.user.id);
    if (!perfil) {
      // el trigger crea el perfil al instante; por si acaso, reintenta una vez
      await new Promise(r => setTimeout(r, 800));
      perfil = await Auth.getPerfil(session.user.id);
    }
    if (!perfil) { showToast('No se pudo cargar tu perfil, intenta recargar la página'); showOverlay('authLogin'); return; }

    renderCuenta();
    showApp();
    await cargarYRenderizar();
    suscribirRealtime();
    duracionMinutos = await Config.obtenerDuracionMinutos();
    document.getElementById('duracionInput').value = duracionMinutos;
    actualizarDuracionHint(duracionMinutos);
    conf = await Config.obtenerTratamiento();
    conf.duracion = duracionMinutos;
    renderConfigTratamiento();
    renderAll();
    renderRecordatorio(await Config.obtenerRecordatorio());
    const apGuardada = await Config.obtenerApariencia();
    if (apGuardada !== undefined) {
      apariencia = Mili.normalizar(apGuardada);
      guardarAparienciaLocal();
      renderMili();
    }
    juegoMinutos = await Config.obtenerJuegoMinutos();
    document.getElementById('juegoMinutosInput').value = juegoMinutos;
    renderJuegoHint();
    renderTimer();
    refrescarEstadoAvisos();
    if (!timerTick) timerTick = setInterval(renderTimer, 30000);
  }

  function renderCuenta() {
    document.getElementById('avatarIniciales').textContent = Utils.iniciales(perfil.nombre);
    document.getElementById('accountName').textContent = perfil.nombre;
    const roleEl = document.getElementById('accountRole');
    roleEl.textContent = perfil.role === 'admin' ? 'Administradora/or' : 'Con acceso';
    roleEl.classList.toggle('admin', perfil.role === 'admin');
  }

  function suscribirRealtime() {
    if (realtimeChannel) return;
    realtimeChannel = DB.suscribirRegistros(async () => {
      try { entries = await DB.cargarRegistros(); renderAll(); setBadge('ok'); }
      catch (e) { setBadge('down'); }
    });
  }

  async function cargarYRenderizar() {
    try {
      entries = await DB.cargarRegistros();
      setBadge('ok');
    } catch (e) {
      setBadge('down');
      showToast('No se pudo cargar el historial, revisa tu conexión');
    }
    renderAll();
    await cargarPersonas();
  }

  // ================= TOQUE DE OJOS =================
  function wireEye(el, side) {
    function act() { onEyeTap(side); }
    el.addEventListener('click', act);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
  }
  async function onEyeTap(side) {
    const id = Utils.todayId();
    const current = entries[id];
    if (current && current.ojo === side) {
      showToast('Ya registrado hoy en el ojo ' + Utils.label(side).toLowerCase());
      return;
    }
    const horaISO = new Date().toISOString();
    try {
      await DB.guardarRegistro(id, side, horaISO, perfil.id, null);
      entries[id] = { fecha: id, ojo: side, hora: horaISO, horaFin: null, registradoPor: perfil.id };
      renderAll();
      showToast('Registrado: ojo ' + Utils.label(side).toLowerCase() + ' a las ' + Utils.fmtTime(horaISO));
    } catch (e) {
      showToast('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    }
  }

  // ================= RENDER =================
  function renderToday() {
    const today = new Date();
    document.getElementById('statusDate').textContent = 'Hoy, ' + Utils.fmtLong(today);
    const id = Utils.todayId();
    const rec = entries[id];
    const line = document.getElementById('statusLine');
    const hint = document.getElementById('hintChip');
    const undo = document.getElementById('undoBtn');
    document.getElementById('eyeDerecho').classList.toggle('patched', !!rec && rec.ojo === 'derecho');
    document.getElementById('eyeIzquierdo').classList.toggle('patched', !!rec && rec.ojo === 'izquierdo');

    const sacar = document.getElementById('sacarBtn'), sacarDeshacer = document.getElementById('sacarDeshacer');
    if (rec) {
      const autor = personasCache[rec.registradoPor];
      line.innerHTML = '🩹 <span class="pill ' + rec.ojo + '">' + Utils.label(rec.ojo) + '</span> · puesto a las ' + Utils.fmtTime(rec.hora) +
        (rec.horaFin ? ' · sacado a las ' + Utils.fmtTime(rec.horaFin) : '') +
        (autor ? '<span class="status-by">Registrado por ' + Utils.esc(autor.nombre) + '</span>' : '');
      if (rec.horaFin) {
        const u = Tratamiento.uso(rec, conf);
        const corto = u.min < conf.duracion - 5;
        hint.innerHTML = '<span class="hint-chip">' + (corto ? '🕐' : '✅') + ' Hoy lo usó ' + Tratamiento.fmtDur(u.min) +
          (corto ? ' de ' + Tratamiento.fmtDur(conf.duracion) : ' ¡completo!') + '</span>';
      } else hint.innerHTML = '';
      undo.classList.remove('hidden');
      sacar.classList.toggle('hidden', !!rec.horaFin);
      sacarDeshacer.classList.toggle('hidden', !rec.horaFin);
    } else {
      line.innerHTML = '<span class="status-empty">Aún no registras el parche de hoy</span>';
      undo.classList.add('hidden');
      sacar.classList.add('hidden'); sacarDeshacer.classList.add('hidden');
      const sug = Tratamiento.sugerencia(conf, entries);
      hint.innerHTML = '<span class="hint-chip">' + (sug.ojo ? '💡 ' : '') + Utils.esc(sug.texto) + '</span>';
    }
  }

  // constancia y racha cuentan solo los días indicados (js/tratamiento.js):
  // un día libre no corta la racha
  function computeStats() {
    const s = Tratamiento.estadisticas(entries, conf);
    return { ...s, streak: s.racha };
  }

  function renderStats() {
    const s = computeStats();
    document.getElementById('statRacha').textContent = s.streak;
    document.getElementById('statTotal').textContent = s.total;
    document.getElementById('statConst').textContent = s.constancia + '%';

    const bar = document.getElementById('balanceBar');
    const totalSide = s.countD + s.countI;
    const pD = totalSide ? Math.round(100 * s.countD / totalSide) : 50;
    bar.innerHTML = '<div style="background:var(--eye-derecho);width:' + pD + '%"></div><div style="background:var(--eye-izquierdo);width:' + (100 - pD) + '%"></div>';
    document.getElementById('balDerechoLbl').textContent = 'Derecho ' + s.countD;
    document.getElementById('balIzquierdoLbl').textContent = 'Izquierdo ' + s.countI;
  }

  function renderCalendar() {
    const grid = document.getElementById('calGrid');
    grid.innerHTML = '';
    const todayD = new Date();
    const diasDesdeLunes = (todayD.getDay() + 6) % 7; // lunes=0 ... domingo=6
    const lunesActual = new Date(todayD);
    lunesActual.setDate(lunesActual.getDate() - diasDesdeLunes);
    const inicioGrilla = new Date(lunesActual);
    inicioGrilla.setDate(inicioGrilla.getDate() - 21); // 4 semanas completas, lunes a domingo

    for (let i = 0; i < 28; i++) {
      const d = new Date(inicioGrilla);
      d.setDate(d.getDate() + i);
      const div = document.createElement('div');
      if (d > todayD) {
        div.className = 'cal-cell blank';
      } else {
        const id = Utils.dateId(d);
        const rec = entries[id];
        const libre = !rec && !Tratamiento.esIndicado(conf, d);
        div.className = 'cal-cell' + (rec ? ' ' + rec.ojo : '') + (libre ? ' libre' : '') + (id === Utils.todayId() ? ' today' : '');
        div.textContent = d.getDate();
        div.title = Utils.fmtShort(d) + (rec ? ' · ' + Utils.label(rec.ojo) + ' · ' + Utils.fmtTime(rec.hora) : libre ? ' · día libre' : ' · sin registro');
      }
      grid.appendChild(div);
    }
  }

  function renderList() {
    const list = document.getElementById('list');
    const ids = Object.keys(entries).sort().reverse();
    if (!ids.length) {
      list.innerHTML = '<div class="empty-state"><span class="big">🩹</span>Aún no hay registros.<br>¡Toca un ojito para comenzar hoy!</div>';
      return;
    }
    list.innerHTML = '';
    ids.forEach(id => {
      const rec = entries[id];
      const row = document.createElement('div');
      row.className = 'row';
      row.dataset.id = id;
      if (pendingDelete === id) {
        row.classList.add('confirm');
        row.innerHTML =
          '<span class="side-dot ' + rec.ojo + '"></span>' +
          '<div class="txt"><div class="d1">¿Eliminar ' + Utils.fmtShort(Utils.parseId(id)) + '?</div></div>' +
          '<div class="confirm-actions"><button class="yes-del" data-act="yes">Sí</button><button class="no-del" data-act="no">No</button></div>';
      } else {
        const autor = personasCache[rec.registradoPor];
        row.innerHTML =
          '<span class="side-dot ' + rec.ojo + '"></span>' +
          '<div class="txt"><div class="d1">' + Utils.fmtShort(Utils.parseId(id)) + ' · ' + Utils.label(rec.ojo) + '</div>' +
          '<div class="d2">' + Utils.fmtTime(rec.hora) + (rec.horaFin ? ' → ' + Utils.fmtTime(rec.horaFin) + ' (' + Tratamiento.fmtDur(Tratamiento.uso(rec, conf).min) + ')' : '') +
          (autor ? ' · ' + Utils.esc(autor.nombre) : '') + '</div></div>' +
          '<button class="del" data-act="del" title="Eliminar">🗑</button>';
      }
      list.appendChild(row);
    });
  }

  function renderAll() { renderToday(); renderStats(); renderCalendar(); renderList(); renderTimer(); renderSemana(); renderPremio(); renderControl(); }

  // ================= TEMPORIZADOR (reloj de arena) =================
  function actualizarDuracionHint(minutos) {
    const h = Math.floor(minutos / 60), m = minutos % 60;
    const partes = [];
    if (h) partes.push(h + (h === 1 ? ' hora' : ' horas'));
    if (m || !h) partes.push(m + ' min');
    document.getElementById('duracionHint').textContent = 'Ahora mismo: ' + partes.join(' ');
  }

  function renderTimer() {
    const card = document.getElementById('timerCard');
    const text = document.getElementById('timerText');
    const sandTop = document.getElementById('sandTop');
    const sandBottom = document.getElementById('sandBottom');
    const rec = entries[Utils.todayId()];

    card.classList.remove('sacado');
    if (!rec) {
      card.classList.add('idle'); card.classList.remove('done');
      sandTop.setAttribute('y', 26); sandTop.setAttribute('height', 110);
      sandBottom.setAttribute('y', 254); sandBottom.setAttribute('height', 0);
      text.textContent = Tratamiento.esIndicado(conf, new Date())
        ? 'Cuando le pongas el parche, aquí vas a ver cuánto falta ⏳'
        : 'Hoy es día libre de parche 🎈';
      return;
    }

    const duracionMs = duracionMinutos * 60000;
    const transcurrido = (rec.horaFin ? new Date(rec.horaFin).getTime() : Date.now()) - new Date(rec.hora).getTime();
    const fraccion = Math.max(0, Math.min(1, transcurrido / duracionMs));

    const topApexY = 136, topStartY = 26;
    const nivelTop = topStartY + (topApexY - topStartY) * fraccion;
    sandTop.setAttribute('y', nivelTop);
    sandTop.setAttribute('height', Math.max(0, topApexY - nivelTop));

    const botApexY = 144, botStartY = 254;
    const nivelBot = botStartY - (botStartY - botApexY) * fraccion;
    sandBottom.setAttribute('y', Math.max(botApexY, nivelBot));
    sandBottom.setAttribute('height', Math.max(0, botStartY - nivelBot));

    if (rec.horaFin) {
      // ya se lo sacó: el reloj se queda donde llegó
      card.classList.remove('idle', 'done'); card.classList.add('sacado');
      const min = transcurrido / 60000;
      text.textContent = min >= duracionMinutos - 5
        ? '✅ Hoy lo usó ' + Tratamiento.fmtDur(min) + ': ¡completo! 🎉'
        : '🕐 Hoy lo usó ' + Tratamiento.fmtDur(min) + ' de ' + Tratamiento.fmtDur(duracionMinutos);
    } else if (fraccion >= 1) {
      card.classList.remove('idle'); card.classList.add('done');
      text.textContent = '¡Ya se puede sacar el parche! 🎉';
    } else {
      card.classList.remove('idle', 'done');
      const restanteMin = Math.max(1, Math.ceil((duracionMs - transcurrido) / 60000));
      const h = Math.floor(restanteMin / 60), m = restanteMin % 60;
      let frase;
      if (h > 0 && m > 0) frase = 'Falta' + (h > 1 || m > 0 ? 'n' : '') + ' ' + h + (h === 1 ? ' hora' : ' horas') + ' y ' + m + ' min';
      else if (h > 0) frase = 'Falta' + (h > 1 ? 'n' : '') + ' ' + h + (h === 1 ? ' hora' : ' horas');
      else frase = 'Falta' + (restanteMin > 1 ? 'n' : '') + ' ' + restanteMin + ' min';
      text.textContent = '⏳ ' + frase + ' para sacarle el parche';
    }
  }

  document.getElementById('duracionInput').addEventListener('input', (e) => {
    const v = parseInt(e.target.value, 10);
    if (v > 0) actualizarDuracionHint(v);
  });
  document.getElementById('duracionSave').addEventListener('click', async () => {
    const v = parseInt(document.getElementById('duracionInput').value, 10);
    if (!v || v <= 0) { showToast('Escribe un número de minutos válido'); return; }
    try {
      await Config.guardarDuracionMinutos(v);
      duracionMinutos = v;
      conf.duracion = v;
      actualizarDuracionHint(v);
      renderConfigTratamiento();
      renderAll();
      showToast('Duración guardada');
    } catch (e) {
      const esTablaFaltante = /relation .* does not exist/i.test(e.message || '');
      showToast(esTablaFaltante
        ? 'No se pudo guardar (¿corriste supabase/schema_temporizador.sql?)'
        : 'No se pudo guardar: ' + (e.message || 'intenta de nuevo'));
    }
  });

  // ================= RECORDATORIO DIARIO =================
  function renderRecordatorio(hora) {
    recordatorioHora = hora || null;
    renderResumenesConfig();
    document.getElementById('recordatorioInput').value = hora || '';
    document.getElementById('recordatorioOff').classList.toggle('hidden', !hora);
    document.getElementById('recordatorioHint').textContent = hora
      ? 'Todos los días a las ' + Utils.fmtTime('2000-01-01T' + hora + ':00') +
        ', si todavía no se registra el parche, llega un aviso a los dispositivos con avisos activados.'
      : 'Sin recordatorio. Elige una hora y te avisamos cada día si aún no se pone el parche.';
  }

  async function guardarRecordatorio(hora) {
    try {
      await Config.guardarRecordatorio(hora);
      renderRecordatorio(hora);
      showToast(hora ? 'Recordatorio guardado' : 'Recordatorio quitado');
    } catch (e) {
      const esColumnaFaltante = /recordatorio/i.test(e.message || '');
      showToast(esColumnaFaltante
        ? 'No se pudo guardar (¿corriste supabase/schema_recordatorio.sql?)'
        : 'No se pudo guardar: ' + (e.message || 'intenta de nuevo'));
    }
  }

  document.getElementById('recordatorioSave').addEventListener('click', () => {
    const hora = document.getElementById('recordatorioInput').value;
    if (!hora) { showToast('Elige una hora para el recordatorio'); return; }
    guardarRecordatorio(hora);
  });
  document.getElementById('recordatorioOff').addEventListener('click', () => guardarRecordatorio(null));

  // ================= AVISOS (push) =================
  async function refrescarEstadoAvisos() {
    const btn = document.getElementById('pushToggle');
    const hint = document.getElementById('pushHint');
    if (!Push.soportado()) {
      btn.classList.add('hidden');
      hint.textContent = 'Los avisos automáticos todavía no están configurados en esta app (falta la llave VAPID) — revisa el README.';
      avisosEstado = 'sin configurar'; renderResumenesConfig();
      return;
    }
    if (!Push.instalada()) {
      btn.classList.add('hidden');
      hint.textContent = 'Para recibir avisos, primero agrega esta app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ese ícono.';
      avisosEstado = 'pendientes (primero instala la app)'; renderResumenesConfig();
      return;
    }
    btn.classList.remove('hidden');
    try { await Push.renovarSiCambio(perfil.id); } catch (e) { /* queda para activarlos con el botón */ }
    const suscrito = await Push.estaSuscrito();
    btn.classList.toggle('active', suscrito);
    btn.textContent = suscrito ? '🔔 Avisos activados en este dispositivo' : '🔔 Activar avisos en este dispositivo';
    avisosEstado = suscrito ? 'activados en este celular' : 'apagados en este celular';
    renderResumenesConfig();
    hint.textContent = suscrito
      ? 'Toca el botón para desactivarlos en este dispositivo.'
      : 'Te avisa a la hora del recordatorio y apenas se cumpla el tiempo del parche, aunque tengas el celular bloqueado o la app cerrada.';
  }
  document.getElementById('pushToggle').addEventListener('click', async () => {
    const btn = document.getElementById('pushToggle');
    btn.disabled = true;
    try {
      if (btn.classList.contains('active')) { await Push.desactivar(); showToast('Avisos desactivados en este dispositivo'); }
      else { await Push.activar(perfil.id); showToast('¡Avisos activados!'); }
    } catch (e) {
      showToast(e.message || 'No se pudo cambiar los avisos');
    } finally {
      btn.disabled = false;
      refrescarEstadoAvisos();
    }
  });

  // ================= PERSONALIZAR A MILI =================
  // La apariencia oficial vive en Supabase (compartida). Una copia local sirve
  // solo para dibujarla al instante al abrir la app, antes de que llegue la red.
  const APARIENCIA_LOCAL = 'ojitos-apariencia';
  let apariencia = Mili.DEFAULT;
  try { apariencia = Mili.normalizar(JSON.parse(localStorage.getItem(APARIENCIA_LOCAL))); } catch (e) {}
  function guardarAparienciaLocal() {
    try { localStorage.setItem(APARIENCIA_LOCAL, JSON.stringify(apariencia)); } catch (e) {}
  }

  function renderMili() {
    Mili.dibujar(document.getElementById('miliSvg'), document.getElementById('miliFigura'), apariencia, 'main');
  }

  let borrador = null;     // lo que se está eligiendo en el editor, antes de Guardar
  let miliTab = 'piel';

  const O = Mili.OPC;
  const hay = (k) => (b) => b[k] !== 'ninguno';
  const GRUPOS = {
    piel: [{ t: 'Color de piel', k: 'piel', colores: Mili.PIELES }],
    ojos: [{ t: 'Color de ojos', k: 'ojos', colores: Mili.OJOS }],
    parche: [
      { t: 'Forma del parche', k: 'parcheForma', chips: Mili.PARCHE_FORMAS },
      { t: 'Estampado', k: 'parcheEstampado', chips: Mili.PARCHE_ESTAMPADOS },
      { t: 'Color del parche', k: 'parcheColor', colores: Mili.PARCHE_COLORES, si: (b) => b.parcheEstampado !== 'arcoiris' },
      { t: 'Adorno', k: 'parcheAdorno', chips: Mili.PARCHE_ADORNOS },
    ],
    pelo: [
      { t: 'Peinado', k: 'peloEstilo', chips: Mili.PEINADOS },
      { t: 'Flequillo', k: 'flequillo', chips: Mili.FLEQUILLOS },
      { t: 'Color de pelo', k: 'peloColor', colores: Mili.PELOS },
    ],
    ropa: [
      { t: 'Vestido', k: 'vestido', chips: O.vestido },
      { t: 'Color del vestido', k: 'vestidoColor', colores: Mili.COLORES, si: hay('vestido') },
      { t: 'Arriba', k: 'arriba', chips: O.arriba, si: (b) => b.vestido === 'ninguno' },
      { t: 'Color de arriba', k: 'arribaColor', colores: Mili.COLORES, si: (b) => b.vestido === 'ninguno' },
      { t: 'Abajo', k: 'abajo', chips: O.abajo, si: (b) => b.vestido === 'ninguno' },
      { t: 'Color de abajo', k: 'abajoColor', colores: Mili.COLORES, si: (b) => b.vestido === 'ninguno' },
      { t: (b) => 'Estampado ' + (b.vestido !== 'ninguno' ? 'del vestido' : 'de arriba'), k: 'estampado', chips: Mili.ESTAMPADOS },
      { t: 'Encima', k: 'encima', chips: O.encima },
      { t: 'Color de lo de encima', k: 'encimaColor', colores: Mili.COLORES, si: hay('encima') },
    ],
    zapatos: [
      { t: 'Zapatos', k: 'zapatos', chips: O.zapatos },
      { t: 'Color de los zapatos', k: 'zapatosColor', colores: Mili.COLORES, si: hay('zapatos') },
    ],
    cabeza: [
      { t: 'Coronas y gorros', k: 'sombrero', chips: O.sombrero },
      { t: 'Color', k: 'sombreroColor', colores: Mili.JOYAS_COLORES, si: hay('sombrero') },
      { t: 'Accesorio del pelo', k: 'accesorio', chips: O.accesorio },
      { t: 'Color del accesorio', k: 'accesorioColor', colores: Mili.COLORES, si: hay('accesorio') },
    ],
    joyas: [
      { t: 'Aros', k: 'pendientes', chips: O.pendientes },
      { t: 'Color de los aros', k: 'pendientesColor', colores: Mili.JOYAS_COLORES, si: hay('pendientes') },
      { t: 'Collar', k: 'collar', chips: O.collar },
      { t: 'Color del collar', k: 'collarColor', colores: Mili.JOYAS_COLORES, si: hay('collar') },
      { t: 'Reloj o pulsera', k: 'muneca', chips: O.muneca },
      { t: 'Color', k: 'munecaColor', colores: Mili.JOYAS_COLORES, si: hay('muneca') },
      { t: 'Anillo', k: 'anillo', chips: O.anillo },
      { t: 'Color de la piedrita', k: 'anilloColor', colores: Mili.JOYAS_COLORES, si: hay('anillo') },
    ],
    lentes: [
      { t: 'Lentes', k: 'lentes', chips: O.lentes },
      { t: 'Color de los lentes', k: 'lentesColor', colores: Mili.COLORES, si: hay('lentes') },
    ],
  };

  function renderPreview() {
    Mili.dibujar(document.getElementById('miliPreviewSvg'), document.getElementById('miliPreviewFigura'), borrador, 'prev');
    document.getElementById('miliPreviewOjos').innerHTML = Mili.ojos(borrador, 'prev');
  }

  function renderPanel() {
    document.getElementById('miliPanel').innerHTML = GRUPOS[miliTab]
      .filter((g) => !g.si || g.si(borrador))
      .map((g) => {
        const titulo = typeof g.t === 'function' ? g.t(borrador) : g.t;
        const actual = borrador[g.k];
        let cuerpo;
        if (g.chips) {
          cuerpo = '<div class="chips">' + g.chips.map((o) =>
            '<button data-k="' + g.k + '" data-v="' + o.v + '"' + (o.v === actual ? ' class="active"' : '') + '>' + o.n + '</button>'
          ).join('') + '</div>';
        } else {
          const esPreset = g.colores.some((o) => o.c === actual);
          cuerpo = '<div class="swatches">' + g.colores.map((o) =>
            '<button class="swatch' + (o.c === actual ? ' active' : '') + '" data-k="' + g.k + '" data-v="' + o.c +
            '" style="background:' + o.c + '" title="' + o.n + '" aria-label="' + o.n + '"></button>'
          ).join('') +
            '<label class="swatch custom' + (esPreset ? '' : ' active') + '" title="Otro color"' +
            (esPreset ? '' : ' style="background:' + actual + '"') + '>' +
            '<input type="color" data-k="' + g.k + '" value="' + actual + '" aria-label="Otro color"></label>' +
            '</div>';
        }
        return '<div class="mili-group"><p>' + titulo + '</p>' + cuerpo + '</div>';
      }).join('');
  }

  const sheetMili = document.getElementById('sheetMili');
  function abrirMili() {
    borrador = { ...apariencia };
    renderPreview(); renderPanel();
    sheetMili.classList.add('show'); scrim.classList.add('show');
  }
  function cerrarMili() {
    sheetMili.classList.remove('show'); scrim.classList.remove('show');
    borrador = null;
  }

  document.getElementById('openMili').addEventListener('click', abrirMili);
  document.getElementById('closeMili').addEventListener('click', cerrarMili);

  document.getElementById('miliTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tab]');
    if (!btn) return;
    miliTab = btn.dataset.tab;
    document.querySelectorAll('#miliTabs button').forEach((b) => b.classList.toggle('active', b === btn));
    renderPanel();
  });

  const panel = document.getElementById('miliPanel');
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-k]');
    if (!btn) return;
    borrador[btn.dataset.k] = btn.dataset.v;
    renderPreview(); renderPanel();
  });
  // "Otro color": la vista previa cambia mientras se mueve el selector; el
  // panel se redibuja recién al soltar, para no cerrar el selector a medio uso.
  panel.addEventListener('input', (e) => {
    if (e.target.type !== 'color') return;
    borrador[e.target.dataset.k] = e.target.value;
    renderPreview();
  });
  panel.addEventListener('change', (e) => { if (e.target.type === 'color') renderPanel(); });

  document.getElementById('miliReset').addEventListener('click', () => {
    borrador = { ...Mili.DEFAULT };
    renderPreview(); renderPanel();
    showToast('Toca Guardar para dejarla así');
  });

  document.getElementById('miliSave').addEventListener('click', async () => {
    const btn = document.getElementById('miliSave');
    btn.disabled = true;
    try {
      const nueva = Mili.normalizar(borrador);
      await Config.guardarApariencia(nueva);
      apariencia = nueva;
      guardarAparienciaLocal();
      renderMili();
      cerrarMili();
      showToast('¡Mili quedó guardada! 🎀');
    } catch (e) {
      showToast(/apariencia/i.test(e.message || '')
        ? 'No se pudo guardar (¿corriste supabase/schema_apariencia.sql?)'
        : 'No se pudo guardar: ' + (e.message || 'intenta de nuevo'));
    } finally {
      btn.disabled = false;
    }
  });

  // Ojo con el parche registrado hoy ('derecho' | 'izquierdo' | 'ninguno'),
  // para que el avatar salga con su parche en las fotos (ella puede cambiarlo).
  function parcheDeHoy() {
    const rec = entries[Utils.todayId()];
    return rec ? rec.ojo : 'ninguno';
  }

  // Foto con el avatar tal cual está (no es un juego: no gasta tiempo de juego)
  document.getElementById('fotoAvatar').addEventListener('click', () => {
    Camara.abrir({
      dibujar: (o) => Mili.figuraFoto(apariencia, 'cam', o),
      brazo: () => Mili.brazoFoto(apariencia),
      conParche: true, parche: parcheDeHoy(),
    });
  });

  // ================= JUEGOS CON EL PARCHE (js/juegos-parche.js) =================
  document.getElementById('openJuegosParche').addEventListener('click', () => {
    JuegosParche.abrir({ minutosDia: juegoMinutos });
  });

  // ================= JUEGO DE VESTIR (js/juego.js) =================
  document.getElementById('openJuego').addEventListener('click', () => {
    Juego.abrir({ apariencia, minutosDia: juegoMinutos, toast: showToast, parcheHoy: parcheDeHoy() });
  });

  function renderJuegoHint() {
    renderResumenesConfig();
    const quedan = TiempoJuego.minutosRestantesHoy(juegoMinutos);
    document.getElementById('juegoMinutosHint').textContent = quedan === Infinity
      ? 'Sin límite (0 minutos = se puede jugar todo lo que quiera).'
      : 'Vale para "Jugar a vestir" y "Juegos con el parche", sumados. Hoy le quedan ' + quedan +
        ' min en este dispositivo; al acabarse, los juegos se cierran solos hasta mañana. 0 = sin límite.';
  }

  document.getElementById('juegoMinutosSave').addEventListener('click', async () => {
    const v = parseInt(document.getElementById('juegoMinutosInput').value, 10);
    if (isNaN(v) || v < 0) { showToast('Escribe un número de minutos válido (0 = sin límite)'); return; }
    try {
      await Config.guardarJuegoMinutos(v);
      juegoMinutos = v;
      renderJuegoHint();
      showToast('Tiempo de juego guardado');
    } catch (e) {
      showToast(/juego/i.test(e.message || '')
        ? 'No se pudo guardar (¿corriste supabase/schema_juego.sql?)'
        : 'No se pudo guardar: ' + (e.message || 'intenta de nuevo'));
    }
  });

  document.getElementById('juegoMasTiempo').addEventListener('click', () => {
    TiempoJuego.darMasTiempo();
    renderJuegoHint();
    showToast('Listo, la cuenta de hoy empieza de nuevo');
  });

  // Pide un segundo toque para confirmar, igual que en el juego.
  let confirmarResetTodos = null;
  document.getElementById('juegoResetTodos').addEventListener('click', async () => {
    const b = document.getElementById('juegoResetTodos');
    if (!confirmarResetTodos) {
      b.textContent = '¿Seguro? Toca otra vez para restablecer';
      confirmarResetTodos = setTimeout(() => { confirmarResetTodos = null; b.textContent = '↺ Restablecer todos los personajes'; }, 3000);
      return;
    }
    clearTimeout(confirmarResetTodos); confirmarResetTodos = null;
    b.textContent = '↺ Restablecer todos los personajes';
    try {
      await Juego.restablecerTodos(apariencia);
      showToast('Todos los personajes quedaron en blanco');
    } catch (e) {
      showToast(/juego/i.test(e.message || '')
        ? 'No se pudo (¿corriste supabase/schema_juego.sql?)'
        : 'No se pudo restablecer: ' + (e.message || 'intenta de nuevo'));
    }
  });

  // ---------- personas / admin ----------
  let personasCache = {};
  async function cargarPersonas() {
    const personas = await Auth.listarPerfiles();
    personasCache = {};
    personas.forEach(p => { personasCache[p.id] = p; });
    // Los nombres se ponen como texto (textContent), nunca como HTML.
    const list = document.getElementById('peopleList');
    const esAdmin = perfil.role === 'admin';
    list.innerHTML = '';
    personas.forEach(p => {
      const row = document.createElement('div');
      row.className = 'person-row';
      const nombre = document.createElement('span');
      nombre.className = 'p-name';
      nombre.textContent = p.nombre;
      row.appendChild(nombre);
      if (p.role === 'admin') {
        const badge = document.createElement('span');
        badge.className = 'badge-admin';
        badge.textContent = 'Admin';
        row.appendChild(badge);
      } else if (esAdmin && p.id !== perfil.id) {
        const quitar = document.createElement('button');
        quitar.className = 'p-quitar';
        quitar.dataset.id = p.id;
        quitar.textContent = 'Quitar acceso';
        quitar.setAttribute('aria-label', 'Quitar el acceso a ' + p.nombre);
        row.appendChild(quitar);
      }
      list.appendChild(row);
    });
    document.getElementById('inviteForm').classList.toggle('hidden', !esAdmin);
    renderToday(); renderList(); // por si ya cargó gente después del historial (nombres de "registrado por")
    renderResumenesConfig();
  }

  // Quitar acceso (solo admin): pide un segundo toque para confirmar.
  let confirmarQuitar = null;
  document.getElementById('peopleList').addEventListener('click', async (e) => {
    const b = e.target.closest('button.p-quitar');
    if (!b || !perfil || perfil.role !== 'admin') return;
    const id = b.dataset.id;
    if (!confirmarQuitar || confirmarQuitar.id !== id) {
      if (confirmarQuitar) { clearTimeout(confirmarQuitar.t); confirmarQuitar.btn.textContent = 'Quitar acceso'; confirmarQuitar.btn.classList.remove('confirmar'); }
      b.textContent = '¿Seguro? Toca otra vez';
      b.classList.add('confirmar');
      confirmarQuitar = { id, btn: b, t: setTimeout(() => { confirmarQuitar = null; b.textContent = 'Quitar acceso'; b.classList.remove('confirmar'); }, 4000) };
      return;
    }
    clearTimeout(confirmarQuitar.t); confirmarQuitar = null;
    const nombre = (personasCache[id] && personasCache[id].nombre) || 'Esa persona';
    b.disabled = true; b.textContent = 'Quitando…';
    try {
      await Auth.quitarAcceso(id);
      showToast(nombre + ' ya no tiene acceso');
    } catch (err) {
      showToast(err.message || 'No se pudo quitar el acceso');
    }
    await cargarPersonas();
  });

  document.getElementById('inviteSend').addEventListener('click', async () => {
    const email = document.getElementById('inviteEmail').value.trim();
    const nombre = document.getElementById('inviteNombre').value.trim();
    const err = document.getElementById('inviteError');
    err.classList.add('hidden');
    if (!email) { err.textContent = 'Escribe un correo.'; err.classList.remove('hidden'); return; }
    const btn = document.getElementById('inviteSend');
    btn.disabled = true; btn.textContent = 'Enviando…';
    try {
      await Auth.invitarPersona(email, nombre);
      document.getElementById('inviteEmail').value = '';
      document.getElementById('inviteNombre').value = '';
      showToast('Invitación enviada a ' + email);
      await cargarPersonas();
    } catch (e) {
      err.textContent = e.message || 'No se pudo invitar, intenta de nuevo';
      err.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Enviar invitación';
    }
  });

  // ================= TRATAMIENTO (js/tratamiento.js) =================
  const $t = (id) => document.getElementById(id);
  function avisarError(e) {
    showToast(/column|sacar_parche|function/i.test((e && e.message) || '')
      ? 'No se pudo guardar (¿corriste supabase/schema_tratamiento.sql?)'
      : 'No se pudo guardar, revisa tu conexión');
  }
  async function guardarConf(cambios, okTexto) {
    try { await Config.guardarTratamiento(cambios); if (okTexto) showToast(okTexto); return true; }
    catch (e) { avisarError(e); return false; }
  }

  // --- "ya se sacó el parche" ---
  $t('sacarBtn').addEventListener('click', async () => {
    const id = Utils.todayId(), rec = entries[id];
    if (!rec) return;
    const ahora = new Date().toISOString();
    try {
      await DB.sacarParche(id, ahora);
      rec.horaFin = ahora;
      renderAll();
      const min = Tratamiento.uso(rec, conf).min;
      showToast(min >= conf.duracion - 5 ? '¡Bien! Lo usó ' + Tratamiento.fmtDur(min) + ' 🎉' : 'Anotado: lo usó ' + Tratamiento.fmtDur(min) + ' de ' + Tratamiento.fmtDur(conf.duracion));
    } catch (e) { avisarError(e); }
  });
  $t('sacarDeshacer').addEventListener('click', async () => {
    const id = Utils.todayId(), rec = entries[id];
    if (!rec) return;
    try { await DB.sacarParche(id, null); rec.horaFin = null; renderAll(); showToast('Listo: sigue con el parche puesto'); }
    catch (e) { avisarError(e); }
  });

  // --- indicación del oftalmólogo ---
  function renderConfigTratamiento() {
    renderResumenesConfig();
    document.querySelectorAll('#indOjo button').forEach(b => b.classList.toggle('active', b.dataset.v === conf.ojo));
    document.querySelectorAll('#indDias button').forEach(b => b.classList.toggle('active', conf.dias.includes(Number(b.dataset.d))));
    $t('indHint').textContent = 'Ahora: ' + Tratamiento.textoIndicacion(conf) + '.';
    $t('premioMeta').value = conf.premioMeta ? String(conf.premioMeta) : '';
    $t('premioTexto').value = conf.premioTexto;
    $t('ctrlFecha').value = conf.controlFecha || '';
    $t('ctrlHora').value = conf.controlHora || '';
    $t('ctrlDetalle').value = conf.controlDetalle;
    $t('ctrlPreguntas').value = conf.controlPreguntas;
    $t('ctrlQuitar').classList.toggle('hidden', !conf.controlFecha && !conf.controlPreguntas);
    $t('resumenActivo').checked = conf.resumenActivo;
  }
  $t('indOjo').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b || b.dataset.v === conf.ojo) return;
    const antes = conf.ojo;
    conf.ojo = b.dataset.v;
    renderConfigTratamiento(); renderAll();
    if (!(await guardarConf({ indicacion_ojo: conf.ojo }, 'Indicación guardada'))) { conf.ojo = antes; renderConfigTratamiento(); renderAll(); }
  });
  $t('indDias').addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-d]');
    if (!b) return;
    const d = Number(b.dataset.d), antes = conf.dias.slice();
    const dias = antes.includes(d) ? antes.filter(x => x !== d) : antes.concat(d).sort();
    if (!dias.length) { showToast('Tiene que quedar al menos un día'); return; }
    conf.dias = dias;
    renderConfigTratamiento(); renderAll();
    if (!(await guardarConf({ indicacion_dias: dias }, 'Días guardados'))) { conf.dias = antes; renderConfigTratamiento(); renderAll(); }
  });

  // --- esta semana (gráfico) ---
  function durCorta(min) {
    min = Math.round(min);
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + 'h' + (m ? String(m).padStart(2, '0') : '') : m + 'm';
  }
  function renderSemana() {
    const dias = Tratamiento.semana(entries, conf);
    const tope = Math.max(conf.duracion * 1.25, ...dias.map(x => (x.uso ? x.uso.min : 0)));
    const meta = Math.round(100 * conf.duracion / tope);
    $t('semanaGraf').innerHTML = dias.map((x) => {
      const min = x.uso ? x.uso.min : 0;
      const cls = 'sem-dia' + (x.hoy ? ' hoy' : '') + (!x.indicado ? ' libre' : '') + (x.futuro ? ' futuro' : '') +
        (x.rec ? ' ' + x.rec.ojo : '') + (x.uso && x.uso.estimado ? ' estimado' : '') + (x.uso && x.uso.enCurso ? ' encurso' : '');
      const etq = x.rec ? durCorta(min) : (!x.indicado ? 'libre' : (x.futuro || x.hoy ? '' : '—'));
      return '<div class="' + cls + '"><div class="sem-barra"><i style="bottom:' + meta + '%"></i><span style="height:' + Math.round(100 * min / tope) + '%"></span></div>' +
        '<b>' + x.corto + '</b><small>' + etq + '</small></div>';
    }).join('');
    const indicados = dias.filter(x => x.indicado && !x.futuro).length;
    const hechos = dias.filter(x => x.rec && x.indicado).length;
    const total = dias.reduce((s, x) => s + (x.uso ? x.uso.min : 0), 0);
    const estimados = dias.filter(x => x.uso && x.uso.estimado).length;
    $t('semanaResumen').textContent = hechos + ' de ' + indicados + ' días hasta hoy · ' + Tratamiento.fmtDur(total) + ' con el parche' +
      (estimados ? ' (' + estimados + ' día' + (estimados > 1 ? 's' : '') + ' sin hora de sacado: se estimó la duración indicada)' : '') + '.';
  }

  // --- premio por constancia (tarjeta de la pantalla principal) ---
  function renderPremio() {
    const card = $t('premioCard');
    const p = Tratamiento.premio(entries, conf);
    if (!p) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    card.classList.toggle('logrado', p.logrado);
    const texto = Utils.esc(p.texto);
    const dias = p.dias.map((x) => '<span class="pr-dia' + (x.rec ? ' hecho' : '') + (x.futuro ? ' futuro' : '') + (!x.indicado ? ' libre' : '') + (x.hoy ? ' hoy' : '') + '">' +
      '<i>' + (x.rec ? '⭐' : '') + '</i><b>' + x.corto + '</b></span>').join('');
    card.innerHTML =
      '<div class="pr-titulo">' + (p.logrado ? '🎉 ¡Lo lograste! Ganaste: ' + texto : '🏆 Premio de la semana: ' + texto) + '</div>' +
      '<div class="pr-sub">' + (p.logrado ? p.hechos + ' días con parche esta semana 💖' : p.hechos + ' de ' + p.meta + ' días · ¡te falta' + (p.faltan > 1 ? 'n ' : ' ') + p.faltan + '!') + '</div>' +
      '<div class="pr-dias">' + dias + '</div>';
  }
  $t('premioGuardar').addEventListener('click', async () => {
    const meta = parseInt($t('premioMeta').value, 10) || null;
    let texto = $t('premioTexto').value.trim().slice(0, 60);
    if (meta && !texto) texto = 'un premio sorpresa 🎁';
    if (await guardarConf({ premio_meta: meta, premio_texto: texto || null }, meta ? 'Premio guardado' : 'Premio quitado')) {
      conf.premioMeta = meta; conf.premioTexto = texto;
      renderConfigTratamiento(); renderPremio();
    }
  });

  // --- próximo control ---
  function renderControl() {
    const b = $t('controlCard');
    const c = Tratamiento.control(conf);
    if (!c) { b.classList.add('hidden'); return; }
    b.classList.remove('hidden');
    b.classList.toggle('pronto', c.dias <= 1);
    b.textContent = '👁️ Control con el oftalmólogo ' + c.cuando + ' · ' + c.fecha;
  }
  $t('controlCard').addEventListener('click', () => abrirConfig('cfgControl'));
  $t('ctrlGuardar').addEventListener('click', async () => {
    const fecha = $t('ctrlFecha').value || null, hora = $t('ctrlHora').value || null;
    const detalle = $t('ctrlDetalle').value.trim().slice(0, 80), preguntas = $t('ctrlPreguntas').value.trim().slice(0, 1500);
    if (!fecha && !preguntas) { showToast('Elige la fecha del control'); return; }
    if (fecha && fecha < Utils.todayId()) { showToast('Esa fecha ya pasó'); return; }
    if (await guardarConf({ control_fecha: fecha, control_hora: hora, control_detalle: detalle || null, control_preguntas: preguntas || null, control_aviso_enviado: null }, 'Control guardado')) {
      Object.assign(conf, { controlFecha: fecha, controlHora: hora, controlDetalle: detalle, controlPreguntas: preguntas });
      renderConfigTratamiento(); renderControl();
    }
  });
  $t('ctrlQuitar').addEventListener('click', async () => {
    if (await guardarConf({ control_fecha: null, control_hora: null, control_detalle: null, control_preguntas: null, control_aviso_enviado: null }, 'Control quitado')) {
      Object.assign(conf, { controlFecha: null, controlHora: null, controlDetalle: '', controlPreguntas: '' });
      renderConfigTratamiento(); renderControl();
    }
  });

  // --- resumen semanal ---
  $t('resumenActivo').addEventListener('change', async (e) => {
    const v = e.target.checked;
    if (await guardarConf({ resumen_activo: v }, v ? 'Resumen semanal activado' : 'Resumen semanal desactivado')) conf.resumenActivo = v;
    else e.target.checked = !v;
  });

  // --- informe para el doctor ---
  let informeActual = null;
  $t('infVer').addEventListener('click', () => {
    const dias = parseInt($t('infPeriodo').value, 10) || 28;
    const desde = new Date(); desde.setDate(desde.getDate() - (dias - 1));
    informeActual = Tratamiento.informe(entries, conf, Utils.dateId(desde), Utils.todayId());
    $t('infHoja').innerHTML = informeActual.html;
    $t('informe').classList.remove('hidden');
    document.body.classList.add('con-informe');
  });
  $t('infCerrar').addEventListener('click', () => { $t('informe').classList.add('hidden'); document.body.classList.remove('con-informe'); });
  $t('infImprimir').addEventListener('click', () => window.print());
  $t('infCompartir').addEventListener('click', async () => {
    if (!informeActual) return;
    try {
      if (navigator.share) { await navigator.share({ title: informeActual.titulo, text: informeActual.texto }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(informeActual.texto); showToast('Informe copiado: pégalo en WhatsApp o en un correo'); }
    catch (e) { showToast('No se pudo compartir: usa "PDF"'); }
  });

  // ================= interacciones del historial =================
  document.getElementById('list').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const row = e.target.closest('.row');
    const id = row.dataset.id;
    const act = btn.dataset.act;
    if (act === 'del') { pendingDelete = id; renderList(); }
    else if (act === 'no') { pendingDelete = null; renderList(); }
    else if (act === 'yes') {
      pendingDelete = null;
      DB.eliminarRegistro(id)
        .then(() => { delete entries[id]; renderAll(); })
        .catch(() => showToast('No se pudo eliminar, intenta de nuevo'));
    }
  });

  document.getElementById('undoBtn').addEventListener('click', () => {
    const id = Utils.todayId();
    DB.eliminarRegistro(id)
      .then(() => { delete entries[id]; renderAll(); showToast('Registro de hoy eliminado'); })
      .catch(() => showToast('No se pudo deshacer, intenta de nuevo'));
  });

  const sheet = document.getElementById('sheet'), scrim = document.getElementById('scrim');
  function openSheet() { sheet.classList.add('show'); scrim.classList.add('show'); }
  function closeSheet() { sheet.classList.remove('show'); scrim.classList.remove('show'); }
  document.getElementById('openHistory').addEventListener('click', openSheet);
  document.getElementById('closeHistory').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);

  // ================= CONFIGURACIÓN =================
  // Todo lo que se ajusta (tratamiento, avisos, control, premio, juegos y
  // personas), en grupos que se abren y cierran; cada uno muestra un resumen.
  const sheetConfig = document.getElementById('sheetConfig');
  function abrirConfig(grupo) {
    refrescarEstadoAvisos(); renderJuegoHint(); renderResumenesConfig();
    sheetConfig.classList.add('show'); scrim.classList.add('show');
    if (grupo) {
      const g = document.getElementById(grupo);
      g.open = true;
      setTimeout(() => g.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
    }
  }
  function cerrarConfig() { sheetConfig.classList.remove('show'); scrim.classList.remove('show'); }
  document.getElementById('openConfig').addEventListener('click', () => abrirConfig());
  document.getElementById('closeConfig').addEventListener('click', cerrarConfig);
  scrim.addEventListener('click', cerrarConfig);
  function renderResumenesConfig() {
    const pon = (id, t) => { const el = document.getElementById(id); if (el) el.textContent = t; };
    pon('cfgTratamientoRes', Tratamiento.textoIndicacion(conf));
    pon('cfgAvisosRes', (avisosEstado ? 'Avisos ' + avisosEstado : 'Avisos') +
      (recordatorioHora ? ' · recordatorio ' + Utils.fmtTime('2000-01-01T' + recordatorioHora + ':00') : ' · sin recordatorio'));
    const c = Tratamiento.control(conf);
    pon('cfgControlRes', c ? c.fecha + ' (' + c.cuando + ')' : 'Sin fecha anotada');
    pon('cfgPremioRes', conf.premioMeta ? conf.premioMeta + ' días a la semana → ' + (conf.premioTexto || 'premio') : 'Sin premio');
    pon('cfgJuegosRes', juegoMinutos ? juegoMinutos + ' min de juego al día' : 'Sin límite de juego');
    const n = Object.keys(personasCache).length;
    pon('cfgPersonasRes', n ? n + (n === 1 ? ' persona' : ' personas') + (perfil && perfil.role === 'admin' ? ' · tú eres admin' : '') : '');
  }
  scrim.addEventListener('click', () => { if (sheetMili.classList.contains('show')) cerrarMili(); });

  const addForm = document.getElementById('addForm'), addToggle = document.getElementById('addToggle');
  let chosenSide = 'derecho';
  addToggle.addEventListener('click', () => {
    const showing = addForm.classList.toggle('show');
    if (showing) {
      document.getElementById('addDate').value = Utils.todayId();
      const now = new Date();
      document.getElementById('addTime').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      document.getElementById('addTimeFin').value = '';
    }
  });
  document.getElementById('addCancel').addEventListener('click', () => addForm.classList.remove('show'));
  addForm.querySelectorAll('.seg button').forEach(b => {
    b.addEventListener('click', () => {
      chosenSide = b.dataset.side;
      addForm.querySelectorAll('.seg button').forEach(x => x.classList.toggle('active', x === b));
    });
  });
  document.getElementById('addSave').addEventListener('click', async () => {
    const dateVal = document.getElementById('addDate').value;
    const timeVal = document.getElementById('addTime').value || '09:00';
    if (!dateVal) { showToast('Elige una fecha'); return; }
    const iso = new Date(dateVal + 'T' + timeVal + ':00').toISOString();
    const finVal = document.getElementById('addTimeFin').value;
    const finIso = finVal ? new Date(dateVal + 'T' + finVal + ':00').toISOString() : null;
    if (finIso && finIso <= iso) { showToast('La hora en que se sacó tiene que ser después de la hora en que se puso'); return; }
    try {
      await DB.guardarRegistro(dateVal, chosenSide, iso, perfil.id, finIso);
      entries[dateVal] = { fecha: dateVal, ojo: chosenSide, hora: iso, horaFin: finIso, registradoPor: perfil.id };
      renderAll();
      addForm.classList.remove('show');
      showToast('Registro guardado');
    } catch (e) { showToast('No se pudo guardar, intenta de nuevo'); }
  });

  // ================= arranque =================
  async function boot() {
    wireLogin();
    renderMili();
    wireEye(document.getElementById('eyeDerecho'), 'derecho');
    wireEye(document.getElementById('eyeIzquierdo'), 'izquierdo');

    if (!SUPABASE_CONFIGURADO) { showOverlay('authConfigError'); return; }

    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        document.getElementById('setPasswordMuted').textContent = 'Elige una contraseña nueva para tu cuenta.';
        showOverlay('authSetPassword');
      }
    });

    await arrancarSesion();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
