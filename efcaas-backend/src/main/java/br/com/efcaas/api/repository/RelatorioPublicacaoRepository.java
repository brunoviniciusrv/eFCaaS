package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.RelatorioPublicacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RelatorioPublicacaoRepository extends JpaRepository<RelatorioPublicacao, Long> {

    Optional<RelatorioPublicacao> findByParecerId(Long parecerId);

    List<RelatorioPublicacao> findAllByParecer_Id(Long parecerId);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            WHERE c.conteudo.id = :conteudoId
              AND c.conteudo.tenantId = :tenantId
            ORDER BY r.dataCriacao DESC
            """)
    List<RelatorioPublicacao> findDetalhadosByConteudoId(Long conteudoId, Long tenantId);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            WHERE r.id = :id
              AND c.conteudo.tenantId = :tenantId
            """)
    Optional<RelatorioPublicacao> findDetalhadoById(Long id, Long tenantId);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            WHERE c.conteudo.tenantId = :tenantId
            ORDER BY r.dataAtualizacao DESC NULLS LAST, r.dataCriacao DESC
            """)
    List<RelatorioPublicacao> findAllComDetalhes(Long tenantId);
}
