package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Evidencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvidenciaRepository extends JpaRepository<Evidencia, Long> {

    List<Evidencia> findByChecagemId(Long checagemId);

    Optional<Evidencia> findByIdAndChecagemId(Long id, Long checagemId);
}
