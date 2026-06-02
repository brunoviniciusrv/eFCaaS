package br.com.efcaas.api.web;

import br.com.efcaas.api.service.DenodareExtracaoService;
import br.com.efcaas.api.web.dto.YoutubeResultadoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/youtube")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "YouTube", description = "Busca e extração de conteúdo do YouTube via API Denodare")
public class YoutubeExtracaoController {

    private final DenodareExtracaoService extracaoService;

    @GetMapping("/buscar")
    @PreAuthorize("hasAuthority('manage_triage')")
    @Operation(summary = "Buscar vídeos no YouTube por palavra-chave",
               description = "Realiza crawling no YouTube através da API Denodare e retorna os resultados para triagem.")
    public ResponseEntity<List<YoutubeResultadoDto>> buscar(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        List<YoutubeResultadoDto> resultados =
                extracaoService.buscarYoutube(query, limit, startDate, endDate);
        return ResponseEntity.ok(resultados);
    }
}
