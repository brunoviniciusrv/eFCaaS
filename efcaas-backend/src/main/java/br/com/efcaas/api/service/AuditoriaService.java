package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Auditoria;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.AuditoriaRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

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
}
