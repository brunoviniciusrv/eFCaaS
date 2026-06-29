package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.*;
import br.com.efcaas.api.repository.*;
import br.com.efcaas.api.repository.RevisaoRepository;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.tenant.TenantContext;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.*;
import br.com.efcaas.api.web.mapper.AnaliseIaTopicMatchCodec;
import br.com.efcaas.api.web.mapper.ChecagemMapper;
import br.com.efcaas.api.web.mapper.ConteudoSuspeitoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConteudoSuspeitoService {

    private static final Set<String> STATUS_EXCLUIVEIS = Set.of(
            "pending", "in_progress", "to_rectify", "final_review");

    private final ConteudoSuspeitoRepository conteudoRepo;
    private final ChecagemRepository checagemRepo;
    private final ParecerRepository parecerRepo;
    private final InvestigacaoRepository investigacaoRepo;
    private final EvidenciaRepository evidenciaRepo;
    private final AnexoConteudoRepository anexoRepo;
    private final ConteudoRecebidoRepository conteudoRecebidoRepo;
    private final AnaliseIaRepository analiseIaRepo;
    private final UsuarioRepository usuarioRepo;
    private final HistoricoAtribuicaoRepository historicoRepo;
    private final ChecagemParticipanteRepository participanteRepo;
    private final RevisaoRepository revisaoRepo;
    private final RelatorioPublicacaoRepository relatorioRepo;
    private final ConteudoSuspeitoMapper mapper;
    private final ChecagemMapper checagemMapper;
    private final AuditoriaService auditoria;
    private final IaService iaService;
    private final IaAnaliseAsyncService iaAnaliseAsyncService;
    private final TenantConteudoSeqService tenantConteudoSeqService;
    private final RelatorioPublicacaoService relatorioPublicacaoService;
    private final StorageService storageService;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<ConteudoSuspeitoDto> listar(String status, String prioridade, Long checadorId) {
        Long tenantId = tenantScope.requireTenantId();
        List<ConteudoSuspeito> conteudos = conteudoRepo.findByFilters(tenantId, status, prioridade);

        if (checadorId != null) {
            Set<Long> ids = checagemRepo.findByChecadorId(checadorId)
                    .stream()
                    .map(c -> c.getConteudo().getId())
                    .collect(Collectors.toSet());
            ids.addAll(participanteRepo.findConteudoIdsByUsuarioIdAtivo(checadorId));
            conteudos = conteudos.stream()
                    .filter(c -> ids.contains(c.getId()))
                    .toList();
        }

        return conteudos.stream()
                .map(c -> {
                    Checagem ch = checagemRepo.findByConteudoId(c.getId()).orElse(null);
                    Parecer parecer = ch != null
                            ? parecerRepo.findByChecagemId(ch.getId()).orElse(null)
                            : null;
                    List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(c.getId());
                    var midiasRecebidas = midiasDoRecebido(c.getId());
                    return mapper.toDtoSimples(c, ch, parecer, anexos, midiasRecebidas);
                })
                .toList();
    }

    private List<ConteudoRecebidoMidia> midiasDoRecebido(Long conteudoTriagemId) {
        return conteudoRecebidoRepo.findByConteudoTriagem_Id(conteudoTriagemId)
                .map(r -> r.getMidias() != null ? r.getMidias() : List.<ConteudoRecebidoMidia>of())
                .orElse(List.of());
    }

    @Transactional(readOnly = true)
    public ConteudoSuspeitoDto obterDetalhe(Long id) {
        ConteudoSuspeito c = requireConteudo(id);
        Checagem ch = checagemRepo.findByConteudoId(id).orElse(null);
        Parecer parecer = ch != null ? parecerRepo.findByChecagemId(ch.getId()).orElse(null) : null;
        Investigacao investigacao = ch != null
                ? investigacaoRepo.findByChecagemId(ch.getId()).orElse(null)
                : null;
        List<Evidencia> evidencias = ch != null ? evidenciaRepo.findByChecagemId(ch.getId()) : List.of();
        List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(id);
        AnaliseIa analiseIa = buscarAnaliseIa(id);
        var midiasRecebidas = midiasDoRecebido(id);
        return mapper.toDto(c, ch, parecer, investigacao, evidencias, analiseIa, anexos, midiasRecebidas);
    }

    @Transactional
    public ConteudoSuspeitoDto criar(CriarConteudoRequest req, Long curadorId) {
        ConteudoSuspeito c = new ConteudoSuspeito();
        c.setTitulo(req.titulo());
        c.setAlegacao(req.alegacao());
        c.setLink(req.link() != null ? req.link() : "");
        c.setFonte(req.fonte());
        c.setDescricao(req.descricao());
        c.setPrioridade(req.prioridade());
        c.setStatus("pending");
        Long tenantId = tenantScope.requireTenantId();
        c.setTenantId(tenantId);
        c.setNumeroReferencia(tenantConteudoSeqService.proximoNumeroReferencia(tenantId));
        conteudoRepo.save(c);

        auditoria.registrar(curadorId, "conteudo_criado", "conteudo:" + c.getId(), req.titulo());
        return mapper.toDtoSimples(c, null, List.of());
    }

    @Transactional
    public ConteudoSuspeitoDto atualizar(Long id, AtualizarConteudoRequest req, Long usuarioId) {
        ConteudoSuspeito c = requireConteudo(id);
        c.setTitulo(req.titulo());
        if (req.alegacao()   != null) c.setAlegacao(req.alegacao());
        if (req.link()       != null) c.setLink(req.link());
        if (req.fonte()      != null) c.setFonte(req.fonte());
        if (req.descricao()  != null) c.setDescricao(req.descricao());
        if (req.prioridade() != null) c.setPrioridade(req.prioridade());
        conteudoRepo.save(c);
        auditoria.registrar(usuarioId, "conteudo_editado", "conteudo:" + id, req.titulo());
        Checagem ch = checagemRepo.findByConteudoId(id).orElse(null);
        List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(id);
        return mapper.toDtoSimples(c, ch, anexos);
    }

    @Transactional
    public ConteudoSuspeitoDto atualizarStatus(Long id, String novoStatus, Long usuarioId) {
        ConteudoSuspeito c = requireConteudo(id);
        c.setStatus(novoStatus);
        conteudoRepo.save(c);
        Checagem ch = checagemRepo.findByConteudoId(id).orElse(null);
        List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(id);
        auditoria.registrar(usuarioId, "status_atualizado", "conteudo:" + id, novoStatus);
        return mapper.toDtoSimples(c, ch, anexos);
    }

    @Transactional
    public ChecagemDto atribuir(Long conteudoId, AtribuirChecagemRequest req, Long curadorId) {
        return adicionarChecador(conteudoId, req.checadorId(), curadorId, req.briefing(), "assigned", "checagem_atribuida");
    }

    @Transactional
    public ChecagemDto assumir(Long conteudoId, Long checadorId) {
        return adicionarChecador(conteudoId, checadorId, checadorId, "Assumiu a tarefa", "assumed", "checagem_assumida");
    }

    @Transactional
    public ChecagemDto desatribuir(Long conteudoId, Long checadorId, Long usuarioId) {
        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));

        ChecagemParticipante participante = participanteRepo
                .findByChecagem_IdAndUsuario_Id(checagem.getId(), checadorId)
                .orElseThrow(() -> new NoSuchElementException("Checador não está atribuído a este conteúdo"));

        if (!participante.isAtivo()) {
            return checagemMapper.toDto(checagem, null, List.of());
        }

        participante.setAtivo(false);
        participanteRepo.save(participante);

        Usuario removido = participante.getUsuario();
        Usuario responsavel = requireUsuario(usuarioId);
        historicoRepo.save(new HistoricoAtribuicao(checagem, removido, responsavel, "removed", null));
        auditoria.registrar(usuarioId, "checagem_desatribuida",
                "checagem:" + checagem.getId(), "checador:" + removido.getNome());

        ConteudoSuspeito conteudo = checagem.getConteudo();
        List<ChecagemParticipante> ativos = participanteRepo.findByChecagem_IdAndAtivoTrue(checagem.getId());
        if (ativos.isEmpty()) {
            checagem.setChecador(null);
            conteudo.setResponsavel(null);
            if ("in_progress".equals(conteudo.getStatus())) {
                conteudo.setStatus("pending");
            }
        } else {
            checagem.setChecador(ativos.get(0).getUsuario());
            conteudo.setResponsavel(checagem.getChecador());
        }
        checagemRepo.save(checagem);
        conteudoRepo.save(conteudo);

        return checagemMapper.toDto(checagem, null, List.of());
    }

    private ChecagemDto adicionarChecador(
            Long conteudoId,
            Long checadorId,
            Long atribuidoPorId,
            String briefing,
            String acaoHistorico,
            String acaoAuditoria) {
        ConteudoSuspeito conteudo = requireConteudo(conteudoId);

        Usuario checador = requireUsuario(checadorId);
        requirePermissaoChecagem(checador);

        Usuario atribuidoPor = requireUsuario(atribuidoPorId);

        Checagem checagem = checagemRepo.findByConteudoId(conteudoId).orElse(new Checagem());
        checagem.setConteudo(conteudo);
        checagem.setTenantId(conteudo.getTenantId());
        if (checagem.getCurador() == null) {
            checagem.setCurador(atribuidoPor);
        }
        if (checagem.getChecador() == null) {
            checagem.setChecador(checador);
        }
        if (briefing != null && !briefing.isBlank()) {
            checagem.setBriefing(briefing);
        }
        if (checagem.getStatus() == null || checagem.getStatus().isBlank()) {
            checagem.setStatus("aberta");
        }
        checagemRepo.save(checagem);

        ChecagemParticipante participante = participanteRepo
                .findByChecagem_IdAndUsuario_Id(checagem.getId(), checadorId)
                .orElseGet(ChecagemParticipante::new);
        boolean novoParticipante = participante.getId() == null || !participante.isAtivo();
        participante.setChecagem(checagem);
        participante.setUsuario(checador);
        participante.setAtivo(true);
        participanteRepo.save(participante);

        if (novoParticipante) {
            historicoRepo.save(new HistoricoAtribuicao(checagem, checador, atribuidoPor, acaoHistorico, briefing));
            auditoria.registrar(atribuidoPorId, acaoAuditoria,
                    "checagem:" + checagem.getId(), "checador:" + checador.getNome());
        } else if (briefing != null && !briefing.isBlank() && "assigned".equals(acaoHistorico)) {
            historicoRepo.save(new HistoricoAtribuicao(checagem, checador, atribuidoPor, "assigned", briefing));
            auditoria.registrar(atribuidoPorId, "checagem_atribuida",
                    "checagem:" + checagem.getId(), "checador:" + checador.getNome());
        }

        conteudo.setStatus("in_progress");
        conteudo.setResponsavel(checagem.getChecador());
        conteudoRepo.save(conteudo);

        return checagemMapper.toDto(checagem, null, List.of());
    }

    @Transactional
    public void aprovar(Long conteudoId, Long revisorId, String justificativa) {
        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));
        Parecer parecer = parecerRepo.findByChecagemId(checagem.getId())
                .orElseThrow(() -> new IllegalStateException("Parecer não finalizado para esta checagem"));

        Revisao revisao = new Revisao();
        revisao.setParecer(parecer);
        revisao.setStatus("aprovado");
        revisao.setJustificativa(justificativa);
        revisaoRepo.save(revisao);

        checagem.setStatus("aprovada");
        checagemRepo.save(checagem);

        ConteudoSuspeito conteudo = checagem.getConteudo();
        conteudo.setStatus("completed");
        conteudoRepo.save(conteudo);

        relatorioPublicacaoService.criarRascunhoAutomatico(conteudoId);

        auditoria.registrar(revisorId, "revisao_aprovada", "checagem:" + checagem.getId(), justificativa);
    }

    @Transactional
    public void rejeitar(Long conteudoId, Long revisorId, String justificativa) {
        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));
        Parecer parecer = parecerRepo.findByChecagemId(checagem.getId())
                .orElseThrow(() -> new IllegalStateException("Parecer não finalizado para esta checagem"));

        Revisao revisao = new Revisao();
        revisao.setParecer(parecer);
        revisao.setStatus("rejeitado");
        revisao.setJustificativa(justificativa);
        revisaoRepo.save(revisao);

        checagem.setStatus("rejeitada");
        checagemRepo.save(checagem);

        ConteudoSuspeito conteudo = checagem.getConteudo();
        conteudo.setStatus("to_rectify");
        conteudoRepo.save(conteudo);

        auditoria.registrar(revisorId, "revisao_rejeitada", "checagem:" + checagem.getId(), justificativa);
    }

    @Transactional
    public ConteudoSuspeitoDto iniciarAnaliseIa(Long id) {
        ConteudoSuspeito conteudo = requireConteudo(id);
        AnaliseIa analise = obterOuCriarAnaliseIa(conteudo);
        if ("processando".equals(analise.getStatusIa())) {
            return obterDetalhe(id);
        }
        analise.setConteudo(conteudo);
        analise.setStatusIa("processando");
        analise.setIniciadoEm(LocalDateTime.now());
        analise.setMensagemErro(null);
        analiseIaRepo.save(analise);

        Long tenantId = TenantContext.getTenantId();
        String tenantSlug = TenantContext.getTenantSlug();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    iaAnaliseAsyncService.executarAnalise(id, tenantId, tenantSlug);
                }
            });
        } else {
            iaAnaliseAsyncService.executarAnalise(id, tenantId, tenantSlug);
        }
        return obterDetalhe(id);
    }

    /** @deprecated use {@link #iniciarAnaliseIa(Long)} */
    @Transactional
    public ConteudoSuspeitoDto analisarConteudo(Long id) {
        return iniciarAnaliseIa(id);
    }

    private AnaliseIa buscarAnaliseIa(Long conteudoId) {
        return analiseIaRepo.findFirstByConteudo_IdOrderByIdDesc(conteudoId).orElse(null);
    }

    private AnaliseIa obterOuCriarAnaliseIa(ConteudoSuspeito conteudo) {
        Long conteudoId = conteudo.getId();
        List<AnaliseIa> existentes = analiseIaRepo.findAllByConteudo_Id(conteudoId);
        if (existentes.isEmpty()) {
            AnaliseIa nova = new AnaliseIa();
            nova.setConteudo(conteudo);
            return nova;
        }
        AnaliseIa latest = existentes.stream()
                .max(Comparator.comparing(AnaliseIa::getId))
                .orElseThrow();
        if (existentes.size() > 1) {
            existentes.stream()
                    .filter(a -> !a.getId().equals(latest.getId()))
                    .forEach(analiseIaRepo::delete);
        }
        latest.setConteudo(conteudo);
        return latest;
    }

    private void aplicarAnaliseIa(AnaliseIa analise, AnaliseIaDto dto) {
        analise.setAvaliacaoRisco(dto.avaliacaoRisco());
        analise.setTextoAnalise(dto.textoAnalise());
        analise.setSimulado(dto.simulado());
        analise.setScoreInveracidade(dto.scoreInveracidade());
        analise.setScoreDistorcao(dto.scoreFalsidade());
        analise.setScoreForaContexto(dto.scoreDistorcaoMidia());
        analise.setClassificacaoOdio(dto.classificacaoOdio());
        analise.setClassificacaoAntidemo(dto.classificacaoAntidemo());
        analise.setConfiancaClassificacao(dto.confiancaClassificacao());
        analise.setCategoriaFinal(dto.categoriaFinal());
        analise.setScoreRiscoIlicitude(dto.scoreRiscoIlicitude());
        analise.setScoreDiscOdio(null);
        analise.setScoreDiscAntidemo(null);
        analise.setAtributoWhat(dto.atributoWhat());
        analise.setAtributoWho(dto.atributoWho());
        analise.setAtributoWhere(dto.atributoWhere());
        analise.setAtributoWhen(dto.atributoWhen());
        analise.setKeywords(dto.keywords());
        analise.setPseudoLabel(dto.pseudoLabel());
        analise.setMisinformationFeatures(dto.misinformationFeatures());
        analise.setCertezaAlegacao(dto.certezaAlegacao());
        analise.setFaixaCertezaAlegacao(dto.faixaCertezaAlegacao());
        analise.setTopicMatchJson(AnaliseIaTopicMatchCodec.serialize(dto.topicMatch()));
    }

    @Transactional
    public void reabrir(Long conteudoId, Long usuarioId, String justificativa) {
        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));

        checagem.setStatus("retificacao");
        checagemRepo.save(checagem);

        ConteudoSuspeito conteudo = checagem.getConteudo();
        conteudo.setStatus("to_rectify");
        conteudoRepo.save(conteudo);

        Usuario usuario = requireUsuario(usuarioId);
        if (checagem.getChecador() != null) {
            historicoRepo.save(new HistoricoAtribuicao(
                    checagem, checagem.getChecador(), usuario, "reopened", justificativa));
        }

        auditoria.registrar(usuarioId, "conteudo_reaberto", "conteudo:" + conteudoId, justificativa);
    }

    @Transactional
    public void habilitarEdicaoConcluida(Long conteudoId, Long usuarioId) {
        ConteudoSuspeito conteudo = requireConteudo(conteudoId);
        if (!"completed".equals(conteudo.getStatus())) {
            throw new IllegalStateException(
                    "Só é possível habilitar edição para conteúdos concluídos.");
        }

        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));

        auditoria.registrar(usuarioId, "edicao_concluida_habilitada",
                "checagem:" + checagem.getId(), null);
    }

    @Transactional
    public void excluir(Long id, Long usuarioId) {
        ConteudoSuspeito conteudo = requireConteudo(id);

        if (!STATUS_EXCLUIVEIS.contains(conteudo.getStatus())) {
            throw new IllegalStateException(
                    "Só é possível excluir conteúdos que ainda não foram concluídos.");
        }

        for (Checagem checagem : checagemRepo.findAllByConteudo_Id(id)) {
            excluirDadosChecagem(checagem);
        }

        analiseIaRepo.findAllByConteudo_Id(id).forEach(analiseIaRepo::delete);

        conteudoRecebidoRepo.findByConteudoTriagem_Id(id).ifPresent(recebido -> {
            recebido.setConteudoTriagem(null);
            recebido.setStatus("deleted");
            conteudoRecebidoRepo.save(recebido);
        });

        for (AnexoConteudo anexo : anexoRepo.findByConteudoId(id)) {
            try {
                storageService.delete(anexo.getObjectKey());
            } catch (Exception e) {
                // Continua a exclusão mesmo se o arquivo já não existir no storage.
            }
            anexoRepo.delete(anexo);
        }

        String titulo = conteudo.getTitulo();
        conteudoRepo.delete(conteudo);
        auditoria.registrar(usuarioId, "conteudo_excluido", "conteudo:" + id, titulo);
    }

    private void excluirDadosChecagem(Checagem checagem) {
        Long checagemId = checagem.getId();

        for (Evidencia evidencia : evidenciaRepo.findByChecagemId(checagemId)) {
            if (evidencia.getObjectKey() != null && !evidencia.getObjectKey().isBlank()) {
                try {
                    storageService.delete(evidencia.getObjectKey());
                } catch (Exception e) {
                    // Continua a exclusão mesmo se o arquivo já não existir no storage.
                }
            }
            evidenciaRepo.delete(evidencia);
        }

        investigacaoRepo.findByChecagemId(checagemId).ifPresent(investigacaoRepo::delete);

        for (Parecer parecer : parecerRepo.findAllByChecagem_Id(checagemId)) {
            relatorioRepo.findAllByParecer_Id(parecer.getId()).forEach(relatorioRepo::delete);
            revisaoRepo.deleteAll(revisaoRepo.findByParecer_Id(parecer.getId()));
            parecerRepo.delete(parecer);
        }

        historicoRepo.deleteAll(historicoRepo.findByChecagem_Id(checagemId));
        checagemRepo.delete(checagem);
    }

    private void requirePermissaoChecagem(Usuario usuario) {
        if (usuario.getTipoUsuario() == null || usuario.getTipoUsuario().getPermissoes() == null) {
            throw new IllegalArgumentException("Usuário não possui permissão para fluxo de checagem.");
        }
        boolean allowed = usuario.getTipoUsuario().getPermissoes().stream()
                .anyMatch(p -> "perform_analysis".equals(p.getNome()) || "view_analysis".equals(p.getNome()));
        if (!allowed) {
            throw new IllegalArgumentException("Usuário não possui permissão para fluxo de checagem.");
        }
    }

    private ConteudoSuspeito requireConteudo(Long id) {
        return conteudoRepo.findByIdAndTenantId(id, tenantScope.requireTenantId())
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + id));
    }

    private Usuario requireUsuario(Long id) {
        return usuarioRepo.findByIdAndTenant_Id(id, tenantScope.requireTenantId())
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado nesta agência: " + id));
    }

    private Checagem requireChecagemDoTenant(Long conteudoId) {
        ConteudoSuspeito conteudo = requireConteudo(conteudoId);
        return checagemRepo.findByConteudoId(conteudo.getId())
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));
    }
}
