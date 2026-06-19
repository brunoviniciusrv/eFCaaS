-- V11: Anexos de conteúdo suspeito (triagem) armazenados em object storage (MinIO)

CREATE TABLE IF NOT EXISTS anexos_conteudo (
    id              BIGSERIAL PRIMARY KEY,
    id_conteudo     BIGINT       NOT NULL,
    tipo            VARCHAR(50),
    object_key      VARCHAR(500) NOT NULL,
    nome_arquivo    VARCHAR(255),
    content_type    VARCHAR(100),
    tamanho_bytes   BIGINT,
    CONSTRAINT fk_anexos_conteudo
        FOREIGN KEY (id_conteudo) REFERENCES conteudo_suspeito(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_anexos_conteudo_id_conteudo ON anexos_conteudo(id_conteudo);
