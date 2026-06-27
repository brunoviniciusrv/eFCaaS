-- Guaia retorna textos longos em atributos e classificações de ilicitude.

ALTER TABLE analise_ia
    ALTER COLUMN atributo_where TYPE TEXT,
    ALTER COLUMN atributo_when TYPE TEXT;

ALTER TABLE analise_ia
    ALTER COLUMN classificacao_odio TYPE VARCHAR(255),
    ALTER COLUMN classificacao_antidemo TYPE VARCHAR(255),
    ALTER COLUMN categoria_final TYPE VARCHAR(255);
