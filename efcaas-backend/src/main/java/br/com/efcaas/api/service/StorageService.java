package br.com.efcaas.api.service;

import br.com.efcaas.api.config.StorageProperties;
import io.minio.GetObjectArgs;
import io.minio.GetObjectResponse;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;
    private final StorageProperties props;

    public record UploadResult(String objectKey, String contentType, long size, String originalFilename) {}

    public UploadResult upload(Long checagemId, MultipartFile file) {
        return uploadToPrefix("checagens/" + checagemId, file);
    }

    public UploadResult uploadConteudo(Long conteudoId, MultipartFile file) {
        return uploadToPrefix("conteudos/" + conteudoId, file);
    }

    public UploadResult uploadIngestRecebido(MultipartFile file) {
        return uploadToPrefix("ingest-recebidos", file);
    }

    private UploadResult uploadToPrefix(String prefix, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Arquivo vazio");
        }

        String originalName = sanitizeFilename(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "arquivo");
        String objectKey = prefix + "/" + UUID.randomUUID() + "_" + originalName;
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        long size = file.getSize();
        long partSize = 5 * 1024 * 1024L;

        try (InputStream input = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(props.bucket())
                            .object(objectKey)
                            .stream(input, size >= 0 ? size : -1, partSize)
                            .contentType(contentType)
                            .build());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao enviar arquivo para o storage: " + e.getMessage(), e);
        }

        long storedSize = size >= 0 ? size : statObjectSize(objectKey);
        return new UploadResult(objectKey, contentType, storedSize, originalName);
    }

    public long getObjectSize(String objectKey) {
        return statObjectSize(objectKey);
    }

    private long statObjectSize(String objectKey) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(props.bucket())
                            .object(objectKey)
                            .build());
            return stat.size();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao obter metadados do arquivo: " + e.getMessage(), e);
        }
    }

    public GetObjectResponse getObjectRange(String objectKey, long offset, long length) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(props.bucket())
                            .object(objectKey)
                            .offset(offset)
                            .length(length)
                            .build());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao ler arquivo do storage: " + e.getMessage(), e);
        }
    }

    public GetObjectResponse getObject(String objectKey) {
        try {
            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(props.bucket())
                            .object(objectKey)
                            .build());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao ler arquivo do storage: " + e.getMessage(), e);
        }
    }

    /**
     * Gera uma URL pré-assinada para acesso GET temporário ao objeto.
     * A URL aponta para {@code MINIO_ENDPOINT} — que deve ser publicamente acessível
     * caso precise ser consumida por serviços externos (ex: Guaia IA Hub).
     */
    public String generatePresignedUrl(String objectKey, int expiryMinutes) {
        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(props.bucket())
                            .object(objectKey)
                            .expiry(expiryMinutes * 60)
                            .build());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar URL pré-assinada: " + e.getMessage(), e);
        }
    }

    public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) return;
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(props.bucket())
                            .object(objectKey)
                            .build());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao remover arquivo do storage: " + e.getMessage(), e);
        }
    }

    private static String sanitizeFilename(String name) {
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
