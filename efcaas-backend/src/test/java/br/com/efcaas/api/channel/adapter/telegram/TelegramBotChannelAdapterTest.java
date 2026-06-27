package br.com.efcaas.api.channel.adapter.telegram;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.config.ChannelProperties;
import br.com.efcaas.api.exception.ChannelValidationException;
import br.com.efcaas.api.exception.WebhookAckOnlyException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TelegramBotChannelAdapterTest {

    private static final String SECRET = "telegram-secret";

    private TelegramBotChannelAdapter adapter;

    @BeforeEach
    void setUp() {
        ChannelProperties props = new ChannelProperties(
                new ChannelProperties.WhatsApp(false, "", "", "", "", "v21.0"),
                new ChannelProperties.Telegram(true, "bot-token", SECRET)
        );
        adapter = new TelegramBotChannelAdapter(props, null, new ObjectMapper());
    }

    @Test
    void validateInbound_acceptsMatchingSecretToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Telegram-Bot-Api-Secret-Token", SECRET);
        ChannelContext context = ChannelContext.of(
                ChannelType.TELEGRAM, "127.0.0.1", "Telegram", null, null, "{}", headers, null);

        adapter.validateInbound(context);
    }

    @Test
    void validateInbound_rejectsInvalidSecretToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Telegram-Bot-Api-Secret-Token", "wrong");
        ChannelContext context = ChannelContext.of(
                ChannelType.TELEGRAM, "127.0.0.1", "Telegram", null, null, "{}", headers, null);

        assertThatThrownBy(() -> adapter.validateInbound(context))
                .isInstanceOf(ChannelValidationException.class);
    }

    @Test
    void parseInbound_mapsTextMessage() {
        String body = """
                {
                  "update_id": 1,
                  "message": {
                    "message_id": 42,
                    "from": { "id": 12345, "first_name": "Test", "last_name": "User" },
                    "text": "Mensagem Telegram"
                  }
                }
                """;
        ChannelContext context = ChannelContext.of(
                ChannelType.TELEGRAM, "127.0.0.1", "Telegram", null, null, body, new HttpHeaders(), null);

        ChannelInboundMessage message = adapter.parseInbound(context);

        assertThat(message.tipoFonte()).isEqualTo("telegram");
        assertThat(message.idMensagemExterna()).isEqualTo("tg-42");
        assertThat(message.conteudo()).isEqualTo("Mensagem Telegram");
        assertThat(message.nomeRemetente()).contains("Test");
    }

    @Test
    void parseInbound_ackOnlyWhenNoMessage() {
        String body = "{\"update_id\": 2}";
        ChannelContext context = ChannelContext.of(
                ChannelType.TELEGRAM, "127.0.0.1", "Telegram", null, null, body, new HttpHeaders(), null);

        assertThatThrownBy(() -> adapter.parseInbound(context))
                .isInstanceOf(WebhookAckOnlyException.class);
    }
}
