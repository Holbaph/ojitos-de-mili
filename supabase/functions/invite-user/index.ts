// invite-user — invita a una persona nueva por correo a Ojitos de Mili.
//
// Solo puede llamarla alguien cuyo perfil tenga role = 'admin' (se verifica
// aquí mismo, con el cliente de la propia persona, antes de invitar). Usa la
// service role key para invitar — esa clave la inyecta Supabase
// automáticamente en cada Edge Function, nunca llega al navegador.
//
// Responde siempre HTTP 200 con { ok: true } o { ok: false, error }, para que
// el front (js/auth.js) no tenga que lidiar con distintos códigos de estado.

import { withSupabase } from 'npm:@supabase/server'

// Debe coincidir con la Site URL / Redirect URL que configuraste en
// Authentication → URL Configuration.
const APP_URL = 'https://holbaph.github.io/ojitos-de-mili/'

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const userId = ctx.userClaims?.sub
    if (!userId) {
      return Response.json({ ok: false, error: 'No autenticado' })
    }

    // Solo un admin puede invitar — se comprueba con el cliente RLS de quien llama.
    const { data: perfil, error: perfilError } = await ctx.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (perfilError || !perfil || perfil.role !== 'admin') {
      return Response.json({ ok: false, error: 'Solo la administradora/or puede invitar personas' })
    }

    let body
    try {
      body = await req.json()
    } catch {
      return Response.json({ ok: false, error: 'Solicitud inválida' })
    }

    const email = String(body?.email || '').trim().toLowerCase()
    const nombre = String(body?.nombre || '').trim()
    if (!email || !email.includes('@')) {
      return Response.json({ ok: false, error: 'Escribe un correo válido' })
    }

    const { data, error } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: APP_URL,
      data: nombre ? { nombre } : undefined,
    })

    if (error) {
      return Response.json({ ok: false, error: error.message })
    }

    return Response.json({ ok: true, userId: data.user?.id })
  }),
}
