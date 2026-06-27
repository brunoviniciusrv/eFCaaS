package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.IngestContentFingerprint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;

public interface IngestContentFingerprintRepository extends JpaRepository<IngestContentFingerprint, Long> {

    Optional<IngestContentFingerprint> findFirstByContentHashAndCriadoEmGreaterThanEqualOrderByCriadoEmDesc(
            String contentHash, Instant since);

    Optional<IngestContentFingerprint> findFirstByFingerprintAndCriadoEmGreaterThanEqualOrderByCriadoEmDesc(
            String fingerprint, Instant since);
}
