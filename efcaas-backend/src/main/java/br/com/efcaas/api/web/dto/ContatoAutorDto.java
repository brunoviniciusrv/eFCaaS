package br.com.efcaas.api.web.dto;

public record ContatoAutorDto(
        Boolean hadContact,
        String justificacao,
        String response
) {}
