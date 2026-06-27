-- V17: Campos adicionais da Guaia IA Hub (classificações textuais e semântica estendida)
-- score_distorcao passa a armazenar fake_score (falsidade); score_fora_contexto = distorção de mídia

ALTER TABLE analise_ia
    ADD COLUMN IF NOT EXISTS classificacao_odio         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS classificacao_antidemo     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS confianca_classificacao    NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS categoria_final            VARCHAR(100),
    ADD COLUMN IF NOT EXISTS misinformation_features    TEXT,
    ADD COLUMN IF NOT EXISTS certeza_alegacao           NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS faixa_certeza_alegacao     VARCHAR(50),
    ADD COLUMN IF NOT EXISTS topic_match                TEXT;
