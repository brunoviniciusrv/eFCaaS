package br.com.efcaas.api.web;

import br.com.efcaas.api.service.NotificacaoService;
import br.com.efcaas.api.web.dto.NotificacaoDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notificacoes")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Notificações", description = "Notificações do usuário logado")
public class NotificacaoController {

    private final NotificacaoService service;

    @GetMapping
    @Operation(summary = "Listar notificações do usuário")
    public ResponseEntity<List<NotificacaoDto>> listar(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(service.listarParaUsuario(userId));
    }

    @PatchMapping("/{id}/lida")
    @Operation(summary = "Marcar notificação como lida")
    public ResponseEntity<Void> marcarLida(@PathVariable Long id, Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        service.marcarComoLida(id, userId);
        return ResponseEntity.noContent().build();
    }
}
