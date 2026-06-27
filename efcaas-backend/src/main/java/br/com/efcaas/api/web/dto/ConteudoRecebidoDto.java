package br.com.efcaas.api.web.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record ConteudoRecebidoDto(
        Long id,
        String titulo,
        String conteudo,
        String resumo,
        String tipoFonte,
        String nomeRemetente,
        String enderecoRemetente,
        String linkOriginal,
        String idMensagemExterna,
        String notasInternas,
        String status,
        OffsetDateTime recebidoEm,
        Long conteudoTriagemId,
        List<ConteudoRecebidoMidiaDto> midias
) {}
