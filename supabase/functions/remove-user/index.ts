// remove-user — le quita el acceso a una persona de Ojitos de Mili (borra su
// cuenta; su perfil y sus avisos se borran solos en cascada, y sus registros
// del historial se quedan, sin nombre).
//
// Solo puede llamarla alguien cuyo perfil tenga role = 'admin' (se verifica
// aquí mismo, con el token de quien llama). No se puede quitar el acceso a sí
// mismo ni a otro admin. Usa la service role key, que Supabase inyecta en cada
// Edge Function y nunca llega al navegador.
//
// Responde siempre HTTP 200 con { ok: true } o { ok: false, error }, igual que
// invite-user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Cliente con el token de quien llama (respeta RLS): quién es y su rol.
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData?.user) {
      return json({ ok: false, error: 'No autenticado' })
    }
    const { data: perfil, error: perfilError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()
    if (perfilError || !perfil || perfil.role !== 'admin') {
      return json({ ok: false, error: 'Solo la administradora/or puede quitar el acceso' })
    }

    let body: { userId?: string }
    try {
      body = await req.json()
    } catch {
      return json({ ok: false, error: 'Solicitud inválida' })
    }
    const userId = String(body?.userId || '')
    if (!UUID.test(userId)) {
      return json({ ok: false, error: 'Solicitud inválida' })
    }
    if (userId === userData.user.id) {
      return json({ ok: false, error: 'No puedes quitarte el acceso a ti misma/o' })
    }

    // Con la service role key: revisa a quién se le quita y borra la cuenta.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: objetivo } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
    if (!objetivo) {
      return json({ ok: false, error: 'Esa persona ya no tiene acceso' })
    }
    if (objetivo.role === 'admin') {
      return json({ ok: false, error: 'No se puede quitar el acceso a otra persona administradora' })
    }

    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) {
      return json({ ok: false, error: 'No se pudo quitar el acceso, intenta de nuevo' })
    }
    return json({ ok: true })
  } catch (_e) {
    return json({ ok: false, error: 'No se pudo quitar el acceso, intenta de nuevo' })
  }
})
