package br.com.efcaas.api.channel.abuse;

import br.com.efcaas.api.channel.core.ChannelContext;
import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.config.AbuseProperties;
import br.com.efcaas.api.domain.IngestAbuseEvent;
import br.com.efcaas.api.repository.IngestAbuseEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AbuseProtectionService {

    private final AbuseProperties abuseProperties;
    private final RateLimitService rateLimitService;
    private final DuplicateDetectionService duplicateDetectionService;
    private final IngestAbuseEventRepository abuseEventRepository;

    public void validateBeforeProcessing(ChannelContext context, ChannelInboundMessage message) {
        String channel = context.channelType().name();
        String ip = context.clientIp() != null ? context.clientIp() : "unknown";

        rateLimitService.checkAndIncrement("ip:" + ip, abuseProperties.rateLimit().perIp());
        rateLimitService.checkAndIncrement("channel:" + channel, abuseProperties.rateLimit().perChannel());

        if (context.apiKeyHash() != null) {
            rateLimitService.checkAndIncrement("token:" + context.apiKeyHash(),
                    abuseProperties.rateLimit().perToken());
        }

        String fingerprint = IngestHashUtil.fingerprint(
                context.clientIp(),
                context.userAgent(),
                channel,
                message.enderecoRemetente());

        duplicateDetectionService.assertNotDuplicate(context.channelType(), message, fingerprint);
    }

    public void registerSuccess(ChannelContext context, ChannelInboundMessage message, Long conteudoId) {
        String fingerprint = IngestHashUtil.fingerprint(
                context.clientIp(),
                context.userAgent(),
                context.channelType().name(),
                message.enderecoRemetente());
        duplicateDetectionService.registerFingerprint(context.channelType(), message, fingerprint, conteudoId);
    }

    public void recordBlocked(ChannelType channelType, String eventType, ChannelContext context,
                              String contentHash, String detail) {
        abuseEventRepository.save(new IngestAbuseEvent(
                channelType.name(),
                eventType,
                context != null ? context.clientIp() : null,
                context != null ? IngestHashUtil.fingerprint(context.clientIp(), context.userAgent(),
                        channelType.name(), null) : null,
                contentHash,
                detail));
    }
}
