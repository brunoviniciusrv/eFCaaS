package br.com.efcaas.api.web;

import br.com.efcaas.api.service.IngestMidiaService;
import br.com.efcaas.api.web.dto.IngestMidiaUploadDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/v1/ingest/midias")
@RequiredArgsConstructor
@Tag(name = "Ingestão Externa", description = "Upload de mídias para conteúdos recebidos")
public class IngestMidiaController {

    private final IngestMidiaService service;

    @PostMapping("/upload")
    @Operation(summary = "Enviar imagem ou vídeo (requer X-Ingest-Api-Key)")
    public ResponseEntity<IngestMidiaUploadDto> upload(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.upload(file));
    }

    @GetMapping("/download")
    @Operation(summary = "Download público via token retornado no upload")
    public ResponseEntity<StreamingResponseBody> download(
            @RequestParam String token,
            @RequestHeader(value = org.springframework.http.HttpHeaders.RANGE, required = false) String range) {
        return service.download(token, range);
    }
}
