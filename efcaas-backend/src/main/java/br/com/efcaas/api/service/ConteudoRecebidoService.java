package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.ConteudoRecebido;
import br.com.efcaas.api.domain.ConteudoRecebidoMidia;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.ConteudoRecebidoRepository;
import br.com.efcaas.api.repository.ConteudoSuspeitoRepository;
import br.com.efcaas.api.web.dto.ConteudoRecebidoDto;
import br.com.efcaas.api.web.dto.ConteudoSuspeitoDto;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoMidiaRequest;
import br.com.efcaas.api.web.dto.IngestConteudoRecebidoRequest;
import br.com.efcaas.api.web.mapper.ConteudoRecebidoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ConteudoRecebidoService {

    private static final Set<String> TIPOS_FONTE_VALIDOS = Set.of(
            "whatsapp", "facebook", "instagram", "telegram", "email",
            "youtube", "reddit", "tiktok", "other"
    );

    private final ConteudoRecebidoRepository repository;
    private final ConteudoSuspeitoRepository conteudoRepo;
    private final ConteudoRecebidoMapper mapper;
    private final ConteudoSuspeitoService conteudoSuspeitoService;
    private final AuditoriaService auditoria;

    @Transactional(readOnly = true)
    public List<ConteudoRecebidoDto> listar(String status) {
        String filtro = status != null && !status.isBlank() ? status : "received";
        return repository.findByStatusOrderByRecebidoEmDesc(filtro).stream()
                .map(mapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConteudoRecebidoDto obter(Long id) {
        return mapper.toDto(buscar(id));
    }

    @Transactional
    public IngestRegistrationResult registrarExterno(IngestConteudoRecebidoRequest req) {
        return registrarExterno(req, null);
    }

    @Transactional
    public IngestRegistrationResult registrarExterno(IngestConteudoRecebidoRequest req, String idempotencyKey) {
        IngestConteudoRecebidoRequest normalized = applyIdempotencyKey(req, idempotencyKey);
        String tipoFonte = normalizarTipoFonte(normalized.tipoFonte());

        if (normalized.idMensagemExterna() != null && !normalized.idMensagemExterna().isBlank()) {
            var existente = repository.findByTipoFonteAndIdMensagemExterna(tipoFonte, normalized.idMensagemExterna());
            if (existente.isPresent()) {
                return new IngestRegistrationResult(mapper.toDto(existente.get()), false);
            }
        }

        ConteudoRecebido entity = buildEntity(normalized, tipoFonte);
        try {
            repository.save(entity);
            return new IngestRegistrationResult(mapper.toDto(entity), true);
        } catch (DataIntegrityViolationException ex) {
            if (normalized.idMensagemExterna() != null && !normalized.idMensagemExterna().isBlank()) {
                return repository.findByTipoFonteAndIdMensagemExterna(tipoFonte, normalized.idMensagemExterna())
                        .map(e -> new IngestRegistrationResult(mapper.toDto(e), false))
                        .orElseThrow(() -> ex);
            }
            throw ex;
        }
    }

    @Transactional
    public ConteudoSuspeitoDto encaminharParaTriagem(Long id, Long usuarioId) {
        ConteudoRecebido recebido = buscar(id);
        if (!"received".equals(recebido.getStatus())) {
            throw new IllegalStateException("Conteúdo recebido não está disponível para triagem: " + recebido.getStatus());
        }

        ConteudoSuspeito conteudo = new ConteudoSuspeito();
        conteudo.setTitulo(recebido.getTitulo());
        conteudo.setAlegacao(recebido.getConteudo());
        conteudo.setDescricao(recebido.getResumo());
        conteudo.setFonte(formatarFonteParaExibicao(recebido.getTipoFonte()));
        conteudo.setLink(recebido.getLinkOriginal() != null ? recebido.getLinkOriginal() : "");
        conteudo.setStatus("pending");
        conteudoRepo.save(conteudo);

        recebido.setStatus("in_triage");
        recebido.setConteudoTriagem(conteudo);
        repository.save(recebido);

        auditoria.registrar(usuarioId, "forward_to_triage",
                "conteudo_recebido:" + id, "Encaminhou para triagem como conteudo:" + conteudo.getId());

        return conteudoSuspeitoService.obterDetalhe(conteudo.getId());
    }

    @Transactional
    public void excluir(Long id, Long usuarioId) {
        ConteudoRecebido recebido = buscar(id);
        recebido.setStatus("deleted");
        repository.save(recebido);
        auditoria.registrar(usuarioId, "delete_received_news",
                "conteudo_recebido:" + id, recebido.getTitulo());
    }

    private ConteudoRecebido buildEntity(IngestConteudoRecebidoRequest req, String tipoFonte) {
        ConteudoRecebido entity = new ConteudoRecebido();
        entity.setTitulo(req.titulo().trim());
        entity.setConteudo(req.conteudo().trim());
        entity.setResumo(req.resumo());
        entity.setTipoFonte(tipoFonte);
        entity.setNomeRemetente(req.nomeRemetente());
        entity.setEnderecoRemetente(req.enderecoRemetente());
        entity.setLinkOriginal(req.linkOriginal());
        entity.setIdMensagemExterna(req.idMensagemExterna());
        entity.setNotasInternas(req.notasInternas());
        entity.setStatus("received");

        if (req.midias() != null) {
            for (IngestConteudoRecebidoMidiaRequest m : req.midias()) {
                ConteudoRecebidoMidia midia = new ConteudoRecebidoMidia();
                midia.setConteudoRecebido(entity);
                midia.setTipo(m.tipo().toLowerCase(Locale.ROOT));
                midia.setUrl(m.url());
                midia.setTitulo(m.titulo());
                entity.getMidias().add(midia);
            }
        }
        return entity;
    }

    private IngestConteudoRecebidoRequest applyIdempotencyKey(IngestConteudoRecebidoRequest req, String idempotencyKey) {
        if ((req.idMensagemExterna() == null || req.idMensagemExterna().isBlank())
                && idempotencyKey != null && !idempotencyKey.isBlank()) {
            return new IngestConteudoRecebidoRequest(
                    req.titulo(), req.conteudo(), req.resumo(), req.tipoFonte(),
                    req.nomeRemetente(), req.enderecoRemetente(), req.linkOriginal(),
                    idempotencyKey, req.notasInternas(), req.midias());
        }
        return req;
    }

    private ConteudoRecebido buscar(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Conteúdo recebido não encontrado: " + id));
    }

    private String normalizarTipoFonte(String tipoFonte) {
        String normalizado = tipoFonte.trim().toLowerCase(Locale.ROOT)
                .replace("e-mail", "email")
                .replace("-", "");
        if ("e_mail".equals(normalizado)) {
            normalizado = "email";
        }
        if (!TIPOS_FONTE_VALIDOS.contains(normalizado)) {
            throw new IllegalArgumentException(
                    "tipoFonte inválido: " + tipoFonte + ". Valores aceitos: " + TIPOS_FONTE_VALIDOS);
        }
        return normalizado;
    }

    private String formatarFonteParaExibicao(String tipoFonte) {
        return switch (tipoFonte) {
            case "whatsapp" -> "WhatsApp";
            case "facebook" -> "Facebook";
            case "instagram" -> "Instagram";
            case "telegram" -> "Telegram";
            case "email" -> "E-mail";
            case "youtube" -> "YouTube";
            case "reddit" -> "Reddit";
            case "tiktok" -> "TikTok";
            default -> "Other";
        };
    }
}
