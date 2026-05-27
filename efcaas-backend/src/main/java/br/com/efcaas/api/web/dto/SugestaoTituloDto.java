package br.com.efcaas.api.web.dto;

import lombok.Builder;

@Builder
public record SugestaoTituloDto(
        String titulo,
        String excerpt,
        boolean simulado
) {}
