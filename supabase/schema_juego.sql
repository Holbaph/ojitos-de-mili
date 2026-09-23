-- Ojitos de Mili — juego de vestir personajes
-- Corre esto DESPUÉS de supabase/schema_temporizador.sql (usa su tabla
-- "configuracion"). Pega todo este archivo en Supabase → SQL Editor → Run.
-- Es seguro volver a correrlo.

-- La ropa, peinado y accesorios de cada personaje del juego (ver js/juego.js).
-- Se guarda sola a cada cambio y es compartida: el mismo guardarropa en todos
-- los celulares. La app valida cada valor antes de dibujarlo.
alter table public.configuracion
  add column if not exists juego jsonb;

-- Minutos de juego por día (0 = sin límite). Se configura en
-- Historial → Juego de vestir. El tiempo usado se cuenta en cada dispositivo.
alter table public.configuracion
  add column if not exists juego_minutos_dia int not null default 20
  check (juego_minutos_dia >= 0);
