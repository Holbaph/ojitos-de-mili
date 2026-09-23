-- Ojitos de Mili — apariencia personalizable de Mili (piel, pelo, ropa, zapatos…)
-- Corre esto DESPUÉS de supabase/schema_temporizador.sql (usa su tabla
-- "configuracion"). Pega todo este archivo en Supabase → SQL Editor → Run.
-- Es seguro volver a correrlo.

-- Un objeto JSON con lo elegido en "🎨 Personalizar" (ver js/mili.js).
-- Es compartido: toda la familia ve a la misma Mili. null = la apariencia
-- original. La app valida cada valor antes de dibujarlo.
alter table public.configuracion
  add column if not exists apariencia jsonb;
