package br.com.efcaas.api.web.dto;

import java.time.LocalDateTime;

public record NotificacaoDto(
        String id,
        String titulo,
        String mensagem,
        String categoria,
        String link,
        boolean lida,
        String criadoEm
) {}
