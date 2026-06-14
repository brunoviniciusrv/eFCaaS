-- Configuração da agência (painéis do fluxo "Ajustar" / onboarding)
CREATE TABLE IF NOT EXISTS configuracao_agencia (
    id                                      BIGSERIAL PRIMARY KEY,
    nome                                    VARCHAR(150) NOT NULL DEFAULT 'Agência eFCaaS',
    url_logo                                TEXT,
    idioma                                  VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    pais                                    VARCHAR(80)  NOT NULL DEFAULT 'Brasil',
    fuso_horario                            VARCHAR(60)  NOT NULL DEFAULT 'America/Sao_Paulo',
    onboarding_concluido                    BOOLEAN      NOT NULL DEFAULT FALSE,
    id_modelo                               VARCHAR(50)  NOT NULL DEFAULT 'default',
    perfis_padrao                           BOOLEAN      NOT NULL DEFAULT TRUE,
    ia                                      BOOLEAN      NOT NULL DEFAULT TRUE,
    rede_especializada                      BOOLEAN      NOT NULL DEFAULT TRUE,
    monitor_redes_sociais                   BOOLEAN      NOT NULL DEFAULT TRUE,
    analisador_desinformacao                BOOLEAN      NOT NULL DEFAULT TRUE,
    classificacao_risco_engajamento         BOOLEAN      NOT NULL DEFAULT TRUE,
    risco_ilicitudes                        BOOLEAN      NOT NULL DEFAULT TRUE,
    tema_json                               TEXT         NOT NULL,
    criado_em                               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_em                           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    atualizado_por_id                       BIGINT,
    CONSTRAINT fk_config_agencia_usuario
        FOREIGN KEY (atualizado_por_id) REFERENCES usuario(id)
);

-- Instância única (singleton) da plataforma
INSERT INTO configuracao_agencia (id, nome, tema_json)
VALUES (1, 'Agência eFCaaS', '{}')
ON CONFLICT (id) DO NOTHING;

SELECT setval(
    pg_get_serial_sequence('configuracao_agencia', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM configuracao_agencia), 1)
);
