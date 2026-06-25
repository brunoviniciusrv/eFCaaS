package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarUsuarioRequest(
        @NotBlank @Size(max = 100) String nome,
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(max = 50) String perfil,
        @Size(min = 8, max = 100) String senha
) {}
