-- V2: Ajustes no schema base para suportar a aplicação Spring Boot

-- Ampliar coluna de senha para BCrypt (60-72 chars + salt = até 60 chars, mas VARCHAR(255) é padrão seguro)
ALTER TABLE usuario ALTER COLUMN senha TYPE VARCHAR(255);

-- Adicionar coluna status em conteudo_suspeito (alinhamento com front-end NewsItem.status)
ALTER TABLE conteudo_suspeito
    ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS prioridade VARCHAR(10),
    ADD COLUMN IF NOT EXISTS id_responsavel BIGINT REFERENCES usuario(id);

-- A constraint NOT NULL em conteudo_suspeito.link impede cadastros sem URL.
-- Relaxar para permitir conteúdo sem link externo (ex: denúncias diretas).
ALTER TABLE conteudo_suspeito ALTER COLUMN link DROP NOT NULL;
ALTER TABLE conteudo_suspeito ALTER COLUMN link SET DEFAULT '';

-- Adicionar coluna bio ao usuário (exibida no perfil)
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adicionar coluna data_conclusao em relatorio_publicacao se não existir
-- (schema base já tem, mas garantindo compatibilidade)
ALTER TABLE relatorio_publicacao
    ADD COLUMN IF NOT EXISTS data_publicacao TIMESTAMP;

-- Garantir que checagem pode ter checador nulo (atribuição acontece depois)
ALTER TABLE checagem ALTER COLUMN id_checador DROP NOT NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conteudo_suspeito_status ON conteudo_suspeito(status);
CREATE INDEX IF NOT EXISTS idx_conteudo_suspeito_data_entrada ON conteudo_suspeito(data_entrada);
CREATE INDEX IF NOT EXISTS idx_checagem_status ON checagem(status);
CREATE INDEX IF NOT EXISTS idx_checagem_id_checador ON checagem(id_checador);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
