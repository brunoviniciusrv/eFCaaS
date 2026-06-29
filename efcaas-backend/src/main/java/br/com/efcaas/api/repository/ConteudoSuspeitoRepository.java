package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.ConteudoSuspeito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConteudoSuspeitoRepository extends JpaRepository<ConteudoSuspeito, Long> {

    long countByStatusAndTenantId(String status, Long tenantId);

    Optional<ConteudoSuspeito> findByIdAndTenantId(Long id, Long tenantId);

    @Query("""
        SELECT c FROM ConteudoSuspeito c
        WHERE c.tenantId = :tenantId
          AND (:status IS NULL OR c.status = :status)
          AND (:prioridade IS NULL OR c.prioridade = :prioridade)
        ORDER BY c.dataEntrada DESC
        """)
    List<ConteudoSuspeito> findByFilters(
            @Param("tenantId") Long tenantId,
            @Param("status") String status,
            @Param("prioridade") String prioridade);
}
