package br.com.efcaas.api.web;

import br.com.efcaas.api.service.ConteudoRecebidoService;
import br.com.efcaas.api.web.dto.ConteudoRecebidoDto;
import br.com.efcaas.api.web.dto.ConteudoSuspeitoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/conteudos-recebidos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conteúdos Recebidos", description = "Gestão de conteúdos capturados de fontes externas")
public class ConteudoRecebidoController {

    private final ConteudoRecebidoService service;

    @GetMapping
    @PreAuthorize("hasAuthority('manage_received')")
    @Operation(summary = "Listar conteúdos recebidos de fontes externas")
    public ResponseEntity<List<ConteudoRecebidoDto>> listar(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(service.listar(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('manage_received')")
    @Operation(summary = "Detalhe de um conteúdo recebido")
    public ResponseEntity<ConteudoRecebidoDto> detalhe(@PathVariable Long id) {
        return ResponseEntity.ok(service.obter(id));
    }

    @PostMapping("/{id}/encaminhar")
    @PreAuthorize("hasAuthority('manage_received')")
    @Operation(summary = "Encaminhar conteúdo recebido para a fila de triagem")
    public ResponseEntity<ConteudoSuspeitoDto> encaminhar(
            @PathVariable Long id,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.encaminharParaTriagem(id, userId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('manage_received')")
    @Operation(summary = "Excluir (arquivar) conteúdo recebido")
    public ResponseEntity<Void> excluir(@PathVariable Long id, Authentication auth) {
        service.excluir(id, Long.parseLong(auth.getName()));
        return ResponseEntity.noContent().build();
    }
}
