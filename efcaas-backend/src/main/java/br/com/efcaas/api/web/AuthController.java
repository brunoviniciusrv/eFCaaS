package br.com.efcaas.api.web;

import br.com.efcaas.api.service.AuthService;
import br.com.efcaas.api.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Autenticação", description = "Login e gestão de perfil do usuário logado")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/auth/login")
    @Operation(summary = "Autenticar usuário", description = "Retorna JWT + dados do usuário com permissões")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    @Operation(summary = "Usuário logado", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UsuarioDto> me(Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(authService.getUsuarioLogado(userId));
    }

    @PatchMapping("/me")
    @Operation(summary = "Atualizar nome e bio", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<UsuarioDto> atualizarPerfil(
            @Valid @RequestBody AtualizarPerfilRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        return ResponseEntity.ok(authService.atualizarPerfil(userId, request.nome(), request.bio()));
    }

    @PatchMapping("/me/senha")
    @Operation(summary = "Alterar senha", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<Void> alterarSenha(
            @Valid @RequestBody AlterarSenhaRequest request,
            Authentication auth) {
        Long userId = Long.parseLong(auth.getName());
        authService.alterarSenha(userId, request.senhaAtual(), request.novaSenha());
        return ResponseEntity.noContent().build();
    }
}
