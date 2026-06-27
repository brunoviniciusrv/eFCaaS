package br.com.efcaas.api.web.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public final class AnaliseIaTopicMatchCodec {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private AnaliseIaTopicMatchCodec() {}

    public static List<String> deserialize(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    public static String serialize(List<String> topics) {
        if (topics == null || topics.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(topics);
        } catch (Exception e) {
            return null;
        }
    }
}
