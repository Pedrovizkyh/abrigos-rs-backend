-- Criar banco de dados (rodar separadamente se necessário)
-- CREATE DATABASE abrigos_db;

-- Tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de abrigos
CREATE TABLE IF NOT EXISTS abrigos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  endereco VARCHAR(500) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL DEFAULT 'RS',
  telefone VARCHAR(20),
  responsavel VARCHAR(255),
  capacidade_total INTEGER NOT NULL,
  vagas_disponiveis INTEGER NOT NULL,
  aceita_animais BOOLEAN DEFAULT FALSE,
  aceita_pcd BOOLEAN DEFAULT FALSE,
  tem_banheiro BOOLEAN DEFAULT TRUE,
  tem_alimentacao BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'lotado', 'inativo')),
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_em TIMESTAMP,
  aprovado_por INTEGER REFERENCES admins(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de necessidades dos abrigos
CREATE TABLE IF NOT EXISTS necessidades (
  id SERIAL PRIMARY KEY,
  abrigo_id INTEGER REFERENCES abrigos(id) ON DELETE CASCADE,
  item VARCHAR(255) NOT NULL,
  quantidade INTEGER,
  urgencia VARCHAR(10) DEFAULT 'media' CHECK (urgencia IN ('baixa', 'media', 'alta', 'critica')),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Tabela de histórico de vagas (para rastreabilidade)
CREATE TABLE IF NOT EXISTS historico_vagas (
  id SERIAL PRIMARY KEY,
  abrigo_id INTEGER REFERENCES abrigos(id) ON DELETE CASCADE,
  vagas_anteriores INTEGER,
  vagas_novas INTEGER,
  alterado_em TIMESTAMP DEFAULT NOW()
);

-- Trigger para atualizar o campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_abrigo
BEFORE UPDATE ON abrigos
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp();

-- Trigger para registrar histórico de vagas
CREATE OR REPLACE FUNCTION registrar_historico_vagas()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.vagas_disponiveis <> NEW.vagas_disponiveis THEN
    INSERT INTO historico_vagas (abrigo_id, vagas_anteriores, vagas_novas)
    VALUES (NEW.id, OLD.vagas_disponiveis, NEW.vagas_disponiveis);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historico_vagas
BEFORE UPDATE ON abrigos
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_vagas();

-- Admin padrão (senha: admin123 — troque após o primeiro acesso)
INSERT INTO admins (nome, email, senha_hash)
VALUES (
  'Administrador',
  'admin@abrigosrs.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGDUPqzGZZuT.lzuNYJzxLaROyW'
) ON CONFLICT (email) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_abrigos_aprovado ON abrigos(aprovado);
CREATE INDEX IF NOT EXISTS idx_abrigos_status_aprovado ON abrigos(status, aprovado);

-- Dados iniciais de exemplo
INSERT INTO abrigos (nome, endereco, cidade, estado, telefone, responsavel, capacidade_total, vagas_disponiveis, aceita_animais, aceita_pcd, tem_alimentacao, status, observacoes, aprovado, aprovado_em) VALUES
('Escola Municipal João Paulo', 'Rua das Flores, 200', 'Porto Alegre', 'RS', '(51) 3333-1111', 'Maria Santos', 150, 42, FALSE, TRUE, TRUE, 'ativo', 'Abrigo com infraestrutura completa. Atendimento 24h.', TRUE, NOW()),
('Ginásio Municipal Centro', 'Av. Borges de Medeiros, 500', 'Porto Alegre', 'RS', '(51) 3333-2222', 'João Oliveira', 300, 0, FALSE, TRUE, TRUE, 'lotado', 'Abrigo lotado. Não aceitar mais pessoas no momento.', TRUE, NOW()),
('Igreja São Francisco', 'Rua da Igreja, 45', 'Canoas', 'RS', '(51) 3444-5555', 'Padre Carlos', 80, 23, TRUE, FALSE, FALSE, 'ativo', 'Aceita animais de pequeno porte. Refeições fornecidas por voluntários.', TRUE, NOW()),
('SESC Novo Hamburgo', 'Av. Dois de Novembro, 100', 'Novo Hamburgo', 'RS', '(51) 3555-6666', 'Ana Lima', 200, 87, FALSE, TRUE, TRUE, 'ativo', 'Estrutura moderna com banheiros adaptados e alimentação 3x ao dia.', TRUE, NOW()),
('Centro Comunitário Vila Nova', 'Rua XV de Novembro, 320', 'São Leopoldo', 'RS', '(51) 3666-7777', 'Carlos Pereira', 60, 5, TRUE, FALSE, FALSE, 'ativo', 'Pouquíssimas vagas. Prioridade para famílias com crianças.', TRUE, NOW());

INSERT INTO necessidades (abrigo_id, item, quantidade, urgencia) VALUES
(1, 'Cobertores', 50, 'alta'),
(1, 'Fraldas tamanho M', 30, 'critica'),
(1, 'Água mineral (caixas)', 20, 'alta'),
(3, 'Ração para cães', 10, 'media'),
(3, 'Medicamentos básicos (kit)', 5, 'alta'),
(4, 'Roupas adulto tamanho G', 100, 'media'),
(4, 'Calçados infantis', 40, 'alta'),
(5, 'Alimentos não perecíveis', 200, 'critica');
