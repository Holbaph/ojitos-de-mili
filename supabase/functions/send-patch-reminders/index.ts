// send-patch-reminders — la llama pg_cron cada minuto (ver
// supabase/schema_temporizador.sql), no una persona. Revisa si el registro de
// hoy ya cumplió su tiempo de parche y, si es así, manda un aviso push a
// todos los dispositivos suscritos — así llega aunque nadie tenga la app
// abierta ni el celular desbloqueado.

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data: config } = await sb
      .from('configuracion')
      .select('duracion_minutos')
      .eq('id', 'general')
      .single()
    const duracionMin = config?.duracion_minutos ?? 120

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

    if (!vencidos.length) {
      return json({ ok: true, avisos: 0 })
    }

    const { data: subs } = await sb.from('push_subscriptions').select('id, endpoint, p256dh, auth')

    if (subs?.length) {
      const payload = JSON.stringify({
        title: '¡Ya se puede sacar el parche! 🎉',
        body: 'Se cumplió el tiempo de hoy para Mili.',
      })
      await Promise.allSettled(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
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

    await sb
      .from('registros')
      .update({ notificado: true })
      .in('fecha', vencidos.map((r) => r.fecha))

    return json({ ok: true, avisos: vencidos.length })
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500)
  }
})
