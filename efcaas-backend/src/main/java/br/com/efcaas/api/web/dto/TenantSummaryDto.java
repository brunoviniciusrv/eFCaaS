package br.com.efcaas.api.web.dto;

import java.time.OffsetDateTime;

public record TenantSummaryDto(
        String id,
        String slug,
        String nome,
        String plano,
        String status,
        boolean compartilhaDadosEcossistema,
        OffsetDateTime criadoEm
) {}
