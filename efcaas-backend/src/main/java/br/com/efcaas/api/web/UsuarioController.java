package br.com.efcaas.api.web;

import br.com.efcaas.api.service.UsuarioService;
import br.com.efcaas.api.web.dto.CriarUsuarioRequest;
import br.com.efcaas.api.web.dto.UsuarioDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Usuários", description = "Gestão de usuários do sistema")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    @Operation(summary = "Listar todos os usuários ativos")
    public ResponseEntity<List<UsuarioDto>> listar() {
        return ResponseEntity.ok(usuarioService.listarAtivos());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('admin_users')")
    @Operation(summary = "Cadastrar novo usuário")
    public ResponseEntity<UsuarioDto> criar(@Valid @RequestBody CriarUsuarioRequest request) {
        UsuarioDto criado = usuarioService.criar(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(criado.id())
                .toUri();
        return ResponseEntity.created(location).body(criado);
    }
}
