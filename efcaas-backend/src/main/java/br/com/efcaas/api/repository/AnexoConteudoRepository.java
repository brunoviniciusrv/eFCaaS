package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.AnexoConteudo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AnexoConteudoRepository extends JpaRepository<AnexoConteudo, Long> {

    List<AnexoConteudo> findByConteudoId(Long conteudoId);

    Optional<AnexoConteudo> findByIdAndConteudoId(Long id, Long conteudoId);
}
