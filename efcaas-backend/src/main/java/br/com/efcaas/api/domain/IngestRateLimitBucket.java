package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "ingest_rate_limit_bucket")
@Getter
@Setter
@NoArgsConstructor
public class IngestRateLimitBucket {

    @Id
    @Column(name = "bucket_key", length = 256)
    private String bucketKey;

    @Column(name = "request_count", nullable = false)
    private int requestCount;

    @Column(name = "window_start", nullable = false)
    private Instant windowStart;

    @Column(name = "blocked_until")
    private Instant blockedUntil;

    public IngestRateLimitBucket(String bucketKey, int requestCount, Instant windowStart) {
        this.bucketKey = bucketKey;
        this.requestCount = requestCount;
        this.windowStart = windowStart;
    }
}
