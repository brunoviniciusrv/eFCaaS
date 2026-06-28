package br.com.efcaas.api.service;

import br.com.efcaas.api.config.DenodareProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;
import java.util.Map;

/**
 * Gerencia autenticação com a API Denodare.
 * O JWT é cacheado e reutilizado enquanto não expirar (TTL conservador de 50 min).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DenodareAuthService {

    private static final long TOKEN_TTL_SECONDS = 50 * 60L; // 50 minutos

    private final DenodareProperties props;

    private String cachedToken;
    private Instant tokenObtainedAt;

    public synchronized String getToken() {
        if (isTokenValid()) {
            return cachedToken;
        }
        return authenticate();
    }

    private boolean isTokenValid() {
        return cachedToken != null
                && tokenObtainedAt != null
                && Instant.now().isBefore(tokenObtainedAt.plusSeconds(TOKEN_TTL_SECONDS));
    }

    @SuppressWarnings("unchecked")
    private String authenticate() {
        log.info("Autenticando na API Denodare...");

        Map<String, String> body = Map.of(
                "email", props.email(),
                "password", props.password()
        );

        Map<String, Object> response = RestClient.create(props.baseUrl())
                .post()
                .uri("/auth/signin")
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null || !response.containsKey("accessToken")) {
            throw new IllegalStateException("Resposta de autenticação Denodare inválida ou sem accessToken");
        }

        cachedToken = (String) response.get("accessToken");
        tokenObtainedAt = Instant.now();
        log.info("Token Denodare obtido com sucesso.");
        return cachedToken;
    }

    /** Força renovação do token na próxima chamada (usado após 401). */
    public synchronized void invalidateToken() {
        cachedToken = null;
        tokenObtainedAt = null;
    }
}
