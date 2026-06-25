package br.com.efcaas.api.web.dto.guaia;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GuaiaTextResponse(
        @JsonProperty("what")                   String what,
        @JsonProperty("who")                    String who,
        @JsonProperty("where")                  String where,
        @JsonProperty("when")                   String when,
        @JsonProperty("keywords")               String keywords,
        @JsonProperty("pseudo_label")           String pseudoLabel,
        @JsonProperty("fake_score")             double fakeScore,
        @JsonProperty("misinformation_features") String misinformationFeatures,
        @JsonProperty("topic_match")            List<String> topicMatch
) {}
