package br.com.efcaas.api.web.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record ConfiguracaoAgenciaDto(
        AgencyConfigDto agency,
        JsonNode theme
) {}
