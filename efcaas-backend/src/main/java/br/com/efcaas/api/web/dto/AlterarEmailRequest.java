package br.com.efcaas.api.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AlterarEmailRequest(
        @NotBlank @Email String novoEmail,
        @NotBlank String senhaAtual
) {}
