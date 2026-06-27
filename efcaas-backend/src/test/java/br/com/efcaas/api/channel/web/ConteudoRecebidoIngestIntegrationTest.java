package br.com.efcaas.api.channel.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConteudoRecebidoIngestIntegrationTest {

    private static final String INGEST_PATH = "/api/v1/ingest/conteudos-recebidos";
    private static final String API_KEY = "test-ingest-key";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void ingest_returns401WithoutApiKey() throws Exception {
        mockMvc.perform(post(INGEST_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload("unauth-001")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void ingest_returns201ForNewContent() throws Exception {
        mockMvc.perform(post(INGEST_PATH)
                        .header("X-Ingest-Api-Key", API_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload("new-001")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.status").value("received"));
    }

    @Test
    void ingest_returns200ForDuplicateExternalId() throws Exception {
        String payload = validPayload("dup-ext-001");

        mockMvc.perform(post(INGEST_PATH)
                        .header("X-Ingest-Api-Key", API_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(INGEST_PATH)
                        .header("X-Ingest-Api-Key", API_KEY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idMensagemExterna").value("dup-ext-001"));
    }

    @Test
    void ingest_usesIdempotencyKeyHeaderWhenExternalIdMissing() throws Exception {
        String payload = """
                {
                  "titulo": "Com Idempotency-Key",
                  "conteudo": "Corpo",
                  "tipoFonte": "other"
                }
                """;

        mockMvc.perform(post(INGEST_PATH)
                        .header("X-Ingest-Api-Key", API_KEY)
                        .header("Idempotency-Key", "idem-key-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(post(INGEST_PATH)
                        .header("X-Ingest-Api-Key", API_KEY)
                        .header("Idempotency-Key", "idem-key-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());
    }

    private static String validPayload(String externalId) {
        return """
                {
                  "titulo": "Titulo teste %s",
                  "conteudo": "Conteudo de teste integracao",
                  "tipoFonte": "other",
                  "idMensagemExterna": "%s"
                }
                """.formatted(externalId, externalId);
    }
}
