package br.com.efcaas.api.web;

import br.com.efcaas.api.support.TestUserSupport;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TriagemFlowIntegrationTest {

    private static final String INGEST_API_KEY = "test-ingest-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestUserSupport testUserSupport;

    @BeforeEach
    void seedUser() {
        testUserSupport.seedCurador();
    }

    @Test
    void ingestThenEncaminhar_movesContentToTriage() throws Exception {
        mockMvc.perform(post("/api/v1/ingest/conteudos-recebidos")
                        .header("X-Ingest-Api-Key", INGEST_API_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": "Fluxo triagem E2E",
                                  "conteudo": "Conteudo para encaminhar",
                                  "tipoFonte": "other",
                                  "idMensagemExterna": "triagem-e2e-001"
                                }
                                """))
                .andExpect(status().isCreated());

        String token = obtainCuradorToken();

        String listBody = mockMvc.perform(get("/api/v1/conteudos-recebidos")
                        .param("status", "received")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].idMensagemExterna").value("triagem-e2e-001"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Number conteudoId = JsonPath.read(listBody, "$[0].id");

        mockMvc.perform(post("/api/v1/conteudos-recebidos/" + conteudoId + "/encaminhar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pending"));

        mockMvc.perform(get("/api/v1/conteudos-recebidos/" + conteudoId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("in_triage"));
    }

    private String obtainCuradorToken() throws Exception {
        String loginBody = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "%s",
                                  "senha": "%s"
                                }
                                """.formatted(TestUserSupport.CURADOR_EMAIL, TestUserSupport.CURADOR_PASSWORD)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(loginBody, "$.token");
    }
}
