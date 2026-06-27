package br.com.efcaas.api.channel.core;

import java.util.List;
import java.util.Map;

public record ChannelInboundMessage(
        String titulo,
        String conteudo,
        String resumo,
        String tipoFonte,
        String nomeRemetente,
        String enderecoRemetente,
        String linkOriginal,
        String idMensagemExterna,
        String notasInternas,
        List<ChannelInboundMedia> midias,
        Map<String, String> metadata
) {
    public ChannelInboundMessage {
        midias = midias != null ? midias : List.of();
        metadata = metadata != null ? metadata : Map.of();
    }
}
