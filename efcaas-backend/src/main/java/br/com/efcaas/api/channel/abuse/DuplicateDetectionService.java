package br.com.efcaas.api.channel.abuse;

import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import br.com.efcaas.api.config.AbuseProperties;
import br.com.efcaas.api.domain.IngestContentFingerprint;
import br.com.efcaas.api.exception.DuplicateContentException;
import br.com.efcaas.api.repository.IngestContentFingerprintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private final AbuseProperties abuseProperties;
    private final IngestContentFingerprintRepository fingerprintRepository;
    private final ObjectProvider<StringRedisTemplate> redisProvider;

    public Optional<Long> findRecentDuplicate(ChannelType channelType, ChannelInboundMessage message,
                                              String fingerprint) {
        String contentHash = IngestHashUtil.contentHash(
                message.tipoFonte(), message.titulo(), message.conteudo(), message.enderecoRemetente());
        Instant since = Instant.now().minusSeconds(abuseProperties.duplicate().windowSeconds());

        if (abuseProperties.redis().enabled()) {
            StringRedisTemplate redis = redisProvider.getIfAvailable();
            if (redis != null) {
                String redisKey = "ingest:dup:" + contentHash;
                String existing = redis.opsForValue().get(redisKey);
                if (existing != null) {
                    return Optional.of(Long.parseLong(existing));
                }
            }
        }

        return fingerprintRepository.findFirstByContentHashAndCriadoEmGreaterThanEqualOrderByCriadoEmDesc(contentHash, since)
                .map(IngestContentFingerprint::getConteudoId)
                .or(() -> fingerprint != null
                        ? fingerprintRepository.findFirstByFingerprintAndCriadoEmGreaterThanEqualOrderByCriadoEmDesc(
                                fingerprint, since)
                                .map(IngestContentFingerprint::getConteudoId)
                        : Optional.empty());
    }

    @Transactional
    public void registerFingerprint(ChannelType channelType, ChannelInboundMessage message,
                                   String fingerprint, Long conteudoId) {
        String contentHash = IngestHashUtil.contentHash(
                message.tipoFonte(), message.titulo(), message.conteudo(), message.enderecoRemetente());

        fingerprintRepository.save(new IngestContentFingerprint(
                contentHash, fingerprint, channelType.name(), message.tipoFonte(), conteudoId));

        if (abuseProperties.redis().enabled()) {
            StringRedisTemplate redis = redisProvider.getIfAvailable();
            if (redis != null) {
                String redisKey = "ingest:dup:" + contentHash;
                redis.opsForValue().set(redisKey, String.valueOf(conteudoId),
                        Duration.ofSeconds(abuseProperties.duplicate().windowSeconds()));
            }
        }
    }

    public void assertNotDuplicate(ChannelType channelType, ChannelInboundMessage message, String fingerprint) {
        if (message.idMensagemExterna() != null && !message.idMensagemExterna().isBlank()) {
            return;
        }
        findRecentDuplicate(channelType, message, fingerprint).ifPresent(existingId -> {
            if (abuseProperties.duplicate().rejectDuplicates()) {
                throw new DuplicateContentException(
                        "Conteúdo duplicado detectado na janela de " + abuseProperties.duplicate().windowSeconds() + "s");
            }
        });
    }
}
