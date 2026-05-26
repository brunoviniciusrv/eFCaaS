package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.Etiqueta;
import br.com.efcaas.api.domain.Evidencia;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.web.dto.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ChecagemMapper {

    private final ObjectMapper objectMapper;

    public ChecagemDto toDto(Checagem ch, Parecer parecer, List<Evidencia> evidencias) {
        return new ChecagemDto(
                str(ch.getId()),
                str(ch.getConteudo().getId()),
                ch.getCurador() != null ? str(ch.getCurador().getId()) : null,
                ch.getChecador() != null ? str(ch.getChecador().getId()) : null,
                ch.getBriefing(),
                ch.getStatus(),
                ch.getDataInicio() != null ? ch.getDataInicio().toString() : null,
                ch.getDataConclusao() != null ? ch.getDataConclusao().toString() : null,
                parecer != null ? toParecerDto(parecer) : null,
                evidencias != null ? evidencias.stream().map(this::toEvidenciaDto).toList() : Collections.emptyList()
        );
    }

    public ParecerDto toParecerDto(Parecer p) {
        return new ParecerDto(
                str(p.getId()),
                p.getResumo(),
                parseStringList(p.getPerguntas()),
                parseStringList(p.getFontes()),
                p.isInverificavel(),
                parseContatoAutor(p.getContatoAutor()),
                p.getRespostaAutor(),
                p.getTextoParecer(),
                p.getEtiqueta() != null ? toEtiquetaDto(p.getEtiqueta()) : null
        );
    }

    public EvidenciaDto toEvidenciaDto(Evidencia e) {
        return new EvidenciaDto(
                str(e.getId()),
                e.getTipo(),
                e.getLinkArquivo(),
                e.getDescricao()
        );
    }

    public EtiquetaDto toEtiquetaDto(Etiqueta e) {
        return new EtiquetaDto(str(e.getId()), e.getNome(), e.getDescricao(), e.getCor());
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private ContatoAutorDto parseContatoAutor(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, ContatoAutorDto.class);
        } catch (Exception e) {
            return null;
        }
    }

    private static String str(Long id) {
        return id != null ? String.valueOf(id) : null;
    }
}
