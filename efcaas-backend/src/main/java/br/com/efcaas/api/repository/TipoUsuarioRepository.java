package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.TipoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TipoUsuarioRepository extends JpaRepository<TipoUsuario, Long> {

    Optional<TipoUsuario> findByNome(String nome);
}
