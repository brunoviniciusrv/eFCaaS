package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.AnaliseIa;
import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ChecagemParticipante;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.AnaliseIaRepository;
import br.com.efcaas.api.repository.ChecagemParticipanteRepository;
import br.com.efcaas.api.repository.ChecagemRepository;
import br.com.efcaas.api.repository.ConteudoSuspeitoRepository;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.tenant.TenantContext;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IaAnaliseAsyncService {

    private final ConteudoSuspeitoRepository conteudoRepo;
    private final AnaliseIaRepository analiseIaRepo;
    private final ChecagemRepository checagemRepo;
    private final ChecagemParticipanteRepository participanteRepo;
    private final IaService iaService;
    private final NotificacaoService notificacaoService;

    @Async
    public void executarAnalise(Long conteudoId, Long tenantId, String tenantSlug) {
        try {
            if (tenantId != null) {
                TenantContext.set(tenantId, tenantSlug);
            }
            ConteudoSuspeito conteudo = conteudoRepo.findByIdAndTenantId(conteudoId, tenantId)
                    .orElseThrow();
            AnaliseIa analise = obterOuCriarAnaliseIa(conteudo);
            try {
                AnaliseIaDto iaDto = iaService.analisarConteudo(conteudo);
                aplicarAnaliseIa(analise, iaDto);
                analise.setStatusIa("concluida");
                analise.setFinalizadoEm(LocalDateTime.now());
                analise.setMensagemErro(null);
                analiseIaRepo.save(analise);
                notificarAssignees(conteudoId, conteudo.getTitulo());
            } catch (Exception e) {
                log.error("Falha na análise IA para conteudo {}", conteudoId, e);
                analise.setStatusIa("erro");
                analise.setFinalizadoEm(LocalDateTime.now());
                analise.setMensagemErro(e.getMessage());
                analiseIaRepo.save(analise);
            }
        } catch (Exception e) {
            log.error("Falha ao iniciar job IA para conteudo {}", conteudoId, e);
            marcarAnaliseErro(conteudoId, e.getMessage());
        } finally {
            TenantContext.clear();
        }
    }

    private void marcarAnaliseErro(Long conteudoId, String mensagem) {
        analiseIaRepo.findFirstByConteudo_IdOrderByIdDesc(conteudoId).ifPresent(analise -> {
            analise.setStatusIa("erro");
            analise.setFinalizadoEm(LocalDateTime.now());
            analise.setMensagemErro(mensagem);
            analiseIaRepo.save(analise);
        });
    }

    private void notificarAssignees(Long conteudoId, String titulo) {
        checagemRepo.findByConteudoId(conteudoId).ifPresent(checagem -> {
            List<ChecagemParticipante> ativos = participanteRepo.findByChecagem_IdAndAtivoTrue(checagem.getId());
            for (ChecagemParticipante p : ativos) {
                if (p.getUsuario() != null) {
                    notificacaoService.criar(
                            p.getUsuario().getId(),
                            "Análise de IA concluída",
                            "A análise de IA da notícia \"" + titulo + "\" foi finalizada.",
                            "ia_concluida",
                            "/analysis/" + conteudoId
                    );
                }
            }
            if (checagem.getChecador() != null && ativos.stream().noneMatch(p ->
                    p.getUsuario().getId().equals(checagem.getChecador().getId()))) {
                notificacaoService.criar(
                        checagem.getChecador().getId(),
                        "Análise de IA concluída",
                        "A análise de IA da notícia \"" + titulo + "\" foi finalizada.",
                        "ia_concluida",
                        "/analysis/" + conteudoId
                );
            }
        });
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
        analise.setAtributoWhat(dto.atributoWhat());
        analise.setAtributoWho(dto.atributoWho());
        analise.setAtributoWhere(dto.atributoWhere());
        analise.setAtributoWhen(dto.atributoWhen());
        analise.setKeywords(dto.keywords());
        analise.setPseudoLabel(dto.pseudoLabel());
        analise.setMisinformationFeatures(dto.misinformationFeatures());
        analise.setCertezaAlegacao(dto.certezaAlegacao());
        analise.setFaixaCertezaAlegacao(dto.faixaCertezaAlegacao());
        analise.setTopicMatchJson(br.com.efcaas.api.web.mapper.AnaliseIaTopicMatchCodec.serialize(dto.topicMatch()));
    }
}
