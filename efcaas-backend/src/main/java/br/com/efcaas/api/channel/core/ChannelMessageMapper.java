package br.com.efcaas.api.channel.core;

import br.com.efcaas.api.util.TextSanitizer;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoMidiaRequest;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChannelMessageMapper {

    public IngestConteudoRecebidoRequest toIngestRequest(ChannelInboundMessage message) {
        List<IngestConteudoRecebidoMidiaRequest> midias = message.midias().stream()
                .map(m -> new IngestConteudoRecebidoMidiaRequest(m.tipo(), m.url(), m.titulo()))
                .toList();

        return new IngestConteudoRecebidoRequest(
                TextSanitizer.sanitize(message.titulo()),
                TextSanitizer.sanitize(message.conteudo()),
                message.resumo() != null ? TextSanitizer.sanitize(message.resumo()) : null,
                message.tipoFonte(),
                message.nomeRemetente() != null ? TextSanitizer.sanitize(message.nomeRemetente()) : null,
                message.enderecoRemetente(),
                message.linkOriginal(),
                message.idMensagemExterna(),
                message.notasInternas(),
                midias.isEmpty() ? null : midias
        );
    }
}
