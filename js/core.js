// core.js — helpers de fecha/hora y la capa de datos de "registros" (Supabase).
// Los registros son compartidos entre todas las cuentas invitadas: cualquiera con
// acceso ve y mantiene el mismo historial de Mili.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto',
  'septiembre', 'octubre', 'noviembre', 'diciembre'];

const Utils = {
  dateId(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },
  todayId() { return Utils.dateId(new Date()); },
  parseId(id) { const [y, m, d] = id.split('-').map(Number); return new Date(y, m - 1, d); },
  fmtLong(d) { return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; },
  fmtShort(d) { return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`; },
  fmtTime(iso) {
    try {
      const d = new Date(iso);
      let h = d.getHours();
      const m = String(d.getMinutes()).padStart(2, '0');
      const ap = h >= 12 ? 'p.m.' : 'a.m.';
      h = h % 12; if (h === 0) h = 12;
      return `${h}:${m} ${ap}`;
    } catch (e) { return ''; }
  },
  label(side) { return side === 'derecho' ? 'Derecho' : 'Izquierdo'; },
  iniciales(nombre) {
    if (!nombre) return '?';
    return nombre.trim().split(/\s+/).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  },
};

function rowToRegistro(r) {
  return { fecha: r.fecha, ojo: r.ojo, hora: r.hora, registradoPor: r.registrado_por, id: r.id };
}

const DB = {
  // Trae todo el historial (hasta 400 días) como { [fecha]: registro }.
  async cargarRegistros() {
    const { data, error } = await supabaseClient
      .from('registros')
      .select('id, fecha, ojo, hora, registrado_por')
      .order('fecha', { ascending: false })
      .limit(400);
    if (error) throw error;
    const out = {};
    (data || []).forEach(r => { out[r.fecha] = rowToRegistro(r); });
    return out;
  },

  // Crea o reemplaza el registro de un día (upsert por fecha, que es unique).
  // notificado se resetea a false: si se corrige la hora, el temporizador
  // (Edge Function send-patch-reminders) debe volver a evaluarlo.
  async guardarRegistro(fecha, ojo, horaISO, userId) {
    const payload = { fecha, ojo, hora: horaISO || new Date().toISOString(), registrado_por: userId, notificado: false };
    let { error } = await supabaseClient.from('registros').upsert(payload, { onConflict: 'fecha' });
    if (error && /notificado/i.test(error.message || '')) {
      // Todavía no corriste supabase/schema_temporizador.sql — sigue funcionando
      // igual, solo que sin el temporizador hasta que lo corras.
      delete payload.notificado;
      ({ error } = await supabaseClient.from('registros').upsert(payload, { onConflict: 'fecha' }));
    }
    if (error) throw error;
  },

  async eliminarRegistro(fecha) {
    const { error } = await supabaseClient.from('registros').delete().eq('fecha', fecha);
    if (error) throw error;
  },

  // Realtime: avisa con la fila completa (INSERT/UPDATE/DELETE) para mantener la
  // vista sincronizada entre todos los dispositivos con sesión iniciada.
  suscribirRegistros(onChange) {
    return supabaseClient
      .channel('registros-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registros' }, onChange)
      .subscribe();
  },
};

// ---------- duración del parche (temporizador) ----------
const Config = {
  async obtenerDuracionMinutos() {
    const { data, error } = await supabaseClient
      .from('configuracion')
      .select('duracion_minutos')
      .eq('id', 'general')
      .maybeSingle();
    if (error || !data) return 120; // valor por defecto si aún no se corrió schema_temporizador.sql
    return data.duracion_minutos;
  },
  async guardarDuracionMinutos(minutos) {
    const { error } = await supabaseClient
      .from('configuracion')
      .upsert({ id: 'general', duracion_minutos: minutos, updated_at: new Date().toISOString() });
    if (error) throw error;
  },
};

// ---------- avisos push (temporizador) ----------
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const Push = {
  soportado() {
    return PUSH_CONFIGURADO && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },
  // En iPhone, el Push API solo funciona si la app está instalada (abierta
  // desde el ícono de la pantalla de inicio), no en una pestaña suelta de Safari.
  instalada() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  },
  async estaSuscrito() {
    if (!this.soportado()) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  },
  async activar(userId) {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') throw new Error('No diste permiso para las notificaciones');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = sub.toJSON();
    const { error } = await supabaseClient.from('push_subscriptions').upsert(
      { user_id: userId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      { onConflict: 'endpoint' }
    );
    if (error) throw error;
  },
  async desactivar() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await supabaseClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  },
};
