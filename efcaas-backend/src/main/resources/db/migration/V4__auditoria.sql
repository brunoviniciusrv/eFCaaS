-- V5: Tabela de auditoria + extensões ao schema do parecer para Fase 1

CREATE TABLE IF NOT EXISTS auditoria (
    id         BIGSERIAL PRIMARY KEY,
    id_usuario BIGINT,
    acao       VARCHAR(100) NOT NULL,
    alvo       VARCHAR(255),
    detalhes   TEXT,
    timestamp  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp  ON auditoria(timestamp);
CREATE INDEX IF NOT EXISTS idx_auditoria_id_usuario ON auditoria(id_usuario);

-- Permitir parecer em rascunho (sem etiqueta definida ainda)
ALTER TABLE parecer ALTER COLUMN id_etiqueta DROP NOT NULL;

-- Campos extras da estrutura de relatório (salvos como JSON TEXT)
ALTER TABLE parecer
    ADD COLUMN IF NOT EXISTS perguntas     TEXT,
    ADD COLUMN IF NOT EXISTS inverificavel BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS contato_autor TEXT;
