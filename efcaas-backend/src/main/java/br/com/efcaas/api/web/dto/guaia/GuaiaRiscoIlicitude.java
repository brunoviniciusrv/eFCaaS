package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaRiscoIlicitude(
        @JsonProperty("risco")            double risco,
        @JsonProperty("risco_percentual") double riscoPercentual
) {}
