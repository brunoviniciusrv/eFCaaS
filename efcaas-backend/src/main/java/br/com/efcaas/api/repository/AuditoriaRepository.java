package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {

    List<Auditoria> findByAlvoOrderByTimestampDesc(String alvo);
}
