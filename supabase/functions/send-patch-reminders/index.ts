// send-patch-reminders — la llama pg_cron cada minuto (ver
// supabase/schema_temporizador.sql), no una persona. Hace dos revisiones y
// manda avisos push a todos los dispositivos suscritos — así llegan aunque
// nadie tenga la app abierta ni el celular desbloqueado:
//   1. Recordatorio diario: si llegó la hora configurada y todavía no se
//      registró el parche de hoy (ver supabase/schema_recordatorio.sql).
//   2. Temporizador: si el registro de hoy ya cumplió su tiempo de parche
//      (y todavía no se anotó que se lo sacaron).
//   3. Próximo control: el día antes, desde las 19:00 (schema_tratamiento.sql).
//   4. Resumen semanal: los domingos desde las 19:00, si está activado.
// El recordatorio no se manda en los días libres de la indicación del doctor.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

webpush.setVapidDetails(
  'mailto:phernandez@softcorp.cl',
  Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
)

const sb = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// El recordatorio solo se manda dentro de esta ventana después de la hora
// elegida — así, si alguien lo configura a las 8:00 cuando ya son las 15:00,
// no llega un aviso "atrasado" de inmediato.
const VENTANA_RECORDATORIO_MIN = 60

async function enviarATodos(payload: { title: string; body: string; tag: string }) {
  const { data: subs } = await sb.from('push_subscriptions').select('id, endpoint, p256dh, auth')
  if (!subs?.length) return
  const texto = JSON.stringify(payload)
  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          texto
        )
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 410 || statusCode === 404) {
          await sb.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    })
  )
}

// Fecha (YYYY-MM-DD) y minuto del día en la zona horaria de la familia.
function ahoraEnZona(zona: string) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zona,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value])
  )
  const fecha = `${partes.year}-${partes.month}-${partes.day}`
  return {
    fecha,
    minutoDelDia: Number(partes.hour) * 60 + Number(partes.minute),
    diaSemana: diaDe(fecha), // 0 = domingo … 6 = sábado
  }
}

