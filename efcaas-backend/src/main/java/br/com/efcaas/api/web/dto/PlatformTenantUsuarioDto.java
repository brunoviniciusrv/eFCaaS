package br.com.efcaas.api.web.dto;

public record PlatformTenantUsuarioDto(
        String id,
        String nome,
        String email,
        String status,
        String perfil
) {}
