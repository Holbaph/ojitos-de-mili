// crear-personaje — "✨ Crear con magia" del Taller de personajes (js/taller.js).
//
// Mili escribe (o dice) quién quiere crear, por ejemplo "Bluey" o "una hada
// del bosque", y Claude describe cómo dibujarlo CON LAS PIEZAS DE LA APP
// (tipo de cuerpo, colores, peinado, ropa): no se baja ninguna imagen de
// internet. La app lo dibuja con su propio estilo y lo guarda solo si un
// adulto pone el PIN de padres.
//
// Solo pueden llamarla personas de la familia (con perfil en la app).
// Necesita el secreto ANTHROPIC_API_KEY:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Responde siempre HTTP 200 con { ok: true, personaje } o { ok: false, error }.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

// Las piezas que la app sabe dibujar (deben coincidir con js/vestuario.js)
const TIPOS = ['persona', 'raton', 'olaf', 'sven', 'stitch', 'angel', 'pua', 'heihei', 'bruni']
const PEINADOS = ['melena', 'largo', 'ondas', 'muy-largo', 'corto', 'pixie', 'afro', 'crespo', 'colitas', 'colitas-altas',
  'cola', 'cola-alta', 'cola-baja', 'tomate', 'moños-dobles', 'trenza', 'dos-trenzas']
const FLEQUILLOS = ['ondas', 'recto', 'lado', 'cortina', 'sin']
const ROPA: Record<string, string[]> = {
  arriba: ['polera', 'manga-larga', 'musculosa', 'top', 'camisa', 'sueter', 'poleron', 'blusa', 'top-concha'],
  abajo: ['jeans', 'calzas', 'falda', 'tutu', 'short', 'short-botones', 'jardinera', 'falda-larga', 'bombacho', 'cola-sirena'],
  vestido: ['vestido', 'vestido-lunares', 'vestido-tutu', 'vestido-largo', 'vestido-princesa', 'enterito'],
  encima: ['chaqueta', 'chaleco', 'abrigo', 'ruana', 'capa'],
  zapatos: ['zapatillas', 'botas', 'botas-lluvia', 'botines', 'balerinas', 'guillerminas', 'sandalias', 'pantuflas', 'patines'],
  cabeza: ['moño', 'moño-lunares', 'collet', 'pinches', 'flor', 'cintillo', 'tiara'],
  sombrero: ['corona', 'corona-flores', 'corona-estrellas', 'gorro-lana', 'jockey', 'sombrero', 'orejitas', 'unicornio'],
  cara: ['lentes', 'lentes-corazon', 'lentes-estrella', 'lentes-redondos'],
  collar: ['cadena', 'perlas', 'corazon', 'estrella', 'mostacillas', 'concha', 'humita'],
}
const color = { type: 'string', description: 'Color en formato #rrggbb' }
const pieza = (tipos: string[]) => ({
  type: 'object', additionalProperties: false, required: ['t', 'c'],
  properties: { t: { type: 'string', enum: ['ninguno', ...tipos] }, c: color },
})
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['nombre', 'tipo', 'piel', 'ojos', 'peloEstilo', 'peloColor', 'flequillo', 'pestanas', 'pecas', 'ropa'],
  properties: {
    nombre: { type: 'string', description: 'Nombre corto para mostrar (máximo 18 letras)' },
    tipo: { type: 'string', enum: TIPOS },
    piel: color, ojos: color, peloColor: color,
    peloEstilo: { type: 'string', enum: PEINADOS },
    flequillo: { type: 'string', enum: FLEQUILLOS },
    pestanas: { type: 'boolean' }, pecas: { type: 'boolean' },
    ropa: {
      type: 'object', additionalProperties: false, required: Object.keys(ROPA),
      properties: Object.fromEntries(Object.entries(ROPA).map(([k, v]) => [k, pieza(v)])),
    },
  },
}

const SISTEMA = `Ayudas a una niña de 4 años a crear personajes para un juego de vestir infantil.
Te dice quién quiere crear (un personaje que conoce o uno inventado). Descríbelo usando SOLO las piezas
disponibles del esquema, eligiendo los colores, el peinado y la ropa que más lo hagan reconocible.
Tipos de cuerpo: "persona" (niña, niño o adulto), "raton" (cabeza redonda con orejas grandes: sirve para
ratones, osos, perritos y otros animalitos; "piel" es el color del pelaje), y figuras ya dibujadas que puedes
usar para animales parecidos: olaf (muñeco de nieve), sven (reno o venado), stitch y angel (extraterrestre
o koala), pua (chanchito), heihei (gallo o pajarito), bruni (lagartija o dragoncito).
Para lo que no lleva, usa t = "ninguno". Si hay vestido, deja arriba y abajo en "ninguno".
Si te piden algo que no es apto para una niña pequeña, crea en su lugar un personaje tierno y alegre.`

const HEX = /^#[0-9a-f]{6}$/i
function limpiar(p: any) {
  const c = (v: unknown, d: string) => (typeof v === 'string' && HEX.test(v) ? v.toLowerCase() : d)
  const ropa: Record<string, unknown> = {}
  for (const [k, tipos] of Object.entries(ROPA)) {
    const v = p?.ropa?.[k]
    ropa[k] = v && tipos.includes(v.t) && HEX.test(v.c || '') ? { t: v.t, c: v.c.toLowerCase() } : null
  }
  return {
    nombre: String(p?.nombre || '').replace(/[<>&"'`]/g, '').trim().slice(0, 18) || 'Amigo',
    tipo: TIPOS.includes(p?.tipo) ? p.tipo : 'persona',
    piel: c(p?.piel, '#f6d7bd'), ojos: c(p?.ojos, '#4a3222'), peloColor: c(p?.peloColor, '#4a3222'),
    peloEstilo: PEINADOS.includes(p?.peloEstilo) ? p.peloEstilo : 'melena',
    flequillo: FLEQUILLOS.includes(p?.flequillo) ? p.flequillo : 'ondas',
    pestanas: !!p?.pestanas, pecas: !!p?.pecas, ropa,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const caller = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    })
    const { data: u } = await caller.auth.getUser()
    if (!u?.user) return json({ ok: false, error: 'No autenticado' })
    const { data: miembro } = await caller.rpc('es_miembro')
    if (miembro !== true) return json({ ok: false, error: 'Solo la familia puede crear personajes' })

    const key = Deno.env.get('ANTHROPIC_API_KEY')
    if (!key) return json({ ok: false, error: 'La magia todavía no está configurada' })

    let body: { pedido?: string }
    try { body = await req.json() } catch { return json({ ok: false, error: 'Solicitud inválida' }) }
    const pedido = String(body?.pedido || '').replace(/[<>]/g, '').trim().slice(0, 80)
    if (!pedido) return json({ ok: false, error: 'Dime quién quieres crear' })

    const client = new Anthropic({ apiKey: key })
    const r = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SISTEMA,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      messages: [{ role: 'user', content: `Quiero crear a: ${pedido}` }],
    } as any)
    if (r.stop_reason === 'refusal') return json({ ok: false, error: 'No pude crear ese personaje. ¡Prueba con otro!' })
    const texto = (r.content as any[]).filter((b) => b.type === 'text').map((b) => b.text).join('')
    let datos: unknown
    try { datos = JSON.parse(texto) } catch { return json({ ok: false, error: 'La magia falló, prueba otra vez' }) }
    return json({ ok: true, personaje: limpiar(datos) })
  } catch (e) {
    console.error(e)
    return json({ ok: false, error: 'La magia falló, prueba otra vez' })
  }
})
