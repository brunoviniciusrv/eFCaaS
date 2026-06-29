package br.com.efcaas.api.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record SolicitacaoCadastroDto(
        Long id,
        String nomeAgencia,
        String cnpj,
        String nomeResponsavel,
        String emailContato,
        String telefone,
        String pais,
        String estado,
        String cidade,
        String planoSolicitado,
        String informacoesExtras,
        String status,
        String motivoReprovacao,
        Long tenantId,
        String tenantSlug,
        OffsetDateTime criadoEm,
        OffsetDateTime atualizadoEm,
        List<DocumentoSolicitacaoDto> documentos
) {}
