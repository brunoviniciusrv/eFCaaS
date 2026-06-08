package br.com.efcaas.api.web.dto;

public record AuditoriaDto(
        Long id,
        String usuarioNome,
        String acao,
        String alvo,
        String detalhes,
        String timestamp
) {}
