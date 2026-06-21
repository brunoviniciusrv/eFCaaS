package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record SalvarRelatorioPublicacaoRequest(
        @NotBlank String titulo,
        String corpoTexto,
        String resumo,
        @NotBlank String statusPublicacao,
        String template,
        List<EditorialCommentDto> comentarios
) {}
