-- Ojitos de Mili — esquema de base de datos (Supabase / Postgres)
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
--
-- Modelo:
--   profiles   — una fila por usuario invitado (espejo de auth.users). El PRIMER
--                usuario que se crea (tú, el admin) queda con role='admin'
--                automáticamente; todos los que se inviten después quedan como
--                'user'. Nadie se registra solo: las cuentas se crean/invitan
--                desde Authentication → Users en el panel de Supabase.
--   registros  — un registro por día (fecha es única): qué ojo se le tapó a Mili
--                y quién de la familia lo registró. Es un dato compartido: todo
--                usuario con acceso lo ve y lo edita, igual que en tus otras apps
--                familiares.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nombre text not null,
  role text not null default 'user' check (role in ('admin','user')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cualquiera con sesión iniciada puede ver quién más tiene acceso (para el panel
-- "Personas con acceso"), pero solo puede editar su propia fila (su nombre).
create policy "profiles: lectura para usuarios con sesión" on public.profiles
  for select using (auth.uid() is not null);

create policy "profiles: cada quien edita su propia fila" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Crea automáticamente el perfil al invitar/crear un usuario en Supabase Auth.
-- El primer perfil creado queda como 'admin'; el resto, como 'user'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'user' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- registros ----------
create table if not exists public.registros (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  ojo text not null check (ojo in ('derecho','izquierdo')),
  hora timestamptz not null default now(),
  registrado_por uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists registros_fecha_idx on public.registros (fecha desc);

alter table public.registros enable row level security;

-- Cualquier usuario con acceso a la app ve y mantiene el mismo historial
-- compartido de Mili (pensado para la familia, no para separar datos por persona).
create policy "registros: lectura compartida" on public.registros
  for select using (auth.uid() is not null);

create policy "registros: escritura compartida" on public.registros
  for insert with check (auth.uid() is not null);

create policy "registros: edición compartida" on public.registros
  for update using (auth.uid() is not null) with check (auth.uid() is not null);

create policy "registros: borrado compartido" on public.registros
  for delete using (auth.uid() is not null);
