package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.*;
import br.com.efcaas.api.repository.*;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.web.dto.*;
import br.com.efcaas.api.web.mapper.ChecagemMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ChecagemService {

    private final ChecagemRepository checagemRepo;
    private final ParecerRepository parecerRepo;
    private final InvestigacaoRepository investigacaoRepo;
    private final EvidenciaRepository evidenciaRepo;
    private final EtiquetaRepository etiquetaRepo;
    private final ChecagemMapper mapper;
    private final AuditoriaService auditoria;
    private final IaService iaService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ChecagemDto iniciar(Long checagemId, Long checadorId) {
        Checagem ch = buscarChecagem(checagemId);
        ch.setStatus("em_analise");
        ch.setDataInicio(LocalDateTime.now());
        checagemRepo.save(ch);
        auditoria.registrar(checadorId, "checagem_iniciada", "checagem:" + checagemId, null);
        return toDto(ch);
    }

    @Transactional(readOnly = true)
    public ChecagemDto obterDetalhe(Long checagemId) {
        return toDto(buscarChecagem(checagemId));
    }

    @Transactional
    public InvestigacaoDto salvarInvestigacao(Long checagemId, SalvarInvestigacaoRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Investigacao inv = investigacaoRepo.findByChecagemId(checagemId).orElse(new Investigacao());
        inv.setChecagem(ch);
        inv.setResumoMetodologia(req.resumo());
        inv.setInverificavel(req.inverificavel());
        inv.setAtualizadoEm(LocalDateTime.now());

        if (req.perguntas() != null) {
            inv.setPerguntas(toJson(req.perguntas()));
        }
        if (req.fontes() != null) {
            inv.setFontes(toJson(req.fontes()));
        }
        if (req.contatoAutor() != null) {
            inv.setContatoRealizado(req.contatoAutor().hadContact());
            inv.setRespostaAutor(req.contatoAutor().response());
            inv.setJustificativaSemContato(req.contatoAutor().justificacao());
        }

        investigacaoRepo.save(inv);
        auditoria.registrar(usuarioId, "investigacao_salva", "checagem:" + checagemId, null);
        return mapper.toInvestigacaoDto(inv);
    }

    @Transactional(readOnly = true)
    public ParecerDto obterParecer(Long checagemId) {
        buscarChecagem(checagemId);
        Parecer parecer = parecerRepo.findByChecagemId(checagemId)
                .orElseThrow(() -> new NoSuchElementException("Parecer não encontrado para checagem: " + checagemId));
        return mapper.toParecerDto(parecer);
    }

    @Transactional
    public ParecerDto salvarParecer(Long checagemId, SalvarParecerRequest req, Long usuarioId) {
        buscarChecagem(checagemId);
        Parecer parecer = parecerRepo.findByChecagemId(checagemId).orElse(new Parecer());
        parecer.setChecagem(checagemRepo.getReferenceById(checagemId));
        parecer.setTextoParecer(req.textoParecer());
        parecerRepo.save(parecer);
        auditoria.registrar(usuarioId, "parecer_salvo", "checagem:" + checagemId, null);
        return mapper.toParecerDto(parecer);
    }

    @Transactional
    public ChecagemDto finalizarParecer(Long checagemId, FinalizarParecerRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Etiqueta etiqueta = etiquetaRepo.findById(req.etiquetaId())
                .orElseThrow(() -> new NoSuchElementException("Etiqueta não encontrada: " + req.etiquetaId()));

        Parecer parecer = parecerRepo.findByChecagemId(checagemId).orElse(new Parecer());
        parecer.setChecagem(ch);
        parecer.setTextoParecer(req.textoParecer());
        parecer.setEtiqueta(etiqueta);
        parecerRepo.save(parecer);

        ch.setStatus("aguardando_revisao");
        checagemRepo.save(ch);

        ConteudoSuspeito conteudo = ch.getConteudo();
        conteudo.setStatus("final_review");
        auditoria.registrar(usuarioId, "parecer_finalizado", "checagem:" + checagemId,
                "etiqueta:" + etiqueta.getNome());
        return toDto(ch);
    }

    @Transactional(readOnly = true)
    public List<EvidenciaDto> listarEvidencias(Long checagemId) {
        buscarChecagem(checagemId);
        return evidenciaRepo.findByChecagemId(checagemId)
                .stream().map(mapper::toEvidenciaDto).toList();
    }

    @Transactional
    public EvidenciaDto adicionarEvidencia(Long checagemId, AdicionarEvidenciaRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Evidencia e = new Evidencia();
        e.setChecagem(ch);
        e.setTipo(req.tipo());
        e.setLinkArquivo(req.linkArquivo());
        e.setDescricao(req.descricao());
        evidenciaRepo.save(e);
        auditoria.registrar(usuarioId, "evidencia_adicionada", "checagem:" + checagemId, req.tipo());
        return mapper.toEvidenciaDto(e);
    }

    @Transactional
    public void removerEvidencia(Long checagemId, Long evidenciaId, Long usuarioId) {
        buscarChecagem(checagemId);
        Evidencia e = evidenciaRepo.findByIdAndChecagemId(evidenciaId, checagemId)
                .orElseThrow(() -> new NoSuchElementException("Evidência não encontrada: " + evidenciaId));
        evidenciaRepo.delete(e);
        auditoria.registrar(usuarioId, "evidencia_removida", "checagem:" + checagemId, "evidencia:" + evidenciaId);
    }

    @Transactional(readOnly = true)
    public RascunhoIaResponse gerarRascunho(Long checagemId) {
        Checagem ch = buscarChecagem(checagemId);
        String rascunho = iaService.gerarRascunhoParecer(ch);
        return new RascunhoIaResponse(rascunho, true);
    }

    @Transactional(readOnly = true)
    public RascunhoIaResponse revisarParecer(Long checagemId) {
        buscarChecagem(checagemId);
        Parecer parecer = parecerRepo.findByChecagemId(checagemId).orElse(null);
        String texto = parecer != null ? parecer.getTextoParecer() : "";
        String revisao = iaService.revisarParecer(texto != null ? texto : "");
        return new RascunhoIaResponse(revisao, true);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Checagem buscarChecagem(Long id) {
        return checagemRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada: " + id));
    }

    private ChecagemDto toDto(Checagem ch) {
        Parecer parecer = parecerRepo.findByChecagemId(ch.getId()).orElse(null);
        Investigacao investigacao = investigacaoRepo.findByChecagemId(ch.getId()).orElse(null);
        List<Evidencia> evidencias = evidenciaRepo.findByChecagemId(ch.getId());
        return mapper.toDto(ch, parecer, investigacao, evidencias);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }
}
