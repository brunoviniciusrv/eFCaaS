package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

public record AdicionarEvidenciaRequest(
        @NotBlank String tipo,
        String linkArquivo,
        String descricao
) {}
