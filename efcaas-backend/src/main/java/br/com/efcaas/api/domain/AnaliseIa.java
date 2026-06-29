package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "analise_ia")
@Getter
@Setter
public class AnaliseIa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_conteudo", nullable = false)
    private ConteudoSuspeito conteudo;

    @Column(name = "avaliacao_risco", length = 50)
    private String avaliacaoRisco;

    @Column(name = "texto_analise", columnDefinition = "TEXT")
    private String textoAnalise;

    // ── Eixo Desinformação ──────────────────────────────────────────────────────

    @Column(name = "score_inveracidade", precision = 5, scale = 2)
    private BigDecimal scoreInveracidade;

    /** Coluna legada: armazena score de falsidade (fake_score) */
    @Column(name = "score_distorcao", precision = 5, scale = 2)
    private BigDecimal scoreDistorcao;

    /** Coluna legada: armazena distorção de mídia (distortion_level) */
    @Column(name = "score_fora_contexto", precision = 5, scale = 2)
    private BigDecimal scoreForaContexto;

    // ── Eixo Ilicitudes ─────────────────────────────────────────────────────────

    @Column(name = "classificacao_odio", length = 255)
    private String classificacaoOdio;

    @Column(name = "classificacao_antidemo", length = 255)
    private String classificacaoAntidemo;

    @Column(name = "confianca_classificacao", precision = 5, scale = 2)
    private BigDecimal confiancaClassificacao;

    @Column(name = "categoria_final", length = 255)
    private String categoriaFinal;

    @Column(name = "score_risco_ilicitude", precision = 5, scale = 2)
    private BigDecimal scoreRiscoIlicitude;

    /** Legado — não mais populado; mantido para compatibilidade de schema */
    @Column(name = "score_disc_odio", precision = 5, scale = 2)
    private BigDecimal scoreDiscOdio;

    /** Legado — não mais populado; mantido para compatibilidade de schema */
    @Column(name = "score_disc_antidemo", precision = 5, scale = 2)
    private BigDecimal scoreDiscAntidemo;

    // ── Análise semântica ────────────────────────────────────────────────────────

    @Column(name = "atributo_what", columnDefinition = "TEXT")
    private String atributoWhat;

    @Column(name = "atributo_who", columnDefinition = "TEXT")
    private String atributoWho;

    @Column(name = "atributo_where", columnDefinition = "TEXT")
    private String atributoWhere;

    @Column(name = "atributo_when", columnDefinition = "TEXT")
    private String atributoWhen;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "pseudo_label", length = 100)
    private String pseudoLabel;

    @Column(name = "misinformation_features", columnDefinition = "TEXT")
    private String misinformationFeatures;

    @Column(name = "certeza_alegacao", precision = 5, scale = 2)
    private BigDecimal certezaAlegacao;

    @Column(name = "faixa_certeza_alegacao", length = 50)
    private String faixaCertezaAlegacao;

    @Column(name = "topic_match", columnDefinition = "TEXT")
    private String topicMatchJson;

    @Column(name = "simulado", nullable = false)
    private boolean simulado = true;

    @Column(name = "status_ia", length = 30)
    private String statusIa = "pendente";

    @Column(name = "iniciado_em")
    private java.time.LocalDateTime iniciadoEm;

    @Column(name = "finalizado_em")
    private java.time.LocalDateTime finalizadoEm;

    @Column(name = "mensagem_erro", columnDefinition = "TEXT")
    private String mensagemErro;
}
