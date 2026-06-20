package br.com.efcaas.api.web.dto;

public record EditorialCommentDto(
        String id,
        String userId,
        String userName,
        String text,
        String timestamp,
        boolean resolved
) {}
