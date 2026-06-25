package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.guaia")
public record GuaiaHubProperties(
        String baseUrl,
        String username,
        String password,
        String tenantId,
        String tenantSlug,
        String institutionId,
        String institutionSlug,
        String institutionName
) {}
