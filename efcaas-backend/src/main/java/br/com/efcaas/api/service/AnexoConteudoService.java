package br.com.efcaas.api.service;

import br.com.efcaas.api.config.ApiProperties;
import br.com.efcaas.api.domain.AnexoConteudo;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.AnexoConteudoRepository;
import br.com.efcaas.api.repository.ConteudoSuspeitoRepository;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.AnexoConteudoDto;
import io.minio.GetObjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class AnexoConteudoService {

    private final AnexoConteudoRepository anexoRepo;
    private final ConteudoSuspeitoRepository conteudoRepo;
    private final StorageService storageService;
    private final AnexoConteudoAccessTokenService accessTokenService;
    private final AuditoriaService auditoria;
    private final ApiProperties apiProperties;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<AnexoConteudoDto> listar(Long conteudoId) {
        buscarConteudo(conteudoId);
        return anexoRepo.findByConteudoId(conteudoId).stream()
                .map(a -> toDto(a, conteudoId))
                .toList();
    }

    @Transactional
    public AnexoConteudoDto upload(Long conteudoId, MultipartFile file, Long usuarioId) {
        ConteudoSuspeito conteudo = buscarConteudo(conteudoId);
        StorageService.UploadResult upload = storageService.uploadConteudo(conteudoId, file);
        String tipo = inferirTipo(upload.contentType());

        AnexoConteudo anexo = new AnexoConteudo();
        anexo.setConteudo(conteudo);
        anexo.setTipo(tipo);
        anexo.setObjectKey(upload.objectKey());
        anexo.setNomeArquivo(upload.originalFilename());
        anexo.setContentType(upload.contentType());
        anexo.setTamanhoBytes(upload.size());
        anexoRepo.save(anexo);

        auditoria.registrar(usuarioId, "anexo_conteudo_adicionado", "conteudo:" + conteudoId, tipo);
        return toDto(anexo, conteudoId);
    }

    @Transactional
    public void remover(Long conteudoId, Long anexoId, Long usuarioId) {
        buscarConteudo(conteudoId);
        AnexoConteudo anexo = anexoRepo.findByIdAndConteudoId(anexoId, conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Anexo não encontrado: " + anexoId));
        storageService.delete(anexo.getObjectKey());
        anexoRepo.delete(anexo);
        auditoria.registrar(usuarioId, "anexo_conteudo_removido", "conteudo:" + conteudoId, "anexo:" + anexoId);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<StreamingResponseBody> download(
            Long conteudoId, Long anexoId, String token, String rangeHeader) {
        accessTokenService.validar(token, conteudoId, anexoId);
        AnexoConteudo anexo = anexoRepo.findByIdAndConteudoId(anexoId, conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Anexo não encontrado: " + anexoId));

        long fileSize = anexo.getTamanhoBytes() != null && anexo.getTamanhoBytes() > 0
                ? anexo.getTamanhoBytes()
                : storageService.getObjectSize(anexo.getObjectKey());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                anexo.getContentType() != null ? anexo.getContentType() : "application/octet-stream"));
        String filename = anexo.getNomeArquivo() != null ? anexo.getNomeArquivo() : "anexo";
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "inline; filename=\"" + URLEncoder.encode(filename, StandardCharsets.UTF_8) + "\"");
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (rangeHeader == null || rangeHeader.isBlank()) {
            StreamingResponseBody body = outputStream -> {
                try (GetObjectResponse object = storageService.getObject(anexo.getObjectKey())) {
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
                    anexo.getObjectKey(), range.start(), contentLength)) {
                object.transferTo(outputStream);
            }
        };

        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.CONTENT_RANGE,
                "bytes " + range.start() + "-" + range.end() + "/" + fileSize);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers).body(body);
    }

    private ConteudoSuspeito buscarConteudo(Long conteudoId) {
        return conteudoRepo.findByIdAndTenantId(conteudoId, tenantScope.requireTenantId())
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + conteudoId));
    }

    private AnexoConteudoDto toDto(AnexoConteudo anexo, Long conteudoId) {
        return new AnexoConteudoDto(
                String.valueOf(anexo.getId()),
                anexo.getTipo(),
                buildDownloadUrl(conteudoId, anexo.getId()),
                anexo.getNomeArquivo(),
                anexo.getContentType(),
                anexo.getTamanhoBytes(),
                anexo.getObjectKey()
        );
    }

    private String buildDownloadUrl(Long conteudoId, Long anexoId) {
        String base = apiProperties.publicUrl().replaceAll("/$", "");
        String token = accessTokenService.gerarToken(conteudoId, anexoId);
        return base + "/conteudos/" + conteudoId + "/anexos/" + anexoId + "/download?token=" + token;
    }

    private static String inferirTipo(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("audio/")) return "audio";
        return "document";
    }

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
