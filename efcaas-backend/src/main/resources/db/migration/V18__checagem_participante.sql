-- Participantes ativos de uma checagem (múltiplos checadores por conteúdo)

CREATE TABLE IF NOT EXISTS checagem_participante (
    id           BIGSERIAL PRIMARY KEY,
    id_checagem  BIGINT NOT NULL,
    id_usuario   BIGINT NOT NULL,
    ativo        BOOLEAN NOT NULL DEFAULT TRUE,
    data_entrada TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_part_checagem
        FOREIGN KEY (id_checagem) REFERENCES checagem(id) ON DELETE CASCADE,

    CONSTRAINT fk_part_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id),

    CONSTRAINT uq_part_checagem_usuario UNIQUE (id_checagem, id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_part_checagem ON checagem_participante(id_checagem);
CREATE INDEX IF NOT EXISTS idx_part_usuario ON checagem_participante(id_usuario);

INSERT INTO checagem_participante (id_checagem, id_usuario, ativo)
SELECT c.id, c.id_checador, TRUE
FROM checagem c
WHERE c.id_checador IS NOT NULL
ON CONFLICT (id_checagem, id_usuario) DO NOTHING;
