package br.com.efcaas.api.web.dto;

import java.util.List;

public record RelatorioPublicacaoDto(
        String id,
        String newsId,
        String title,
        String excerpt,
        String content,
        String status,
        String template,
        String authorId,
        String createdAt,
        String updatedAt,
        List<EditorialCommentDto> comments
) {}
