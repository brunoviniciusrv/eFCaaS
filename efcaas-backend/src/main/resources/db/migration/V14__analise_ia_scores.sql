-- V14: Adiciona colunas de scores e análise semântica à tabela analise_ia
-- Suporta integração com a API Guaia IA Hub (/ia/publication/v1 e /ia/text/classify/v1)

ALTER TABLE analise_ia
    ADD COLUMN IF NOT EXISTS score_inveracidade    NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS score_distorcao       NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS score_fora_contexto   NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS score_disc_odio       NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS score_disc_antidemo   NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS score_risco_ilicitude NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS atributo_what         TEXT,
    ADD COLUMN IF NOT EXISTS atributo_who          TEXT,
    ADD COLUMN IF NOT EXISTS atributo_where        VARCHAR(500),
    ADD COLUMN IF NOT EXISTS atributo_when         VARCHAR(500),
    ADD COLUMN IF NOT EXISTS keywords              TEXT,
    ADD COLUMN IF NOT EXISTS pseudo_label          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS simulado              BOOLEAN NOT NULL DEFAULT TRUE;
