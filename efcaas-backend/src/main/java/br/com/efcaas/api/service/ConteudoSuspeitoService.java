package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.*;
import br.com.efcaas.api.repository.*;
import br.com.efcaas.api.repository.RevisaoRepository;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.web.dto.*;
import br.com.efcaas.api.web.mapper.ChecagemMapper;
import br.com.efcaas.api.web.mapper.ConteudoSuspeitoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConteudoSuspeitoService {

    private final ConteudoSuspeitoRepository conteudoRepo;
    private final ChecagemRepository checagemRepo;
    private final ParecerRepository parecerRepo;
    private final InvestigacaoRepository investigacaoRepo;
    private final EvidenciaRepository evidenciaRepo;
    private final AnexoConteudoRepository anexoRepo;
    private final AnaliseIaRepository analiseIaRepo;
    private final UsuarioRepository usuarioRepo;
    private final HistoricoAtribuicaoRepository historicoRepo;
    private final RevisaoRepository revisaoRepo;
    private final ConteudoSuspeitoMapper mapper;
    private final ChecagemMapper checagemMapper;
    private final AuditoriaService auditoria;
    private final IaService iaService;

    @Transactional(readOnly = true)
    public List<ConteudoSuspeitoDto> listar(String status, String prioridade, Long checadorId) {
        List<ConteudoSuspeito> conteudos = conteudoRepo.findByFilters(status, prioridade);

        if (checadorId != null) {
            Set<Long> ids = checagemRepo.findByChecadorId(checadorId)
                    .stream()
                    .map(c -> c.getConteudo().getId())
                    .collect(Collectors.toSet());
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
                    return mapper.toDtoSimples(c, ch, parecer, anexos);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ConteudoSuspeitoDto obterDetalhe(Long id) {
        ConteudoSuspeito c = conteudoRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + id));
        Checagem ch = checagemRepo.findByConteudoId(id).orElse(null);
        Parecer parecer = ch != null ? parecerRepo.findByChecagemId(ch.getId()).orElse(null) : null;
        Investigacao investigacao = ch != null
                ? investigacaoRepo.findByChecagemId(ch.getId()).orElse(null)
                : null;
        List<Evidencia> evidencias = ch != null ? evidenciaRepo.findByChecagemId(ch.getId()) : List.of();
        List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(id);
        AnaliseIa analiseIa = analiseIaRepo.findByConteudoId(id).orElse(null);
        return mapper.toDto(c, ch, parecer, investigacao, evidencias, analiseIa, anexos);
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
        conteudoRepo.save(c);

        auditoria.registrar(curadorId, "conteudo_criado", "conteudo:" + c.getId(), req.titulo());
        return mapper.toDtoSimples(c, null, List.of());
    }

    @Transactional
    public ConteudoSuspeitoDto atualizar(Long id, AtualizarConteudoRequest req, Long usuarioId) {
        ConteudoSuspeito c = conteudoRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + id));
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
        ConteudoSuspeito c = conteudoRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + id));
        c.setStatus(novoStatus);
        conteudoRepo.save(c);
        Checagem ch = checagemRepo.findByConteudoId(id).orElse(null);
        List<AnexoConteudo> anexos = anexoRepo.findByConteudoId(id);
        auditoria.registrar(usuarioId, "status_atualizado", "conteudo:" + id, novoStatus);
        return mapper.toDtoSimples(c, ch, anexos);
    }

    @Transactional
    public ChecagemDto atribuir(Long conteudoId, AtribuirChecagemRequest req, Long curadorId) {
        ConteudoSuspeito conteudo = conteudoRepo.findById(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("ConteudoSuspeito não encontrado: " + conteudoId));

        Usuario checador = usuarioRepo.findById(req.checadorId())
                .orElseThrow(() -> new NoSuchElementException("Checador não encontrado: " + req.checadorId()));

        Usuario curador = usuarioRepo.findById(curadorId)
                .orElseThrow(() -> new NoSuchElementException("Curador não encontrado: " + curadorId));

        Checagem checagem = checagemRepo.findByConteudoId(conteudoId).orElse(new Checagem());
        checagem.setConteudo(conteudo);
        checagem.setCurador(curador);
        checagem.setChecador(checador);
        checagem.setBriefing(req.briefing());
        checagem.setStatus("aberta");
        checagemRepo.save(checagem);

        conteudo.setStatus("in_progress");
        conteudo.setResponsavel(checador);
        conteudoRepo.save(conteudo);

        // Stub IA
        AnaliseIa analise = analiseIaRepo.findByConteudoId(conteudoId).orElse(new AnaliseIa());
        if (analise.getId() == null) {
            AnaliseIaDto iaDto = iaService.analisarConteudo(conteudo);
            analise.setConteudo(conteudo);
            analise.setAvaliacaoRisco(iaDto.avaliacaoRisco());
            analise.setTextoAnalise(iaDto.textoAnalise());
            analiseIaRepo.save(analise);
        }

        historicoRepo.save(new HistoricoAtribuicao(checagem, checador, curador, "assigned", req.briefing()));
        auditoria.registrar(curadorId, "checagem_atribuida",
                "checagem:" + checagem.getId(), "checador:" + checador.getNome());

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
    public void reabrir(Long conteudoId, Long usuarioId, String justificativa) {
        Checagem checagem = checagemRepo.findByConteudoId(conteudoId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteudo: " + conteudoId));

        checagem.setStatus("retificacao");
        checagemRepo.save(checagem);

        ConteudoSuspeito conteudo = checagem.getConteudo();
        conteudo.setStatus("to_rectify");
        conteudoRepo.save(conteudo);

        Usuario usuario = usuarioRepo.findById(usuarioId).orElse(null);
        if (checagem.getChecador() != null) {
            historicoRepo.save(new HistoricoAtribuicao(
                    checagem, checagem.getChecador(), usuario, "reopened", justificativa));
        }

        auditoria.registrar(usuarioId, "conteudo_reaberto", "conteudo:" + conteudoId, justificativa);
    }
}
