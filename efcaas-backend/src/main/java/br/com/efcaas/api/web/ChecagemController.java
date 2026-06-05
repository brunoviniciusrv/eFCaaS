package br.com.efcaas.api.web;

import br.com.efcaas.api.service.AuditoriaService;
import br.com.efcaas.api.service.ChecagemService;
import br.com.efcaas.api.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/checagens")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Checagens", description = "Fluxo de análise e verificação de fatos")
public class ChecagemController {

    private final ChecagemService service;
    private final AuditoriaService auditoriaService;

    @PostMapping("/{id}/iniciar")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Iniciar análise da checagem")
    public ResponseEntity<ChecagemDto> iniciar(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(service.iniciar(id, Long.parseLong(auth.getName())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe completo da checagem")
    public ResponseEntity<ChecagemDto> detalhe(@PathVariable Long id) {
        return ResponseEntity.ok(service.obterDetalhe(id));
    }

    @PutMapping("/{id}/investigacao")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Salvar dados de investigação (perguntas, metodologia, contato com autor)")
    public ResponseEntity<InvestigacaoDto> salvarInvestigacao(
            @PathVariable Long id,
            @RequestBody SalvarInvestigacaoRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.salvarInvestigacao(id, request, Long.parseLong(auth.getName())));
    }

    /** @deprecated Use PUT /{id}/investigacao */
    @PatchMapping("/{id}/estrutura-relatorio")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "[Deprecated] Alias para PUT /{id}/investigacao")
    public ResponseEntity<InvestigacaoDto> salvarEstruturaLegado(
            @PathVariable Long id,
            @RequestBody SalvarInvestigacaoRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.salvarInvestigacao(id, request, Long.parseLong(auth.getName())));
    }

    @GetMapping("/{id}/parecer")
    @Operation(summary = "Obter texto do parecer")
    public ResponseEntity<ParecerDto> obterParecer(@PathVariable Long id) {
        return ResponseEntity.ok(service.obterParecer(id));
    }

    @PatchMapping("/{id}/parecer")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Salvar texto markdown do parecer")
    public ResponseEntity<ParecerDto> salvarParecer(
            @PathVariable Long id,
            @RequestBody SalvarParecerRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.salvarParecer(id, request, Long.parseLong(auth.getName())));
    }

    @PostMapping("/{id}/parecer/finalizar")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Finalizar parecer com etiqueta — encaminha para revisão")
    public ResponseEntity<ChecagemDto> finalizarParecer(
            @PathVariable Long id,
            @Valid @RequestBody FinalizarParecerRequest request,
            Authentication auth) {
        return ResponseEntity.ok(service.finalizarParecer(id, request, Long.parseLong(auth.getName())));
    }

    @GetMapping("/{id}/evidencias")
    @Operation(summary = "Listar evidências da checagem")
    public ResponseEntity<List<EvidenciaDto>> listarEvidencias(@PathVariable Long id) {
        return ResponseEntity.ok(service.listarEvidencias(id));
    }

    @PostMapping("/{id}/evidencias")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Adicionar evidência")
    public ResponseEntity<EvidenciaDto> adicionarEvidencia(
            @PathVariable Long id,
            @Valid @RequestBody AdicionarEvidenciaRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.adicionarEvidencia(id, request, Long.parseLong(auth.getName())));
    }

    @DeleteMapping("/{id}/evidencias/{evId}")
    @PreAuthorize("hasAuthority('perform_analysis')")
    @Operation(summary = "Remover evidência")
    public ResponseEntity<Void> removerEvidencia(
            @PathVariable Long id,
            @PathVariable Long evId,
            Authentication auth) {
        service.removerEvidencia(id, evId, Long.parseLong(auth.getName()));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/ia/rascunho")
    @Operation(summary = "Gerar rascunho de parecer via IA (stub MVP)")
    public ResponseEntity<RascunhoIaResponse> gerarRascunho(@PathVariable Long id) {
        return ResponseEntity.ok(service.gerarRascunho(id));
    }

    @PostMapping("/{id}/ia/revisar")
    @Operation(summary = "Revisar parecer via IA (stub MVP)")
    public ResponseEntity<RascunhoIaResponse> revisarParecer(@PathVariable Long id) {
        return ResponseEntity.ok(service.revisarParecer(id));
    }

    @GetMapping("/{id}/auditoria")
    @Operation(summary = "Histórico de ações da checagem",
               description = "Retorna o log de auditoria de todas as ações realizadas nesta checagem, ordenadas da mais recente para a mais antiga.")
    public ResponseEntity<List<AuditoriaDto>> listarAuditoria(@PathVariable Long id) {
        return ResponseEntity.ok(auditoriaService.listarPorChecagem(id));
    }
}
