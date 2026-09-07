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
      if (p1.length < 6) { err.textContent = 'La contraseña debe tener al menos 6 caracteres.'; err.classList.remove('hidden'); return; }
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
      await DB.guardarRegistro(id, side, horaISO, perfil.id);
      entries[id] = { fecha: id, ojo: side, hora: horaISO, registradoPor: perfil.id };
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

    if (rec) {
      const autor = personasCache[rec.registradoPor];
      line.innerHTML = '🩹 <span class="pill ' + rec.ojo + '">' + Utils.label(rec.ojo) + '</span> · puesto a las ' + Utils.fmtTime(rec.hora) +
        (autor ? '<span class="status-by">Registrado por ' + autor.nombre + '</span>' : '');
      hint.innerHTML = '';
      undo.classList.remove('hidden');
    } else {
      line.innerHTML = '<span class="status-empty">Aún no registras el parche de hoy</span>';
      undo.classList.add('hidden');
      const ids = Object.keys(entries).filter(k => k !== id).sort();
      const last = ids.length ? entries[ids[ids.length - 1]] : null;
      if (last) {
        const suggestion = last.ojo === 'derecho' ? 'izquierdo' : 'derecho';
        hint.innerHTML = '<span class="hint-chip">💡 La última vez fue ojo ' + last.ojo + ' — hoy probablemente toca ' + suggestion + '</span>';
      } else {
        hint.innerHTML = '<span class="hint-chip">Toca un ojito para registrar el parche de hoy</span>';
      }
    }
  }

  function computeStats() {
    const ids = Object.keys(entries).sort();
    const total = ids.length;
    let countD = 0, countI = 0;
    ids.forEach(id => { if (entries[id].ojo === 'derecho') countD++; else countI++; });

    let streak = 0;
    const cursor = new Date();
    if (!entries[Utils.todayId()]) cursor.setDate(cursor.getDate() - 1);
    while (entries[Utils.dateId(cursor)]) { streak++; cursor.setDate(cursor.getDate() - 1); }

    let constancia = 0;
    if (total > 0) {
      const first = Utils.parseId(ids[0]);
      const now = new Date();
      const days = Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(first.getFullYear(), first.getMonth(), first.getDate())) / 86400000) + 1;
      constancia = Math.round(100 * total / Math.max(days, 1));
    }
    return { total, countD, countI, streak, constancia };
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
        div.className = 'cal-cell' + (rec ? ' ' + rec.ojo : '') + (id === Utils.todayId() ? ' today' : '');
        div.textContent = d.getDate();
        div.title = Utils.fmtShort(d) + (rec ? ' · ' + Utils.label(rec.ojo) + ' · ' + Utils.fmtTime(rec.hora) : ' · sin registro');
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
          '<div class="d2">' + Utils.fmtTime(rec.hora) + (autor ? ' · ' + autor.nombre : '') + '</div></div>' +
          '<button class="del" data-act="del" title="Eliminar">🗑</button>';
      }
      list.appendChild(row);
    });
  }

  function renderAll() { renderToday(); renderStats(); renderCalendar(); renderList(); renderTimer(); }

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

    if (!rec) {
      card.classList.add('idle'); card.classList.remove('done');
      sandTop.setAttribute('y', 26); sandTop.setAttribute('height', 110);
      sandBottom.setAttribute('y', 254); sandBottom.setAttribute('height', 0);
      text.textContent = 'Cuando le pongas el parche, aquí vas a ver cuánto falta ⏳';
      return;
    }

    const duracionMs = duracionMinutos * 60000;
    const transcurrido = Date.now() - new Date(rec.hora).getTime();
    const fraccion = Math.max(0, Math.min(1, transcurrido / duracionMs));

    const topApexY = 136, topStartY = 26;
    const nivelTop = topStartY + (topApexY - topStartY) * fraccion;
    sandTop.setAttribute('y', nivelTop);
    sandTop.setAttribute('height', Math.max(0, topApexY - nivelTop));

    const botApexY = 144, botStartY = 254;
    const nivelBot = botStartY - (botStartY - botApexY) * fraccion;
    sandBottom.setAttribute('y', Math.max(botApexY, nivelBot));
    sandBottom.setAttribute('height', Math.max(0, botStartY - nivelBot));

    if (fraccion >= 1) {
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
      actualizarDuracionHint(v);
      renderTimer();
      showToast('Duración guardada');
    } catch (e) {
      showToast('No se pudo guardar (¿corriste supabase/schema_temporizador.sql?)');
    }
  });

  // ================= AVISOS (push) =================
  async function refrescarEstadoAvisos() {
    const btn = document.getElementById('pushToggle');
    const hint = document.getElementById('pushHint');
    if (!Push.soportado()) {
      btn.classList.add('hidden');
      hint.textContent = 'Los avisos automáticos todavía no están configurados en esta app (falta la llave VAPID) — revisa el README.';
      return;
    }
    if (!Push.instalada()) {
      btn.classList.add('hidden');
      hint.textContent = 'Para recibir avisos, primero agrega esta app a tu pantalla de inicio (Compartir → Agregar a inicio) y ábrela desde ese ícono.';
      return;
    }
    btn.classList.remove('hidden');
    const suscrito = await Push.estaSuscrito();
    btn.classList.toggle('active', suscrito);
    btn.textContent = suscrito ? '🔔 Avisos activados en este dispositivo' : '🔔 Activar avisos en este dispositivo';
    hint.textContent = suscrito
      ? 'Toca el botón para desactivarlos en este dispositivo.'
      : 'Te avisa apenas se cumpla el tiempo del parche, aunque tengas el celular bloqueado o la app cerrada.';
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

  // ---------- personas / admin ----------
  let personasCache = {};
  async function cargarPersonas() {
    const personas = await Auth.listarPerfiles();
    personasCache = {};
    personas.forEach(p => { personasCache[p.id] = p; });
    const list = document.getElementById('peopleList');
    list.innerHTML = personas.map(p =>
      '<div class="person-row"><span class="p-name">' + p.nombre + '</span>' +
      (p.role === 'admin' ? '<span class="badge-admin">Admin</span>' : '') +
      '</div>'
    ).join('');
    document.getElementById('inviteForm').classList.toggle('hidden', perfil.role !== 'admin');
    renderToday(); renderList(); // por si ya cargó gente después del historial (nombres de "registrado por")
  }

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
  document.getElementById('openHistory').addEventListener('click', () => { openSheet(); refrescarEstadoAvisos(); });
  document.getElementById('closeHistory').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);

  const addForm = document.getElementById('addForm'), addToggle = document.getElementById('addToggle');
  let chosenSide = 'derecho';
  addToggle.addEventListener('click', () => {
    const showing = addForm.classList.toggle('show');
    if (showing) {
      document.getElementById('addDate').value = Utils.todayId();
      const now = new Date();
      document.getElementById('addTime').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
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
    try {
      await DB.guardarRegistro(dateVal, chosenSide, iso, perfil.id);
      entries[dateVal] = { fecha: dateVal, ojo: chosenSide, hora: iso, registradoPor: perfil.id };
      renderAll();
      addForm.classList.remove('show');
      showToast('Registro guardado');
    } catch (e) { showToast('No se pudo guardar, intenta de nuevo'); }
  });

  // ================= arranque =================
  async function boot() {
    wireLogin();
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
