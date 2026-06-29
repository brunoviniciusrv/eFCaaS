package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.SolicitacaoCadastroAgencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolicitacaoCadastroRepository extends JpaRepository<SolicitacaoCadastroAgencia, Long> {

    List<SolicitacaoCadastroAgencia> findByStatusOrderByCriadoEmDesc(String status);

    List<SolicitacaoCadastroAgencia> findAllByOrderByCriadoEmDesc();
}
