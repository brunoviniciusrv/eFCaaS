package br.com.efcaas.api.repository;

import br.com.efcaas.api.domain.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {

    List<Notificacao> findByUsuario_IdAndLidaFalseOrderByCriadoEmDesc(Long usuarioId);

    List<Notificacao> findByUsuario_IdOrderByCriadoEmDesc(Long usuarioId);
}
