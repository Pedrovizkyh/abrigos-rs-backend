-- ============================================================
-- MIGRATION: Sistema de autenticação e aprovação de abrigos
-- Execute: psql -U postgres -d abrigos_db -f migration_auth.sql
-- ============================================================

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Adiciona coluna de aprovação nos abrigos
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT FALSE;
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMP;
ALTER TABLE abrigos ADD COLUMN IF NOT EXISTS aprovado_por INTEGER REFERENCES admins(id);

-- Abrigos já existentes ficam como pendentes (aprovado = false)
-- Para aprovar os dados de exemplo, rode:
-- UPDATE abrigos SET aprovado = TRUE;

-- Cria o admin padrão (senha: admin123 — TROQUE após o primeiro login!)
-- Hash gerado com bcrypt (cost 12) para a senha 'admin123':
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Administrador',
  'admin@abrigosrs.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGDUPqzGZZuT.lzuNYJzxLaROyW'
) ON CONFLICT (email) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_abrigos_aprovado ON abrigos(aprovado);
CREATE INDEX IF NOT EXISTS idx_abrigos_status_aprovado ON abrigos(status, aprovado);
