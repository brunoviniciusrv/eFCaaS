package br.com.efcaas.api.web.dto;

import java.util.List;

public record SalvarInvestigacaoRequest(
        String resumo,
        List<String> perguntas,
        List<String> fontes,
        boolean inverificavel,
        ContatoAutorDto contatoAutor
) {}
