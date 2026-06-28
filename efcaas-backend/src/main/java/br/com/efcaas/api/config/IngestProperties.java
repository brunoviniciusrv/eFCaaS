package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.ingest")
public record IngestProperties(
        String apiKey,
        String defaultTenantSlug
) {}
