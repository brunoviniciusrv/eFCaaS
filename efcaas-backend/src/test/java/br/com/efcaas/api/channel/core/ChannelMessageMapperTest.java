package br.com.efcaas.api.channel.core;

import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChannelMessageMapperTest {

    private final ChannelMessageMapper mapper = new ChannelMessageMapper();

    @Test
    void toIngestRequest_sanitizesTextAndMapsMidias() {
        ChannelInboundMessage message = new ChannelInboundMessage(
                "<b>Titulo</b>",
                "<script>alert(1)</script>Conteudo",
                null,
                "whatsapp",
                "Nome",
                "+5511",
                null,
                "msg-1",
                null,
                List.of(new ChannelInboundMedia("video", "https://v.mp4", "video.mp4")),
                null
        );

        IngestConteudoRecebidoRequest request = mapper.toIngestRequest(message);

        assertThat(request.titulo()).isEqualTo("<b>Titulo</b>");
        assertThat(request.conteudo()).doesNotContain("script");
        assertThat(request.midias()).hasSize(1);
        assertThat(request.midias().get(0).tipo()).isEqualTo("video");
    }
}
