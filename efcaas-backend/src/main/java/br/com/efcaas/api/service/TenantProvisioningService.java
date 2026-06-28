package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.*;
import br.com.efcaas.api.repository.*;
import br.com.efcaas.api.util.HashUtil;
import br.com.efcaas.api.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TenantProvisioningService {

    private final TenantRepository tenantRepository;
    private final ConfiguracaoAgenciaRepository configuracaoAgenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final TipoUsuarioRepository tipoUsuarioRepository;
    private final EtiquetaRepository etiquetaRepository;
    private final TokenAtivacaoRepository tokenAtivacaoRepository;
    private final TenantIngestKeyRepository tenantIngestKeyRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public record ProvisioningResult(Tenant tenant, Usuario admin, String rawToken) {}

    @Transactional
    public ProvisioningResult provisionar(SolicitacaoCadastroAgencia solicitacao, Usuario aprovadoPor) {
        String baseSlug = SlugUtil.fromName(solicitacao.getNomeAgencia());
        String slug = SlugUtil.uniqueSlug(baseSlug, tenantRepository::existsBySlug);

        Tenant tenant = new Tenant();
        tenant.setSlug(slug);
        tenant.setNome(solicitacao.getNomeAgencia());
        tenant.setCnpj(solicitacao.getCnpj());
        tenant.setPlano(solicitacao.getPlanoSolicitado());
        tenant.setCompartilhaDadosEcossistema(!"PAID".equalsIgnoreCase(solicitacao.getPlanoSolicitado()));
        tenant.setStatus("ACTIVE");
        tenant = tenantRepository.save(tenant);

        ConfiguracaoAgencia config = new ConfiguracaoAgencia();
        config.setTenant(tenant);
        config.setNome(solicitacao.getNomeAgencia());
        config.setPais(solicitacao.getPais());
        config.setOnboardingConcluido(false);
        config.setTemaJson("{}");
        configuracaoAgenciaRepository.save(config);

        seedEtiquetas(tenant);

        TipoUsuario adminTipo = tipoUsuarioRepository.findByNome("Administrador")
                .orElseThrow(() -> new IllegalStateException("Perfil Administrador não encontrado"));

        Usuario admin = new Usuario();
        admin.setNome(solicitacao.getNomeResponsavel());
        admin.setEmail(solicitacao.getEmailContato().trim().toLowerCase());
        boolean senhaDefinidaNoCadastro = solicitacao.getSenhaHash() != null && !solicitacao.getSenhaHash().isBlank();
        admin.setSenha(senhaDefinidaNoCadastro
                ? solicitacao.getSenhaHash()
                : passwordEncoder.encode(UUID.randomUUID().toString()));
        admin.setTenant(tenant);
        admin.setTipoUsuario(adminTipo);
        admin.setStatus("A");
        admin = usuarioRepository.save(admin);

        String rawToken = null;
        if (!senhaDefinidaNoCadastro) {
            rawToken = UUID.randomUUID().toString();
            TokenAtivacao token = new TokenAtivacao();
            token.setTenant(tenant);
            token.setUsuario(admin);
            token.setTokenHash(HashUtil.sha256(rawToken));
            token.setExpiraEm(OffsetDateTime.now().plusDays(7));
            tokenAtivacaoRepository.save(token);
        }

        TenantIngestKey ingestKey = new TenantIngestKey();
        ingestKey.setTenant(tenant);
        ingestKey.setApiKeyHash(HashUtil.sha256(UUID.randomUUID().toString()));
        tenantIngestKeyRepository.save(ingestKey);

        solicitacao.setStatus("APPROVED");
        solicitacao.setTenant(tenant);
        solicitacao.setAprovadoPor(aprovadoPor);
        solicitacao.setAtualizadoEm(OffsetDateTime.now());

        emailService.enviarAprovacaoCadastro(
                admin.getEmail(), tenant.getNome(), tenant.getSlug(), rawToken, senhaDefinidaNoCadastro);

        return new ProvisioningResult(tenant, admin, rawToken);
    }

    private void seedEtiquetas(Tenant tenant) {
        String[][] defaults = {
                {"Verdadeiro", "A informação é totalmente correta e comprovada.", "#22c55e"},
                {"Falso", "A informação é totalmente incorreta ou inventada.", "#ef4444"},
                {"Distorcido", "A informação tem base real mas foi alterada para enganar.", "#f97316"},
        };
        for (String[] row : defaults) {
            Etiqueta e = new Etiqueta();
            e.setNome(row[0]);
            e.setDescricao(row[1]);
            e.setCor(row[2]);
            e.setTenantId(tenant.getId());
            etiquetaRepository.save(e);
        }
    }
}
