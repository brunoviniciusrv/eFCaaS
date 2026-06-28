package br.com.efcaas.api.security;

import br.com.efcaas.api.config.IngestProperties;
import br.com.efcaas.api.repository.TenantIngestKeyRepository;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.tenant.TenantContext;
import br.com.efcaas.api.util.HashUtil;
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
    private static final String TENANT_HEADER = "X-Tenant-Slug";

    private final IngestProperties ingestProperties;
    private final TenantIngestKeyRepository tenantIngestKeyRepository;
    private final TenantRepository tenantRepository;
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
        String tenantSlug = request.getHeader(TENANT_HEADER);

        if (tenantSlug != null && !tenantSlug.isBlank()) {
            String hash = HashUtil.sha256(providedKey != null ? providedKey : "");
            boolean valid = tenantIngestKeyRepository.findByTenant_Slug(tenantSlug.trim())
                    .map(k -> k.getApiKeyHash().equals(hash))
                    .orElse(false);
            if (!valid && configuredKey.equals(providedKey)) {
                valid = true;
            }
            if (!valid) {
                respond(response, HttpServletResponse.SC_UNAUTHORIZED, "Chave de ingestão inválida para o tenant.");
                return;
            }
            tenantRepository.findBySlug(tenantSlug.trim()).ifPresent(tenant ->
                    TenantContext.set(tenant.getId(), tenant.getSlug()));
        } else if (providedKey == null || !configuredKey.equals(providedKey)) {
            respond(response, HttpServletResponse.SC_UNAUTHORIZED, "Chave de ingestão inválida ou ausente.");
            return;
        } else {
            tenantRepository.findBySlug("dev").ifPresent(tenant ->
                    TenantContext.set(tenant.getId(), tenant.getSlug()));
        }

        filterChain.doFilter(request, response);
        TenantContext.clear();
    }

    private void respond(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Map.of("message", message));
    }
}
