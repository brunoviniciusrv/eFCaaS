package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarConteudoRequest(
        @NotBlank @Size(max = 255) String titulo,
        String alegacao,
        String link,
        String descricao,
        String prioridade
) {}
