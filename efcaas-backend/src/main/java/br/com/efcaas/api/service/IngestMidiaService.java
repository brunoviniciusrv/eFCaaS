package br.com.efcaas.api.service;

import br.com.efcaas.api.config.ApiProperties;
import br.com.efcaas.api.web.dto.IngestMidiaUploadDto;
import io.minio.GetObjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class IngestMidiaService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image", "video");

    private final StorageService storageService;
    private final ApiProperties apiProperties;

    @Value("${efcaas.jwt.secret}")
    private String jwtSecret;

    @Value("${efcaas.storage.presigned-url-expiry-minutes:1440}")
    private int expiryMinutes;

    public IngestMidiaUploadDto upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        StorageService.UploadResult upload = storageService.uploadIngestRecebido(file);
        String tipo = inferirTipo(upload.contentType());
        if (!ALLOWED_TYPES.contains(tipo)) {
            storageService.delete(upload.objectKey());
            throw new IllegalArgumentException("Somente imagens e vídeos são permitidos");
        }

        return new IngestMidiaUploadDto(
                tipo,
                buildDownloadUrl(upload.objectKey(), upload.contentType()),
                upload.originalFilename()
        );
    }

    public ResponseEntity<StreamingResponseBody> download(String token, String rangeHeader) {
        TokenPayload payload = validarToken(token);
        long fileSize = storageService.getObjectSize(payload.objectKey());
        String filename = payload.objectKey().substring(payload.objectKey().lastIndexOf('_') + 1);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(payload.contentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + URLEncoder.encode(filename, StandardCharsets.UTF_8) + "\"");
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (rangeHeader == null || rangeHeader.isBlank()) {
            StreamingResponseBody body = outputStream -> {
                try (GetObjectResponse object = storageService.getObject(payload.objectKey())) {
                    object.transferTo(outputStream);
                }
            };
            headers.setContentLength(fileSize);
            return ResponseEntity.ok().headers(headers).body(body);
        }

        ByteRange range = parseByteRange(rangeHeader, fileSize);
        long contentLength = range.end() - range.start() + 1;

        StreamingResponseBody body = outputStream -> {
            try (GetObjectResponse object = storageService.getObjectRange(
                    payload.objectKey(), range.start(), contentLength)) {
                object.transferTo(outputStream);
            }
        };

        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.CONTENT_RANGE,
                "bytes " + range.start() + "-" + range.end() + "/" + fileSize);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers).body(body);
    }

    private String buildDownloadUrl(String objectKey, String contentType) {
        String base = apiProperties.publicUrl().replaceAll("/$", "");
        return base + "/ingest/midias/download?token=" + gerarToken(objectKey, contentType);
    }

    private String gerarToken(String objectKey, String contentType) {
        long exp = Instant.now().plusSeconds(expiryMinutes * 60L).getEpochSecond();
        String payload = objectKey + ":" + contentType + ":" + exp;
        String signature = hmac(payload);
        String raw = payload + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private TokenPayload validarToken(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token de acesso ausente");
        }

        String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
        int lastColon = raw.lastIndexOf(':');
        if (lastColon <= 0) {
            throw new IllegalArgumentException("Token de acesso inválido");
        }
        String signature = raw.substring(lastColon + 1);
        String payload = raw.substring(0, lastColon);

        int secondColon = payload.lastIndexOf(':');
        int firstColon = payload.indexOf(':');
        if (firstColon <= 0 || secondColon <= firstColon) {
            throw new IllegalArgumentException("Token de acesso inválido");
        }

        String objectKey = payload.substring(0, firstColon);
        String contentType = payload.substring(firstColon + 1, secondColon);
        long exp = Long.parseLong(payload.substring(secondColon + 1));

        if (Instant.now().getEpochSecond() > exp) {
            throw new IllegalArgumentException("Token de acesso expirado");
        }

        String signedPayload = objectKey + ":" + contentType + ":" + exp;
        if (!MessageDigest.isEqual(hmac(signedPayload).getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Token de acesso inválido");
        }

        return new TokenPayload(objectKey, contentType);
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao assinar token de acesso", e);
        }
    }

    private static String inferirTipo(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("audio/")) return "audio";
        return "document";
    }

    private record TokenPayload(String objectKey, String contentType) {}

    private record ByteRange(long start, long end) {}

    private static ByteRange parseByteRange(String rangeHeader, long fileSize) {
        if (!rangeHeader.startsWith("bytes=")) {
            throw new IllegalArgumentException("Range inválido");
        }
        String[] parts = rangeHeader.substring(6).trim().split("-", 2);
        long start;
        long end;
        if (parts[0].isEmpty()) {
            long suffix = Long.parseLong(parts[1]);
            start = Math.max(0, fileSize - suffix);
            end = fileSize - 1;
        } else {
            start = Long.parseLong(parts[0]);
            end = (parts.length < 2 || parts[1].isEmpty()) ? fileSize - 1 : Long.parseLong(parts[1]);
        }
        if (start < 0 || end >= fileSize || start > end) {
            throw new IllegalArgumentException("Range inválido");
        }
        return new ByteRange(start, end);
    }
}
