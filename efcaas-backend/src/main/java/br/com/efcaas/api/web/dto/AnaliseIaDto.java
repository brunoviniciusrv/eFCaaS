package br.com.efcaas.api.web.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record AnaliseIaDto(
        String avaliacaoRisco,
        String textoAnalise,
        boolean simulado,

        // Eixo Desinformação (0–100)
        BigDecimal scoreInveracidade,
        /** fake_score da Guaia — persistido em score_distorcao */
        @JsonProperty("scoreFalsidade")
        BigDecimal scoreFalsidade,
        /** média distortion_level das mídias — persistido em score_fora_contexto; null sem mídia */
        @JsonProperty("scoreDistorcaoMidia")
        BigDecimal scoreDistorcaoMidia,

        // Eixo Ilicitudes
        String classificacaoOdio,
        String classificacaoAntidemo,
        BigDecimal confiancaClassificacao,
        String categoriaFinal,
        BigDecimal scoreRiscoIlicitude,

        // Análise semântica
        String atributoWhat,
        String atributoWho,
        String atributoWhere,
        String atributoWhen,
        String keywords,
        String pseudoLabel,
        String misinformationFeatures,
        BigDecimal certezaAlegacao,
        String faixaCertezaAlegacao,
        List<String> topicMatch,
        String statusIa,
        String iniciadoEm,
        String finalizadoEm,
        String mensagemErro
) {}
