package br.com.efcaas.api.web.dto;

import java.util.List;

public record YoutubeResultadoDto(
        String titulo,
        String url,
        String conteudo,
        String descricao,
        String channelTitle,
        String channelId,
        String publishedAt,
        Long viewCount,
        Long commentCount,
        String duration,
        String thumbnailDefault,
        String thumbnailHigh,
        List<String> tags
) {}
