package br.com.efcaas.api.channel.adapter.telegram;

import br.com.efcaas.api.config.ChannelProperties;
import br.com.efcaas.api.service.IngestMidiaService;
import br.com.efcaas.api.util.BytesMultipartFile;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "efcaas.channels.telegram.enabled", havingValue = "true")
public class TelegramMediaFetcher {

    private final ChannelProperties channelProperties;
    private final IngestMidiaService ingestMidiaService;
    private final RestClient restClient = RestClient.create();

    public String fetchFileUrl(String fileId) {
        String token = channelProperties.telegram().botToken();
        JsonNode fileMeta = restClient.get()
                .uri("https://api.telegram.org/bot{token}/getFile?file_id={fileId}", token, fileId)
                .retrieve()
                .body(JsonNode.class);

        if (fileMeta == null || !fileMeta.path("ok").asBoolean(false)) {
            throw new IllegalStateException("getFile Telegram falhou para fileId=" + fileId);
        }

        String filePath = fileMeta.path("result").path("file_path").asText();
        byte[] bytes = restClient.get()
                .uri("https://api.telegram.org/file/bot{token}/{path}", token, filePath)
                .retrieve()
                .body(byte[].class);

        String filename = filePath.contains("/") ? filePath.substring(filePath.lastIndexOf('/') + 1) : filePath;
        String mime = filename.endsWith(".mp4") ? "video/mp4" : "application/octet-stream";
        var upload = ingestMidiaService.upload(new BytesMultipartFile(
                "file", filename, mime, bytes != null ? bytes : new byte[0]));
        return upload.url();
    }
}
