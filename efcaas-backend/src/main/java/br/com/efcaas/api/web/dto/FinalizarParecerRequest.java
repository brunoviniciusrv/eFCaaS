package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record FinalizarParecerRequest(
        @NotBlank String textoParecer,
        @NotNull Long etiquetaId
) {}
