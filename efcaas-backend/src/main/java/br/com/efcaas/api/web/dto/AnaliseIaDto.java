package br.com.efcaas.api.web.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record AnaliseIaDto(
        String avaliacaoRisco,
        String textoAnalise,
        boolean simulado,

        // Eixo Desinformação
        BigDecimal scoreInveracidade,
        BigDecimal scoreDistorcao,
        BigDecimal scoreForaContexto,

        // Eixo Ilicitudes
        BigDecimal scoreDiscOdio,
        BigDecimal scoreDiscAntidemo,
        BigDecimal scoreRiscoIlicitude,

        // Análise semântica
        String atributoWhat,
        String atributoWho,
        String atributoWhere,
        String atributoWhen,
        String keywords,
        String pseudoLabel
) {}
