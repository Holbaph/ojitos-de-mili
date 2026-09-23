-- Ojitos de Mili — recordatorio diario para ponerle el parche
-- Corre esto DESPUÉS de supabase/schema_temporizador.sql (usa su tabla
-- "configuracion", sus suscripciones push y su cron de cada minuto).
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
-- Es seguro volver a correrlo.

-- Hora del recordatorio (null = desactivado). Es compartida: la misma para
-- todas las personas con acceso, igual que la duración del parche.
alter table public.configuracion
  add column if not exists recordatorio_hora time;

-- Zona horaria en que se eligió esa hora (la Edge Function corre en UTC, así
-- que necesita saber qué significa "las 9:00" para ustedes).
alter table public.configuracion
  add column if not exists recordatorio_zona text not null default 'America/Santiago';

-- Último día (en esa zona horaria) en que ya se revisó/mandó el recordatorio,
-- para no mandarlo más de una vez al día.
alter table public.configuracion
  add column if not exists recordatorio_ultimo_envio date;
