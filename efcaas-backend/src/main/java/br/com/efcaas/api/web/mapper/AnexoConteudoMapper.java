package br.com.efcaas.api.web.mapper;

import br.com.efcaas.api.config.ApiProperties;
import br.com.efcaas.api.domain.AnexoConteudo;
import br.com.efcaas.api.service.AnexoConteudoAccessTokenService;
import br.com.efcaas.api.web.dto.AnexoConteudoDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AnexoConteudoMapper {

    private final AnexoConteudoAccessTokenService accessTokenService;
    private final ApiProperties apiProperties;

    public AnexoConteudoDto toDto(AnexoConteudo anexo, Long conteudoId) {
        return new AnexoConteudoDto(
                String.valueOf(anexo.getId()),
                anexo.getTipo(),
                buildDownloadUrl(conteudoId, anexo.getId()),
                anexo.getNomeArquivo(),
                anexo.getContentType(),
                anexo.getTamanhoBytes(),
                anexo.getObjectKey()
        );
    }

    private String buildDownloadUrl(Long conteudoId, Long anexoId) {
        String base = apiProperties.normalizedPublicUrl();
        String token = accessTokenService.gerarToken(conteudoId, anexoId);
        return base + "/conteudos/" + conteudoId + "/anexos/" + anexoId + "/download?token=" + token;
    }
}
