ALTER TABLE conteudo_suspeito ADD COLUMN IF NOT EXISTS numero_referencia INTEGER;

UPDATE conteudo_suspeito c
SET numero_referencia = sub.rn
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY id) AS rn
    FROM conteudo_suspeito
) sub
WHERE c.id = sub.id AND c.numero_referencia IS NULL;

CREATE TABLE IF NOT EXISTS tenant_conteudo_seq (
    tenant_id   BIGINT PRIMARY KEY REFERENCES tenant(id),
    ultimo_numero INTEGER NOT NULL DEFAULT 0
);

INSERT INTO tenant_conteudo_seq (tenant_id, ultimo_numero)
SELECT tenant_id, COALESCE(MAX(numero_referencia), 0)
FROM conteudo_suspeito
WHERE tenant_id IS NOT NULL
GROUP BY tenant_id
ON CONFLICT (tenant_id) DO UPDATE
SET ultimo_numero = GREATEST(tenant_conteudo_seq.ultimo_numero, EXCLUDED.ultimo_numero);

UPDATE conteudo_suspeito SET numero_referencia = id WHERE numero_referencia IS NULL;

ALTER TABLE conteudo_suspeito ALTER COLUMN numero_referencia SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_conteudo_tenant_numero
    ON conteudo_suspeito (tenant_id, numero_referencia);
