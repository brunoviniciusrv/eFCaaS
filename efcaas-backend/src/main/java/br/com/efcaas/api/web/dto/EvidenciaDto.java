package br.com.efcaas.api.web.dto;

public record EvidenciaDto(
        String id,
        String tipo,
        String linkArquivo,
        String descricao
) {}
