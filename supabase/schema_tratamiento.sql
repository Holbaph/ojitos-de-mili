-- Ojitos de Mili — control del tratamiento para los padres
-- Corre esto DESPUÉS de supabase/schema_seguridad.sql (usa public.es_miembro()).
-- Pega todo este archivo en Supabase → SQL Editor → New query → Run.
-- Es seguro volver a correrlo.

-- ---------- tiempo real de uso ----------
-- Hora en que se sacó el parche (null = sigue puesto, o no se anotó).
alter table public.registros add column if not exists hora_fin timestamptz;
alter table public.registros drop constraint if exists registros_hora_fin_valida;
alter table public.registros add constraint registros_hora_fin_valida
  check (hora_fin is null or hora_fin >= hora);

-- "Se sacó el parche": cualquiera de la familia puede anotarlo, aunque el
-- parche lo haya registrado otra persona (la política de edición exige que
-- registrado_por sea quien edita, así que esto va por una función aparte que
-- solo toca hora_fin). p_hora = null deshace el "se sacó".
create or replace function public.sacar_parche(p_fecha date, p_hora timestamptz)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.es_miembro() then
    raise exception 'sin acceso';
  end if;
  update public.registros set hora_fin = p_hora where fecha = p_fecha;
end;
$$;
revoke execute on function public.sacar_parche(date, timestamptz) from public, anon;
grant execute on function public.sacar_parche(date, timestamptz) to authenticated;

-- ---------- indicación del oftalmólogo, premio, control y resumen ----------
alter table public.configuracion
  -- qué ojo se tapa: el mismo todos los días o alternando
  add column if not exists indicacion_ojo text not null default 'alternar',
  -- qué días de la semana va el parche (0 = domingo … 6 = sábado)
  add column if not exists indicacion_dias smallint[] not null default '{0,1,2,3,4,5,6}',
  -- premio por constancia: cuántos días a la semana y qué premio
  add column if not exists premio_meta smallint,
  add column if not exists premio_texto text,
  -- próximo control con el oftalmólogo
  add column if not exists control_fecha date,
  add column if not exists control_hora time,
  add column if not exists control_detalle text,
  add column if not exists control_preguntas text,
  add column if not exists control_aviso_enviado date,
  -- resumen semanal por aviso (los domingos)
  add column if not exists resumen_activo boolean not null default true,
  add column if not exists resumen_ultimo_envio date;

alter table public.configuracion drop constraint if exists configuracion_tratamiento_valido;
alter table public.configuracion add constraint configuracion_tratamiento_valido check (
  indicacion_ojo in ('alternar', 'derecho', 'izquierdo')
  and cardinality(indicacion_dias) between 1 and 7
  and indicacion_dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  and (premio_meta is null or premio_meta between 1 and 7)
  and (premio_texto is null or char_length(premio_texto) <= 60)
  and (control_detalle is null or char_length(control_detalle) <= 80)
  and (control_preguntas is null or char_length(control_preguntas) <= 1500)
);
