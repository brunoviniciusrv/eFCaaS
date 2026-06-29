package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.TenantConteudoSeq;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TenantConteudoSeqRepository extends JpaRepository<TenantConteudoSeq, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM TenantConteudoSeq s WHERE s.tenantId = :tenantId")
    Optional<TenantConteudoSeq> findByTenantIdForUpdate(@Param("tenantId") Long tenantId);
}
