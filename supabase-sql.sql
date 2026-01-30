-- =============================================
-- FINTRACK - SQL para Supabase
-- Execute esses comandos no SQL Editor do Supabase
-- =============================================

-- 1. Tabela: Fontes de Renda
CREATE TABLE fontes_renda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela: Entradas (receitas)
CREATE TABLE entradas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  fonte_id UUID REFERENCES fontes_renda(id) ON DELETE SET NULL,
  descricao TEXT,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RLS (Row Level Security) - cada usuário só vê seus dados
-- =============================================

-- Fontes de Renda
ALTER TABLE fontes_renda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas fontes" ON fontes_renda
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam suas fontes" ON fontes_renda
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários editam suas fontes" ON fontes_renda
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas fontes" ON fontes_renda
  FOR DELETE USING (auth.uid() = user_id);

-- Entradas
ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas entradas" ON entradas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam suas entradas" ON entradas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários editam suas entradas" ON entradas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas entradas" ON entradas
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- GASTOS
-- =============================================

-- 3. Tabela: Categorias de Gastos
CREATE TABLE categorias_gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela: Gastos (despesas)
CREATE TABLE gastos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  categoria_id UUID REFERENCES categorias_gastos(id) ON DELETE SET NULL,
  descricao TEXT,
  data DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorias de Gastos
ALTER TABLE categorias_gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas categorias de gastos" ON categorias_gastos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam suas categorias de gastos" ON categorias_gastos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários editam suas categorias de gastos" ON categorias_gastos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam suas categorias de gastos" ON categorias_gastos
  FOR DELETE USING (auth.uid() = user_id);

-- Gastos
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus gastos" ON gastos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam seus gastos" ON gastos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários editam seus gastos" ON gastos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam seus gastos" ON gastos
  FOR DELETE USING (auth.uid() = user_id);
