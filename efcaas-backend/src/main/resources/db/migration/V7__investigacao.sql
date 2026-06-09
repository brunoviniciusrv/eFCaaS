-- V7: Tabela dedicada para dados de investigação
--     Separa o processo investigativo do veredicto final (parecer).

CREATE TABLE IF NOT EXISTS investigacao (
    id                        BIGSERIAL PRIMARY KEY,
    id_checagem               BIGINT    NOT NULL UNIQUE,
    resumo_metodologia        TEXT,
    perguntas                 TEXT,                        -- JSON: ["Pergunta 1", "Pergunta 2"]
    fontes                    TEXT,                        -- JSON: ["https://...", "https://..."]
    inverificavel             BOOLEAN   NOT NULL DEFAULT FALSE,
    contato_realizado         BOOLEAN,                     -- NULL = não respondido
    resposta_autor            TEXT,                        -- preenchido quando contato_realizado = TRUE
    justificativa_sem_contato TEXT,                        -- preenchido quando contato_realizado = FALSE
    criado_em                 TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em             TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_investigacao_checagem
        FOREIGN KEY (id_checagem) REFERENCES checagem(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_investigacao_checagem ON investigacao(id_checagem);

-- ─── Remover colunas de investigação do parecer ──────────────────────────────
ALTER TABLE parecer
    DROP COLUMN IF EXISTS resumo,
    DROP COLUMN IF EXISTS fontes,
    DROP COLUMN IF EXISTS perguntas,
    DROP COLUMN IF EXISTS inverificavel,
    DROP COLUMN IF EXISTS contato_autor,
    DROP COLUMN IF EXISTS resposta_autor;
