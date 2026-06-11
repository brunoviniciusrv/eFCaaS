package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.api")
public record ApiProperties(
        String publicUrl
) {}
