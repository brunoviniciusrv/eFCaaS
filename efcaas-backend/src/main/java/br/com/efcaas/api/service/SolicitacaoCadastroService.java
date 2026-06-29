package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.DocumentoSolicitacao;
import br.com.efcaas.api.domain.SolicitacaoCadastroAgencia;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.SolicitacaoCadastroRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.util.BrValidator;
import br.com.efcaas.api.web.dto.DocumentoSolicitacaoDto;
import br.com.efcaas.api.web.dto.SolicitacaoCadastroDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SolicitacaoCadastroService {

    private static final int MAX_DOCUMENTOS = 5;
    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_MIME = Set.of(
            "application/pdf", "image/jpeg", "image/png", "image/webp");

    private final SolicitacaoCadastroRepository repository;
    private final UsuarioRepository usuarioRepository;
    private final StorageService storageService;
    private final TenantProvisioningService tenantProvisioningService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public SolicitacaoCadastroDto criar(
            String nomeAgencia,
            String cnpj,
            String nomeResponsavel,
            String emailContato,
            String senha,
            String telefone,
            String pais,
            String estado,
            String cidade,
            String planoSolicitado,
            String informacoesExtras,
            List<MultipartFile> documentos) {
        String nome = trimRequired(nomeAgencia, "nomeAgencia");
        String responsavel = trimRequired(nomeResponsavel, "nomeResponsavel");
        String email = trimRequired(emailContato, "emailContato").toLowerCase();
        String senhaNorm = trimRequired(senha, "senha");
        String paisNorm = pais != null && !pais.isBlank() ? pais.trim() : "Brasil";
        String plano = planoSolicitado != null && !planoSolicitado.isBlank() ? planoSolicitado.trim() : "FREE";

        validarCampos(nome, responsavel, email, senhaNorm, cnpj, telefone, paisNorm, estado, cidade, plano, documentos);

        SolicitacaoCadastroAgencia solicitacao = new SolicitacaoCadastroAgencia();
        solicitacao.setNomeAgencia(nome);
        solicitacao.setCnpj(cnpj != null && !cnpj.isBlank()
                ? BrValidator.formatCnpj(BrValidator.digitsOnly(cnpj)) : null);
        solicitacao.setNomeResponsavel(responsavel);
        solicitacao.setEmailContato(email);
        solicitacao.setSenhaHash(passwordEncoder.encode(senhaNorm));
        solicitacao.setTelefone(telefone != null && !telefone.isBlank()
                ? BrValidator.digitsOnly(telefone) : null);
        solicitacao.setPais(paisNorm);
        solicitacao.setEstado(trimOrNull(estado) != null ? estado.trim().toUpperCase() : null);
        solicitacao.setCidade(trimOrNull(cidade));
        solicitacao.setPlanoSolicitado(plano);
        solicitacao.setInformacoesExtras(trimOrNull(informacoesExtras));
        solicitacao.setStatus("PENDING");

        solicitacao = repository.save(solicitacao);
        anexarDocumentos(solicitacao, documentos);

        return toDto(repository.save(solicitacao));
    }

    @Transactional(readOnly = true)
    public List<SolicitacaoCadastroDto> list(String status) {
        List<SolicitacaoCadastroAgencia> solicitacoes = status != null && !status.isBlank()
                ? repository.findByStatusOrderByCriadoEmDesc(status.trim())
                : repository.findAllByOrderByCriadoEmDesc();
        return solicitacoes.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SolicitacaoCadastroDto getById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public SolicitacaoCadastroDto aprovar(Long id, Long aprovadorId) {
        SolicitacaoCadastroAgencia solicitacao = findOrThrow(id);
        if (!"PENDING".equals(solicitacao.getStatus())) {
            throw new IllegalStateException("Solicitação não está pendente");
        }

        Usuario aprovador = usuarioRepository.findById(aprovadorId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + aprovadorId));

        tenantProvisioningService.provisionar(solicitacao, aprovador);
        return toDto(repository.save(solicitacao));
    }

    @Transactional
    public SolicitacaoCadastroDto reprovar(Long id, String motivo) {
        SolicitacaoCadastroAgencia solicitacao = findOrThrow(id);
        if (!"PENDING".equals(solicitacao.getStatus())) {
            throw new IllegalStateException("Solicitação não está pendente");
        }

        solicitacao.setStatus("REJECTED");
        solicitacao.setMotivoReprovacao(motivo != null ? motivo.trim() : null);
        solicitacao.setAtualizadoEm(OffsetDateTime.now());
        solicitacao = repository.save(solicitacao);

        emailService.enviarReprovacaoCadastro(
                solicitacao.getEmailContato(), solicitacao.getNomeAgencia(), solicitacao.getMotivoReprovacao());

        return toDto(solicitacao);
    }

    private void anexarDocumentos(SolicitacaoCadastroAgencia solicitacao, List<MultipartFile> documentos) {
        if (documentos == null || documentos.isEmpty()) {
            throw new IllegalArgumentException("Ao menos um documento comprobatório é obrigatório");
        }

        List<DocumentoSolicitacao> anexos = new ArrayList<>();
        for (MultipartFile file : documentos) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            if (file.getSize() > MAX_FILE_BYTES) {
                throw new IllegalArgumentException("Arquivo excede o limite de 10 MB: " + file.getOriginalFilename());
            }
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_MIME.contains(contentType)) {
                throw new IllegalArgumentException(
                        "Formato não permitido. Use PDF, JPG, PNG ou WEBP: " + file.getOriginalFilename());
            }
            StorageService.UploadResult upload = storageService.uploadSolicitacao(solicitacao.getId(), file);
            DocumentoSolicitacao doc = new DocumentoSolicitacao();
            doc.setSolicitacao(solicitacao);
            doc.setNomeArquivo(upload.originalFilename());
            doc.setObjectKey(upload.objectKey());
            doc.setTipoMime(upload.contentType());
            doc.setTamanhoBytes(upload.size());
            anexos.add(doc);
        }
        solicitacao.getDocumentos().addAll(anexos);
        if (anexos.isEmpty()) {
            throw new IllegalArgumentException("Ao menos um documento comprobatório é obrigatório");
        }
    }

    private void validarCampos(
            String nomeAgencia,
            String nomeResponsavel,
            String email,
            String senha,
            String cnpj,
            String telefone,
            String pais,
            String estado,
            String cidade,
            String plano,
            List<MultipartFile> documentos) {
        if (nomeAgencia.length() < 3 || nomeAgencia.length() > 150) {
            throw new IllegalArgumentException("Nome da agência deve ter entre 3 e 150 caracteres");
        }
        if (nomeResponsavel.length() < 3 || nomeResponsavel.length() > 150) {
            throw new IllegalArgumentException("Nome do responsável deve ter entre 3 e 150 caracteres");
        }
        if (!BrValidator.isValidEmail(email)) {
            throw new IllegalArgumentException("E-mail de contato inválido");
        }
        if (senha == null || senha.length() < 8 || senha.length() > 100) {
            throw new IllegalArgumentException("Senha deve ter entre 8 e 100 caracteres");
        }
        if (!"FREE".equalsIgnoreCase(plano) && !"PAID".equalsIgnoreCase(plano)) {
            throw new IllegalArgumentException("Plano solicitado inválido");
        }

        boolean brasil = BrValidator.isBrazilCountry(pais);
        if (brasil) {
            if (cnpj == null || cnpj.isBlank()) {
                throw new IllegalArgumentException("CNPJ é obrigatório para agências no Brasil");
            }
            if (!BrValidator.isValidCnpj(cnpj)) {
                throw new IllegalArgumentException("CNPJ inválido");
            }
            if (estado == null || estado.isBlank()) {
                throw new IllegalArgumentException("Estado (UF) é obrigatório para agências no Brasil");
            }
            if (!BrValidator.isValidBrazilianUf(estado)) {
                throw new IllegalArgumentException("UF inválida");
            }
            if (cidade == null || cidade.isBlank() || cidade.trim().length() < 2) {
                throw new IllegalArgumentException("Cidade é obrigatória para agências no Brasil");
            }
            if (telefone == null || telefone.isBlank()) {
                throw new IllegalArgumentException("Telefone é obrigatório para agências no Brasil");
            }
            if (!BrValidator.isValidBrazilianPhone(telefone)) {
                throw new IllegalArgumentException("Telefone inválido");
            }
        } else if (cnpj != null && !cnpj.isBlank() && !BrValidator.isValidCnpj(cnpj)) {
            throw new IllegalArgumentException("CNPJ inválido");
        }

        if (documentos == null || documentos.stream().noneMatch(f -> f != null && !f.isEmpty())) {
            throw new IllegalArgumentException("Ao menos um documento comprobatório é obrigatório");
        }
        long count = documentos.stream().filter(f -> f != null && !f.isEmpty()).count();
        if (count > MAX_DOCUMENTOS) {
            throw new IllegalArgumentException("Máximo de " + MAX_DOCUMENTOS + " documentos por solicitação");
        }
    }

    private SolicitacaoCadastroAgencia findOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Solicitação não encontrada: " + id));
    }

    private SolicitacaoCadastroDto toDto(SolicitacaoCadastroAgencia solicitacao) {
        Long tenantId = solicitacao.getTenant() != null ? solicitacao.getTenant().getId() : null;
        String tenantSlug = solicitacao.getTenant() != null ? solicitacao.getTenant().getSlug() : null;
        List<DocumentoSolicitacaoDto> docs = solicitacao.getDocumentos().stream()
                .map(d -> new DocumentoSolicitacaoDto(
                        d.getId(),
                        d.getNomeArquivo(),
                        d.getTipoMime(),
                        d.getTamanhoBytes(),
                        d.getCriadoEm()))
                .toList();

        return new SolicitacaoCadastroDto(
                solicitacao.getId(),
                solicitacao.getNomeAgencia(),
                solicitacao.getCnpj(),
                solicitacao.getNomeResponsavel(),
                solicitacao.getEmailContato(),
                solicitacao.getTelefone(),
                solicitacao.getPais(),
                solicitacao.getEstado(),
                solicitacao.getCidade(),
                solicitacao.getPlanoSolicitado(),
                solicitacao.getInformacoesExtras(),
                solicitacao.getStatus(),
                solicitacao.getMotivoReprovacao(),
                tenantId,
                tenantSlug,
                solicitacao.getCriadoEm(),
                solicitacao.getAtualizadoEm(),
                docs);
    }

    private static String trimRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " é obrigatório");
        }
        return value.trim();
    }

    private static String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