// Utilidades de fechas 'YYYY-MM-DD' (sin horas, sin zonas).
const diaDe = (fecha: string) => new Date(fecha + 'T12:00:00Z').getUTCDay()
function sumarDias(fecha: string, n: number) {
  const d = new Date(fecha + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
function fmtDur(min: number) {
  min = Math.max(0, Math.round(min))
  const h = Math.floor(min / 60), m = min % 60
  return h ? `${h} h${m ? ' ' + m + ' min' : ''}` : `${m} min`
}
const diasIndicados = (config: Record<string, unknown> | null) =>
  Array.isArray(config?.indicacion_dias) ? (config!.indicacion_dias as number[]).map(Number) : [0, 1, 2, 3, 4, 5, 6]
const zonaDe = (config: Record<string, unknown> | null) => (config?.recordatorio_zona as string) || 'America/Santiago'

// "Reclama" un envío del día marcando la columna ANTES de mandar, y solo si
// nadie la marcó antes: así, aunque dos ejecuciones se crucen, sale una vez.
async function reclamar(columna: string, fecha: string) {
  const { data } = await sb
    .from('configuracion')
    .update({ [columna]: fecha })
    .eq('id', 'general')
    .or(`${columna}.is.null,${columna}.neq.${fecha}`)
    .select('id')
  return !!data?.length
}

async function revisarRecordatorio(config: Record<string, unknown> | null) {
  const hora = config?.recordatorio_hora as string | null | undefined
  if (!hora) return false

  const { fecha, minutoDelDia, diaSemana } = ahoraEnZona(zonaDe(config))
  const [h, m] = hora.split(':').map(Number)
  const desde = h * 60 + m
  if (minutoDelDia < desde || minutoDelDia >= desde + VENTANA_RECORDATORIO_MIN) return false
  if (config?.recordatorio_ultimo_envio === fecha) return false
  // día libre según la indicación del doctor: no se recuerda nada
  if (!diasIndicados(config).includes(diaSemana)) return false

  if (!(await reclamar('recordatorio_ultimo_envio', fecha))) return false

  // Si ya le pusieron el parche hoy, no hace falta recordar nada.
  const { data: hoy } = await sb.from('registros').select('fecha').eq('fecha', fecha).limit(1)
  if (hoy?.length) return false

  await enviarATodos({
    title: '¡Hora del parche de Mili! 🩹',
    body: 'Todavía no se registra el parche de hoy.',
    tag: 'ojitos-de-mili-recordatorio',
  })
  return true
}

async function revisarTemporizador(config: Record<string, unknown> | null) {
  const duracionMin = (config?.duracion_minutos as number) ?? 120

  // Mira los últimos 2 días por si el turno cruzó la medianoche.
  const desde = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const { data: registros } = await sb
    .from('registros')
    .select('fecha, hora, hora_fin')
    .eq('notificado', false)
    .gte('fecha', desde)

  // Si ya se anotó que se lo sacaron, no hace falta avisar.
  const sacados = (registros ?? []).filter((r) => r.hora_fin)
  if (sacados.length) {
    await sb.from('registros').update({ notificado: true }).in('fecha', sacados.map((r) => r.fecha))
  }

  const ahora = Date.now()
  const vencidos = (registros ?? []).filter((r) => {
    if (r.hora_fin) return false
    const fin = new Date(r.hora).getTime() + duracionMin * 60000
    return fin <= ahora
  })
  if (!vencidos.length) return 0

  await enviarATodos({
    title: '¡Ya se puede sacar el parche! 🎉',
    body: 'Se cumplió el tiempo de hoy para Mili.',
    tag: 'ojitos-de-mili-temporizador',
  })

  await sb
    .from('registros')
    .update({ notificado: true })
    .in('fecha', vencidos.map((r) => r.fecha))

  return vencidos.length
}

// El día antes del control con el oftalmólogo, desde las 19:00.
async function revisarControl(config: Record<string, unknown> | null) {
  const control = config?.control_fecha as string | null | undefined
  if (!control) return false
  const { fecha, minutoDelDia } = ahoraEnZona(zonaDe(config))
  if (control !== sumarDias(fecha, 1) || minutoDelDia < 19 * 60) return false
  if (config?.control_aviso_enviado === fecha) return false
  if (!(await reclamar('control_aviso_enviado', fecha))) return false

  const hora = (config?.control_hora as string | null)?.slice(0, 5)
  const detalle = String(config?.control_detalle || '').slice(0, 80)
  await enviarATodos({
    title: 'Mañana es el control con el oftalmólogo 👁️',
    body: `${hora ? 'A las ' + hora + '. ' : ''}${detalle ? detalle + '. ' : ''}Revisa las preguntas y el informe en la app.`,
    tag: 'ojitos-de-mili-control',
  })
  return true
}

// Los domingos desde las 19:00: cómo fue la semana (lunes a domingo).
async function revisarResumen(config: Record<string, unknown> | null) {
  if (config?.resumen_activo === false) return false
  const { fecha, minutoDelDia, diaSemana } = ahoraEnZona(zonaDe(config))
  if (diaSemana !== 0 || minutoDelDia < 19 * 60) return false
  if (config?.resumen_ultimo_envio === fecha) return false
  if (!(await reclamar('resumen_ultimo_envio', fecha))) return false

  const lunes = sumarDias(fecha, -6)
  const { data: semana } = await sb
    .from('registros')
    .select('fecha, hora, hora_fin')
    .gte('fecha', lunes)
    .lte('fecha', fecha)
  const dias = diasIndicados(config)
  const duracion = (config?.duracion_minutos as number) ?? 120
  const regs = semana ?? []
  const hechos = regs.filter((r) => dias.includes(diaDe(r.fecha))).length
  const minutos = regs.reduce((s, r) => s + (r.hora_fin
    ? (new Date(r.hora_fin).getTime() - new Date(r.hora).getTime()) / 60000
    : duracion), 0)

  let premio = ''
  const meta = config?.premio_meta as number | null
  if (meta) {
    const texto = String(config?.premio_texto || 'el premio').slice(0, 60)
    const faltan = meta - regs.length
    premio = faltan <= 0 ? ` ¡Ganó el premio: ${texto}! 🎉` : ` Le faltó ${faltan} día${faltan > 1 ? 's' : ''} para el premio.`
  }
  await enviarATodos({
    title: 'Resumen de la semana de Mili ⭐',
    body: `Esta semana: ${hechos} de ${dias.length} días con parche · ${fmtDur(minutos)} en total.${premio}`,
    tag: 'ojitos-de-mili-resumen',
  })
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // select('*') para que siga funcionando aunque todavía no se haya corrido
    // schema_recordatorio.sql (simplemente no habrá recordatorio_hora).
    const { data: config } = await sb
      .from('configuracion')
      .select('*')
      .eq('id', 'general')
      .maybeSingle()

    const recordatorio = await revisarRecordatorio(config)
    const avisos = await revisarTemporizador(config)
    const control = await revisarControl(config)
    const resumen = await revisarResumen(config)

    return json({ ok: true, recordatorio, avisos, control, resumen })
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
