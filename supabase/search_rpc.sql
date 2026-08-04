-- supabase/search_rpc.sql
-- Habilitar extensiones requeridas
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm;

-- Eliminar firmas anteriores
drop function if exists search_patients(text, uuid);
drop function if exists search_patients(text);

-- Crear función segura con security invoker y filtro directo por doctor_id
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
  where unaccent(full_name) ilike unaccent('%' || search_query || '%')
    and doctor_id = auth.uid()
  order by full_name asc;
end;
$$;
