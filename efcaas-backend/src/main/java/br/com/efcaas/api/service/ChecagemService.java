package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.*;
import br.com.efcaas.api.repository.*;
import br.com.efcaas.api.tenant.TenantScope;
import br.com.efcaas.api.web.dto.*;
import br.com.efcaas.api.web.mapper.ChecagemMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import io.minio.GetObjectResponse;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ChecagemService {

    private final ChecagemRepository checagemRepo;
    private final ParecerRepository parecerRepo;
    private final InvestigacaoRepository investigacaoRepo;
    private final EvidenciaRepository evidenciaRepo;
    private final EtiquetaRepository etiquetaRepo;
    private final ChecagemMapper mapper;
    private final AuditoriaService auditoria;
    private final StorageService storageService;
    private final EvidenciaAccessTokenService accessTokenService;
    private final ObjectMapper objectMapper;
    private final TenantScope tenantScope;

    @Transactional
    public ChecagemDto iniciar(Long checagemId, Long checadorId) {
        Checagem ch = buscarChecagem(checagemId);
        ch.setStatus("em_analise");
        ch.setDataInicio(LocalDateTime.now());
        checagemRepo.save(ch);
        auditoria.registrar(checadorId, "checagem_iniciada", "checagem:" + checagemId, null);
        return toDto(ch);
    }

    @Transactional(readOnly = true)
    public ChecagemDto obterDetalhe(Long checagemId) {
        return toDto(buscarChecagem(checagemId));
    }

    @Transactional
    public InvestigacaoDto salvarInvestigacao(Long checagemId, SalvarInvestigacaoRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Investigacao inv = investigacaoRepo.findByChecagemId(checagemId).orElse(new Investigacao());
        inv.setChecagem(ch);
        inv.setResumoMetodologia(req.resumo());
        inv.setInverificavel(req.inverificavel());
        inv.setAtualizadoEm(LocalDateTime.now());

        if (req.perguntas() != null) {
            inv.setPerguntas(toJson(req.perguntas()));
        }
        if (req.fontes() != null) {
            inv.setFontes(toJson(req.fontes()));
        }
        if (req.contatoAutor() != null) {
            inv.setContatoRealizado(req.contatoAutor().hadContact());
            inv.setRespostaAutor(req.contatoAutor().response());
            inv.setJustificativaSemContato(req.contatoAutor().justificacao());
        }

        investigacaoRepo.save(inv);

        List<String> camposAlterados = new ArrayList<>();
        if (req.resumo() != null) camposAlterados.add("resumo_metodologia");
        if (req.perguntas() != null && !req.perguntas().isEmpty()) camposAlterados.add("perguntas");
        if (req.fontes() != null && !req.fontes().isEmpty()) camposAlterados.add("fontes");
        if (req.inverificavel()) camposAlterados.add("inverificavel");
        if (req.contatoAutor() != null) camposAlterados.add("contato_autor");
        String detalhesInv = camposAlterados.isEmpty() ? null : String.join(",", camposAlterados);

        auditoria.registrar(usuarioId, "investigacao_salva", "checagem:" + checagemId, detalhesInv);
        return mapper.toInvestigacaoDto(inv);
    }

    @Transactional(readOnly = true)
    public ParecerDto obterParecer(Long checagemId) {
        buscarChecagem(checagemId);
        Parecer parecer = parecerRepo.findByChecagemId(checagemId)
                .orElseThrow(() -> new NoSuchElementException("Parecer não encontrado para checagem: " + checagemId));
        return mapper.toParecerDto(parecer);
    }

    @Transactional
    public ParecerDto salvarParecer(Long checagemId, SalvarParecerRequest req, Long usuarioId) {
        buscarChecagem(checagemId);
        Parecer parecer = parecerRepo.findByChecagemId(checagemId).orElse(new Parecer());
        parecer.setChecagem(checagemRepo.getReferenceById(checagemId));
        parecer.setTextoParecer(req.textoParecer());
        parecerRepo.save(parecer);
        auditoria.registrar(usuarioId, "parecer_salvo", "checagem:" + checagemId, "texto_parecer");
        return mapper.toParecerDto(parecer);
    }

    @Transactional
    public ChecagemDto finalizarParecer(Long checagemId, FinalizarParecerRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Long tenantId = tenantScope.requireTenantId();
        Etiqueta etiqueta = etiquetaRepo.findById(req.etiquetaId())
                .filter(e -> tenantId.equals(e.getTenantId()))
                .orElseThrow(() -> new NoSuchElementException("Etiqueta não encontrada: " + req.etiquetaId()));

        Parecer parecer = parecerRepo.findByChecagemId(checagemId).orElse(new Parecer());
        parecer.setChecagem(ch);
        parecer.setTextoParecer(req.textoParecer());
        parecer.setEtiqueta(etiqueta);
        parecerRepo.save(parecer);

        ch.setStatus("aguardando_revisao");
        checagemRepo.save(ch);

        ConteudoSuspeito conteudo = ch.getConteudo();
        conteudo.setStatus("final_review");
        auditoria.registrar(usuarioId, "parecer_finalizado", "checagem:" + checagemId,
                "etiqueta:" + etiqueta.getNome());
        return toDto(ch);
    }

    @Transactional(readOnly = true)
    public List<EvidenciaDto> listarEvidencias(Long checagemId) {
        buscarChecagem(checagemId);
        return evidenciaRepo.findByChecagemId(checagemId)
                .stream().map(ev -> mapper.toEvidenciaDto(ev, checagemId)).toList();
    }

    @Transactional(readOnly = true)
    public ResponseEntity<StreamingResponseBody> downloadEvidencia(
            Long checagemId, Long evidenciaId, String token, String rangeHeader) {
        accessTokenService.validar(token, checagemId, evidenciaId);
        Evidencia e = evidenciaRepo.findByIdAndChecagemId(evidenciaId, checagemId)
                .orElseThrow(() -> new NoSuchElementException("Evidência não encontrada: " + evidenciaId));
        if (e.getObjectKey() == null || e.getObjectKey().isBlank()) {
            throw new IllegalStateException("Evidência não possui arquivo armazenado");
        }

        String contentType = e.getContentType() != null ? e.getContentType() : "application/octet-stream";
        String filename = e.getNomeArquivo() != null ? e.getNomeArquivo() : "arquivo";
        long fileSize = e.getTamanhoBytes() != null && e.getTamanhoBytes() > 0
                ? e.getTamanhoBytes()
                : storageService.getObjectSize(e.getObjectKey());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"");
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");

        if (rangeHeader == null || rangeHeader.isBlank()) {
            StreamingResponseBody body = outputStream -> {
                try (GetObjectResponse object = storageService.getObject(e.getObjectKey())) {
                    object.transferTo(outputStream);
                }
            };
            headers.setContentLength(fileSize);
            return ResponseEntity.ok().headers(headers).body(body);
        }

        ByteRange range = parseByteRange(rangeHeader, fileSize);
        long contentLength = range.end() - range.start() + 1;

        StreamingResponseBody body = outputStream -> {
            try (GetObjectResponse object = storageService.getObjectRange(
                    e.getObjectKey(), range.start(), contentLength)) {
                object.transferTo(outputStream);
            }
        };

        headers.setContentLength(contentLength);
        headers.set(HttpHeaders.CONTENT_RANGE,
                "bytes " + range.start() + "-" + range.end() + "/" + fileSize);

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers).body(body);
    }

    @Transactional
    public EvidenciaDto uploadEvidenciaArquivo(
            Long checagemId, MultipartFile file, String descricao, Long usuarioId) {
        StorageService.UploadResult upload = storageService.upload(checagemId, file);
        Checagem ch = buscarChecagem(checagemId);
        String tipo = inferirTipoEvidencia(upload.contentType());

        Evidencia evidencia = new Evidencia();
        evidencia.setChecagem(ch);
        evidencia.setTipo(tipo);
        evidencia.setObjectKey(upload.objectKey());
        evidencia.setNomeArquivo(upload.originalFilename());
        evidencia.setContentType(upload.contentType());
        evidencia.setTamanhoBytes(upload.size());
        evidencia.setDescricao(descricao != null && !descricao.isBlank()
                ? descricao
                : upload.originalFilename());
        evidenciaRepo.save(evidencia);
        auditoria.registrar(usuarioId, "evidencia_adicionada", "checagem:" + checagemId, tipo);
        return mapper.toEvidenciaDto(evidencia, checagemId);
    }

    @Transactional
    public EvidenciaDto adicionarEvidencia(Long checagemId, AdicionarEvidenciaRequest req, Long usuarioId) {
        Checagem ch = buscarChecagem(checagemId);
        Evidencia e = new Evidencia();
        e.setChecagem(ch);
        e.setTipo(req.tipo());
        e.setLinkArquivo(req.linkArquivo());
        e.setDescricao(req.descricao());
        evidenciaRepo.save(e);
        auditoria.registrar(usuarioId, "evidencia_adicionada", "checagem:" + checagemId, req.tipo());
        return mapper.toEvidenciaDto(e, checagemId);
    }

    @Transactional
    public void removerEvidencia(Long checagemId, Long evidenciaId, Long usuarioId) {
        buscarChecagem(checagemId);
        Evidencia e = evidenciaRepo.findByIdAndChecagemId(evidenciaId, checagemId)
                .orElseThrow(() -> new NoSuchElementException("Evidência não encontrada: " + evidenciaId));
        if (e.getObjectKey() != null && !e.getObjectKey().isBlank()) {
            storageService.delete(e.getObjectKey());
        }
        evidenciaRepo.delete(e);
        auditoria.registrar(usuarioId, "evidencia_removida", "checagem:" + checagemId, "evidencia:" + evidenciaId);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private Checagem buscarChecagem(Long id) {
        return checagemRepo.findByIdAndTenantId(id, tenantScope.requireTenantId())
                .orElseThrow(() -> new NoSuchElementException("Checagem não encontrada: " + id));
    }

    private ChecagemDto toDto(Checagem ch) {
        Parecer parecer = parecerRepo.findByChecagemId(ch.getId()).orElse(null);
        Investigacao investigacao = investigacaoRepo.findByChecagemId(ch.getId()).orElse(null);
        List<Evidencia> evidencias = evidenciaRepo.findByChecagemId(ch.getId());
        return mapper.toDto(ch, parecer, investigacao, evidencias);
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }

    private static String inferirTipoEvidencia(String contentType) {
        if (contentType == null) return "document";
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        return "document";
    }

    private record ByteRange(long start, long end) {}

    private static ByteRange parseByteRange(String rangeHeader, long fileSize) {
        if (!rangeHeader.startsWith("bytes=")) {
            throw new IllegalArgumentException("Range inválido");
        }
        String[] parts = rangeHeader.substring(6).trim().split("-", 2);
        long start;
        long end;
        if (parts[0].isEmpty()) {
            long suffix = Long.parseLong(parts[1]);
            start = Math.max(0, fileSize - suffix);
            end = fileSize - 1;
        } else {
            start = Long.parseLong(parts[0]);
            end = (parts.length < 2 || parts[1].isEmpty()) ? fileSize - 1 : Long.parseLong(parts[1]);
        }
        if (start < 0 || end >= fileSize || start > end) {
            throw new IllegalArgumentException("Range inválido");
        }
        return new ByteRange(start, end);
    }
}
