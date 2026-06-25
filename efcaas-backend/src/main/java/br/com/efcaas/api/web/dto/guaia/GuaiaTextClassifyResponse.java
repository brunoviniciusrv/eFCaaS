package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaTextClassifyResponse(
        @JsonProperty("classificacao_antidemocratica") String classificacaoAntidemocratica,
        @JsonProperty("classificacao_odio")            String classificacaoOdio,
        @JsonProperty("categoria_final")               String categoriaFinal,
        @JsonProperty("confianca")                     double confianca,
        @JsonProperty("risco_ilicitude")               GuaiaRiscoIlicitude riscoIlicitude
) {}
