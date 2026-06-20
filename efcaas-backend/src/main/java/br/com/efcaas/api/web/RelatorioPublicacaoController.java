package br.com.efcaas.api.web;

import br.com.efcaas.api.service.RelatorioPublicacaoService;
import br.com.efcaas.api.web.dto.AtualizarStatusRelatorioRequest;
import br.com.efcaas.api.web.dto.RelatorioPublicacaoDto;
import br.com.efcaas.api.web.dto.SalvarRelatorioPublicacaoRequest;
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
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Relatórios de Publicação", description = "Acervo editorial e matérias para publicação")
public class RelatorioPublicacaoController {

    private final RelatorioPublicacaoService service;

    @GetMapping("/relatorios-publicacao")
    @PreAuthorize("hasAnyAuthority('view_editor', 'view_archive')")
    @Operation(summary = "Listar relatórios do acervo editorial")
    public ResponseEntity<List<RelatorioPublicacaoDto>> listar() {
        return ResponseEntity.ok(service.listar());
    }

    @GetMapping("/conteudos/{conteudoId}/relatorio-publicacao")
    @PreAuthorize("hasAnyAuthority('view_editor', 'view_archive')")
    @Operation(summary = "Obter relatório editorial vinculado a um conteúdo")
    public ResponseEntity<RelatorioPublicacaoDto> obterPorConteudo(@PathVariable Long conteudoId) {
        return ResponseEntity.ok(service.obterPorConteudo(conteudoId));
    }

    @PutMapping("/conteudos/{conteudoId}/relatorio-publicacao")
    @PreAuthorize("hasAnyAuthority('view_editor', 'publish_article')")
    @Operation(summary = "Salvar ou atualizar relatório editorial de um conteúdo")
    public ResponseEntity<RelatorioPublicacaoDto> salvar(
            @PathVariable Long conteudoId,
            @Valid @RequestBody SalvarRelatorioPublicacaoRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.salvar(conteudoId, request, userId));
    }

    @PatchMapping("/relatorios-publicacao/{id}/status")
    @PreAuthorize("hasAnyAuthority('view_editor', 'publish_article')")
    @Operation(summary = "Atualizar status de publicação do relatório")
    public ResponseEntity<RelatorioPublicacaoDto> atualizarStatus(
            @PathVariable Long id,
            @Valid @RequestBody AtualizarStatusRelatorioRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.atualizarStatus(id, request, userId));
    }

    @DeleteMapping("/relatorios-publicacao/{id}")
    @PreAuthorize("hasAnyAuthority('view_editor', 'view_archive')")
    @Operation(summary = "Remover relatório do acervo editorial")
    public ResponseEntity<Void> remover(@PathVariable Long id, Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        service.remover(id, userId);
        return ResponseEntity.noContent().build();
    }
}
