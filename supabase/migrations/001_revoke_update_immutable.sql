-- ============================================================
-- MIGRATION: 001_revoke_update_immutable_tables
-- Descripción: Revoca el permiso UPDATE de las tablas clínicas
--   inmutables para cumplir con NOM-004-SSA3-2012 (§ 7.1).
--   Los documentos clínicos NO deben poder modificarse una vez
--   guardados — solo SELECT e INSERT están permitidos.
--
-- ⚠️  Ejecutar en: Panel SQL de Supabase > SQL Editor
-- ============================================================

-- Revocar UPDATE en clinical_documents para el rol 'authenticated'
REVOKE UPDATE ON TABLE public.clinical_documents FROM authenticated;

-- Revocar UPDATE en document_attachments para el rol 'authenticated'
REVOKE UPDATE ON TABLE public.document_attachments FROM authenticated;

-- Verificación (opcional): debería devolver solo SELECT e INSERT
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_name IN ('clinical_documents', 'document_attachments')
--   AND grantee = 'authenticated'
-- ORDER BY table_name, privilege_type;
