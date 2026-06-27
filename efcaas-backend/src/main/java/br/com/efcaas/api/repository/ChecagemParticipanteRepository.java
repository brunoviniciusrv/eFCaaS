package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.ChecagemParticipante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ChecagemParticipanteRepository extends JpaRepository<ChecagemParticipante, Long> {

    List<ChecagemParticipante> findByChecagem_IdAndAtivoTrue(Long checagemId);

    Optional<ChecagemParticipante> findByChecagem_IdAndUsuario_Id(Long checagemId, Long usuarioId);

    @Query("""
            SELECT DISTINCT p.checagem.conteudo.id
            FROM ChecagemParticipante p
            WHERE p.usuario.id = :usuarioId AND p.ativo = true
            """)
    Set<Long> findConteudoIdsByUsuarioIdAtivo(@Param("usuarioId") Long usuarioId);
}
