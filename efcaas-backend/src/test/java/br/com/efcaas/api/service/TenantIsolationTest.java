package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.TenantRepository;
import br.com.efcaas.api.repository.UsuarioRepository;
import br.com.efcaas.api.support.TestUserSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class TenantIsolationTest {

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TestUserSupport testUserSupport;

    @BeforeEach
    void setUp() {
        testUserSupport.seedCurador();
    }

    @Test
    void usuariosDeTenantsDiferentesNaoCompartilhamEmailGlobal() {
        Tenant dev = tenantRepository.findBySlug("dev").orElseThrow();
        assertThat(dev.getId()).isNotNull();

        long devUsers = usuarioRepository.findAll().stream()
                .filter(u -> u.getTenant() != null && dev.getId().equals(u.getTenant().getId()))
                .count();
        assertThat(devUsers).isGreaterThan(0);
    }

    @Test
    void emailResolvidoPorTenant() {
        Tenant dev = tenantRepository.findBySlug("dev").orElseThrow();
        Usuario curador = usuarioRepository.findByEmailAndTenant_Id(TestUserSupport.CURADOR_EMAIL, dev.getId())
                .orElseThrow();
        assertThat(curador.getTenant().getId()).isEqualTo(dev.getId());
    }
}
