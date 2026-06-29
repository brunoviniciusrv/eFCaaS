package br.com.efcaas.api.web;

import br.com.efcaas.api.service.SolicitacaoCadastroService;
import br.com.efcaas.api.web.dto.ReprovarSolicitacaoRequest;
import br.com.efcaas.api.web.dto.SolicitacaoCadastroDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/platform/solicitacoes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Plataforma", description = "Gestão de solicitações de cadastro de agências")
public class PlatformAdminController {

    private final SolicitacaoCadastroService solicitacaoCadastroService;

    @GetMapping
    @PreAuthorize("hasAuthority('platform_view_requests')")
    @Operation(summary = "Listar solicitações de cadastro")
    public ResponseEntity<List<SolicitacaoCadastroDto>> listar(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(solicitacaoCadastroService.list(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('platform_view_requests')")
    @Operation(summary = "Obter solicitação por ID")
    public ResponseEntity<SolicitacaoCadastroDto> obter(@PathVariable Long id) {
        return ResponseEntity.ok(solicitacaoCadastroService.getById(id));
    }

    @PostMapping("/{id}/aprovar")
    @PreAuthorize("hasAuthority('platform_approve_agency')")
    @Operation(summary = "Aprovar solicitação e provisionar tenant")
    public ResponseEntity<SolicitacaoCadastroDto> aprovar(
            @PathVariable Long id,
            Authentication auth) {
        Long aprovadorId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(solicitacaoCadastroService.aprovar(id, aprovadorId));
    }

    @PostMapping("/{id}/reprovar")
    @PreAuthorize("hasAuthority('platform_reject_agency')")
    @Operation(summary = "Reprovar solicitação de cadastro")
    public ResponseEntity<SolicitacaoCadastroDto> reprovar(
            @PathVariable Long id,
            @Valid @RequestBody ReprovarSolicitacaoRequest request) {
        return ResponseEntity.ok(solicitacaoCadastroService.reprovar(id, request.motivo()));
    }
}
