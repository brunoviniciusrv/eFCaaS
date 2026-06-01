package br.com.efcaas.api.web.dto;

public record ParecerDto(
        String id,
        String textoParecer,
        EtiquetaDto etiqueta
) {}
