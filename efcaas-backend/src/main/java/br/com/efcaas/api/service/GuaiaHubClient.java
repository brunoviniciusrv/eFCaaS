package br.com.efcaas.api.service;

import br.com.efcaas.api.config.GuaiaHubProperties;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextClassifyRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextClassifyResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;

/**
 * Cliente HTTP para a API Guaia IA Hub.
 * Gerencia autenticação OAuth2 (password grant) com cache do token em memória.
 * Token tem duração de 120 minutos conforme documentação — o cache invalida em 110 min.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuaiaHubClient {

    private static final int TOKEN_TTL_SECONDS = 110 * 60;

    private final GuaiaHubProperties props;

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    private RestClient buildClient() {
        return RestClient.builder()
                .baseUrl(props.baseUrl())
                .build();
    }

    private synchronized String getToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedToken;
        }

        log.debug("Obtendo novo token da Guaia IA Hub");
        RestClient client = buildClient();

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "password");
        form.add("username", props.username());
        form.add("password", props.password());

        @SuppressWarnings("unchecked")
        Map<String, String> response = client.post()
                .uri("/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("access_token")) {
            throw new IllegalStateException("Falha ao obter token da Guaia IA Hub: resposta inválida");
        }

        cachedToken = response.get("access_token");
        tokenExpiresAt = Instant.now().plusSeconds(TOKEN_TTL_SECONDS);
        log.debug("Token Guaia obtido com sucesso, válido até {}", tokenExpiresAt);
        return cachedToken;
    }

    /**
     * Processa uma publicação com todas as suas mídias.
     * As URLs de mídia em {@code request.medias[].minioUrl} devem ser acessíveis pelo servidor da Guaia.
     */
    public GuaiaPublicationResponse processarPublicacao(GuaiaPublicationRequest request) {
        String token = getToken();
        RestClient client = buildClient();

        log.debug("Chamando /ia/publication/v1 para publicação id={}", request.idPublication());

        return client.post()
                .uri("/ia/publication/v1")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(GuaiaPublicationResponse.class);
    }

    /**
     * Classifica texto para identificar discurso de ódio e conteúdo antidemocrático.
     */
    public GuaiaTextClassifyResponse classificarTexto(String texto) {
        String token = getToken();
        RestClient client = buildClient();

        log.debug("Chamando /ia/text/classify/v1");

        return client.post()
                .uri("/ia/text/classify/v1")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new GuaiaTextClassifyRequest(texto))
                .retrieve()
                .body(GuaiaTextClassifyResponse.class);
    }
}
