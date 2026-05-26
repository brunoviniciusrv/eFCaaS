package br.com.efcaas.api.web.dto;

import java.util.List;

public record ParecerDto(
        String id,
        String resumo,
        List<String> perguntas,
        List<String> fontes,
        boolean inverificavel,
        ContatoAutorDto contatoAutor,
        String respostaAutor,
        String textoParecer,
        EtiquetaDto etiqueta
) {}
