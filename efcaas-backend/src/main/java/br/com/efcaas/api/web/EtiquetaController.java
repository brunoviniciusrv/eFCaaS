package br.com.efcaas.api.web;

import br.com.efcaas.api.domain.Etiqueta;
import br.com.efcaas.api.repository.EtiquetaRepository;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.CriarEtiquetaRequest;
import br.com.efcaas.api.web.dto.EtiquetaDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/etiquetas")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Etiquetas", description = "Catálogo de etiquetas de checagem")
public class EtiquetaController {

    private final EtiquetaRepository etiquetaRepository;
    private final TenantScope tenantScope;

    @GetMapping
    @Operation(summary = "Listar etiquetas da agência")
    public ResponseEntity<List<EtiquetaDto>> listar() {
        Long tenantId = tenantScope.requireTenantId();
        List<EtiquetaDto> lista = etiquetaRepository.findByTenantId(tenantId).stream()
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(lista);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('admin_settings')")
    @Operation(summary = "Criar nova etiqueta")
    public ResponseEntity<EtiquetaDto> criar(@Valid @RequestBody CriarEtiquetaRequest request) {
        Long tenantId = tenantScope.requireTenantId();
        Etiqueta etiqueta = new Etiqueta();
        etiqueta.setNome(request.nome());
        etiqueta.setDescricao(request.descricao());
        etiqueta.setCor(request.cor());
        etiqueta.setTenantId(tenantId);
        etiqueta = etiquetaRepository.save(etiqueta);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(etiqueta.getId()).toUri();
        return ResponseEntity.created(location).body(toDto(etiqueta));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('admin_settings')")
    @Operation(summary = "Remover etiqueta")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        Long tenantId = tenantScope.requireTenantId();
        if (!etiquetaRepository.existsByIdAndTenantId(id, tenantId)) {
            return ResponseEntity.notFound().build();
        }
        etiquetaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private EtiquetaDto toDto(Etiqueta e) {
        return new EtiquetaDto(String.valueOf(e.getId()), e.getNome(), e.getDescricao(), e.getCor());
    }
}
