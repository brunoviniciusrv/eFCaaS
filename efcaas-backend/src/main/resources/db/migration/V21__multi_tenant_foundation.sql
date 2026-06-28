-- V21: Fundação multi-tenant lógico

CREATE TABLE IF NOT EXISTS tenant (
    id                          BIGSERIAL PRIMARY KEY,
    slug                        VARCHAR(80)  NOT NULL UNIQUE,
    nome                        VARCHAR(150) NOT NULL,
    cnpj                        VARCHAR(20),
    plano                       VARCHAR(20)  NOT NULL DEFAULT 'FREE',
    compartilha_dados_ecossistema BOOLEAN    NOT NULL DEFAULT TRUE,
    status                      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    criado_em                   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO tenant (id, slug, nome, plano, compartilha_dados_ecossistema, status)
VALUES (1, 'dev', 'Agência eFCaaS (Dev)', 'FREE', TRUE, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('tenant', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM tenant), 1));

-- tenant_id em tabelas principais
ALTER TABLE usuario ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE usuario SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_tenant_email ON usuario (tenant_id, email) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uk_usuario_platform_email ON usuario (email) WHERE tenant_id IS NULL;

ALTER TABLE configuracao_agencia ADD COLUMN IF NOT EXISTS tenant_id BIGINT UNIQUE REFERENCES tenant(id);
UPDATE configuracao_agencia SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE etiqueta ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE etiqueta SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE conteudo_suspeito ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE conteudo_suspeito SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE conteudo_recebido ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE conteudo_recebido SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE checagem ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE checagem SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE auditoria ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE auditoria SET tenant_id = 1 WHERE tenant_id IS NULL;

ALTER TABLE relatorio_publicacao ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenant(id);
UPDATE relatorio_publicacao SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Solicitações de cadastro
CREATE TABLE IF NOT EXISTS solicitacao_cadastro_agencia (
    id                  BIGSERIAL PRIMARY KEY,
    nome_agencia        VARCHAR(150) NOT NULL,
    cnpj                VARCHAR(20),
    nome_responsavel    VARCHAR(150) NOT NULL,
    email_contato       VARCHAR(100) NOT NULL,
    telefone            VARCHAR(30),
    pais                VARCHAR(80)  NOT NULL DEFAULT 'Brasil',
    estado              VARCHAR(80),
    cidade              VARCHAR(80),
    plano_solicitado    VARCHAR(20)  NOT NULL DEFAULT 'FREE',
    informacoes_extras  TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    motivo_reprovacao   TEXT,
    tenant_id           BIGINT REFERENCES tenant(id),
    aprovado_por_id     BIGINT REFERENCES usuario(id),
    criado_em           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documento_solicitacao (
    id              BIGSERIAL PRIMARY KEY,
    solicitacao_id  BIGINT NOT NULL REFERENCES solicitacao_cadastro_agencia(id) ON DELETE CASCADE,
    nome_arquivo    VARCHAR(255) NOT NULL,
    object_key      VARCHAR(500) NOT NULL,
    tipo_mime       VARCHAR(100),
    tamanho_bytes   BIGINT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_ativacao (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       BIGINT NOT NULL REFERENCES tenant(id),
    usuario_id      BIGINT NOT NULL REFERENCES usuario(id),
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    expira_em       TIMESTAMPTZ NOT NULL,
    utilizado_em    TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenant_ingest_key (
    id          BIGSERIAL PRIMARY KEY,
    tenant_id   BIGINT NOT NULL UNIQUE REFERENCES tenant(id),
    api_key_hash VARCHAR(128) NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissões platform
INSERT INTO permissao (nome, descricao, tipo) VALUES
    ('platform_view_requests',  'Visualizar solicitações de cadastro de agências', 'platform'),
    ('platform_approve_agency', 'Aprovar cadastro e provisionar tenant',           'platform'),
    ('platform_reject_agency',  'Reprovar solicitação de cadastro',               'platform'),
    ('platform_list_tenants',   'Listar tenants da plataforma',                  'platform')
ON CONFLICT DO NOTHING;

INSERT INTO tipo_usuario (nome, descricao) VALUES
    ('Platform Admin', 'Administrador da plataforma eFCaaS (cross-tenant)')
ON CONFLICT DO NOTHING;

INSERT INTO tipo_usuario_permissao (id_tipo_usuario, id_permissao)
SELECT tu.id, p.id
FROM tipo_usuario tu, permissao p
WHERE tu.nome = 'Platform Admin'
  AND p.nome IN ('platform_view_requests', 'platform_approve_agency', 'platform_reject_agency', 'platform_list_tenants')
ON CONFLICT DO NOTHING;

INSERT INTO usuario (nome, email, senha, status, id_tipo_usuario, tenant_id)
SELECT 'Platform Admin', 'platform@efcaas.com',
       '$2a$12$G1sSYEED5A4kk8sv6Lby0O75bccaK7IRLXoS3.svR3aroFmwODz/a', 'A', tu.id, NULL
FROM tipo_usuario tu WHERE tu.nome = 'Platform Admin'
  AND NOT EXISTS (SELECT 1 FROM usuario u WHERE u.email = 'platform@efcaas.com' AND u.tenant_id IS NULL);
