-- Conteúdos recebidos de fontes externas (WhatsApp, e-mail, redes sociais, etc.)

CREATE TABLE IF NOT EXISTS conteudo_recebido (
    id                   BIGSERIAL PRIMARY KEY,
    titulo               VARCHAR(500)  NOT NULL,
    conteudo             TEXT          NOT NULL,
    resumo               TEXT,
    tipo_fonte           VARCHAR(50)   NOT NULL,
    nome_remetente       VARCHAR(255),
    endereco_remetente   VARCHAR(255),
    link_original        VARCHAR(1024),
    id_mensagem_externa  VARCHAR(255),
    notas_internas       TEXT,
    status               VARCHAR(30)   NOT NULL DEFAULT 'received',
    recebido_em          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    id_conteudo_triagem  BIGINT,
    CONSTRAINT fk_conteudo_recebido_triagem
        FOREIGN KEY (id_conteudo_triagem) REFERENCES conteudo_suspeito(id)
);

CREATE INDEX IF NOT EXISTS idx_conteudo_recebido_status ON conteudo_recebido(status);
CREATE INDEX IF NOT EXISTS idx_conteudo_recebido_recebido_em ON conteudo_recebido(recebido_em DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uk_conteudo_recebido_mensagem
    ON conteudo_recebido(tipo_fonte, id_mensagem_externa)
    WHERE id_mensagem_externa IS NOT NULL;

CREATE TABLE IF NOT EXISTS conteudo_recebido_midia (
    id                    BIGSERIAL PRIMARY KEY,
    id_conteudo_recebido  BIGINT       NOT NULL,
    tipo                  VARCHAR(30)  NOT NULL,
    url                   VARCHAR(2048) NOT NULL,
    titulo                VARCHAR(255),
    CONSTRAINT fk_conteudo_recebido_midia_conteudo
        FOREIGN KEY (id_conteudo_recebido) REFERENCES conteudo_recebido(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conteudo_recebido_midia_conteudo
    ON conteudo_recebido_midia(id_conteudo_recebido);
