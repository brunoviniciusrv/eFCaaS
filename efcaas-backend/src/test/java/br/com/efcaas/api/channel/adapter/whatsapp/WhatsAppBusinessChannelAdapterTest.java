package br.com.efcaas.api.channel.adapter.whatsapp;

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

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class WhatsAppBusinessChannelAdapterTest {

    private static final String APP_SECRET = "test-app-secret";
    private static final String VERIFY_TOKEN = "verify-me";

    private WhatsAppBusinessChannelAdapter adapter;

    @BeforeEach
    void setUp() {
        ChannelProperties props = new ChannelProperties(
                new ChannelProperties.WhatsApp(true, "phone-id", "token", APP_SECRET, VERIFY_TOKEN, "v21.0"),
                new ChannelProperties.Telegram(false, "", "")
        );
        adapter = new WhatsAppBusinessChannelAdapter(props, null, new ObjectMapper());
    }

    @Test
    void verifyChallenge_returnsChallengeWhenTokenMatches() {
        assertThat(adapter.verifyChallenge("subscribe", VERIFY_TOKEN, "12345")).isEqualTo("12345");
    }

    @Test
    void verifyChallenge_rejectsInvalidToken() {
        assertThatThrownBy(() -> adapter.verifyChallenge("subscribe", "wrong", "12345"))
                .isInstanceOf(ChannelValidationException.class);
    }

    @Test
    void validateInbound_acceptsValidSignature() {
        String body = sampleTextPayload();
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Hub-Signature-256", "sha256=" + hmac(body, APP_SECRET));

        ChannelContext context = ChannelContext.of(
                ChannelType.WHATSAPP, "127.0.0.1", "Meta", null, null, body, headers, null);

        adapter.validateInbound(context);
    }

    @Test
    void validateInbound_rejectsInvalidSignature() {
        String body = sampleTextPayload();
        HttpHeaders headers = new HttpHeaders();
        headers.add("X-Hub-Signature-256", "sha256=deadbeef");

        ChannelContext context = ChannelContext.of(
                ChannelType.WHATSAPP, "127.0.0.1", "Meta", null, null, body, headers, null);

        assertThatThrownBy(() -> adapter.validateInbound(context))
                .isInstanceOf(ChannelValidationException.class);
    }

    @Test
    void parseInbound_mapsTextMessage() {
        String body = sampleTextPayload();
        ChannelContext context = ChannelContext.of(
                ChannelType.WHATSAPP, "127.0.0.1", "Meta", null, null, body, new HttpHeaders(), null);

        ChannelInboundMessage message = adapter.parseInbound(context);

        assertThat(message.tipoFonte()).isEqualTo("whatsapp");
        assertThat(message.idMensagemExterna()).isEqualTo("wamid.123");
        assertThat(message.conteudo()).contains("Olá");
        assertThat(message.enderecoRemetente()).isEqualTo("5511999999999");
    }

    @Test
    void parseInbound_ackOnlyWhenNoMessages() {
        String body = """
                {"entry":[{"changes":[{"value":{"messages":[]}}]}]}
                """;
        ChannelContext context = ChannelContext.of(
                ChannelType.WHATSAPP, "127.0.0.1", "Meta", null, null, body, new HttpHeaders(), null);

        assertThatThrownBy(() -> adapter.parseInbound(context))
                .isInstanceOf(WebhookAckOnlyException.class);
    }

    private static String sampleTextPayload() {
        return """
                {
                  "entry": [{
                    "changes": [{
                      "value": {
                        "messages": [{
                          "id": "wamid.123",
                          "from": "5511999999999",
                          "type": "text",
                          "text": { "body": "Olá via WhatsApp" }
                        }],
                        "contacts": [{
                          "profile": { "name": "Test User" }
                        }]
                      }
                    }]
                  }]
                }
                """;
    }

    private static String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
