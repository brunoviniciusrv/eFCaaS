package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.domain.RelatorioPublicacao;
import br.com.efcaas.api.repository.ChecagemRepository;
import br.com.efcaas.api.repository.ParecerRepository;
import br.com.efcaas.api.repository.RelatorioPublicacaoRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.AtualizarStatusRelatorioRequest;
import br.com.efcaas.api.web.dto.RelatorioPublicacaoDto;
import br.com.efcaas.api.web.dto.SalvarRelatorioPublicacaoRequest;
import br.com.efcaas.api.web.mapper.RelatorioPublicacaoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class RelatorioPublicacaoService {

    private final RelatorioPublicacaoRepository relatorioRepo;
    private final ChecagemRepository checagemRepo;
    private final ParecerRepository parecerRepo;
    private final UsuarioRepository usuarioRepo;
    private final RelatorioPublicacaoMapper mapper;
    private final AuditoriaService auditoria;
    private final TenantScope tenantScope;

    @Transactional(readOnly = true)
    public List<RelatorioPublicacaoDto> listar() {
        return relatorioRepo.findAllComDetalhes(tenantScope.requireTenantId()).stream()
                .map(mapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RelatorioPublicacaoDto obterPorConteudo(Long conteudoId) {
        RelatorioPublicacao rel = relatorioRepo
                .findDetalhadosByConteudoId(conteudoId, tenantScope.requireTenantId())
                .stream().findFirst()
                .orElseThrow(() -> new NoSuchElementException(
                        "Relatório de publicação não encontrado para conteúdo: " + conteudoId));
        return mapper.toDto(rel);
    }

    @Transactional
    public RelatorioPublicacaoDto salvar(Long conteudoId, SalvarRelatorioPublicacaoRequest req, Long editorId) {
        Long tenantId = tenantScope.requireTenantId();
        Checagem checagem = checagemRepo.findByConteudoIdAndTenantId(conteudoId, tenantId)
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada para conteúdo: " + conteudoId));
        Parecer parecer = parecerRepo.findByChecagemId(checagem.getId())
                .orElseThrow(() -> new NoSuchElementException("Parecer não encontrado para conteúdo: " + conteudoId));

        RelatorioPublicacao rel = relatorioRepo.findByParecerId(parecer.getId()).orElseGet(() -> {
            RelatorioPublicacao novo = new RelatorioPublicacao();
            novo.setParecer(parecer);
            novo.setEditor(usuarioRepo.getReferenceById(editorId));
            novo.setDataCriacao(LocalDateTime.now());
            novo.setTenantId(checagem.getTenantId());
            return novo;
        });

        rel.setTitulo(req.titulo());
        String corpoTexto = req.corpoTexto();
        if (corpoTexto == null || corpoTexto.isBlank()) {
            corpoTexto = parecer.getTextoParecer();
        }
        rel.setCorpoTexto(corpoTexto);
        rel.setResumo(req.resumo());
        rel.setStatusPublicacao(req.statusPublicacao());
        rel.setTemplate(req.template() != null && !req.template().isBlank() ? req.template() : "complete");
        rel.setComentariosJson(mapper.toJsonComments(req.comentarios()));
        rel.setDataAtualizacao(LocalDateTime.now());

        if ("published".equals(req.statusPublicacao()) && rel.getDataPublicacao() == null) {
            rel.setDataPublicacao(LocalDateTime.now());
        }

        relatorioRepo.save(rel);
        auditoria.registrar(editorId, "relatorio_publicacao_salvo", "conteudo:" + conteudoId, req.statusPublicacao());
        return mapper.toDto(relatorioRepo.findDetalhadosByConteudoId(conteudoId, tenantScope.requireTenantId())
                .stream().findFirst().orElseThrow());
    }

    @Transactional
    public RelatorioPublicacaoDto atualizarStatus(Long relatorioId, AtualizarStatusRelatorioRequest req, Long usuarioId) {
        RelatorioPublicacao rel = buscarRelatorio(relatorioId);
        rel.setStatusPublicacao(req.statusPublicacao());
        rel.setDataAtualizacao(LocalDateTime.now());

        if ("published".equals(req.statusPublicacao()) && rel.getDataPublicacao() == null) {
            rel.setDataPublicacao(LocalDateTime.now());
        }

        relatorioRepo.save(rel);
        Long conteudoId = rel.getParecer().getChecagem().getConteudo().getId();
        auditoria.registrar(usuarioId, "relatorio_publicacao_status", "conteudo:" + conteudoId, req.statusPublicacao());
        return mapper.toDto(relatorioRepo.findDetalhadoById(relatorioId, tenantScope.requireTenantId()).orElseThrow());
    }

    @Transactional
    public void remover(Long relatorioId, Long usuarioId) {
        RelatorioPublicacao rel = buscarRelatorio(relatorioId);
        Long conteudoId = rel.getParecer().getChecagem().getConteudo().getId();
        relatorioRepo.delete(rel);
        auditoria.registrar(usuarioId, "relatorio_publicacao_removido", "conteudo:" + conteudoId, null);
    }

    private RelatorioPublicacao buscarRelatorio(Long id) {
        return relatorioRepo.findDetalhadoById(id, tenantScope.requireTenantId())
                .orElseThrow(() -> new NoSuchElementException("Relatório de publicação não encontrado: " + id));
    }
}
