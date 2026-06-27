package br.com.efcaas.api.service;

import br.com.efcaas.api.config.GuaiaHubProperties;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.AnexoConteudoRepository;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationMediaRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationMediaResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextClassifyResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Implementação do serviço de IA usando a API Guaia IA Hub.
 * Requer {@code GUAIA_USERNAME} configurado; caso contrário, lança exceção.
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class IaRealService implements IaService {

    private static final int PRESIGNED_EXPIRY_MINUTES = 60;

    private final GuaiaHubClient guaiaClient;
    private final GuaiaHubProperties props;
    private final AnexoConteudoRepository anexoRepo;
    private final StorageService storageService;

    private void requireConfigured() {
        if (props.username() == null || props.username().isBlank()) {
            throw new IllegalStateException(
                    "Análise de IA indisponível: configure GUAIA_USERNAME e GUAIA_PASSWORD.");
        }
    }

    @Override
    public AnaliseIaDto analisarConteudo(ConteudoSuspeito conteudo) {
        requireConfigured();
        try {
            return analisarComGuaia(conteudo);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Falha na análise Guaia para conteúdo id={}: {}", conteudo.getId(), e.getMessage(), e);
            throw new IllegalStateException("Falha na análise IA: " + e.getMessage(), e);
        }
    }

    private AnaliseIaDto analisarComGuaia(ConteudoSuspeito conteudo) {
        String textoAnalise = buildTextoPrincipal(conteudo);
        List<GuaiaPublicationMediaRequest> medias = buildMediaRequests(conteudo.getId());

        GuaiaPublicationRequest pubRequest = new GuaiaPublicationRequest(
                Math.toIntExact(conteudo.getId()),
                nullSafe(props.tenantId()),
                nullSafe(props.tenantSlug()),
                nullSafe(props.institutionId()),
                nullSafe(props.institutionSlug()),
                nullSafe(props.institutionName()),
                Math.toIntExact(conteudo.getId()),
                textoAnalise,
                conteudo.getAlegacao(),
                conteudo.getDataEntrada() != null ? conteudo.getDataEntrada().toString() : null,
                null,
                conteudo.getFonte(),
                conteudo.getLink(),
                List.of(),
                List.of(),
                List.of(),
                medias
        );

        log.info("Iniciando análise Guaia para conteúdo id={} com {} mídias",
                conteudo.getId(), medias.size());

        GuaiaPublicationResponse pubResp = guaiaClient.processarPublicacao(pubRequest);
        GuaiaTextClassifyResponse classifyResp = guaiaClient.classificarTexto(textoAnalise);

        return mapToDto(conteudo, pubResp, classifyResp, !medias.isEmpty());
    }

    private String buildTextoPrincipal(ConteudoSuspeito conteudo) {
        StringBuilder sb = new StringBuilder();
        if (conteudo.getTitulo() != null) sb.append(conteudo.getTitulo()).append("\n\n");
        if (conteudo.getDescricao() != null) sb.append(conteudo.getDescricao()).append("\n\n");
        if (conteudo.getAlegacao() != null) sb.append(conteudo.getAlegacao());
        String result = sb.toString().trim();
        return result.isBlank() ? "Conteúdo sem texto disponível." : result;
    }

    private List<GuaiaPublicationMediaRequest> buildMediaRequests(Long conteudoId) {
        List<GuaiaPublicationMediaRequest> medias = new ArrayList<>();
        AtomicInteger counter = new AtomicInteger(1);

        anexoRepo.findByConteudoId(conteudoId).forEach(anexo -> {
            int mediaType = resolveMediaType(anexo.getContentType(), anexo.getTipo());
            if (mediaType == 0) return;

            String presignedUrl;
            try {
                presignedUrl = storageService.generatePresignedUrl(
                        anexo.getObjectKey(), PRESIGNED_EXPIRY_MINUTES);
            } catch (Exception e) {
                log.warn("Não foi possível gerar URL pré-assinada para anexo id={}: {}",
                        anexo.getId(), e.getMessage());
                return;
            }

            String filename = anexo.getNomeArquivo() != null ? anexo.getNomeArquivo() : anexo.getObjectKey();
            String ext = extractExtension(filename);
            String mediaTypeDesc = switch (mediaType) {
                case 2 -> "imagem";
                case 3 -> "audio";
                case 4 -> "video";
                default -> "desconhecido";
            };

            medias.add(new GuaiaPublicationMediaRequest(
                    counter.getAndIncrement(),
                    filename,
                    ext,
                    mediaType,
                    mediaTypeDesc,
                    presignedUrl,
                    anexo.getContentType(),
                    List.of(),
                    List.of(),
                    true
            ));
        });

        return medias;
    }

    private int resolveMediaType(String contentType, String tipo) {
        if (contentType != null) {
            if (contentType.startsWith("image/")) return 2;
            if (contentType.startsWith("audio/")) return 3;
            if (contentType.startsWith("video/")) return 4;
        }
        if (tipo != null) {
            return switch (tipo.toLowerCase()) {
                case "image" -> 2;
                case "audio" -> 3;
                case "video" -> 4;
                default -> 0;
            };
        }
        return 0;
    }

    private String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }

    AnaliseIaDto mapToDto(ConteudoSuspeito conteudo,
                          GuaiaPublicationResponse pub,
                          GuaiaTextClassifyResponse classify,
                          boolean hadMedias) {

        GuaiaTextResponse texto = pub.resultadoTexto();

        double missinformationPotential = pub.missinformationPotential() != null
                ? pub.missinformationPotential() : 0.0;
        double fakeScore = texto != null ? texto.fakeScore() : 0.0;
        Double avgDistortion = hadMedias ? averageDistortion(pub.resultadosMidias()) : null;

        BigDecimal scoreInveracidade = pct(missinformationPotential);
        BigDecimal scoreFalsidade = pct(fakeScore);
        BigDecimal scoreDistorcaoMidia = avgDistortion != null ? pct(avgDistortion) : null;

        double confianca = classify.confianca();
        double riscoPercentual = classify.riscoIlicitude() != null
                ? classify.riscoIlicitude().riscoPercentual() : 0.0;

        String textoAnalise = firstNonBlank(pub.detailedAnalysisText(), pub.explanationText());
        if (textoAnalise == null) {
            textoAnalise = "Análise concluída pela Guaia IA Hub.";
        }

        String atributoWhat = firstNonBlank(pub.attributeWhat(), texto != null ? texto.what() : null);
        String atributoWho = firstNonBlank(pub.attributeWho(), texto != null ? texto.who() : null);
        String atributoWhere = firstNonBlank(pub.attributeWhere(), texto != null ? texto.where() : null);
        String atributoWhen = firstNonBlank(pub.attributeWhen(), texto != null ? texto.when() : null);
        String keywords = texto != null ? texto.keywords() : null;
        String pseudoLabel = texto != null ? texto.pseudoLabel() : null;
        String misinformationFeatures = texto != null ? texto.misinformationFeatures() : null;
        List<String> topicMatch = texto != null && texto.topicMatch() != null
                ? texto.topicMatch() : List.of();

        BigDecimal certezaAlegacao = null;
        String faixaCertezaAlegacao = null;
        if (pub.resultadoAlegacaoTexto() != null) {
            certezaAlegacao = pct(pub.resultadoAlegacaoTexto().certaintyScore());
            faixaCertezaAlegacao = pub.resultadoAlegacaoTexto().certaintyBand();
        }

        String avaliacaoRisco = deriveAvaliacaoRisco(missinformationPotential);

        log.info("Análise Guaia concluída — conteúdo id={}: potencialDesinformacao={}%, falsidade={}%",
                conteudo.getId(), scoreInveracidade, scoreFalsidade);

        return AnaliseIaDto.builder()
                .avaliacaoRisco(avaliacaoRisco)
                .textoAnalise(textoAnalise)
                .simulado(false)
                .scoreInveracidade(scoreInveracidade)
                .scoreFalsidade(scoreFalsidade)
                .scoreDistorcaoMidia(scoreDistorcaoMidia)
                .classificacaoOdio(classify.classificacaoOdio())
                .classificacaoAntidemo(classify.classificacaoAntidemocratica())
                .confiancaClassificacao(pct(confianca))
                .categoriaFinal(classify.categoriaFinal())
                .scoreRiscoIlicitude(BigDecimal.valueOf(riscoPercentual).setScale(2, RoundingMode.HALF_UP))
                .atributoWhat(atributoWhat)
                .atributoWho(atributoWho)
                .atributoWhere(atributoWhere)
                .atributoWhen(atributoWhen)
                .keywords(keywords)
                .pseudoLabel(pseudoLabel)
                .misinformationFeatures(misinformationFeatures)
                .certezaAlegacao(certezaAlegacao)
                .faixaCertezaAlegacao(faixaCertezaAlegacao)
                .topicMatch(topicMatch)
                .build();
    }

    private double averageDistortion(List<GuaiaPublicationMediaResponse> midias) {
        if (midias == null || midias.isEmpty()) return 0.0;
        return midias.stream()
                .filter(GuaiaPublicationMediaResponse::sucesso)
                .mapToDouble(m -> extractDistortionLevel(m.resultado()))
                .average()
                .orElse(0.0);
    }

    @SuppressWarnings("unchecked")
    private double extractDistortionLevel(Map<String, Object> resultado) {
        if (resultado == null) return 0.0;
        Object val = resultado.get("distortion_level");
        if (val instanceof Number n) return n.doubleValue();
        return 0.0;
    }

    private BigDecimal pct(double value) {
        double clamped = Math.max(0.0, Math.min(1.0, value));
        return BigDecimal.valueOf(Math.round(clamped * 100));
    }

    private String deriveAvaliacaoRisco(double missinformationPotential) {
        if (missinformationPotential >= 0.80) return "crítico";
        if (missinformationPotential >= 0.60) return "alto";
        if (missinformationPotential >= 0.30) return "moderado";
        return "baixo";
    }

    private String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return null;
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
