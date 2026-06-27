package br.com.efcaas.api.channel.adapter.rest;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoMidiaRequest;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RestApiChannelAdapterTest {

    private final RestApiChannelAdapter adapter = new RestApiChannelAdapter();

    @Test
    void parseInbound_mapsRequestFields() {
        IngestConteudoRecebidoRequest request = new IngestConteudoRecebidoRequest(
                "Titulo",
                "Conteudo",
                "Resumo",
                "telegram",
                "Remetente",
                "+5511999999999",
                "https://example.com",
                "ext-001",
                "notas",
                List.of(new IngestConteudoRecebidoMidiaRequest("image", "https://img", "foto.jpg"))
        );

        ChannelContext context = ChannelContext.of(
                ChannelType.REST, "127.0.0.1", "test", null, null, null, new HttpHeaders(), request);

        ChannelInboundMessage message = adapter.parseInbound(context);

        assertThat(message.titulo()).isEqualTo("Titulo");
        assertThat(message.tipoFonte()).isEqualTo("telegram");
        assertThat(message.idMensagemExterna()).isEqualTo("ext-001");
        assertThat(message.midias()).hasSize(1);
        assertThat(message.midias().get(0).tipo()).isEqualTo("image");
    }

    @Test
    void validateInbound_rejectsInvalidPayload() {
        ChannelContext context = ChannelContext.of(
                ChannelType.REST, "127.0.0.1", "test", null, null, null, new HttpHeaders(), "invalid");

        assertThatThrownBy(() -> adapter.validateInbound(context))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
