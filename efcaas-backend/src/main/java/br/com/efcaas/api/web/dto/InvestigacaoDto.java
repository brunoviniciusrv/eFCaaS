package br.com.efcaas.api.web.dto;

import java.util.List;

public record InvestigacaoDto(
        String id,
        String resumoMetodologia,
        List<String> perguntas,
        List<String> respostasPerguntas,
        List<String> fontes,
        boolean inverificavel,
        String autorDesinformacao,
        boolean autorDesinformacaoInverificavel,
        Boolean contatoRealizado,
        String respostaAutor,
        String justificativaSemContato
) {}
