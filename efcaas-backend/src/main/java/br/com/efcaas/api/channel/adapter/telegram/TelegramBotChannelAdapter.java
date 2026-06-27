package br.com.efcaas.api.channel.adapter.telegram;

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
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "efcaas.channels.telegram.enabled", havingValue = "true")
public class TelegramBotChannelAdapter implements CommunicationChannel {

    private final ChannelProperties channelProperties;
    private final TelegramMediaFetcher mediaFetcher;
    private final ObjectMapper objectMapper;

    @Override
    public ChannelType type() {
        return ChannelType.TELEGRAM;
    }

    @Override
    public void validateInbound(ChannelContext context) {
        String secret = channelProperties.telegram().secretToken();
        if (secret == null || secret.isBlank()) {
            return;
        }
        String header = context.headers().get("X-Telegram-Bot-Api-Secret-Token");
        if (!secret.equals(header)) {
            throw new ChannelValidationException("Secret token Telegram inválido");
        }
    }

    @Override
    public ChannelInboundMessage parseInbound(ChannelContext context) {
        try {
            JsonNode root = objectMapper.readTree(context.rawBody());
            JsonNode message = root.path("message");
            if (message.isMissingNode() || message.isNull()) {
                throw new WebhookAckOnlyException();
            }

            String messageId = message.path("message_id").asText();
            JsonNode from = message.path("from");
            String senderId = from.path("id").asText();
            String senderName = (from.path("first_name").asText("") + " "
                    + from.path("last_name").asText("")).trim();

            String text = message.path("text").asText("");
            List<ChannelInboundMedia> midias = new ArrayList<>();

            if (message.has("photo") && message.path("photo").isArray() && !message.path("photo").isEmpty()) {
                JsonNode largest = message.path("photo").get(message.path("photo").size() - 1);
                String fileId = largest.path("file_id").asText();
                String url = mediaFetcher.fetchFileUrl(fileId);
                midias.add(new ChannelInboundMedia("image", url, "telegram-photo.jpg"));
                if (text.isBlank()) text = "Imagem recebida via Telegram";
            } else if (message.has("video")) {
                String fileId = message.path("video").path("file_id").asText();
                String url = mediaFetcher.fetchFileUrl(fileId);
                midias.add(new ChannelInboundMedia("video", url, "telegram-video.mp4"));
                if (text.isBlank()) text = message.path("video").path("caption").asText("Vídeo recebido via Telegram");
            } else if (message.has("document")) {
                String fileId = message.path("document").path("file_id").asText();
                String fileName = message.path("document").path("file_name").asText("document");
                String url = mediaFetcher.fetchFileUrl(fileId);
                midias.add(new ChannelInboundMedia("document", url, fileName));
                if (text.isBlank()) text = "Documento recebido via Telegram";
            }

            if (text.isBlank() && midias.isEmpty()) {
                throw new WebhookAckOnlyException();
            }

            return new ChannelInboundMessage(
                    text.length() > 120 ? text.substring(0, 120) : text,
                    text,
                    null,
                    "telegram",
                    senderName.isBlank() ? null : senderName,
                    senderId,
                    null,
                    "tg-" + messageId,
                    null,
                    midias,
                    Map.of("telegram_chat_id", message.path("chat").path("id").asText(""))
            );
        } catch (WebhookAckOnlyException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Payload Telegram inválido: " + ex.getMessage(), ex);
        }
    }
}
