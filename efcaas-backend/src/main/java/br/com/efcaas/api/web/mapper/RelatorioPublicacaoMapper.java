package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.RelatorioPublicacao;
import br.com.efcaas.api.web.dto.EditorialCommentDto;
import br.com.efcaas.api.web.dto.RelatorioPublicacaoDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RelatorioPublicacaoMapper {

    private final ObjectMapper objectMapper;

    public RelatorioPublicacaoDto toDto(RelatorioPublicacao rel) {
        Long conteudoId = rel.getParecer().getChecagem().getConteudo().getId();
        return new RelatorioPublicacaoDto(
                str(rel.getId()),
                str(conteudoId),
                rel.getTitulo(),
                rel.getResumo(),
                rel.getCorpoTexto(),
                rel.getStatusPublicacao(),
                rel.getTemplate(),
                str(rel.getEditor().getId()),
                rel.getDataCriacao() != null ? rel.getDataCriacao().toString() : null,
                rel.getDataAtualizacao() != null ? rel.getDataAtualizacao().toString() : null,
                parseComments(rel.getComentariosJson())
        );
    }

    public String toJsonComments(List<EditorialCommentDto> comments) {
        if (comments == null) return null;
        try {
            return objectMapper.writeValueAsString(comments);
        } catch (Exception e) {
            return null;
        }
    }

    private List<EditorialCommentDto> parseComments(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static String str(Long id) {
        return id != null ? String.valueOf(id) : null;
    }
}
