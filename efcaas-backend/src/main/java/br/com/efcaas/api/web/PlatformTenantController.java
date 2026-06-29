package br.com.efcaas.api.web;

import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.web.dto.PlatformTenantUsuarioDto;
import br.com.efcaas.api.web.dto.TenantSummaryDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/v1/platform/tenants")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Plataforma", description = "Gestão de tenants da plataforma")
public class PlatformTenantController {

    private final TenantRepository tenantRepository;
    private final UsuarioRepository usuarioRepository;

    @GetMapping
    @PreAuthorize("hasAuthority('platform_list_tenants')")
    @Operation(summary = "Listar tenants ativos da plataforma")
    public ResponseEntity<List<TenantSummaryDto>> listar() {
        List<TenantSummaryDto> tenants = tenantRepository.findAll().stream()
                .sorted(Comparator.comparing(Tenant::getCriadoEm).reversed())
                .map(this::toDto)
                .toList();
        return ResponseEntity.ok(tenants);
    }

    @GetMapping("/{tenantId}/usuarios")
    @PreAuthorize("hasAuthority('platform_list_tenants')")
    @Operation(summary = "Listar usuários de um tenant (visão platform admin)")
    public ResponseEntity<List<PlatformTenantUsuarioDto>> listarUsuarios(@PathVariable Long tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new NoSuchElementException("Tenant não encontrado: " + tenantId);
        }
        List<PlatformTenantUsuarioDto> usuarios = usuarioRepository.findByTenant_IdOrderByNomeAsc(tenantId)
                .stream()
                .map(this::toUsuarioDto)
                .toList();
        return ResponseEntity.ok(usuarios);
    }

    private PlatformTenantUsuarioDto toUsuarioDto(Usuario usuario) {
        String perfil = usuario.getTipoUsuario() != null ? usuario.getTipoUsuario().getNome() : "—";
        return new PlatformTenantUsuarioDto(
                String.valueOf(usuario.getId()),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getStatus(),
                perfil
        );
    }

    private TenantSummaryDto toDto(Tenant tenant) {
        return new TenantSummaryDto(
                String.valueOf(tenant.getId()),
                tenant.getSlug(),
                tenant.getNome(),
                tenant.getPlano(),
                tenant.getStatus(),
                tenant.isCompartilhaDadosEcossistema(),
                tenant.getCriadoEm()
        );
    }
}
