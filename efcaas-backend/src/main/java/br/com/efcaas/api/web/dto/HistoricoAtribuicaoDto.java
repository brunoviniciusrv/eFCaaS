package br.com.efcaas.api.web.dto;

public record HistoricoAtribuicaoDto(
        String id,
        String usuarioId,
        String usuarioNome,
        String atribuidoPorId,
        String atribuidoPorNome,
        String acao,
        String motivo,
        String timestamp
) {}
