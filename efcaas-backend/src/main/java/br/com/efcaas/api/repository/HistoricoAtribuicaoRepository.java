package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.HistoricoAtribuicao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoricoAtribuicaoRepository extends JpaRepository<HistoricoAtribuicao, Long> {
}
