-- ============================================================
-- RLS (Row Level Security) - CalendarIgreja
-- Execute este script INTEIRO no Supabase SQL Editor.
-- Ele habilita RLS em todas as tabelas e cria políticas
-- para proteger dados a nível de banco de dados.
-- ============================================================

-- ============================================================
-- 0. NOVA COLUNA: logo_url na tabela igrejas
-- ============================================================
ALTER TABLE igrejas ADD COLUMN IF NOT EXISTS logo_url text DEFAULT NULL;

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
-- Qualquer pessoa pode ver as igrejas (landing page pública)
CREATE POLICY "igrejas_select_public"
  ON igrejas FOR SELECT
  TO public
  USING (true);

-- Apenas superadmin pode criar/editar/deletar igrejas
CREATE POLICY "igrejas_all_superadmin"
  ON igrejas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  );

-- Ancião pode atualizar SUA igreja (ex: logo_url)
CREATE POLICY "igrejas_update_ansiao"
  ON igrejas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = igrejas.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = igrejas.id
    )
  );

-- ============================================================
-- 3. POLÍTICAS: DEPARTAMENTOS
-- ============================================================
-- Qualquer pessoa pode ver departamentos (portal público)
CREATE POLICY "departamentos_select_public"
  ON departamentos FOR SELECT
  TO public
  USING (true);

-- Superadmin pode tudo
CREATE POLICY "departamentos_all_superadmin"
  ON departamentos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  );

-- Ancião pode gerenciar departamentos da SUA igreja
CREATE POLICY "departamentos_all_ansiao"
  ON departamentos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = departamentos.igreja_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = departamentos.igreja_id
    )
  );

-- ============================================================
-- 4. POLÍTICAS: PERFIS
-- ============================================================
-- Usuário pode ver seu próprio perfil
CREATE POLICY "perfis_select_own"
  ON perfis FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Membros da mesma igreja podem ver perfis uns dos outros
CREATE POLICY "perfis_select_same_church"
  ON perfis FOR SELECT
  TO authenticated
  USING (
    igreja_id IN (
      SELECT p.igreja_id FROM perfis p WHERE p.id = auth.uid()
    )
  );

-- Superadmin vê tudo
CREATE POLICY "perfis_select_superadmin"
  ON perfis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  );

-- Usuário pode atualizar seu próprio perfil
CREATE POLICY "perfis_update_own"
  ON perfis FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Superadmin pode tudo em perfis
CREATE POLICY "perfis_all_superadmin"
  ON perfis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  );

-- INSERT automático pelo trigger (service_role bypassa RLS)
-- Não precisa de política específica

-- ============================================================
-- 5. POLÍTICAS: EVENTOS
-- ============================================================
-- Qualquer pessoa pode ver eventos (portal público)
CREATE POLICY "eventos_select_public"
  ON eventos FOR SELECT
  TO public
  USING (true);

-- Superadmin pode tudo
CREATE POLICY "eventos_all_superadmin"
  ON eventos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  );

-- Ancião pode gerenciar todos os eventos da sua igreja
CREATE POLICY "eventos_all_ansiao"
  ON eventos FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = eventos.igreja_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = eventos.igreja_id
    )
  );

-- Líder pode atualizar eventos do seu departamento
CREATE POLICY "eventos_update_lider"
  ON eventos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'lider'
      AND perfis.igreja_id = eventos.igreja_id
      AND (
        perfis.departamento_id = eventos.departamento_id
        OR perfis.departamento_id = ANY(eventos.colaboradores_ids)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'lider'
      AND perfis.igreja_id = eventos.igreja_id
      AND (
        perfis.departamento_id = eventos.departamento_id
        OR perfis.departamento_id = ANY(eventos.colaboradores_ids)
      )
    )
  );

-- ============================================================
-- 6. POLÍTICAS: SOLICITAÇÕES DE IGREJAS
-- ============================================================
-- Usuário autenticado pode inserir solicitações
CREATE POLICY "solicitacoes_insert_authenticated"
  ON solicitacoes_igrejas FOR INSERT
  TO authenticated
  WITH CHECK (usuario_id = auth.uid());

-- Usuário pode ver suas próprias solicitações
CREATE POLICY "solicitacoes_select_own"
  ON solicitacoes_igrejas FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

-- Superadmin vê e gerencia tudo
CREATE POLICY "solicitacoes_all_superadmin"
  ON solicitacoes_igrejas FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  );

-- ============================================================
-- 7. POLÍTICAS: DOXOLOGIA TEMPLATES
-- ============================================================
-- Membros da igreja podem ler templates
CREATE POLICY "doxologia_templates_select_church"
  ON doxologia_templates FOR SELECT
  TO authenticated
  USING (
    igreja_id IN (
      SELECT p.igreja_id FROM perfis p WHERE p.id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.id = auth.uid()
      AND p.role = 'superadmin'
    )
  );

-- Ancião pode gerenciar templates da sua igreja
CREATE POLICY "doxologia_templates_all_ansiao"
  ON doxologia_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = doxologia_templates.igreja_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'ansiao'
      AND perfis.igreja_id = doxologia_templates.igreja_id
    )
  );

-- Superadmin pode tudo
CREATE POLICY "doxologia_templates_all_superadmin"
  ON doxologia_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.role = 'superadmin'
    )
  );
