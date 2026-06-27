package br.com.efcaas.api.channel.adapter.whatsapp;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelInboundMedia;
import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.channel.core.CommunicationChannel;
import br.com.efcaas.api.config.ChannelProperties;
import br.com.efcaas.api.exception.ChannelValidationException;
import br.com.efcaas.api.exception.WebhookAckOnlyException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "efcaas.channels.whatsapp.enabled", havingValue = "true")
public class WhatsAppBusinessChannelAdapter implements CommunicationChannel {

    private final ChannelProperties channelProperties;
    private final WhatsAppMediaFetcher mediaFetcher;
    private final ObjectMapper objectMapper;

    @Override
    public ChannelType type() {
        return ChannelType.WHATSAPP;
    }

    @Override
    public void validateInbound(ChannelContext context) {
        if (context.headers().containsKey("X-Hub-Signature-256")) {
            validateSignature(context.rawBody(), context.headers().get("X-Hub-Signature-256"));
        }
    }

    @Override
    public ChannelInboundMessage parseInbound(ChannelContext context) {
        try {
            JsonNode root = objectMapper.readTree(context.rawBody());
            JsonNode entry = root.path("entry").path(0);
            JsonNode change = entry.path("changes").path(0).path("value");
            JsonNode messages = change.path("messages");
            if (!messages.isArray() || messages.isEmpty()) {
                throw new WebhookAckOnlyException();
            }
            JsonNode msg = messages.get(0);
            String messageId = msg.path("id").asText();
            String from = msg.path("from").asText();
            String type = msg.path("type").asText("text");

            String text = "";
            List<ChannelInboundMedia> midias = new ArrayList<>();

            if ("text".equals(type)) {
                text = msg.path("text").path("body").asText("");
            } else if ("image".equals(type) || "video".equals(type) || "document".equals(type)) {
                JsonNode mediaNode = msg.path(type);
                String mediaId = mediaNode.path("id").asText();
                String caption = mediaNode.path("caption").asText("");
                text = caption.isBlank() ? ("Mídia recebida via WhatsApp (" + type + ")") : caption;
                String url = mediaFetcher.fetchMediaUrl(mediaId);
                midias.add(new ChannelInboundMedia(type.equals("document") ? "document" : type, url,
                        mediaNode.path("filename").asText(null)));
            } else {
                text = "Mensagem WhatsApp tipo: " + type;
            }

            String contactName = change.path("contacts").path(0).path("profile").path("name").asText(null);

            return new ChannelInboundMessage(
                    text.length() > 120 ? text.substring(0, 120) : text,
                    text,
                    null,
                    "whatsapp",
                    contactName,
                    from,
                    null,
                    messageId,
                    null,
                    midias,
                    Map.of("wa_message_type", type)
            );
        } catch (WebhookAckOnlyException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Payload WhatsApp inválido: " + ex.getMessage(), ex);
        }
    }

    public String verifyChallenge(String mode, String token, String challenge) {
        if (!"subscribe".equals(mode)) {
            throw new ChannelValidationException("Modo de verificação WhatsApp inválido");
        }
        if (!channelProperties.whatsapp().verifyToken().equals(token)) {
            throw new ChannelValidationException("Verify token WhatsApp inválido");
        }
        return challenge;
    }

    private void validateSignature(String rawBody, String signatureHeader) {
        String secret = channelProperties.whatsapp().appSecret();
        if (secret == null || secret.isBlank()) {
            log.warn("WHATSAPP app-secret não configurado; assinatura não verificada");
            return;
        }
        if (signatureHeader == null || !signatureHeader.startsWith("sha256=")) {
            throw new ChannelValidationException("Assinatura WhatsApp ausente ou inválida");
        }
        String expected = "sha256=" + hmacSha256(rawBody, secret);
        if (!expected.equals(signatureHeader)) {
            throw new ChannelValidationException("Assinatura WhatsApp inválida");
        }
    }

    private static String hmacSha256(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao validar assinatura WhatsApp", e);
        }
    }
}
