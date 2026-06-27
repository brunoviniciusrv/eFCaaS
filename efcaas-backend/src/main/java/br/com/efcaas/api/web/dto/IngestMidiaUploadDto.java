package br.com.efcaas.api.web.dto;

public record IngestMidiaUploadDto(
        String tipo,
        String url,
        String titulo
) {}
