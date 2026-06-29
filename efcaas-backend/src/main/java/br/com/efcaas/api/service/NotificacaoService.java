package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Notificacao;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.NotificacaoRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.NotificacaoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepo;
    private final UsuarioRepository usuarioRepo;
    private final TenantScope tenantScope;

    @Transactional
    public void criar(Long usuarioId, String titulo, String mensagem, String categoria, String link) {
        Usuario usuario = usuarioRepo.findById(usuarioId)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado: " + usuarioId));
        Notificacao n = new Notificacao();
        n.setUsuario(usuario);
        n.setTenantId(tenantScope.requireTenantId());
        n.setTitulo(titulo);
        n.setMensagem(mensagem);
        n.setCategoria(categoria);
        n.setLink(link);
        notificacaoRepo.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificacaoDto> listarParaUsuario(Long usuarioId) {
        return notificacaoRepo.findByUsuario_IdOrderByCriadoEmDesc(usuarioId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void marcarComoLida(Long notificacaoId, Long usuarioId) {
        Notificacao n = notificacaoRepo.findById(notificacaoId)
                .orElseThrow(() -> new NoSuchElementException("Notificação não encontrada"));
        if (!n.getUsuario().getId().equals(usuarioId)) {
            throw new IllegalStateException("Notificação não pertence ao usuário");
        }
        n.setLida(true);
        notificacaoRepo.save(n);
    }

    private NotificacaoDto toDto(Notificacao n) {
        return new NotificacaoDto(
                String.valueOf(n.getId()),
                n.getTitulo(),
                n.getMensagem(),
                n.getCategoria(),
                n.getLink(),
                n.isLida(),
                n.getCriadoEm() != null ? n.getCriadoEm().toString() : null
        );
    }
}
