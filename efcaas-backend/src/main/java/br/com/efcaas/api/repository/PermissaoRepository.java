package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Permissao;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissaoRepository extends JpaRepository<Permissao, Long> {
}
