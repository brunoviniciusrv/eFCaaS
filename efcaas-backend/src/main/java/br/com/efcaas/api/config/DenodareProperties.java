package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "denodare")
public record DenodareProperties(
        String baseUrl,
        String email,
        String password
) {}
