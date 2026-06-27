package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "ingest_abuse_event")
@Getter
@Setter
@NoArgsConstructor
public class IngestAbuseEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "channel_type", nullable = false, length = 32)
    private String channelType;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "client_ip", length = 64)
    private String clientIp;

    @Column(length = 128)
    private String fingerprint;

    @Column(name = "content_hash", length = 128)
    private String contentHash;

    @Column(length = 512)
    private String detail;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();

    public IngestAbuseEvent(String channelType, String eventType, String clientIp,
                            String fingerprint, String contentHash, String detail) {
        this.channelType = channelType;
        this.eventType = eventType;
        this.clientIp = clientIp;
        this.fingerprint = fingerprint;
        this.contentHash = contentHash;
        this.detail = detail;
    }
}
