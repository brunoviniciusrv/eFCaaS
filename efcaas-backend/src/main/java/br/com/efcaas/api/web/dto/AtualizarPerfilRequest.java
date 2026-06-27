package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequest(
        @Size(min = 2, max = 100) String nome,
        @Size(max = 1000) String bio,
        @Size(max = 500_000) String foto
) {}
