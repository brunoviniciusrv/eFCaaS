package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaAllegationResponse(
        @JsonProperty("normalized_claim")  String normalizedClaim,
        @JsonProperty("certainty_score")   double certaintyScore,
        @JsonProperty("certainty_band")    String certaintyBand
) {}
