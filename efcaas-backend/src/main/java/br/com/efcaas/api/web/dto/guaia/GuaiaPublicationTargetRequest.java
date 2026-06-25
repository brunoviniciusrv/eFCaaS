package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GuaiaPublicationTargetRequest(
        @JsonProperty("id_publication_target") int idPublicationTarget,
        @JsonProperty("target_type")            int targetType
) {}
