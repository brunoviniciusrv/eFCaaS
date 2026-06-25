package br.com.efcaas.api.service;

import br.com.efcaas.api.config.GuaiaHubProperties;
import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.repository.AnexoConteudoRepository;
import br.com.efcaas.api.stub.IaService;
import br.com.efcaas.api.stub.IaStubService;
import br.com.efcaas.api.web.dto.AnaliseIaDto;
import br.com.efcaas.api.web.dto.SugestaoTituloDto;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationMediaRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationMediaResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationRequest;
import br.com.efcaas.api.web.dto.guaia.GuaiaPublicationResponse;
import br.com.efcaas.api.web.dto.guaia.GuaiaTextClassifyResponse;
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
 * Implementação real do serviço de IA usando a API Guaia IA Hub.
 * Quando {@code GUAIA_USERNAME} não estiver configurado, delega para {@link IaStubService}.
 *
 * <p>Endpoints utilizados:
 * <ul>
 *   <li>{@code POST /ia/publication/v1} — Eixo Desinformação + análise semântica</li>
 *   <li>{@code POST /ia/text/classify/v1} — Eixo Ilicitudes</li>
 * </ul>
 */
@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class IaRealService implements IaService {

    private static final int PRESIGNED_EXPIRY_MINUTES = 60;

    private final IaStubService stub;
    private final GuaiaHubClient guaiaClient;
    private final GuaiaHubProperties props;
    private final AnexoConteudoRepository anexoRepo;
    private final StorageService storageService;

    private boolean isConfigured() {
        return props.username() != null && !props.username().isBlank();
    }

    @Override
    public String gerarRascunhoParecer(Checagem checagem) {
        return stub.gerarRascunhoParecer(checagem);
    }

    @Override
    public String revisarParecer(String textoParecer) {
        return stub.revisarParecer(textoParecer);
    }

    @Override
    public List<SugestaoTituloDto> gerarSugestoesEditoriais(String titulo, String conteudo) {
        return stub.gerarSugestoesEditoriais(titulo, conteudo);
    }

    @Override
    public AnaliseIaDto analisarConteudo(ConteudoSuspeito conteudo) {
        if (!isConfigured()) {
            log.debug("Guaia não configurada — usando stub para conteúdo id={}", conteudo.getId());
            return stub.analisarConteudo(conteudo);
        }

        try {
            return analisarComGuaia(conteudo);
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

        return mapToDto(conteudo, pubResp, classifyResp);
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
            if (mediaType == 0) return; // documentos não suportados pela API

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

    /**
     * Mapeia tipo MIME ou tipo textual para o código de mídia da Guaia:
     * 2 = imagem, 3 = áudio, 4 = vídeo, 0 = não suportado.
     */
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

    private AnaliseIaDto mapToDto(ConteudoSuspeito conteudo,
                                   GuaiaPublicationResponse pub,
                                   GuaiaTextClassifyResponse classify) {

        // Eixo Desinformação
        double missinformationPotential = pub.missinformationPotential() != null
                ? pub.missinformationPotential() : 0.0;
        double fakeScore = pub.resultadoTexto() != null ? pub.resultadoTexto().fakeScore() : 0.0;
        double avgDistortion = averageDistortion(pub.resultadosMidias());

        BigDecimal scoreInveracidade = pct(missinformationPotential);
        BigDecimal scoreDistorcao    = pct(fakeScore);
        BigDecimal scoreForaContexto = pct(avgDistortion);

        // Eixo Ilicitudes
        double confianca = classify.confianca();
        double riscoPercentual = classify.riscoIlicitude() != null
                ? classify.riscoIlicitude().riscoPercentual() : 0.0;

        boolean ehOdio = isPositiveClassification(classify.classificacaoOdio());
        boolean ehAntidemo = isPositiveClassification(classify.classificacaoAntidemocratica());

        BigDecimal scoreDiscOdio       = pct(ehOdio ? confianca : (1 - confianca) * 0.15);
        BigDecimal scoreDiscAntidemo   = pct(ehAntidemo ? confianca : (1 - confianca) * 0.15);
        BigDecimal scoreRiscoIlicitude = BigDecimal.valueOf(riscoPercentual).setScale(2, RoundingMode.HALF_UP);

        // Análise semântica
        String atributoWhat  = pub.attributeWhat();
        String atributoWho   = pub.attributeWho();
        String atributoWhere = pub.attributeWhere();
        String atributoWhen  = pub.attributeWhen();
        String keywords      = pub.resultadoTexto() != null ? pub.resultadoTexto().keywords() : null;
        String pseudoLabel   = pub.resultadoTexto() != null ? pub.resultadoTexto().pseudoLabel() : null;

        String textoAnalise = pub.explanationText() != null
                ? pub.explanationText()
                : "Análise concluída pela Guaia IA Hub.";

        String avaliacaoRisco = deriveAvaliacaoRisco(missinformationPotential);

        log.info("Análise Guaia concluída — conteúdo id={}: inveracidade={}%, distorcao={}%",
                conteudo.getId(), scoreInveracidade, scoreDistorcao);

        return AnaliseIaDto.builder()
                .avaliacaoRisco(avaliacaoRisco)
                .textoAnalise(textoAnalise)
                .simulado(false)
                .scoreInveracidade(scoreInveracidade)
                .scoreDistorcao(scoreDistorcao)
                .scoreForaContexto(scoreForaContexto)
                .scoreDiscOdio(scoreDiscOdio)
                .scoreDiscAntidemo(scoreDiscAntidemo)
                .scoreRiscoIlicitude(scoreRiscoIlicitude)
                .atributoWhat(atributoWhat)
                .atributoWho(atributoWho)
                .atributoWhere(atributoWhere)
                .atributoWhen(atributoWhen)
                .keywords(keywords)
                .pseudoLabel(pseudoLabel)
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

    private boolean isPositiveClassification(String value) {
        if (value == null) return false;
        String normalized = value.toLowerCase()
                .replace("ã", "a").replace("ó", "o").replace("é", "e");
        return !normalized.contains("nao") && !normalized.contains("negativo");
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

    private String nullSafe(String value) {
        return value != null ? value : "";
    }
}
