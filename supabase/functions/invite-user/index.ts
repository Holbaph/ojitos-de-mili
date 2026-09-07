// invite-user — invita a una persona nueva por correo a Ojitos de Mili.
//
// Solo puede llamarla alguien cuyo perfil tenga role = 'admin' (se verifica
// aquí mismo, con el token de quien llama, antes de invitar). Usa la service
// role key para invitar — esa clave la inyecta Supabase automáticamente en
// cada Edge Function (SUPABASE_SERVICE_ROLE_KEY), nunca llega al navegador.
//
// Responde siempre HTTP 200 con { ok: true } o { ok: false, error }, para que
// el front (js/auth.js) no tenga que lidiar con distintos códigos de estado.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Debe coincidir con la Site URL / Redirect URL que configuraste en
// Authentication → URL Configuration.
const APP_URL = 'https://holbaph.github.io/ojitos-de-mili/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Cliente con el token de quien llama (respeta RLS) — sirve para saber
    // quién es y comprobar su rol.
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
      return json({ ok: false, error: 'Solo la administradora/or puede invitar personas' })
    }

    let body: { email?: string; nombre?: string }
    try {
      body = await req.json()
    } catch {
      return json({ ok: false, error: 'Solicitud inválida' })
    }

    const email = String(body?.email || '').trim().toLowerCase()
    const nombre = String(body?.nombre || '').trim()
    if (!email || !email.includes('@')) {
      return json({ ok: false, error: 'Escribe un correo válido' })
    }

    // Cliente con la service role key — este sí puede invitar usuarios.
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: APP_URL,
      data: nombre ? { nombre } : undefined,
    })

    if (error) {
      return json({ ok: false, error: error.message })
    }

    return json({ ok: true, userId: data.user?.id })
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) })
  }
})
