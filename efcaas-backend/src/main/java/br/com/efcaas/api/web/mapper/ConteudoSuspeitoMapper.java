package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.AnaliseIa;
import br.com.efcaas.api.domain.AnexoConteudo;
import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoRecebidoMidia;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.domain.Evidencia;
import br.com.efcaas.api.domain.Investigacao;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.AnexoConteudoDto;
import br.com.efcaas.api.web.dto.ConteudoSuspeitoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ConteudoSuspeitoMapper {

    private final ChecagemMapper checagemMapper;
    private final AnexoConteudoMapper anexoConteudoMapper;

    public ConteudoSuspeitoDto toDto(ConteudoSuspeito c,
                                     Checagem checagem,
                                     Parecer parecer,
                                     Investigacao investigacao,
                                     List<Evidencia> evidencias,
                                     AnaliseIa analiseIa,
                                     List<AnexoConteudo> anexos) {
        return new ConteudoSuspeitoDto(
                String.valueOf(c.getId()),
                c.getTitulo(),
                c.getAlegacao(),
                c.getLink(),
                c.getFonte(),
                c.getDescricao(),
                c.getDataEntrada() != null ? c.getDataEntrada().toString() : null,
                c.getStatus(),
                c.getPrioridade(),
                checagem != null ? checagemMapper.toDto(checagem, parecer, investigacao, evidencias) : null,
                analiseIa != null ? toAnaliseIaDto(analiseIa) : null,
                mergeAnexos(anexos, List.of(), c.getId())
        );
    }

    public ConteudoSuspeitoDto toDto(ConteudoSuspeito c,
                                     Checagem checagem,
                                     Parecer parecer,
                                     Investigacao investigacao,
                                     List<Evidencia> evidencias,
                                     AnaliseIa analiseIa,
                                     List<AnexoConteudo> anexos,
                                     List<ConteudoRecebidoMidia> midiasRecebidas) {
        return new ConteudoSuspeitoDto(
                String.valueOf(c.getId()),
                c.getTitulo(),
                c.getAlegacao(),
                c.getLink(),
                c.getFonte(),
                c.getDescricao(),
                c.getDataEntrada() != null ? c.getDataEntrada().toString() : null,
                c.getStatus(),
                c.getPrioridade(),
                checagem != null ? checagemMapper.toDto(checagem, parecer, investigacao, evidencias) : null,
                analiseIa != null ? toAnaliseIaDto(analiseIa) : null,
                mergeAnexos(anexos, midiasRecebidas, c.getId())
        );
    }

    public ConteudoSuspeitoDto toDtoSimples(ConteudoSuspeito c, Checagem checagem, Parecer parecer, List<AnexoConteudo> anexos) {
        return toDtoSimples(c, checagem, parecer, anexos, List.of());
    }

    public ConteudoSuspeitoDto toDtoSimples(ConteudoSuspeito c, Checagem checagem, Parecer parecer, List<AnexoConteudo> anexos, List<ConteudoRecebidoMidia> midiasRecebidas) {
        return new ConteudoSuspeitoDto(
                String.valueOf(c.getId()),
                c.getTitulo(),
                c.getAlegacao(),
                c.getLink(),
                c.getFonte(),
                c.getDescricao(),
                c.getDataEntrada() != null ? c.getDataEntrada().toString() : null,
                c.getStatus(),
                c.getPrioridade(),
                checagem != null ? checagemMapper.toDto(checagem, parecer, null) : null,
                null,
                mergeAnexos(anexos, midiasRecebidas, c.getId())
        );
    }

    private List<AnexoConteudoDto> mergeAnexos(List<AnexoConteudo> anexos,
                                               List<ConteudoRecebidoMidia> midiasRecebidas,
                                               Long conteudoId) {
        List<AnexoConteudoDto> result = anexos != null
                ? anexos.stream().map(a -> anexoConteudoMapper.toDto(a, conteudoId)).toList()
                : Collections.emptyList();
        if (!result.isEmpty() || midiasRecebidas == null || midiasRecebidas.isEmpty()) {
            return result;
        }
        return midiasRecebidas.stream()
                .map(m -> new AnexoConteudoDto(
                        "recebido-" + m.getId(),
                        m.getTipo(),
                        m.getUrl(),
                        m.getTitulo(),
                        null,
                        null,
                        null))
                .toList();
    }

    public ConteudoSuspeitoDto toDtoSimples(ConteudoSuspeito c, Checagem checagem, List<AnexoConteudo> anexos) {
        return toDtoSimples(c, checagem, null, anexos);
    }

    public ConteudoSuspeitoDto toDtoSimples(ConteudoSuspeito c, Checagem checagem) {
        return toDtoSimples(c, checagem, Collections.emptyList());
    }

    private AnaliseIaDto toAnaliseIaDto(AnaliseIa a) {
        return AnaliseIaDto.builder()
                .avaliacaoRisco(a.getAvaliacaoRisco())
                .textoAnalise(a.getTextoAnalise())
                .simulado(a.isSimulado())
                .scoreInveracidade(a.getScoreInveracidade())
                .scoreFalsidade(a.getScoreDistorcao())
                .scoreDistorcaoMidia(a.getScoreForaContexto())
                .classificacaoOdio(a.getClassificacaoOdio())
                .classificacaoAntidemo(a.getClassificacaoAntidemo())
                .confiancaClassificacao(a.getConfiancaClassificacao())
                .categoriaFinal(a.getCategoriaFinal())
                .scoreRiscoIlicitude(a.getScoreRiscoIlicitude())
                .atributoWhat(a.getAtributoWhat())
                .atributoWho(a.getAtributoWho())
                .atributoWhere(a.getAtributoWhere())
                .atributoWhen(a.getAtributoWhen())
                .keywords(a.getKeywords())
                .pseudoLabel(a.getPseudoLabel())
                .misinformationFeatures(a.getMisinformationFeatures())
                .certezaAlegacao(a.getCertezaAlegacao())
                .faixaCertezaAlegacao(a.getFaixaCertezaAlegacao())
                .topicMatch(AnaliseIaTopicMatchCodec.deserialize(a.getTopicMatchJson()))
                .build();
    }
}
