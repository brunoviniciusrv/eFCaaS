package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AtualizarStatusRelatorioRequest(
        @NotBlank String statusPublicacao
) {}
