package br.com.efcaas.api.web;

import br.com.efcaas.api.repository.EtiquetaRepository;
import br.com.efcaas.api.web.dto.EtiquetaDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/etiquetas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Etiquetas", description = "Catálogo de etiquetas de checagem")
public class EtiquetaController {

    private final EtiquetaRepository etiquetaRepository;

    @GetMapping
    @Operation(summary = "Listar todas as etiquetas de checagem")
    public ResponseEntity<List<EtiquetaDto>> listar() {
        List<EtiquetaDto> lista = etiquetaRepository.findAll().stream()
                .map(e -> new EtiquetaDto(
                        String.valueOf(e.getId()),
                        e.getNome(),
                        e.getDescricao(),
                        e.getCor()))
                .toList();
        return ResponseEntity.ok(lista);
    }
}
