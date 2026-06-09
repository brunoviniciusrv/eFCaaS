package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarEtiquetaRequest(
        @NotBlank @Size(max = 50) String nome,
        @Size(max = 255)          String descricao,
        @Size(max = 20)           String cor
) {}
