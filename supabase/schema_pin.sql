-- Ojitos de Mili — PIN de padres para entrar a Historial y Configuración
-- Corre esto DESPUÉS de los demás schema_*.sql. Es seguro volver a correrlo.
--
-- Es un "candado para niños": evita que Mili entre sin querer a la parte de
-- los padres (por ejemplo, a dar más tiempo de juego). Se guarda solo una
-- huella del PIN ("sal:sha256"), nunca el número. La seguridad real de los
-- datos la siguen dando la cuenta y las políticas RLS.
alter table public.configuracion add column if not exists pin_padres text;
alter table public.configuracion drop constraint if exists configuracion_pin_valido;
alter table public.configuracion add constraint configuracion_pin_valido
  check (pin_padres is null or pin_padres ~ '^[0-9a-f]{32}:[0-9a-f]{64}$');
