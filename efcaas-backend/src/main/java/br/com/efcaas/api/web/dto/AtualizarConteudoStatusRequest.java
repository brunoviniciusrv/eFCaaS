package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AtualizarConteudoStatusRequest(
        @NotBlank String status
) {}
