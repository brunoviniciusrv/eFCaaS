package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Representa uma mídia enviada para análise.
 * media_type: 2 = imagem, 3 = áudio, 4 = vídeo.
 * minio_url deve ser uma URL publicamente acessível pelo servidor da Guaia.
 */
public record GuaiaPublicationMediaRequest(
        @JsonProperty("id_media")                  int idMedia,
        @JsonProperty("filename")                  String filename,
        @JsonProperty("file_extension")            String fileExtension,
        @JsonProperty("media_type")                int mediaType,
        @JsonProperty("media_type_description")    String mediaTypeDescription,
        @JsonProperty("minio_url")                 String minioUrl,
        @JsonProperty("content_type")              String contentType,
        @JsonProperty("existing_assessments")      List<Integer> existingAssessments,
        @JsonProperty("missing_assessment_types")  List<Integer> missingAssessmentTypes,
        @JsonProperty("is_pending")                Boolean isPending
) {}
