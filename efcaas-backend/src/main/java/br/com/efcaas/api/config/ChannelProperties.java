package br.com.efcaas.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "efcaas.channels")
public record ChannelProperties(
        WhatsApp whatsapp,
        Telegram telegram
) {
    public record WhatsApp(
            boolean enabled,
            String phoneNumberId,
            String accessToken,
            String appSecret,
            String verifyToken,
            String graphApiVersion
    ) {}

    public record Telegram(
            boolean enabled,
            String botToken,
            String secretToken
    ) {}
}
