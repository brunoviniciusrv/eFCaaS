package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AtivacaoRequest(
        @NotBlank String tenant,
        @NotBlank String token,
        @NotBlank String senha
) {}
