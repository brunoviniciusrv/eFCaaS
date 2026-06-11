package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.Etiqueta;
import br.com.efcaas.api.domain.Evidencia;
import br.com.efcaas.api.domain.Investigacao;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.config.ApiProperties;
import br.com.efcaas.api.service.EvidenciaAccessTokenService;
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
    private final EvidenciaAccessTokenService accessTokenService;
    private final ApiProperties apiProperties;

    public ChecagemDto toDto(Checagem ch, Parecer parecer, Investigacao investigacao, List<Evidencia> evidencias) {
        return new ChecagemDto(
                str(ch.getId()),
                str(ch.getConteudo().getId()),
                ch.getCurador() != null ? str(ch.getCurador().getId()) : null,
                ch.getChecador() != null ? str(ch.getChecador().getId()) : null,
                ch.getBriefing(),
                ch.getStatus(),
                ch.getDataInicio() != null ? ch.getDataInicio().toString() : null,
                ch.getDataConclusao() != null ? ch.getDataConclusao().toString() : null,
                investigacao != null ? toInvestigacaoDto(investigacao) : null,
                parecer != null ? toParecerDto(parecer) : null,
                evidencias != null
                        ? evidencias.stream().map(ev -> toEvidenciaDto(ev, ch.getId())).toList()
                        : Collections.emptyList()
        );
    }

    /** Sobrecarga de compatibilidade para chamadas sem investigacao (ex.: listagens). */
    public ChecagemDto toDto(Checagem ch, Parecer parecer, List<Evidencia> evidencias) {
        return toDto(ch, parecer, null, evidencias);
    }

    public InvestigacaoDto toInvestigacaoDto(Investigacao inv) {
        return new InvestigacaoDto(
                str(inv.getId()),
                inv.getResumoMetodologia(),
                parseStringList(inv.getPerguntas()),
                parseStringList(inv.getFontes()),
                inv.isInverificavel(),
                inv.getContatoRealizado(),
                inv.getRespostaAutor(),
                inv.getJustificativaSemContato()
        );
    }

    public ParecerDto toParecerDto(Parecer p) {
        return new ParecerDto(
                str(p.getId()),
                p.getTextoParecer(),
                p.getEtiqueta() != null ? toEtiquetaDto(p.getEtiqueta()) : null
        );
    }

    public EvidenciaDto toEvidenciaDto(Evidencia e, Long checagemId) {
        String urlAcesso = e.getObjectKey() != null && !e.getObjectKey().isBlank()
                ? buildDownloadUrl(checagemId, e.getId())
                : e.getLinkArquivo();
        return new EvidenciaDto(
                str(e.getId()),
                e.getTipo(),
                urlAcesso,
                e.getDescricao(),
                e.getNomeArquivo(),
                e.getTamanhoBytes(),
                e.getContentType(),
                e.getObjectKey()
        );
    }

    private String buildDownloadUrl(Long checagemId, Long evidenciaId) {
        String base = apiProperties.publicUrl().replaceAll("/$", "");
        String token = accessTokenService.gerarToken(checagemId, evidenciaId);
        return base + "/checagens/" + checagemId + "/evidencias/" + evidenciaId + "/download?token=" + token;
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

    private static String str(Long id) {
        return id != null ? String.valueOf(id) : null;
    }
}
