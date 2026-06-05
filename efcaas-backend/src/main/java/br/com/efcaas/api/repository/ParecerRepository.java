package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Parecer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParecerRepository extends JpaRepository<Parecer, Long> {

    Optional<Parecer> findByChecagemId(Long checagemId);
}
