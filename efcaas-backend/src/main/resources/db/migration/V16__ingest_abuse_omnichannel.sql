-- Anti-abuso e deduplicação para ingestão omnichannel

CREATE TABLE IF NOT EXISTS ingest_abuse_event (
    id              BIGSERIAL PRIMARY KEY,
    channel_type    VARCHAR(32)  NOT NULL,
    event_type      VARCHAR(64)  NOT NULL,
    client_ip       VARCHAR(64),
    fingerprint     VARCHAR(128),
    content_hash    VARCHAR(128),
    detail          VARCHAR(512),
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingest_abuse_event_criado ON ingest_abuse_event (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_abuse_event_channel ON ingest_abuse_event (channel_type, event_type);

CREATE TABLE IF NOT EXISTS ingest_content_fingerprint (
    id              BIGSERIAL PRIMARY KEY,
    content_hash    VARCHAR(128) NOT NULL,
    fingerprint     VARCHAR(128),
    channel_type    VARCHAR(32)  NOT NULL,
    tipo_fonte      VARCHAR(50),
    conteudo_id     BIGINT,
    criado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingest_fingerprint_hash ON ingest_content_fingerprint (content_hash, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ingest_fingerprint_fp ON ingest_content_fingerprint (fingerprint, criado_em DESC);

CREATE TABLE IF NOT EXISTS ingest_rate_limit_bucket (
    bucket_key      VARCHAR(256) PRIMARY KEY,
    request_count   INT          NOT NULL DEFAULT 0,
    window_start    TIMESTAMPTZ  NOT NULL,
    blocked_until   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingest_rate_limit_blocked ON ingest_rate_limit_bucket (blocked_until)
    WHERE blocked_until IS NOT NULL;
