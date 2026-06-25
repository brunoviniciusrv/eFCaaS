package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaPublicationMediaResponse(
        @JsonProperty("id_midia")          int idMidia,
        @JsonProperty("tipo_midia")        String tipoMidia,
        @JsonProperty("nome_arquivo")      String nomeArquivo,
        @JsonProperty("sucesso")           boolean sucesso,
        @JsonProperty("resultado")         Map<String, Object> resultado,
        @JsonProperty("resultado_alegacao") Map<String, Object> resultadoAlegacao,
        @JsonProperty("erro")              String erro
) {}
