package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.TokenAtivacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TokenAtivacaoRepository extends JpaRepository<TokenAtivacao, Long> {

    Optional<TokenAtivacao> findByTokenHash(String tokenHash);
}
