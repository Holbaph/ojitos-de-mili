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
  async guardarRegistro(fecha, ojo, horaISO, userId) {
    const { error } = await supabaseClient
      .from('registros')
      .upsert(
        { fecha, ojo, hora: horaISO || new Date().toISOString(), registrado_por: userId },
        { onConflict: 'fecha' }
      );
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
