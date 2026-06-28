package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByEmailAndTenant_Id(String email, Long tenantId);

    Optional<Usuario> findByEmailAndTenantIsNull(String email);

    @Query("SELECT u FROM Usuario u JOIN FETCH u.tenant JOIN FETCH u.tipoUsuario WHERE LOWER(u.email) = LOWER(:email) AND u.tenant IS NOT NULL")
    List<Usuario> findTenantUsersByEmail(@Param("email") String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndTenant_Id(String email, Long tenantId);

    List<Usuario> findByTenant_IdAndStatus(Long tenantId, String status);

    List<Usuario> findByTenant_IdOrderByNomeAsc(Long tenantId);

    Optional<Usuario> findByIdAndTenant_Id(Long id, Long tenantId);
}
