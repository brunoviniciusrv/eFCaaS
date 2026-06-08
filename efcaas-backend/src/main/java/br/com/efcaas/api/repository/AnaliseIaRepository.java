package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.AnaliseIa;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AnaliseIaRepository extends JpaRepository<AnaliseIa, Long> {

    Optional<AnaliseIa> findByConteudoId(Long conteudoId);
}
