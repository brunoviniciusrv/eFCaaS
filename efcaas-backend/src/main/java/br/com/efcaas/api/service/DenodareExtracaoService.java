package br.com.efcaas.api.service;

import br.com.efcaas.api.config.DenodareProperties;
import br.com.efcaas.api.web.dto.YoutubeResultadoDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Chama o endpoint GET /social-media-extractor/crawl da API Denodare
 * para buscar vídeos do YouTube por palavra-chave.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DenodareExtracaoService {

    private final DenodareProperties props;
    private final DenodareAuthService authService;

    /**
     * Busca vídeos no YouTube através da API Denodare.
     *
     * @param query     Termo de busca (obrigatório)
     * @param limit     Quantidade máxima de resultados
     * @param startDate Data de início ISO 8601 (opcional)
     * @param endDate   Data de fim ISO 8601 (opcional)
     * @return Lista de resultados mapeados para YoutubeResultadoDto
     */
    public List<YoutubeResultadoDto> buscarYoutube(
            String query, int limit, String startDate, String endDate) {

        String token = authService.getToken();

        UriComponentsBuilder uri = UriComponentsBuilder
                .fromHttpUrl(props.baseUrl() + "/social-media-extractor/crawl")
                .queryParam("source", "youtube")
                .queryParam("query", query)
                .queryParam("limit", limit);

        if (startDate != null && !startDate.isBlank()) {
            uri.queryParam("startDate", startDate);
        }
        if (endDate != null && !endDate.isBlank()) {
            uri.queryParam("endDate", endDate);
        }

        try {
            List<?> rawList = RestClient.create()
                    .get()
                    .uri(uri.toUriString())
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .body(List.class);

            return mapResultados(rawList);

        } catch (HttpClientErrorException.Unauthorized e) {
            log.warn("Token Denodare expirado, renovando e tentando novamente...");
            authService.invalidateToken();
            String newToken = authService.getToken();

            List<?> rawList = RestClient.create()
                    .get()
                    .uri(uri.toUriString())
                    .header("Authorization", "Bearer " + newToken)
                    .retrieve()
                    .body(List.class);

            return mapResultados(rawList);
        }
    }

    @SuppressWarnings("unchecked")
    private List<YoutubeResultadoDto> mapResultados(List<?> rawList) {
        if (rawList == null) return Collections.emptyList();

        return rawList.stream()
                .filter(item -> item instanceof Map)
                .map(item -> {
                    Map<String, Object> m = (Map<String, Object>) item;
                    return new YoutubeResultadoDto(
                            asString(m, "titulo"),
                            asString(m, "url"),
                            asString(m, "conteudo"),
                            asString(m, "description"),
                            asString(m, "channelTitle"),
                            asString(m, "channelId"),
                            asString(m, "publishedAt"),
                            asLong(m, "viewCount"),
                            asLong(m, "commentCount"),
                            asString(m, "duration"),
                            asString(m, "thumbnailDefault"),
                            asString(m, "thumbnailHigh"),
                            asList(m, "tags")
                    );
                })
                .toList();
    }

    private String asString(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private Long asLong(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null) return null;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong(v.toString()); } catch (NumberFormatException e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private List<String> asList(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return Collections.emptyList();
    }
}
