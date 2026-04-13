-- ============================================================
-- RLS (Row Level Security) - CalendarIgreja
-- VERSÃO 3 (FINAL): Corrige recursão infinita na tabela perfis
-- usando SECURITY DEFINER functions para quebrar o loop.
--
-- Execute este script INTEIRO no Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 0. NOVA COLUNA: logo_url na tabela igrejas
-- ============================================================
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

-- ============================================================
-- REMOVER POLÍTICAS ANTERIORES (caso existam)
-- ============================================================
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('igrejas', 'departamentos', 'perfis', 'eventos', 'solicitacoes_igrejas', 'doxologia_templates')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- Essas funções rodam com permissões de "dono" da tabela,
-- BYPASSANDO o RLS. Isso evita a recursão infinita quando
-- uma policy na tabela perfis precisa ler a própria tabela.
-- ============================================================

-- Retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM perfis WHERE id = auth.uid();
$$;

-- Retorna o igreja_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_igreja_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT igreja_id FROM perfis WHERE id = auth.uid();
$$;

-- Retorna o departamento_id do usuário autenticado
CREATE OR REPLACE FUNCTION auth_user_departamento_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT departamento_id FROM perfis WHERE id = auth.uid();
$$;

-- ============================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================
ALTER TABLE igrejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_igrejas ENABLE ROW LEVEL SECURITY;
ALTER TABLE doxologia_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. POLÍTICAS: IGREJAS
-- ============================================================
CREATE POLICY "igrejas_select_anon"
  ON igrejas FOR SELECT TO anon USING (true);

CREATE POLICY "igrejas_select_authenticated"
  ON igrejas FOR SELECT TO authenticated USING (true);

CREATE POLICY "igrejas_insert_superadmin"
  ON igrejas FOR INSERT TO authenticated
  WITH CHECK (auth_user_role() = 'superadmin');

CREATE POLICY "igrejas_update_manage"
  ON igrejas FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = id)
  );

CREATE POLICY "igrejas_delete_superadmin"
  ON igrejas FOR DELETE TO authenticated
  USING (auth_user_role() = 'superadmin');

-- ============================================================
-- 3. POLÍTICAS: DEPARTAMENTOS
-- ============================================================
CREATE POLICY "departamentos_select_anon"
  ON departamentos FOR SELECT TO anon USING (true);

CREATE POLICY "departamentos_select_authenticated"
  ON departamentos FOR SELECT TO authenticated USING (true);

CREATE POLICY "departamentos_insert_manage"
  ON departamentos FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

CREATE POLICY "departamentos_update_manage"
  ON departamentos FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

CREATE POLICY "departamentos_delete_manage"
  ON departamentos FOR DELETE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

-- ============================================================
-- 4. POLÍTICAS: PERFIS
-- Usa auth.uid() direto (não precisa consultar perfis de novo)
-- e as helper functions para queries mais complexas.
-- ============================================================

-- Qualquer usuário autenticado pode ler seu próprio perfil
CREATE POLICY "perfis_select_own"
  ON perfis FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Membros da mesma igreja veem perfis uns dos outros
-- Usa a helper function para evitar recursão
CREATE POLICY "perfis_select_same_church"
  ON perfis FOR SELECT TO authenticated
  USING (igreja_id = auth_user_igreja_id());

-- Superadmin vê todos os perfis
CREATE POLICY "perfis_select_superadmin"
  ON perfis FOR SELECT TO authenticated
  USING (auth_user_role() = 'superadmin');

-- Usuário atualiza seu próprio perfil
CREATE POLICY "perfis_update_own"
  ON perfis FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Superadmin pode atualizar/deletar perfis
CREATE POLICY "perfis_update_superadmin"
  ON perfis FOR UPDATE TO authenticated
  USING (auth_user_role() = 'superadmin');

CREATE POLICY "perfis_delete_superadmin"
  ON perfis FOR DELETE TO authenticated
  USING (auth_user_role() = 'superadmin');

-- Ancião pode gerenciar perfis da sua igreja (criar membros, etc)
CREATE POLICY "perfis_insert_manage"
  ON perfis FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

-- ============================================================
-- 5. POLÍTICAS: EVENTOS
-- ============================================================
CREATE POLICY "eventos_select_anon"
  ON eventos FOR SELECT TO anon USING (true);

CREATE POLICY "eventos_select_authenticated"
  ON eventos FOR SELECT TO authenticated USING (true);

CREATE POLICY "eventos_insert_manage"
  ON eventos FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
    OR (auth_user_role() = 'lider' AND auth_user_igreja_id() = igreja_id AND auth_user_departamento_id() = departamento_id)
  );

CREATE POLICY "eventos_update_manage"
  ON eventos FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
    OR (
      auth_user_role() = 'lider' 
      AND auth_user_igreja_id() = igreja_id 
      AND (
        auth_user_departamento_id() = departamento_id
        OR auth_user_departamento_id() = ANY(colaboradores_ids)
      )
    )
  );

CREATE POLICY "eventos_delete_manage"
  ON eventos FOR DELETE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

-- ============================================================
-- 6. POLÍTICAS: SOLICITAÇÕES DE IGREJAS
-- ============================================================
CREATE POLICY "solicitacoes_insert_authenticated"
  ON solicitacoes_igrejas FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "solicitacoes_select_own"
  ON solicitacoes_igrejas FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "solicitacoes_select_superadmin"
  ON solicitacoes_igrejas FOR SELECT TO authenticated
  USING (auth_user_role() = 'superadmin');

CREATE POLICY "solicitacoes_update_superadmin"
  ON solicitacoes_igrejas FOR UPDATE TO authenticated
  USING (auth_user_role() = 'superadmin');

CREATE POLICY "solicitacoes_delete_superadmin"
  ON solicitacoes_igrejas FOR DELETE TO authenticated
  USING (auth_user_role() = 'superadmin');

-- ============================================================
-- 7. POLÍTICAS: DOXOLOGIA TEMPLATES
-- ============================================================
CREATE POLICY "doxologia_templates_select_authenticated"
  ON doxologia_templates FOR SELECT TO authenticated
  USING (
    auth_user_igreja_id() = igreja_id
    OR auth_user_role() = 'superadmin'
  );

CREATE POLICY "doxologia_templates_insert_manage"
  ON doxologia_templates FOR INSERT TO authenticated
  WITH CHECK (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

CREATE POLICY "doxologia_templates_update_manage"
  ON doxologia_templates FOR UPDATE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );

CREATE POLICY "doxologia_templates_delete_manage"
  ON doxologia_templates FOR DELETE TO authenticated
  USING (
    auth_user_role() = 'superadmin'
    OR (auth_user_role() = 'ansiao' AND auth_user_igreja_id() = igreja_id)
  );
