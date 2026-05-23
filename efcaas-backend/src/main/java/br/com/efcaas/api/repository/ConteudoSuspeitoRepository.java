package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.ConteudoSuspeito;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Map;

public interface ConteudoSuspeitoRepository extends JpaRepository<ConteudoSuspeito, Long> {

    long countByStatus(String status);

    @Query("""
        SELECT c.status AS status, COUNT(c) AS total
        FROM ConteudoSuspeito c
        GROUP BY c.status
        """)
    java.util.List<Object[]> countGroupByStatus();
}
