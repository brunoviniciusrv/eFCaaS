package br.com.efcaas.api.support;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Garante tenant {@code dev} no banco em memória dos testes (Flyway desabilitado no profile test).
 */
@Component
@Profile("test")
@RequiredArgsConstructor
public class TestTenantBootstrap implements ApplicationRunner {

    private final TestUserSupport testUserSupport;

    @Override
    public void run(ApplicationArguments args) {
        testUserSupport.seedDevTenant();
    }
}
