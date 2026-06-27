package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Revisao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RevisaoRepository extends JpaRepository<Revisao, Long> {

    List<Revisao> findByParecer_Id(Long parecerId);
}
