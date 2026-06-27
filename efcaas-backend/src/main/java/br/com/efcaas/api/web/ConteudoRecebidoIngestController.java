package br.com.efcaas.api.web;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.channel.core.InboundMessageProcessor;
import br.com.efcaas.api.channel.web.IngestClientInfoResolver;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ingest/conteudos-recebidos")
@RequiredArgsConstructor
@Tag(name = "Ingestão Externa", description = "API para sistemas externos enviarem conteúdos recebidos")
public class ConteudoRecebidoIngestController {

    private final InboundMessageProcessor inboundMessageProcessor;
    private final IngestClientInfoResolver clientInfoResolver;

    @PostMapping
    @Operation(
            summary = "Registrar conteúdo recebido de fonte externa",
            description = """
                    Requer header **X-Ingest-Api-Key** (variável INGEST_API_KEY).
                    Suporta header **Idempotency-Key** para deduplicação.
                    Documentação: docs/CONTEUDOS_RECEBIDOS_API.md
                    """,
            responses = {
                    @ApiResponse(responseCode = "201", description = "Conteúdo registrado",
                            content = @Content(schema = @Schema(implementation = br.com.efcaas.api.web.dto.ConteudoRecebidoDto.class))),
                    @ApiResponse(responseCode = "200", description = "Conteúdo já existia (idempotência)"),
                    @ApiResponse(responseCode = "401", description = "Chave de ingestão inválida"),
                    @ApiResponse(responseCode = "429", description = "Rate limit excedido"),
                    @ApiResponse(responseCode = "503", description = "INGEST_API_KEY não configurada")
            }
    )
    public ResponseEntity<?> registrar(@Valid @RequestBody IngestConteudoRecebidoRequest request,
                                       @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                       @RequestHeader(value = "X-Ingest-Api-Key", required = false) String apiKey,
                                       HttpServletRequest httpRequest) {
        HttpHeaders headers = new HttpHeaders();
        httpRequest.getHeaderNames().asIterator()
                .forEachRemaining(name -> headers.add(name, httpRequest.getHeader(name)));

        ChannelContext context = ChannelContext.of(
                ChannelType.REST,
                clientInfoResolver.resolveClientIp(httpRequest),
                clientInfoResolver.resolveUserAgent(httpRequest),
                clientInfoResolver.hashApiKey(apiKey),
                idempotencyKey,
                null,
                headers,
                request);

        return inboundMessageProcessor.process(context);
    }
}
