package br.com.efcaas.api.security;

import br.com.efcaas.api.config.IngestProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class IngestApiKeyFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Ingest-Api-Key";

    private final IngestProperties ingestProperties;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/v1/webhooks/")) {
            return true;
        }
        if (!uri.startsWith("/api/v1/ingest/")) {
            return true;
        }
        return "GET".equalsIgnoreCase(request.getMethod())
                && uri.equals("/api/v1/ingest/midias/download");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String configuredKey = ingestProperties.apiKey();
        if (configuredKey == null || configuredKey.isBlank()) {
            respond(response, HttpServletResponse.SC_SERVICE_UNAVAILABLE,
                    "Ingestão externa não configurada: defina INGEST_API_KEY.");
            return;
        }

        String providedKey = request.getHeader(HEADER);
        if (providedKey == null || !configuredKey.equals(providedKey)) {
            respond(response, HttpServletResponse.SC_UNAUTHORIZED, "Chave de ingestão inválida ou ausente.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void respond(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of("message", message));
    }
}
