-- ==========================================
-- MEDCHART DATABASE SCHEMA FOR SUPABASE
-- ==========================================

-- 1. Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm;

-- 2. Tablas

-- Perfiles de Médicos (Extensión de auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  medical_license text not null,
  specialty_title text not null,
  address text,
  phone text,
  is_founder_account boolean not null default false,
  created_at timestamptz not null default now()
);

-- Pacientes
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  created_at timestamptz not null default now()
);

-- Documentos Clínicos (Historias Clínicas / Notas de Evolución)
-- Protegido estrictamente: ON DELETE RESTRICT evita borrados en cascada no deseados
create table if not exists public.clinical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('historia_clinica', 'nota_evolucion')),
  document_date timestamptz not null default now(),
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- Adjuntos de Documentos (Imágenes, estudios, etc.)
create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.clinical_documents(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now()
);

-- 3. Índices de Rendimiento
create index if not exists idx_patients_doctor_id on public.patients(doctor_id);
create index if not exists idx_clinical_documents_patient_id on public.clinical_documents(patient_id);
create index if not exists idx_clinical_documents_doctor_id on public.clinical_documents(doctor_id);
create index if not exists idx_document_attachments_document_id on public.document_attachments(document_id);

-- Índice de Trigramas para búsqueda ultra-rápida e insensible a acentos
create index if not exists idx_patients_full_name_trgm on public.patients using gin (unaccent(full_name) gin_trgm_ops);

-- 4. Habilitar Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.clinical_documents enable row level security;
alter table public.document_attachments enable row level security;

-- 5. Políticas de Seguridad RLS

-- Profiles
create policy "Usuarios pueden ver su propio perfil" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Usuarios pueden insertar su propio perfil" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Usuarios pueden actualizar su propio perfil" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Patients (SOLO SELECT, INSERT, UPDATE. NUNCA DELETE)
create policy "Médicos pueden ver sus pacientes" 
  on public.patients for select 
  using (auth.uid() = doctor_id);

create policy "Médicos pueden crear pacientes" 
  on public.patients for insert 
  with check (auth.uid() = doctor_id);

create policy "Médicos pueden actualizar sus pacientes" 
  on public.patients for update 
  using (auth.uid() = doctor_id);

-- Clinical Documents (INMUTABLES: SOLO SELECT e INSERT)
create policy "Médicos pueden ver sus documentos clínicos" 
  on public.clinical_documents for select 
  using (auth.uid() = doctor_id);

create policy "Médicos pueden crear documentos clínicos" 
  on public.clinical_documents for insert 
  with check (auth.uid() = doctor_id);

-- Document Attachments (INMUTABLES: SOLO SELECT e INSERT)
create policy "Médicos pueden ver los adjuntos de sus documentos" 
  on public.document_attachments for select 
  using (auth.uid() = doctor_id);

create policy "Médicos pueden agregar adjuntos a sus documentos" 
  on public.document_attachments for insert 
  with check (auth.uid() = doctor_id);

-- 6. Función RPC de Búsqueda de Pacientes (con unaccent e insensible a mayúsculas/acentos)
drop function if exists search_patients(text, uuid);
drop function if exists search_patients(text);

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

-- 7. Trigger Automático para Creación de Perfil al Registrarse (Auth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, medical_license, specialty_title, address, phone, is_founder_account)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Dr. / Dra.'),
    coalesce(new.raw_user_meta_data->>'medical_license', 'Pendiente'),
    coalesce(new.raw_user_meta_data->>'specialty_title', 'Medicina General'),
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'phone',
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. Configuración de Storage para Adjuntos Médicos
insert into storage.buckets (id, name, public)
values ('clinical-attachments', 'clinical-attachments', false)
on conflict (id) do nothing;

create policy "Médicos pueden subir adjuntos a storage"
  on storage.objects for insert
  with check (bucket_id = 'clinical-attachments' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Médicos pueden ver sus adjuntos de storage"
  on storage.objects for select
  using (bucket_id = 'clinical-attachments' and auth.uid()::text = (storage.foldername(name))[1]);
