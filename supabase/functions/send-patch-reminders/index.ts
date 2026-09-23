// send-patch-reminders — la llama pg_cron cada minuto (ver
// supabase/schema_temporizador.sql), no una persona. Hace dos revisiones y
// manda avisos push a todos los dispositivos suscritos — así llegan aunque
// nadie tenga la app abierta ni el celular desbloqueado:
//   1. Recordatorio diario: si llegó la hora configurada y todavía no se
//      registró el parche de hoy (ver supabase/schema_recordatorio.sql).
//   2. Temporizador: si el registro de hoy ya cumplió su tiempo de parche.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

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
  return {
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
    minutoDelDia: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

async function revisarRecordatorio(config: Record<string, unknown> | null) {
  const hora = config?.recordatorio_hora as string | null | undefined
  if (!hora) return false

  const zona = (config?.recordatorio_zona as string) || 'America/Santiago'
  const { fecha, minutoDelDia } = ahoraEnZona(zona)
  const [h, m] = hora.split(':').map(Number)
  const desde = h * 60 + m
  if (minutoDelDia < desde || minutoDelDia >= desde + VENTANA_RECORDATORIO_MIN) return false
  if (config?.recordatorio_ultimo_envio === fecha) return false

  // Marca el día como revisado ANTES de mandar, y solo si nadie lo marcó
  // antes — así, aunque dos ejecuciones se crucen, el aviso sale una vez.
  const { data: reclamado } = await sb
    .from('configuracion')
    .update({ recordatorio_ultimo_envio: fecha })
    .eq('id', 'general')
    .or(`recordatorio_ultimo_envio.is.null,recordatorio_ultimo_envio.neq.${fecha}`)
    .select('id')
  if (!reclamado?.length) return false

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
    .select('fecha, hora')
    .eq('notificado', false)
    .gte('fecha', desde)

  const ahora = Date.now()
  const vencidos = (registros ?? []).filter((r) => {
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

    return json({ ok: true, recordatorio, avisos })
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
