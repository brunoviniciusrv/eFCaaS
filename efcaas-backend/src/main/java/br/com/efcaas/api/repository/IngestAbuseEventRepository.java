package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.IngestAbuseEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IngestAbuseEventRepository extends JpaRepository<IngestAbuseEvent, Long> {
}
