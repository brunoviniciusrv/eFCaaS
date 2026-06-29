ALTER TABLE solicitacao_cadastro_agencia
    ADD COLUMN IF NOT EXISTS senha_hash VARCHAR(255);
