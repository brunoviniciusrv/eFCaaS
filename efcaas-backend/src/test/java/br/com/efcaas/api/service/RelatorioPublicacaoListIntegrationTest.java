package br.com.efcaas.api.service;

import br.com.efcaas.api.domain.Checagem;
import br.com.efcaas.api.domain.ConteudoSuspeito;
import br.com.efcaas.api.domain.Parecer;
import br.com.efcaas.api.domain.RelatorioPublicacao;
import br.com.efcaas.api.domain.Tenant;
import br.com.efcaas.api.domain.Usuario;
import br.com.efcaas.api.repository.RelatorioPublicacaoRepository;
import br.com.efcaas.api.support.TestUserSupport;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class RelatorioPublicacaoListIntegrationTest {

    @Autowired
    private RelatorioPublicacaoRepository relatorioRepo;

    @Autowired
    private TestUserSupport testUserSupport;

    @Autowired
    private EntityManager entityManager;

    @BeforeEach
    void setUp() {
        testUserSupport.seedCurador();
    }

    @Test
    @Transactional
    void findAllComDetalhes_includesRelatorioSemEditor() throws Exception {
        Tenant tenant = testUserSupport.seedDevTenant();
        Usuario curador = entityManager.createQuery(
                        "SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
                .setParameter("email", TestUserSupport.CURADOR_EMAIL)
                .getSingleResult();

        ConteudoSuspeito conteudo = new ConteudoSuspeito();
        conteudo.setTitulo("Noticia revisada");
        conteudo.setStatus("completed");
        conteudo.setTenantId(tenant.getId());
        conteudo.setNumeroReferencia(999001);
        conteudo.setDataEntrada(LocalDateTime.now());
        entityManager.persist(conteudo);

        Checagem checagem = new Checagem();
        checagem.setConteudo(conteudo);
        checagem.setCurador(curador);
        checagem.setStatus("aprovada");
        checagem.setTenantId(tenant.getId());
        entityManager.persist(checagem);

        Parecer parecer = new Parecer();
        parecer.setChecagem(checagem);
        parecer.setTextoParecer("Parecer final");
        entityManager.persist(parecer);

        RelatorioPublicacao rel = new RelatorioPublicacao();
        rel.setParecer(parecer);
        rel.setEditor(null);
        rel.setTitulo(conteudo.getTitulo());
        rel.setCorpoTexto(parecer.getTextoParecer());
        rel.setStatusPublicacao("draft");
        rel.setTenantId(tenant.getId());
        rel.setDataCriacao(LocalDateTime.now());
        rel.setDataAtualizacao(LocalDateTime.now());
        entityManager.persist(rel);
        entityManager.flush();

        long totalInDb = relatorioRepo.findAll().stream()
                .filter(r -> tenant.getId().equals(r.getTenantId()))
                .count();
        var detalhados = relatorioRepo.findAllComDetalhes(tenant.getId());

        String logLine = String.format(
                "{\"sessionId\":\"6d9706\",\"timestamp\":%d,\"location\":\"RelatorioPublicacaoListIntegrationTest\",\"message\":\"repository list counts\",\"hypothesisId\":\"A\",\"data\":{\"totalInDb\":%d,\"findAllComDetalhesCount\":%d,\"missingFromList\":%d}}%n",
                System.currentTimeMillis(), totalInDb, detalhados.size(), totalInDb - detalhados.size());
        Files.writeString(Path.of("debug-6d9706.log"), logLine, StandardOpenOption.CREATE, StandardOpenOption.APPEND);

        assertThat(totalInDb).isGreaterThan(0);
        assertThat(detalhados).anyMatch(r -> r.getId().equals(rel.getId()));
    }
}
