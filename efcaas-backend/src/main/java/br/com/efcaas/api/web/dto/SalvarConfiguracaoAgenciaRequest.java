package br.com.efcaas.api.web.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record SalvarConfiguracaoAgenciaRequest(
        @NotNull @Valid AgencyConfigDto agency,
        @NotNull JsonNode theme
) {}
