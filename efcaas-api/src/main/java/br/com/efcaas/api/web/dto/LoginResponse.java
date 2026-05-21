package br.com.efcaas.api.web.dto;

public record LoginResponse(
        String token,
        UsuarioDto usuario
) {}
