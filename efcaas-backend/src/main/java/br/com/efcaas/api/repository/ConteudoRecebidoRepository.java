package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.ConteudoRecebido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConteudoRecebidoRepository extends JpaRepository<ConteudoRecebido, Long> {

    List<ConteudoRecebido> findByStatusOrderByRecebidoEmDesc(String status);

    Optional<ConteudoRecebido> findByTipoFonteAndIdMensagemExterna(String tipoFonte, String idMensagemExterna);

    Optional<ConteudoRecebido> findByConteudoTriagem_Id(Long conteudoTriagemId);
}
