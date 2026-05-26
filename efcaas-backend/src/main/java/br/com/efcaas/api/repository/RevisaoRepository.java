package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Revisao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevisaoRepository extends JpaRepository<Revisao, Long> {
}
