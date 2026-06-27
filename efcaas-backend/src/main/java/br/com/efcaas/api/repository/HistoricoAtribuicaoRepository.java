package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.HistoricoAtribuicao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistoricoAtribuicaoRepository extends JpaRepository<HistoricoAtribuicao, Long> {

    List<HistoricoAtribuicao> findByChecagem_Id(Long checagemId);
}
