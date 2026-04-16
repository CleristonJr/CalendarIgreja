-- ============================================================
-- ATUALIZAÇÃO: Adicionando Equipe por Departamento
-- ============================================================
-- Execute este script no SQL Editor do Supabase para
-- habilitar a coluna "equipe_json" na tabela "departamentos".

ALTER TABLE departamentos ADD COLUMN IF NOT EXISTS equipe_json JSONB DEFAULT '[]'::jsonb;
