package br.com.efcaas.api.web.dto;

import java.util.List;

public record UsuarioDto(
        String id,
        String nome,
        String email,
        String status,
        String avatarUrl,
        String bio,
        TipoUsuarioDto tipoUsuario,
        List<String> permissoes
) {}
