package br.com.efcaas.api.web.dto;

public record AnexoConteudoDto(
        String id,
        String tipo,
        String urlAcesso,
        String nomeArquivo,
        String contentType,
        Long tamanhoBytes,
        String objectKey
) {}
