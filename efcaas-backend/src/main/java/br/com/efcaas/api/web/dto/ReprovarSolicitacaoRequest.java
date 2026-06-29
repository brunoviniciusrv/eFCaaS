package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ReprovarSolicitacaoRequest(
        @NotBlank String motivo
) {}
