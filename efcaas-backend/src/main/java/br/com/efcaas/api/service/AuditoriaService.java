package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Auditoria;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.AuditoriaRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.web.dto.AuditoriaDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(Long usuarioId, String acao, String alvo, String detalhes) {
        try {
            Usuario usuario = usuarioId != null
                    ? usuarioRepository.findById(usuarioId).orElse(null)
                    : null;
            auditoriaRepository.save(new Auditoria(usuario, acao, alvo, detalhes));
        } catch (Exception e) {
            log.error("Falha ao registrar auditoria: acao={}, alvo={}", acao, alvo, e);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditoriaDto> listarPorChecagem(Long checagemId) {
        String alvo = "checagem:" + checagemId;
        return auditoriaRepository.findByAlvoOrderByTimestampDesc(alvo)
                .stream()
                .map(a -> new AuditoriaDto(
                        a.getId(),
                        a.getUsuario() != null ? a.getUsuario().getNome() : "Sistema",
                        a.getAcao(),
                        a.getAlvo(),
                        enriquecerDetalhes(a.getAcao(), a.getDetalhes()),
                        a.getTimestamp() != null ? a.getTimestamp().toString() : null
                ))
                .toList();
    }

    /** Converte detalhes legados "checador:{id}" para "checador:{nome}". */
    private String enriquecerDetalhes(String acao, String detalhes) {
        if (detalhes == null || !"checagem_atribuida".equals(acao) || !detalhes.startsWith("checador:")) {
            return detalhes;
        }
        String valor = detalhes.substring("checador:".length());
        try {
            Long checadorId = Long.parseLong(valor);
            return usuarioRepository.findById(checadorId)
                    .map(u -> "checador:" + u.getNome())
                    .orElse(detalhes);
        } catch (NumberFormatException e) {
            return detalhes;
        }
    }
}
