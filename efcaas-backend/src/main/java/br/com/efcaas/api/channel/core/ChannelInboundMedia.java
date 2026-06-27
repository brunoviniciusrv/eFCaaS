package br.com.efcaas.api.channel.core;

public record ChannelInboundMedia(
        String tipo,
        String url,
        String titulo
) {}
