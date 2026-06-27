package br.com.efcaas.api.channel.core;

import br.com.efcaas.api.channel.abuse.AbuseProtectionService;
import br.com.efcaas.api.channel.observability.IngestObservabilityService;
import br.com.efcaas.api.exception.DuplicateContentException;
import br.com.efcaas.api.exception.RateLimitExceededException;
import br.com.efcaas.api.service.AuditoriaService;
import br.com.efcaas.api.service.ConteudoRecebidoService;
import br.com.efcaas.api.service.IngestRegistrationResult;
import br.com.efcaas.api.web.dto.ConteudoRecebidoDto;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class InboundMessageProcessor {

    private final CommunicationChannelFactory channelFactory;
    private final AbuseProtectionService abuseProtectionService;
    private final ChannelMessageMapper channelMessageMapper;
    private final ConteudoRecebidoService conteudoRecebidoService;
    private final AuditoriaService auditoriaService;
    private final IngestObservabilityService observabilityService;

    public ResponseEntity<?> process(ChannelContext context) {
        CommunicationChannel channel = channelFactory.get(context.channelType());
        IngestObservabilityService.ChannelSpan span = observabilityService.startChannelSpan(context.channelType());
        try {
            channel.validateInbound(context);
            ChannelInboundMessage message = applyIdempotencyKey(channel.parseInbound(context), context.idempotencyKey());
            abuseProtectionService.validateBeforeProcessing(context, message);

            IngestConteudoRecebidoRequest ingestRequest = channelMessageMapper.toIngestRequest(message);
            IngestRegistrationResult result = conteudoRecebidoService.registrarExterno(
                    ingestRequest, context.idempotencyKey());

            abuseProtectionService.registerSuccess(context, message, result.dto().id());
            observabilityService.recordSuccess(context.channelType());

            auditoriaService.registrar(null, "ingest_received",
                    "conteudo_recebido:" + result.dto().id(),
                    "channel=" + context.channelType().name() + ",created=" + result.created());

            log.info("Ingest concluido channel={} conteudoId={} created={}",
                    context.channelType(), result.dto().id(), result.created());

            return channel.buildSuccessResponse(result.dto(), result.created());
        } catch (RateLimitExceededException | DuplicateContentException ex) {
            observabilityService.recordBlocked(context.channelType(), ex.getClass().getSimpleName());
            abuseProtectionService.recordBlocked(context.channelType(), ex.getClass().getSimpleName(),
                    context, null, ex.getMessage());
            auditoriaService.registrar(null, "ingest_blocked", "channel:" + context.channelType().name(), ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            observabilityService.recordFailure(context.channelType());
            log.warn("Falha no ingest channel={} reason={}", context.channelType(), ex.getMessage());
            throw ex;
        } finally {
            span.closeSpan();
        }
    }

    public ResponseEntity<?> processWebhook(ChannelContext context) {
        CommunicationChannel channel = channelFactory.get(context.channelType());
        IngestObservabilityService.ChannelSpan span = observabilityService.startChannelSpan(context.channelType());
        try {
            channel.validateInbound(context);
            ChannelInboundMessage message = applyIdempotencyKey(channel.parseInbound(context), context.idempotencyKey());
            abuseProtectionService.validateBeforeProcessing(context, message);

            IngestConteudoRecebidoRequest ingestRequest = channelMessageMapper.toIngestRequest(message);
            IngestRegistrationResult result = conteudoRecebidoService.registrarExterno(ingestRequest, null);

            abuseProtectionService.registerSuccess(context, message, result.dto().id());
            observabilityService.recordSuccess(context.channelType());
            auditoriaService.registrar(null, "ingest_received",
                    "conteudo_recebido:" + result.dto().id(),
                    "channel=" + context.channelType().name() + ",created=" + result.created());

            return channel.buildWebhookAckResponse();
        } catch (br.com.efcaas.api.exception.WebhookAckOnlyException ex) {
            return channelFactory.get(context.channelType()).buildWebhookAckResponse();
        } catch (RateLimitExceededException | DuplicateContentException ex) {
            observabilityService.recordBlocked(context.channelType(), ex.getClass().getSimpleName());
            abuseProtectionService.recordBlocked(context.channelType(), ex.getClass().getSimpleName(),
                    context, null, ex.getMessage());
            throw ex;
        } finally {
            span.closeSpan();
        }
    }

    private ChannelInboundMessage applyIdempotencyKey(ChannelInboundMessage message, String idempotencyKey) {
        if ((message.idMensagemExterna() == null || message.idMensagemExterna().isBlank())
                && idempotencyKey != null && !idempotencyKey.isBlank()) {
            return new ChannelInboundMessage(
                    message.titulo(),
                    message.conteudo(),
                    message.resumo(),
                    message.tipoFonte(),
                    message.nomeRemetente(),
                    message.enderecoRemetente(),
                    message.linkOriginal(),
                    idempotencyKey,
                    message.notasInternas(),
                    message.midias(),
                    message.metadata());
        }
        return message;
    }
}
