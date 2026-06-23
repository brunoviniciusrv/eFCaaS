package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "configuracao_agencia")
@Getter
@Setter
public class ConfiguracaoAgencia {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "url_logo", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(nullable = false, length = 10)
    private String idioma = "pt-BR";

    @Column(nullable = false, length = 80)
    private String pais = "Brasil";

    @Column(name = "fuso_horario", nullable = false, length = 60)
    private String timezone = "America/Sao_Paulo";

    @Column(name = "onboarding_concluido", nullable = false)
    private boolean onboardingConcluido = false;

    @Column(name = "id_modelo", nullable = false, length = 50)
    private String templateId = "default";

    @Column(name = "perfis_padrao", nullable = false)
    private boolean useDefaultProfiles = true;

    @Column(name = "ia", nullable = false)
    private boolean enableAi = true;

    @Column(name = "rede_especializada", nullable = false)
    private boolean enableSpecializedNetwork = true;

    @Column(name = "monitor_redes_sociais", nullable = false)
    private boolean enableSocialSearch = true;

    @Column(name = "analisador_desinformacao", nullable = false)
    private boolean enableTrendAnalyzer = true;

    @Column(name = "classificacao_risco_engajamento", nullable = false)
    private boolean enableMisinfoRisk = true;

    @Column(name = "risco_ilicitudes", nullable = false)
    private boolean enableIllicitRisk = true;

    @Column(name = "tema_json", nullable = false, columnDefinition = "TEXT")
    private String temaJson = "{}";

    @Column(name = "criado_em", nullable = false)
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Column(name = "atualizado_em", nullable = false)
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "atualizado_por_id")
    private Usuario atualizadoPor;
}
