package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.TenantIngestKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TenantIngestKeyRepository extends JpaRepository<TenantIngestKey, Long> {

    Optional<TenantIngestKey> findByTenant_Slug(String slug);
}
