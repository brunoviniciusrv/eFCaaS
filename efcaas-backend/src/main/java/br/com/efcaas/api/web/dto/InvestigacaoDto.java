package br.com.efcaas.api.web.dto;

import java.util.List;

public record InvestigacaoDto(
        String id,
        String resumoMetodologia,
        List<String> perguntas,
        List<String> fontes,
        boolean inverificavel,
        Boolean contatoRealizado,
        String respostaAutor,
        String justificativaSemContato
) {}
