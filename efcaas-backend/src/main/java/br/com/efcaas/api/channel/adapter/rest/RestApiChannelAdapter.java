package br.com.efcaas.api.channel.adapter.rest;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelInboundMedia;
import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.channel.core.CommunicationChannel;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoMidiaRequest;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class RestApiChannelAdapter implements CommunicationChannel {

    @Override
    public ChannelType type() {
        return ChannelType.REST;
    }

    @Override
    public void validateInbound(ChannelContext context) {
        if (!(context.parsedPayload() instanceof IngestConteudoRecebidoRequest)) {
            throw new IllegalArgumentException("Payload REST inválido");
        }
    }

    @Override
    public ChannelInboundMessage parseInbound(ChannelContext context) {
        IngestConteudoRecebidoRequest req = (IngestConteudoRecebidoRequest) context.parsedPayload();
        List<ChannelInboundMedia> midias = req.midias() != null
                ? req.midias().stream()
                .map(m -> new ChannelInboundMedia(m.tipo(), m.url(), m.titulo()))
                .toList()
                : List.of();

        return new ChannelInboundMessage(
                req.titulo(),
                req.conteudo(),
                req.resumo(),
                req.tipoFonte(),
                req.nomeRemetente(),
                req.enderecoRemetente(),
                req.linkOriginal(),
                req.idMensagemExterna(),
                req.notasInternas(),
                midias,
                null
        );
    }
}
