package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarConteudoRequest(
        @NotBlank @Size(max = 255) String titulo,
        String alegacao,
        String link,
        @Size(max = 255) String fonte,
        String descricao,
        String prioridade
) {}
