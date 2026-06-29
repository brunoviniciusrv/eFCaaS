package br.com.efcaas.api.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record DocumentoSolicitacaoDto(
        Long id,
        String nomeArquivo,
        String tipoMime,
        Long tamanhoBytes,
        OffsetDateTime criadoEm
) {}
