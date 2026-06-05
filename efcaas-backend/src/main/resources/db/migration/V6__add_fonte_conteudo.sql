-- V6: Adiciona coluna fonte (Fonte/Veículo) à tabela conteudo_suspeito
ALTER TABLE conteudo_suspeito
    ADD COLUMN IF NOT EXISTS fonte VARCHAR(255);
