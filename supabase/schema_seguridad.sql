-- Ojitos de Mili — refuerzo de seguridad (auditoría de septiembre de 2026)
-- Corre esto DESPUÉS de los demás archivos schema_*.sql.
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
-- Es seguro volver a correrlo.

-- ---------- 1) cada persona solo puede cambiar su NOMBRE ----------
-- Antes, la política "cada quien edita su propia fila" dejaba cambiar
-- cualquier columna de la propia fila, incluido el rol: cualquier cuenta
-- podía ponerse role = 'admin'. Ahora solo se puede tocar "nombre"; el rol y
-- el correo solo los cambia el servidor (service role) o el panel de Supabase.
revoke update on public.profiles from anon, authenticated;
grant update (nombre) on public.profiles to authenticated;

-- ---------- 2) nombres: largo razonable y sin < > ----------
-- El nombre se muestra en la app (quién registró el parche, personas con
-- acceso). La app ya lo muestra como texto, esto es una segunda barrera.
update public.profiles
set nombre = coalesce(nullif(left(btrim(regexp_replace(nombre, '[<>]', '', 'g')), 60), ''), 'Persona')
where nombre ~ '[<>]' or char_length(nombre) > 60 or btrim(nombre) = '';

alter table public.profiles drop constraint if exists profiles_nombre_valido;
alter table public.profiles add constraint profiles_nombre_valido
  check (char_length(btrim(nombre)) between 1 and 60 and nombre !~ '[<>]');

-- El perfil nuevo (al invitar a alguien) toma el nombre de la invitación:
-- se limpia igual, para que una invitación con un nombre raro no falle.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nombre text;
begin
  v_nombre := left(btrim(regexp_replace(coalesce(new.raw_user_meta_data->>'nombre', ''), '[<>]', '', 'g')), 60);
  if v_nombre = '' then
    v_nombre := left(btrim(regexp_replace(split_part(coalesce(new.email, ''), '@', 1), '[<>]', '', 'g')), 60);
  end if;
  if v_nombre = '' then v_nombre := 'Persona'; end if;

  insert into public.profiles (id, email, nombre, role)
  values (
    new.id,
    new.email,
    v_nombre,
    case when exists (select 1 from public.profiles) then 'user' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------- 3) solo la familia (quien tiene perfil) ve y cambia datos ----------
-- Antes bastaba con "tener sesión" (auth.uid() is not null). Ahora además hay
-- que tener perfil: si el admin le quita el acceso a alguien (se borra su
-- cuenta y su perfil), queda fuera AL INSTANTE, aunque su sesión todavía no
-- haya vencido en su celular.
create or replace function public.es_miembro()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

-- profiles
drop policy if exists "profiles: lectura para usuarios con sesión" on public.profiles;
drop policy if exists "profiles: lectura para la familia" on public.profiles;
create policy "profiles: lectura para la familia" on public.profiles
  for select using (public.es_miembro());

-- registros (compartidos por toda la familia, como antes). Al crear o cambiar
-- un registro, "registrado_por" tiene que ser quien lo hace: nadie puede
-- firmar un registro a nombre de otra persona.
drop policy if exists "registros: lectura compartida" on public.registros;
create policy "registros: lectura compartida" on public.registros
  for select using (public.es_miembro());

drop policy if exists "registros: escritura compartida" on public.registros;
create policy "registros: escritura compartida" on public.registros
  for insert with check (public.es_miembro() and registrado_por = auth.uid());

drop policy if exists "registros: edición compartida" on public.registros;
create policy "registros: edición compartida" on public.registros
  for update using (public.es_miembro()) with check (public.es_miembro() and registrado_por = auth.uid());

drop policy if exists "registros: borrado compartido" on public.registros;
create policy "registros: borrado compartido" on public.registros
  for delete using (public.es_miembro());

-- configuracion (compartida, como antes)
drop policy if exists "configuracion: lectura compartida" on public.configuracion;
create policy "configuracion: lectura compartida" on public.configuracion
  for select using (public.es_miembro());

drop policy if exists "configuracion: creación compartida" on public.configuracion;
create policy "configuracion: creación compartida" on public.configuracion
  for insert with check (public.es_miembro());

drop policy if exists "configuracion: edición compartida" on public.configuracion;
create policy "configuracion: edición compartida" on public.configuracion
  for update using (public.es_miembro()) with check (public.es_miembro());
