package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.ConfiguracaoAgencia;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracaoAgenciaRepository extends JpaRepository<ConfiguracaoAgencia, Long> {

    java.util.Optional<ConfiguracaoAgencia> findByTenant_Id(Long tenantId);

    java.util.Optional<ConfiguracaoAgencia> findByTenant_Slug(String slug);
}
