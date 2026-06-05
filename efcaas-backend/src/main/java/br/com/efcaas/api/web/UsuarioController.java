package br.com.efcaas.api.web;

import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.web.dto.UsuarioDto;
import br.com.efcaas.api.web.mapper.UsuarioMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Usuários", description = "Listagem de usuários do sistema")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final UsuarioMapper usuarioMapper;

    @GetMapping
    @Operation(summary = "Listar todos os usuários ativos")
    public ResponseEntity<List<UsuarioDto>> listar() {
        List<UsuarioDto> usuarios = usuarioRepository.findAll()
                .stream()
                .filter(u -> "A".equals(u.getStatus()))
                .map(usuarioMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(usuarios);
    }
}
