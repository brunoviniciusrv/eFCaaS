package br.com.efcaas.api.web.dto;

import java.util.List;

public record DashboardResumoDto(
        long totalPendentes,
        long totalEmAnalise,
        long totalConcluidos,
        long totalRetificacao,
        long totalRevisaoFinal,
        long totalGeral,
        List<ConteudoSuspeitoDto> minhaFila
) {}
