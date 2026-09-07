-- Ojitos de Mili — temporizador del parche + avisos automáticos
-- Corre esto DESPUÉS de supabase/schema.sql (ese no se toca, esto se suma).
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.

-- ---------- duración del parche (configurable, compartida) ----------
create table if not exists public.configuracion (
  id text primary key default 'general',
  duracion_minutos int not null default 120 check (duracion_minutos > 0),
  updated_at timestamptz not null default now()
);

insert into public.configuracion (id, duracion_minutos)
values ('general', 120)
on conflict (id) do nothing;

alter table public.configuracion enable row level security;

create policy "configuracion: lectura compartida" on public.configuracion
  for select using (auth.uid() is not null);

create policy "configuracion: edición compartida" on public.configuracion
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

-- ---------- marca si ya se avisó que el registro de hoy cumplió su tiempo ----------
alter table public.registros
  add column if not exists notificado boolean not null default false;

-- ---------- suscripciones de Web Push (una por dispositivo) ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions: cada quien ve las suyas" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions: cada quien crea las suyas" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

-- upsert() reutiliza la fila si el mismo dispositivo ya estaba suscrito (mismo
-- endpoint), así que también hace falta permiso de UPDATE, no solo INSERT.
create policy "push_subscriptions: cada quien actualiza las suyas" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "push_subscriptions: cada quien borra las suyas" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- ---------- avisar automáticamente, aunque nadie tenga la app abierta ----------
-- pg_cron llama cada minuto a la Edge Function send-patch-reminders (vía pg_net),
-- que revisa si el registro de hoy ya cumplió su tiempo y, si es así, manda la
-- notificación push a todos los dispositivos suscritos. Usa la URL del proyecto
-- y la anon key — ambas públicas por diseño (ver supabase-config.js); la Edge
-- Function es la que, del lado del servidor, usa la service role key para
-- mandar los avisos.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'send-patch-reminders-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://gbkrwzihzmbskpivagpn.supabase.co/functions/v1/send-patch-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia3J3emloem1ic2twaXZhZ3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODEyNTEsImV4cCI6MjEwNDM1NzI1MX0.Lv0wCe9LiPGnjqH5SP4TUzSH_eKWbf8Bh9aAJazWmnQ'
    ),
    body := '{}'::jsonb
  );
  $$
);
