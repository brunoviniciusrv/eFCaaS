package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.abuse")
public record AbuseProperties(
        Redis redis,
        RateLimit rateLimit,
        Duplicate duplicate
) {
    public record Redis(boolean enabled) {}
    public record RateLimit(
            int perIp,
            int perToken,
            int perChannel,
            int windowSeconds,
            int cooldownSeconds,
            int maxViolationsBeforeBlock
    ) {}
    public record Duplicate(int windowSeconds, boolean rejectDuplicates) {}
}
