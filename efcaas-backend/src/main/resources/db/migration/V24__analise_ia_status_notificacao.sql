ALTER TABLE analise_ia ADD COLUMN IF NOT EXISTS status_ia VARCHAR(30) DEFAULT 'pendente';
ALTER TABLE analise_ia ADD COLUMN IF NOT EXISTS iniciado_em TIMESTAMP;
ALTER TABLE analise_ia ADD COLUMN IF NOT EXISTS finalizado_em TIMESTAMP;
ALTER TABLE analise_ia ADD COLUMN IF NOT EXISTS mensagem_erro TEXT;

UPDATE analise_ia SET status_ia = 'concluida' WHERE status_ia IS NULL OR status_ia = 'pendente';

CREATE TABLE IF NOT EXISTS notificacao (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT REFERENCES tenant(id),
    usuario_id  BIGINT NOT NULL REFERENCES usuario(id),
    titulo      VARCHAR(255) NOT NULL,
    mensagem    TEXT,
    categoria   VARCHAR(50),
    link        VARCHAR(500),
    lida        BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacao_usuario ON notificacao (usuario_id, lida, criado_em DESC);
