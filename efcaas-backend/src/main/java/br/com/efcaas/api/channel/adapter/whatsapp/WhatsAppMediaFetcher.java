package br.com.efcaas.api.channel.adapter.whatsapp;

import br.com.efcaas.api.config.ChannelProperties;
import br.com.efcaas.api.service.IngestMidiaService;
import br.com.efcaas.api.util.BytesMultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "efcaas.channels.whatsapp.enabled", havingValue = "true")
public class WhatsAppMediaFetcher {

    private final ChannelProperties channelProperties;
    private final IngestMidiaService ingestMidiaService;
    private final RestClient restClient = RestClient.create();

    public String fetchMediaUrl(String mediaId) {
        String version = channelProperties.whatsapp().graphApiVersion();
        String token = channelProperties.whatsapp().accessToken();
        String metaUrl = "https://graph.facebook.com/" + version + "/" + mediaId;

        JsonNode meta = restClient.get()
                .uri(metaUrl)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(JsonNode.class);

        if (meta == null || !meta.has("url")) {
            throw new IllegalStateException("URL de mídia WhatsApp não encontrada para id=" + mediaId);
        }

        byte[] bytes = restClient.get()
                .uri(meta.get("url").asText())
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .body(byte[].class);

        String mime = meta.path("mime_type").asText("application/octet-stream");
        String filename = mediaId + guessExtension(mime);
        var upload = ingestMidiaService.upload(new BytesMultipartFile(
                "file", filename, mime, bytes != null ? bytes : new byte[0]));
        return upload.url();
    }

    private static String guessExtension(String mime) {
        if (mime.contains("jpeg")) return ".jpg";
        if (mime.contains("png")) return ".png";
        if (mime.contains("mp4")) return ".mp4";
        if (mime.contains("pdf")) return ".pdf";
        return ".bin";
    }
}
