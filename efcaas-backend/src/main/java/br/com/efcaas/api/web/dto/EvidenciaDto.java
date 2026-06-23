package br.com.efcaas.api.web.dto;

public record EvidenciaDto(
        String id,
        String tipo,
        String linkArquivo,
        String descricao,
        String nomeArquivo,
        Long tamanhoBytes,
        String contentType,
        String objectKey
) {}
