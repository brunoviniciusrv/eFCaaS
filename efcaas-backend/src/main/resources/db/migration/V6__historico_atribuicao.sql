-- V6: Histórico de atribuições de checagem

CREATE TABLE IF NOT EXISTS historico_atribuicao (
    id               BIGSERIAL PRIMARY KEY,
    id_checagem      BIGINT NOT NULL,
    id_usuario       BIGINT NOT NULL,
    id_atribuido_por BIGINT,
    acao             VARCHAR(50) NOT NULL,
    motivo           TEXT,
    timestamp        TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_hist_checagem
        FOREIGN KEY (id_checagem) REFERENCES checagem(id),

    CONSTRAINT fk_hist_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuario(id),

    CONSTRAINT fk_hist_atribuido_por
        FOREIGN KEY (id_atribuido_por) REFERENCES usuario(id)
);

CREATE INDEX IF NOT EXISTS idx_hist_atrib_checagem ON historico_atribuicao(id_checagem);
