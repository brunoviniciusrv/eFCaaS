package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record GuaiaPublicationRequest(
        @JsonProperty("id_publication")      int idPublication,
        @JsonProperty("tenant_id")           String tenantId,
        @JsonProperty("tenant_slug")         String tenantSlug,
        @JsonProperty("institution_id")      String institutionId,
        @JsonProperty("institution_slug")    String institutionSlug,
        @JsonProperty("institution_name")    String institutionName,
        @JsonProperty("publication_number")  int publicationNumber,
        @JsonProperty("publication_text")    String publicationText,
        @JsonProperty("allegation")          String allegation,
        @JsonProperty("publication_date")    String publicationDate,
        @JsonProperty("source_type")         Integer sourceType,
        @JsonProperty("primary_source")      String primarySource,
        @JsonProperty("publication_url")     String publicationUrl,
        @JsonProperty("targets")             List<GuaiaPublicationTargetRequest> targets,
        @JsonProperty("existing_publication_assessments")  List<Integer> existingPublicationAssessments,
        @JsonProperty("pending_publication_assessment_types") List<Integer> pendingPublicationAssessmentTypes,
        @JsonProperty("medias")              List<GuaiaPublicationMediaRequest> medias
) {}
