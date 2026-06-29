package br.com.efcaas.api.support;

import br.com.efcaas.api.domain.Permissao;
import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.TipoUsuario;
import br.com.efcaas.api.domain.Usuario;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class TestUserSupport {

    /** BCrypt de {@code Admin@2026!} (strength 12) — mesmo hash do seed Flyway V3. */
    public static final String DEFAULT_TEST_PASSWORD_HASH =
            "$2a$12$G1sSYEED5A4kk8sv6Lby0O75bccaK7IRLXoS3.svR3aroFmwODz/a";

    public static final String CURADOR_EMAIL = "curador.test@efcaas.local";
    public static final String CURADOR_PASSWORD = "Admin@2026!";

    private final EntityManager entityManager;

    public TestUserSupport(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional
    public void seedCurador() {
        if (entityManager.createQuery(
                        "SELECT COUNT(u) FROM Usuario u WHERE u.email = :email", Long.class)
                .setParameter("email", CURADOR_EMAIL)
                .getSingleResult() > 0) {
            return;
        }

        Permissao manageReceived = persistPermissao("manage_received", "actions");
        Permissao manageTriage = persistPermissao("manage_triage", "actions");
        Permissao viewCurator = persistPermissao("view_curator", "navigation");

        TipoUsuario tipo = new TipoUsuario();
        tipo.setNome("Curador-Test");
        tipo.setDescricao("Perfil curador para testes de integração");
        tipo.setPermissoes(Set.of(manageReceived, manageTriage, viewCurator));
        entityManager.persist(tipo);

        Tenant tenant = seedDevTenant();

        Usuario usuario = new Usuario();
        usuario.setNome("Curador Teste");
        usuario.setEmail(CURADOR_EMAIL);
        usuario.setSenha(DEFAULT_TEST_PASSWORD_HASH);
        usuario.setStatus("A");
        usuario.setTipoUsuario(tipo);
        usuario.setTenant(tenant);
        entityManager.persist(usuario);
    }

    @Transactional
    public Tenant seedDevTenant() {
        return entityManager.createQuery(
                        "SELECT t FROM Tenant t WHERE t.slug = :slug", Tenant.class)
                .setParameter("slug", "dev")
                .getResultStream()
                .findFirst()
                .orElseGet(() -> {
                    Tenant tenant = new Tenant();
                    tenant.setSlug("dev");
                    tenant.setNome("Agência eFCaaS (Dev)");
                    tenant.setPlano("FREE");
                    tenant.setStatus("ACTIVE");
                    entityManager.persist(tenant);
                    return tenant;
                });
    }

    private Permissao persistPermissao(String nome, String tipo) {
        Permissao permissao = new Permissao();
        permissao.setNome(nome);
        permissao.setTipo(tipo);
        entityManager.persist(permissao);
        return permissao;
    }
}
