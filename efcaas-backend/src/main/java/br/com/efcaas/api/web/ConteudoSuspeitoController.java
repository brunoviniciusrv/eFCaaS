package br.com.efcaas.api.web;

import br.com.efcaas.api.service.ConteudoSuspeitoService;
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
@RequestMapping("/api/v1/conteudos")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Conteúdos Suspeitos", description = "Triagem e gestão de conteúdos para checagem")
public class ConteudoSuspeitoController {

    private final ConteudoSuspeitoService service;

    @GetMapping
    @Operation(summary = "Listar conteúdos (filtros: status, prioridade, checadorId)")
    public ResponseEntity<List<ConteudoSuspeitoDto>> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String prioridade,
            @RequestParam(required = false) Long checadorId) {
        return ResponseEntity.ok(service.listar(status, prioridade, checadorId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('create_news')")
    @Operation(summary = "Cadastrar novo conteúdo suspeito")
    public ResponseEntity<ConteudoSuspeitoDto> criar(
            @Valid @RequestBody CriarConteudoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request, userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalhe do conteúdo com checagem, IA e evidências")
    public ResponseEntity<ConteudoSuspeitoDto> detalhe(@PathVariable Long id) {
        return ResponseEntity.ok(service.obterDetalhe(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('manage_triage')")
    @Operation(summary = "Editar dados do conteúdo (título, alegação, link, descrição, prioridade)")
    public ResponseEntity<ConteudoSuspeitoDto> atualizar(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarConteudoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.atualizar(id, request, userId));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Atualizar status do conteúdo")
    public ResponseEntity<ConteudoSuspeitoDto> atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarConteudoStatusRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.atualizarStatus(id, request.status(), userId));
    }

    @PostMapping("/{id}/atribuir")
    @PreAuthorize("hasAuthority('assign_tasks')")
    @Operation(summary = "Atribuir checador a um conteúdo")
    public ResponseEntity<ChecagemDto> atribuir(
            @PathVariable Long id,
            @Valid @RequestBody AtribuirChecagemRequest request,
            Authentication auth) {
        Long curadorId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.atribuir(id, request, curadorId));
    }

    @PostMapping("/{id}/revisao/aprovar")
    @PreAuthorize("hasAuthority('review_and_approve')")
    @Operation(summary = "Aprovar o parecer da checagem")
    public ResponseEntity<Void> aprovar(
            @PathVariable Long id,
            @RequestBody(required = false) RevisaoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        service.aprovar(id, userId, request != null ? request.justificativa() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/revisao/rejeitar")
    @PreAuthorize("hasAuthority('review_and_approve')")
    @Operation(summary = "Rejeitar o parecer da checagem")
    public ResponseEntity<Void> rejeitar(
            @PathVariable Long id,
            @RequestBody(required = false) RevisaoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        service.rejeitar(id, userId, request != null ? request.justificativa() : null);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/reabrir")
    @Operation(summary = "Reabrir conteúdo para retificação")
    public ResponseEntity<Void> reabrir(
            @PathVariable Long id,
            @RequestBody(required = false) RevisaoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        service.reabrir(id, userId, request != null ? request.justificativa() : null);
        return ResponseEntity.noContent().build();
    }
}
