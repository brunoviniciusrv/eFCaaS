package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaPublicationResponse(
        @JsonProperty("missinformation_potential")  Double missinformationPotential,
        @JsonProperty("explanation_text")           String explanationText,
        @JsonProperty("detailed_analysis_text")     String detailedAnalysisText,
        @JsonProperty("attribute_what")             String attributeWhat,
        @JsonProperty("attribute_who")              String attributeWho,
        @JsonProperty("attribute_where")            String attributeWhere,
        @JsonProperty("attribute_when")             String attributeWhen,
        @JsonProperty("resultado_texto")            GuaiaTextResponse resultadoTexto,
        @JsonProperty("resultado_alegacao_texto")   GuaiaAllegationResponse resultadoAlegacaoTexto,
        @JsonProperty("resultados_midias")          List<GuaiaPublicationMediaResponse> resultadosMidias,
        @JsonProperty("total_midias")               int totalMidias,
        @JsonProperty("total_processadas")          int totalProcessadas,
        @JsonProperty("total_com_erro")             int totalComErro
) {}
