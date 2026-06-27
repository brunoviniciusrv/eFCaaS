package br.com.efcaas.api.channel.abuse;

import br.com.efcaas.api.config.AbuseProperties;
import br.com.efcaas.api.domain.IngestRateLimitBucket;
import br.com.efcaas.api.exception.RateLimitExceededException;
import br.com.efcaas.api.repository.IngestRateLimitBucketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final AbuseProperties abuseProperties;
    private final IngestRateLimitBucketRepository bucketRepository;
    private final ObjectProvider<StringRedisTemplate> redisProvider;

    @Transactional
    public void checkAndIncrement(String bucketKey, int limit) {
        if (abuseProperties.redis().enabled()) {
            StringRedisTemplate redis = redisProvider.getIfAvailable();
            if (redis != null && tryRedis(bucketKey, limit, redis)) {
                return;
            }
        }
        checkAndIncrementPostgres(bucketKey, limit);
    }

    private boolean tryRedis(String bucketKey, int limit, StringRedisTemplate redis) {
        String blockKey = "ingest:block:" + bucketKey;
        if (Boolean.TRUE.equals(redis.hasKey(blockKey))) {
            long ttl = Optional.ofNullable(redis.getExpire(blockKey)).orElse(60L);
            throw new RateLimitExceededException("Limite de requisições excedido", (int) Math.max(1, ttl));
        }

        String counterKey = "ingest:rl:" + bucketKey;
        Long count = redis.opsForValue().increment(counterKey);
        if (count != null && count == 1L) {
            redis.expire(counterKey, Duration.ofSeconds(abuseProperties.rateLimit().windowSeconds()));
        }
        if (count != null && count > limit) {
            int cooldown = abuseProperties.rateLimit().cooldownSeconds();
            redis.opsForValue().set(blockKey, "1", Duration.ofSeconds(cooldown));
            throw new RateLimitExceededException("Limite de requisições excedido", cooldown);
        }
        return true;
    }

    void checkAndIncrementPostgres(String bucketKey, int limit) {
        Instant now = Instant.now();
        IngestRateLimitBucket bucket = bucketRepository.findByKeyForUpdate(bucketKey)
                .orElseGet(() -> new IngestRateLimitBucket(bucketKey, 0, now));

        if (bucket.getBlockedUntil() != null && bucket.getBlockedUntil().isAfter(now)) {
            long seconds = Duration.between(now, bucket.getBlockedUntil()).getSeconds();
            throw new RateLimitExceededException("Limite de requisições excedido", (int) Math.max(1, seconds));
        }

        long windowSeconds = abuseProperties.rateLimit().windowSeconds();
        if (Duration.between(bucket.getWindowStart(), now).getSeconds() >= windowSeconds) {
            bucket.setRequestCount(0);
            bucket.setWindowStart(now);
            bucket.setBlockedUntil(null);
        }

        bucket.setRequestCount(bucket.getRequestCount() + 1);
        if (bucket.getRequestCount() > limit) {
            bucket.setBlockedUntil(now.plusSeconds(abuseProperties.rateLimit().cooldownSeconds()));
            bucketRepository.save(bucket);
            throw new RateLimitExceededException("Limite de requisições excedido",
                    abuseProperties.rateLimit().cooldownSeconds());
        }
        bucketRepository.save(bucket);
    }
}
