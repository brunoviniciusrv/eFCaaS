package br.com.efcaas.api.channel.core;

import org.springframework.http.HttpHeaders;

import java.util.Map;

public record ChannelContext(
        ChannelType channelType,
        String clientIp,
        String userAgent,
        String apiKeyHash,
        String idempotencyKey,
        String rawBody,
        Map<String, String> headers,
        Object parsedPayload
) {
    public static ChannelContext of(ChannelType type, String clientIp, String userAgent,
                                    String apiKeyHash, String idempotencyKey,
                                    String rawBody, HttpHeaders httpHeaders, Object parsedPayload) {
        Map<String, String> headerMap = httpHeaders != null
                ? httpHeaders.toSingleValueMap()
                : Map.of();
        return new ChannelContext(type, clientIp, userAgent, apiKeyHash, idempotencyKey,
                rawBody, headerMap, parsedPayload);
    }
}
