package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.IngestRateLimitBucket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface IngestRateLimitBucketRepository extends JpaRepository<IngestRateLimitBucket, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM IngestRateLimitBucket b WHERE b.bucketKey = :key")
    Optional<IngestRateLimitBucket> findByKeyForUpdate(@Param("key") String bucketKey);
}
