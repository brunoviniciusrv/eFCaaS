-- V9: Metadados de arquivos de evidência armazenados em object storage (MinIO)

ALTER TABLE evidencia
    ADD COLUMN IF NOT EXISTS object_key   VARCHAR(500),
    ADD COLUMN IF NOT EXISTS nome_arquivo VARCHAR(255),
    ADD COLUMN IF NOT EXISTS content_type VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tamanho_bytes BIGINT;

ALTER TABLE evidencia
    ALTER COLUMN link_arquivo TYPE TEXT;
