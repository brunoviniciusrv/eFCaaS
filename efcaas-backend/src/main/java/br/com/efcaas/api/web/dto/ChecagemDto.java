package br.com.efcaas.api.web.dto;

import java.util.List;

public record ChecagemDto(
        String id,
        String conteudoId,
        String curadorId,
        String checadorId,
        String briefing,
        String status,
        String dataInicio,
        String dataConclusao,
        InvestigacaoDto investigacao,
        ParecerDto parecer,
        List<EvidenciaDto> evidencias,
        List<String> checadorIds,
        List<HistoricoAtribuicaoDto> historicoAtribuicao
) {}
