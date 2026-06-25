package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GuaiaTextClassifyRequest(
        @JsonProperty("text") String text
) {}
