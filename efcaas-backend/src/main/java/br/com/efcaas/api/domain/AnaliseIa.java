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

    @Column(name = "score_distorcao", precision = 5, scale = 2)
    private BigDecimal scoreDistorcao;

    @Column(name = "score_fora_contexto", precision = 5, scale = 2)
    private BigDecimal scoreForaContexto;

    // ── Eixo Ilicitudes ─────────────────────────────────────────────────────────

    @Column(name = "score_disc_odio", precision = 5, scale = 2)
    private BigDecimal scoreDiscOdio;

    @Column(name = "score_disc_antidemo", precision = 5, scale = 2)
    private BigDecimal scoreDiscAntidemo;

    @Column(name = "score_risco_ilicitude", precision = 5, scale = 2)
    private BigDecimal scoreRiscoIlicitude;

    // ── Análise semântica ────────────────────────────────────────────────────────

    @Column(name = "atributo_what", columnDefinition = "TEXT")
    private String atributoWhat;

    @Column(name = "atributo_who", columnDefinition = "TEXT")
    private String atributoWho;

    @Column(name = "atributo_where", length = 500)
    private String atributoWhere;

    @Column(name = "atributo_when", length = 500)
    private String atributoWhen;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords;

    @Column(name = "pseudo_label", length = 100)
    private String pseudoLabel;

    @Column(name = "simulado", nullable = false)
    private boolean simulado = true;
}
