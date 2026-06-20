-- Campos adicionais para o acervo editorial (EditorView)
ALTER TABLE relatorio_publicacao
    ADD COLUMN IF NOT EXISTS template VARCHAR(30) DEFAULT 'complete',
    ADD COLUMN IF NOT EXISTS resumo TEXT,
    ADD COLUMN IF NOT EXISTS data_atualizacao TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS comentarios_json TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uk_relatorio_publicacao_parecer
    ON relatorio_publicacao (id_parecer);

CREATE INDEX IF NOT EXISTS idx_relatorio_publicacao_status
    ON relatorio_publicacao (status_publicacao);
