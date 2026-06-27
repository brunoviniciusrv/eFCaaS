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
        "efcaas.abuse.rate-limit.per-ip=1",
        "efcaas.abuse.rate-limit.per-token=1000",
        "efcaas.abuse.rate-limit.per-channel=1000"
})
class RateLimitIngestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void ingest_returns429WhenRateLimitExceeded() throws Exception {
        mockMvc.perform(post("/api/v1/ingest/conteudos-recebidos")
                        .header("X-Ingest-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": "Rate limit 1",
                                  "conteudo": "Primeira",
                                  "tipoFonte": "other",
                                  "idMensagemExterna": "rl-first"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/ingest/conteudos-recebidos")
                        .header("X-Ingest-Api-Key", "test-ingest-key")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "titulo": "Rate limit 2",
                                  "conteudo": "Segunda",
                                  "tipoFonte": "other",
                                  "idMensagemExterna": "rl-second"
                                }
                                """))
                .andExpect(status().isTooManyRequests());
    }
}
