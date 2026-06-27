package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IngestConteudoRecebidoMidiaRequest(
        @NotBlank @Size(max = 30) String tipo,
        @NotBlank @Size(max = 2048) String url,
        @Size(max = 255) String titulo
) {}
