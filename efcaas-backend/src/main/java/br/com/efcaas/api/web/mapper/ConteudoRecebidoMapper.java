package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.ConteudoRecebido;
import br.com.efcaas.api.domain.ConteudoRecebidoMidia;
import br.com.efcaas.api.web.dto.ConteudoRecebidoDto;
import br.com.efcaas.api.web.dto.ConteudoRecebidoMidiaDto;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ConteudoRecebidoMapper {

    public ConteudoRecebidoDto toDto(ConteudoRecebido entity) {
        List<ConteudoRecebidoMidiaDto> midias = entity.getMidias() == null
                ? List.of()
                : entity.getMidias().stream().map(this::toMidiaDto).toList();

        return new ConteudoRecebidoDto(
                entity.getId(),
                entity.getTitulo(),
                entity.getConteudo(),
                entity.getResumo(),
                entity.getTipoFonte(),
                entity.getNomeRemetente(),
                entity.getEnderecoRemetente(),
                entity.getLinkOriginal(),
                entity.getIdMensagemExterna(),
                entity.getNotasInternas(),
                entity.getStatus(),
                entity.getRecebidoEm(),
                entity.getConteudoTriagem() != null ? entity.getConteudoTriagem().getId() : null,
                midias
        );
    }

    private ConteudoRecebidoMidiaDto toMidiaDto(ConteudoRecebidoMidia midia) {
        return new ConteudoRecebidoMidiaDto(
                midia.getId(),
                midia.getTipo(),
                midia.getUrl(),
                midia.getTitulo()
        );
    }
}
