package br.com.efcaas.api.web.dto;

public record ConteudoRecebidoMidiaDto(
        Long id,
        String tipo,
        String url,
        String titulo
) {}
