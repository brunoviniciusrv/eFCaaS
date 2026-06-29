package br.com.efcaas.api.web.dto;

import java.util.List;

public record SalvarInvestigacaoRequest(
        String resumo,
        List<String> perguntas,
        List<String> respostasPerguntas,
        List<String> fontes,
        boolean inverificavel,
        String autorDesinformacao,
        boolean autorDesinformacaoInverificavel,
        ContatoAutorDto contatoAutor
) {}
