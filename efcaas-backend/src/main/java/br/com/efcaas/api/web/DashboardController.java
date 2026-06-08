package br.com.efcaas.api.web;

import br.com.efcaas.api.service.DashboardService;
import br.com.efcaas.api.web.dto.DashboardResumoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dashboard", description = "Métricas e filas do painel principal")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/resumo")
    @Operation(summary = "Resumo do dashboard: contagens por status + fila do usuário logado")
    public ResponseEntity<DashboardResumoDto> resumo(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.obterResumo(userId));
    }
}
