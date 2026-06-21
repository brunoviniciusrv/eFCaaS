package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.RelatorioPublicacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface RelatorioPublicacaoRepository extends JpaRepository<RelatorioPublicacao, Long> {

    Optional<RelatorioPublicacao> findByParecerId(Long parecerId);

    Optional<RelatorioPublicacao> findByParecer_Checagem_Conteudo_Id(Long conteudoId);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            WHERE c.conteudo.id = :conteudoId
            """)
    Optional<RelatorioPublicacao> findDetalhadoByConteudoId(Long conteudoId);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            WHERE r.id = :id
            """)
    Optional<RelatorioPublicacao> findDetalhadoById(Long id);

    @Query("""
            SELECT r FROM RelatorioPublicacao r
            JOIN FETCH r.parecer p
            JOIN FETCH p.checagem c
            JOIN FETCH c.conteudo
            JOIN FETCH r.editor
            ORDER BY r.dataAtualizacao DESC NULLS LAST, r.dataCriacao DESC
            """)
    List<RelatorioPublicacao> findAllComDetalhes();
}
