-- ============================================================
-- ATUALIZAÇÃO RLS: Permitir que o Líder atualize seu próprio departamento
-- ============================================================
-- Execute este script no SQL Editor do Supabase para
-- liberar que líderes de departamento salvem a própria equipe.

DROP POLICY IF EXISTS "departamentos_update_manage" ON departamentos;

CREATE POLICY "departamentos_update_manage"
  ON departamentos FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
    OR (auth_user_role() = 'lider' AND auth_user_igreja_id() = igreja_id AND id = auth_user_departamento_id())
  );
