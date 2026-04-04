-- APAGUE AS TABELAS ANTIGAS PARA EVITAR ERRO DE "ALREADY EXISTS"
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS perfis CASCADE;
DROP TABLE IF EXISTS departamentos CASCADE;
DROP TABLE IF EXISTS igrejas CASCADE;

-- ----------------------------------------------------
-- 1. A Raiz de Tudo: A tabela IGREJAS (Multi-Tenant)
CREATE TABLE igrejas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  slug text UNIQUE NOT NULL, -- O identificador que vai na URL ex: 'verbodavida-sp'
  ativa boolean DEFAULT true NOT NULL, -- Flag para desativar sem deletar
  pagamento_pendente boolean DEFAULT false NOT NULL, -- Flag de Inadimplência
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Departamentos agora pertencem de forma estrita à uma Igreja
CREATE TABLE departamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  igreja_id uuid REFERENCES igrejas(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  cor_identificacao text NOT NULL DEFAULT '#3b82f6',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Usuários/Perfis agora são designados exclusivamente para uma Igreja
CREATE TABLE perfis (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  igreja_id uuid REFERENCES igrejas(id) ON DELETE CASCADE,
  nome_completo text,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE SET NULL,
  role text CHECK (role IN ('superadmin', 'ansiao', 'lider')) DEFAULT 'lider',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Eventos atrelados à Igreja (Segurança Máxima contra vazamentos)
CREATE TABLE eventos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  igreja_id uuid REFERENCES igrejas(id) ON DELETE CASCADE NOT NULL,
  titulo text NOT NULL,
  descricao text,
  data_inicio timestamp with time zone NOT NULL,
  data_fim timestamp with time zone NOT NULL,
  departamento_id uuid REFERENCES departamentos(id) ON DELETE CASCADE NOT NULL,
  responsavel_id uuid REFERENCES perfis(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------
-- 5. AUTOMAÇÃO DE CRIAÇÃO DE PERFIL
-- Isso garante que quando você criar um usuário na aba "Auth", ele apareça em "perfis"
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfis (id, role)
  VALUES (new.id, 'lider');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ----------------------------------------------------
-- DADOS DE TESTE INICIAIS (Opcional)
-- ----------------------------------------------------
INSERT INTO igrejas (nome, slug) VALUES ('Igreja Presbiteriana Central', 'ip-central');

-- ----------------------------------------------------
-- 6. FILA DE SOLICITAÇÕES DE NOVAS IGREJAS
-- ----------------------------------------------------
-- 6. FILA DE SOLICITAÇÕES DE NOVAS IGREJAS
-- ----------------------------------------------------
CREATE TABLE solicitacoes_igrejas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  nome_igreja text NOT NULL,
  slug text NOT NULL,
  status text CHECK (status IN ('pendente', 'aprovada', 'rejeitada')) DEFAULT 'pendente',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------
-- 7. ATUALIZAÇÕES TARDIAS (PATCHES DO SISTEMA V2)
-- ----------------------------------------------------
-- Adicionando Suporte a Colaboradores Múltiplos e Registro de Convidados nos Eventos
-- Execute isto manualmente no Supabase SQL Editor:
-- ALTER TABLE eventos ADD COLUMN colaboradores_ids uuid[] DEFAULT '{}';
-- ALTER TABLE eventos ADD COLUMN convidados jsonb DEFAULT '[]'::jsonb;

-- ----------------------------------------------------
-- 8. ATUALIZAÇÕES TARDIAS (PATCHES DO SISTEMA V3 - RECORRÊNCIA)
-- ----------------------------------------------------
-- Adicionando Suporte a Eventos Recorrentes Semanais
-- Execute isto manualmente no Supabase SQL Editor:
-- ALTER TABLE eventos ADD COLUMN recorrencia_id text DEFAULT NULL;
