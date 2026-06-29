package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "conteudo_suspeito")
@Getter
@Setter
public class ConteudoSuspeito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String alegacao;

    @Column(length = 255)
    private String link;

    @Column(length = 255)
    private String fonte;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "data_entrada", nullable = false)
    private LocalDateTime dataEntrada = LocalDateTime.now();

    @Column(name = "score_gravidade", precision = 5, scale = 2)
    private BigDecimal scoreGravidade;

    @Column(name = "score_urgencia", precision = 5, scale = 2)
    private BigDecimal scoreUrgencia;

    @Column(name = "score_tendencia", precision = 5, scale = 2)
    private BigDecimal scoreTendencia;

    @Column(length = 30)
    private String status = "pending";

    @Column(length = 10)
    private String prioridade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_responsavel")
    private Usuario responsavel;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "numero_referencia", nullable = false)
    private Integer numeroReferencia;
}
