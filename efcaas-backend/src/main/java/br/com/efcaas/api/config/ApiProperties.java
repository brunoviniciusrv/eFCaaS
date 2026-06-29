package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.api")
public record ApiProperties(
        String publicUrl
) {
    /** URL pública da API com protocolo (Railway exige https:// explícito). */
    public String normalizedPublicUrl() {
        if (publicUrl == null || publicUrl.isBlank()) {
            return "http://localhost:8080/api/v1";
        }
        String trimmed = publicUrl.trim().replaceAll("/$", "");
        if (trimmed.matches("(?i)^https?://.*")) {
            return trimmed;
        }
        if (trimmed.matches("(?i)^[a-z0-9][a-z0-9.-]*\\.[a-z]{2,}.*")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }
}
