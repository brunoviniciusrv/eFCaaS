-- =========================================================
-- DATABASE
-- =========================================================
-- CREATE DATABASE efcaas;


-- =========================================================
-- TABELA: tipo_usuario
-- =========================================================

CREATE TABLE IF NOT EXISTS tipo_usuario (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(50) NOT NULL,
    permissoes          TEXT,
    descricao           VARCHAR(255)
);


-- =========================================================
-- TABELA: permissao
-- =========================================================

CREATE TABLE IF NOT EXISTS permissao (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL,
    descricao           VARCHAR(255),
    tipo                VARCHAR(50)
);


-- =========================================================
-- TABELA: tipo_usuario_permissao
-- =========================================================

CREATE TABLE IF NOT EXISTS tipo_usuario_permissao (
    id_tipo_usuario     BIGINT NOT NULL,
    id_permissao        BIGINT NOT NULL,

    CONSTRAINT pk_tipo_usuario_permissao
        PRIMARY KEY (id_tipo_usuario, id_permissao),

    CONSTRAINT fk_tup_tipo_usuario
        FOREIGN KEY (id_tipo_usuario)
        REFERENCES tipo_usuario (id),

    CONSTRAINT fk_tup_permissao
        FOREIGN KEY (id_permissao)
        REFERENCES permissao (id)
);


-- =========================================================
-- TABELA: usuario
-- =========================================================

CREATE TABLE IF NOT EXISTS usuario (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL,
    email               VARCHAR(100) NOT NULL UNIQUE,
    senha               VARCHAR(100) NOT NULL,
    foto                VARCHAR(255),
    id_tipo_usuario     BIGINT NOT NULL,
    status              CHAR(1) DEFAULT 'A',

    CONSTRAINT fk_usuario_tipo
        FOREIGN KEY (id_tipo_usuario)
        REFERENCES tipo_usuario (id)
);


-- =========================================================
-- TABELA: conteudo_suspeito
-- =========================================================

CREATE TABLE IF NOT EXISTS conteudo_suspeito (
    id                  BIGSERIAL PRIMARY KEY,
    titulo              VARCHAR(255) NOT NULL,
    alegacao            TEXT,
    link                VARCHAR(255) NOT NULL,
    descricao           TEXT,
    data_entrada        TIMESTAMP NOT NULL DEFAULT NOW(),
    score_gravidade     NUMERIC(5,2),
    score_urgencia      NUMERIC(5,2),
    score_tendencia     NUMERIC(5,2)
);


-- =========================================================
-- TABELA: analise_ia
-- =========================================================

CREATE TABLE IF NOT EXISTS analise_ia (
    id                  BIGSERIAL PRIMARY KEY,
    id_conteudo         BIGINT NOT NULL,
    avaliacao_risco     VARCHAR(50),
    texto_analise       TEXT,

    CONSTRAINT fk_analise_ia_conteudo
        FOREIGN KEY (id_conteudo)
        REFERENCES conteudo_suspeito (id)
);


-- =========================================================
-- TABELA: checagem
-- =========================================================

CREATE TABLE IF NOT EXISTS checagem (
    id                  BIGSERIAL PRIMARY KEY,
    id_conteudo         BIGINT NOT NULL,
    id_curador          BIGINT NOT NULL,
    id_checador         BIGINT NOT NULL,
    briefing            TEXT,
    status              VARCHAR(30),
    data_inicio         TIMESTAMP,
    data_conclusao      TIMESTAMP,

    CONSTRAINT fk_checagem_conteudo
        FOREIGN KEY (id_conteudo)
        REFERENCES conteudo_suspeito (id),

    CONSTRAINT fk_checagem_curador
        FOREIGN KEY (id_curador)
        REFERENCES usuario (id),

    CONSTRAINT fk_checagem_checador
        FOREIGN KEY (id_checador)
        REFERENCES usuario (id)
);


-- =========================================================
-- TABELA: evidencia
-- =========================================================

CREATE TABLE IF NOT EXISTS evidencia (
    id                  BIGSERIAL PRIMARY KEY,
    id_checagem         BIGINT NOT NULL,
    tipo                VARCHAR(50),
    link_arquivo        VARCHAR(255),
    descricao           TEXT,

    CONSTRAINT fk_evidencia_checagem
        FOREIGN KEY (id_checagem)
        REFERENCES checagem (id)
);


-- =========================================================
-- TABELA: analise_externa
-- =========================================================

CREATE TABLE IF NOT EXISTS analise_externa (
    id                  BIGSERIAL PRIMARY KEY,
    id_checagem         BIGINT NOT NULL,
    veredito            VARCHAR(50),
    parecer             TEXT,
    data_analise        TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_analise_externa_checagem
        FOREIGN KEY (id_checagem)
        REFERENCES checagem (id)
);


-- =========================================================
-- TABELA: etiqueta
-- =========================================================

CREATE TABLE IF NOT EXISTS etiqueta (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(50) NOT NULL,
    descricao           VARCHAR(255),
    cor                 VARCHAR(20)
);


-- =========================================================
-- TABELA: parecer
-- =========================================================

CREATE TABLE IF NOT EXISTS parecer (
    id                  BIGSERIAL PRIMARY KEY,
    id_checagem         BIGINT NOT NULL,
    id_etiqueta         BIGINT NOT NULL,
    resumo              TEXT,
    fontes              TEXT,
    resposta_autor      TEXT,
    texto_parecer       TEXT,

    CONSTRAINT fk_parecer_checagem
        FOREIGN KEY (id_checagem)
        REFERENCES checagem (id),

    CONSTRAINT fk_parecer_etiqueta
        FOREIGN KEY (id_etiqueta)
        REFERENCES etiqueta (id)
);


-- =========================================================
-- TABELA: revisao
-- =========================================================

CREATE TABLE IF NOT EXISTS revisao (
    id                  BIGSERIAL PRIMARY KEY,
    id_parecer          BIGINT NOT NULL,
    status              VARCHAR(30),
    justificativa       TEXT,

    CONSTRAINT fk_revisao_parecer
        FOREIGN KEY (id_parecer)
        REFERENCES parecer (id)
);


-- =========================================================
-- TABELA: relatorio_publicacao
-- =========================================================

CREATE TABLE IF NOT EXISTS relatorio_publicacao (
    id                  BIGSERIAL PRIMARY KEY,
    id_parecer          BIGINT NOT NULL,
    id_editor           BIGINT NOT NULL,
    titulo              VARCHAR(255),
    corpo_texto         TEXT,
    status_publicacao   VARCHAR(30),
    data_criacao        TIMESTAMP DEFAULT NOW(),
    data_publicacao     TIMESTAMP,

    CONSTRAINT fk_relatorio_parecer
        FOREIGN KEY (id_parecer)
        REFERENCES parecer (id),

    CONSTRAINT fk_relatorio_editor
        FOREIGN KEY (id_editor)
        REFERENCES usuario (id)
);


-- =========================================================
-- TABELA: ferramenta_hub
-- =========================================================

CREATE TABLE IF NOT EXISTS ferramenta_hub (
    id                  BIGSERIAL PRIMARY KEY,
    nome                VARCHAR(100) NOT NULL,
    categoria           VARCHAR(100),
    url_acesso          VARCHAR(255),
    credenciais_api     TEXT,
    status              CHAR(1)
);
