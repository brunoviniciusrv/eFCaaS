package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.AnaliseIa;
import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.domain.Evidencia;
import br.com.efcaas.api.domain.Investigacao;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.ConteudoSuspeitoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ConteudoSuspeitoMapper {

    private final ChecagemMapper checagemMapper;

    public ConteudoSuspeitoDto toDto(ConteudoSuspeito c,
                                     Checagem checagem,
                                     Parecer parecer,
                                     Investigacao investigacao,
                                     List<Evidencia> evidencias,
                                     AnaliseIa analiseIa) {
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
                analiseIa != null ? toAnaliseIaDto(analiseIa) : null
        );
    }

    public ConteudoSuspeitoDto toDtoSimples(ConteudoSuspeito c, Checagem checagem) {
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
                checagem != null ? checagemMapper.toDto(checagem, null, null) : null,
                null
        );
    }

    private AnaliseIaDto toAnaliseIaDto(AnaliseIa a) {
        return AnaliseIaDto.builder()
                .avaliacaoRisco(a.getAvaliacaoRisco())
                .textoAnalise(a.getTextoAnalise())
                .simulado(true)
                .build();
    }
}
