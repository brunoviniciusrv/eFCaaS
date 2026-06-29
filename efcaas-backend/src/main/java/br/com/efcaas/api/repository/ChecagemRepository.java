package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Checagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecagemRepository extends JpaRepository<Checagem, Long> {

    Optional<Checagem> findByConteudoId(Long conteudoId);

    Optional<Checagem> findByConteudoIdAndTenantId(Long conteudoId, Long tenantId);

    Optional<Checagem> findByIdAndTenantId(Long id, Long tenantId);

    List<Checagem> findAllByConteudo_Id(Long conteudoId);

    List<Checagem> findByChecadorId(Long checadorId);
}
