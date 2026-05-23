package br.com.efcaas.api.web.dto;

import lombok.Builder;

@Builder
public record AnaliseIaDto(
        String avaliacaoRisco,
        String textoAnalise,
        boolean simulado
) {}
