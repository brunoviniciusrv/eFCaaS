package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.guaia.GuaiaAllegationResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationMediaResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaRiscoIlicitude;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextClassifyResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class IaRealServiceTest {

    private IaRealService service;
    private ConteudoSuspeito conteudo;

    @BeforeEach
    void setUp() {
        service = new IaRealService(null, null, null, null);
        conteudo = new ConteudoSuspeito();
        conteudo.setId(42L);
        conteudo.setTitulo("Título teste");
    }

    @Test
    void mapToDto_mapeiaCamposGuaiaFielmente() {
        GuaiaTextResponse texto = new GuaiaTextResponse(
                "alegação falsa",
                "político X",
                "Brasília",
                "2024",
                "eleição,fraude",
                "fake_news",
                0.72,
                "linguagem alarmista; apelo emocional",
                List.of("política", "eleições")
        );

        GuaiaPublicationResponse pub = new GuaiaPublicationResponse(
                0.65,
                "Resumo breve",
                "Análise detalhada da publicação.",
                null,
                null,
                null,
                null,
                texto,
                new GuaiaAllegationResponse("alegação normalizada", 0.81, "alta"),
                List.of(new GuaiaPublicationMediaResponse(
                        1, "imagem", "foto.jpg", true,
                        Map.of("distortion_level", 0.4),
                        Map.of(), null)),
                1, 1, 0
        );

        GuaiaTextClassifyResponse classify = new GuaiaTextClassifyResponse(
                "Não",
                "Sim",
                "desinformação",
                0.88,
                new GuaiaRiscoIlicitude(0.42, 42.0)
        );

        AnaliseIaDto dto = service.mapToDto(conteudo, pub, classify, true);

        assertThat(dto.scoreInveracidade()).isEqualByComparingTo(BigDecimal.valueOf(65));
        assertThat(dto.scoreFalsidade()).isEqualByComparingTo(BigDecimal.valueOf(72));
        assertThat(dto.scoreDistorcaoMidia()).isEqualByComparingTo(BigDecimal.valueOf(40));
        assertThat(dto.classificacaoOdio()).isEqualTo("Sim");
        assertThat(dto.classificacaoAntidemo()).isEqualTo("Não");
        assertThat(dto.confiancaClassificacao()).isEqualByComparingTo(BigDecimal.valueOf(88));
        assertThat(dto.categoriaFinal()).isEqualTo("desinformação");
        assertThat(dto.scoreRiscoIlicitude()).isEqualByComparingTo(BigDecimal.valueOf(42.0));
        assertThat(dto.textoAnalise()).isEqualTo("Análise detalhada da publicação.");
        assertThat(dto.atributoWhat()).isEqualTo("alegação falsa");
        assertThat(dto.atributoWho()).isEqualTo("político X");
        assertThat(dto.atributoWhere()).isEqualTo("Brasília");
        assertThat(dto.atributoWhen()).isEqualTo("2024");
        assertThat(dto.keywords()).isEqualTo("eleição,fraude");
        assertThat(dto.pseudoLabel()).isEqualTo("fake_news");
        assertThat(dto.misinformationFeatures()).isEqualTo("linguagem alarmista; apelo emocional");
        assertThat(dto.certezaAlegacao()).isEqualByComparingTo(BigDecimal.valueOf(81));
        assertThat(dto.faixaCertezaAlegacao()).isEqualTo("alta");
        assertThat(dto.topicMatch()).containsExactly("política", "eleições");
        assertThat(dto.avaliacaoRisco()).isEqualTo("alto");
        assertThat(dto.simulado()).isFalse();
    }

    @Test
    void mapToDto_semMidias_naoDefineDistorcaoMidia() {
        GuaiaPublicationResponse pub = new GuaiaPublicationResponse(
                0.2,
                "Resumo",
                null,
                "o quê", "quem", "onde", "quando",
                new GuaiaTextResponse(null, null, null, null, null, null, 0.1, null, List.of()),
                null,
                List.of(),
                0, 0, 0
        );

        GuaiaTextClassifyResponse classify = new GuaiaTextClassifyResponse(
                "Não", "Não", "neutro", 0.9, new GuaiaRiscoIlicitude(0.1, 10.0)
        );

        AnaliseIaDto dto = service.mapToDto(conteudo, pub, classify, false);

        assertThat(dto.scoreDistorcaoMidia()).isNull();
        assertThat(dto.atributoWhat()).isEqualTo("o quê");
        assertThat(dto.textoAnalise()).isEqualTo("Resumo");
        assertThat(dto.avaliacaoRisco()).isEqualTo("baixo");
    }
}
