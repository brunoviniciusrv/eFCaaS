package br.com.efcaas.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "ingest_content_fingerprint")
@Getter
@Setter
@NoArgsConstructor
public class IngestContentFingerprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_hash", nullable = false, length = 128)
    private String contentHash;

    @Column(length = 128)
    private String fingerprint;

    @Column(name = "channel_type", nullable = false, length = 32)
    private String channelType;

    @Column(name = "tipo_fonte", length = 50)
    private String tipoFonte;

    @Column(name = "conteudo_id")
    private Long conteudoId;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm = Instant.now();

    public IngestContentFingerprint(String contentHash, String fingerprint, String channelType,
                                    String tipoFonte, Long conteudoId) {
        this.contentHash = contentHash;
        this.fingerprint = fingerprint;
        this.channelType = channelType;
        this.tipoFonte = tipoFonte;
        this.conteudoId = conteudoId;
    }
}
