package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Checagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChecagemRepository extends JpaRepository<Checagem, Long> {

    Optional<Checagem> findByConteudoId(Long conteudoId);

    List<Checagem> findByChecadorId(Long checadorId);
}
