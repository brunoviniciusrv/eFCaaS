package br.com.efcaas.api.channel.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "efcaas.abuse.duplicate.reject-duplicates=true"
})
class DuplicateContentIngestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void ingest_returns409ForDuplicateContentWithoutExternalId() throws Exception {
        String payload = """
                {
                  "titulo": "Spam titulo",
                  "conteudo": "Mesmo conteudo duplicado",
                  "tipoFonte": "other",
                  "nomeRemetente": "User"
                }
                """;

        mockMvc.perform(post("/api/v1/ingest/conteudos-recebidos")
                        .header("X-Ingest-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/ingest/conteudos-recebidos")
                        .header("X-Ingest-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isConflict());
    }
}
