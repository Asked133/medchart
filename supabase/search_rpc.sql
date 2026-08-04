-- supabase/search_rpc.sql
-- Habilitar extensiones requeridas
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm;

-- Envoltorio IMMUTABLE de unaccent (Requerido por Postgres para indexar expresiones y hacer Index Scan)
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
as $$
  select extensions.unaccent('unaccent', $1);
$$;

-- Eliminar firmas anteriores
drop function if exists search_patients(text, uuid);
drop function if exists search_patients(text);

-- Crear función segura con security invoker, filtro por doctor_id y consulta alineada al índice GIN
create or replace function search_patients(search_query text)
returns setof public.patients
language plpgsql
security invoker
set search_path = public, extensions
as $$
begin
  return query
  select *
  from public.patients
  where public.immutable_unaccent(full_name) ilike public.immutable_unaccent('%' || search_query || '%')
    and doctor_id = auth.uid()
  order by full_name asc;
end;
$$;
