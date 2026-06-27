package br.com.efcaas.api.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Payload enviado por sistemas externos para registrar um conteúdo recebido.
 * <p>
 * {@code tipoFonte}: whatsapp | facebook | instagram | telegram | email | youtube | reddit | tiktok | other
 * </p>
 */
public record IngestConteudoRecebidoRequest(
        @NotBlank @Size(max = 500) String titulo,
        @NotBlank String conteudo,
        String resumo,
        @NotBlank @Size(max = 50) String tipoFonte,
        @Size(max = 255) String nomeRemetente,
        @Size(max = 255) String enderecoRemetente,
        @Size(max = 1024) String linkOriginal,
        @Size(max = 255) String idMensagemExterna,
        String notasInternas,
        @Valid List<IngestConteudoRecebidoMidiaRequest> midias
) {}
