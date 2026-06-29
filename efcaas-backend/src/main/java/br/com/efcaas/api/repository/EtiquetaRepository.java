package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Etiqueta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EtiquetaRepository extends JpaRepository<Etiqueta, Long> {

    List<Etiqueta> findByTenantId(Long tenantId);

    boolean existsByIdAndTenantId(Long id, Long tenantId);
}
