package br.com.efcaas.api.web;

import br.com.efcaas.api.service.ConfiguracaoAgenciaService;
import br.com.efcaas.api.web.dto.ConfiguracaoAgenciaDto;
import br.com.efcaas.api.web.dto.SalvarConfiguracaoAgenciaRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/configuracao/agencia")
@RequiredArgsConstructor
@Tag(name = "Configuração da Agência", description = "Ajustes de identidade, IA e tema (fluxo Ajustar)")
public class ConfiguracaoAgenciaController {

    private final ConfiguracaoAgenciaService service;

    @GetMapping
    @Operation(summary = "Obter configuração da agência (painéis do Ajustar)")
    public ResponseEntity<ConfiguracaoAgenciaDto> obter() {
        return ResponseEntity.ok(service.obter());
    }

    @PutMapping
    @Operation(summary = "Salvar configuração da agência")
    public ResponseEntity<ConfiguracaoAgenciaDto> salvar(
            @Valid @RequestBody SalvarConfiguracaoAgenciaRequest request,
            Authentication auth) {
        Long usuarioId = auth != null ? Long.parseLong(auth.getName()) : null;
        boolean autenticado = auth != null && auth.isAuthenticated();
        boolean possuiAdminSettings = autenticado && auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("admin_settings"::equals);

        return ResponseEntity.ok(service.salvar(request, usuarioId, autenticado, possuiAdminSettings));
    }
}
