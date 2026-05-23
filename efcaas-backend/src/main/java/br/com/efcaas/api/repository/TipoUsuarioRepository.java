package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.TipoUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TipoUsuarioRepository extends JpaRepository<TipoUsuario, Long> {
}
