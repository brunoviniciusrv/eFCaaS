package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Investigacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvestigacaoRepository extends JpaRepository<Investigacao, Long> {

    Optional<Investigacao> findByChecagemId(Long checagemId);
}
