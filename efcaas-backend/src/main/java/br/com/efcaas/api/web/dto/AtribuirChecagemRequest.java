package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotNull;

public record AtribuirChecagemRequest(
        @NotNull Long checadorId,
        String briefing
) {}
