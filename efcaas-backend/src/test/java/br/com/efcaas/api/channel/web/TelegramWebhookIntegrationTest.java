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
        "efcaas.channels.telegram.enabled=true",
        "efcaas.channels.telegram.bot-token=bot-token-test",
        "efcaas.channels.telegram.secret-token=tg-secret"
})
class TelegramWebhookIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void webhook_acceptsSignedTextUpdate() throws Exception {
        String body = """
                {
                  "update_id": 100,
                  "message": {
                    "message_id": 77,
                    "from": { "id": 999, "first_name": "Bot" },
                    "text": "Update Telegram"
                  }
                }
                """;

        mockMvc.perform(post("/api/v1/webhooks/telegram")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Telegram-Bot-Api-Secret-Token", "tg-secret")
                        .content(body))
                .andExpect(status().isOk());
    }

    @Test
    void webhook_rejectsInvalidSecret() throws Exception {
        mockMvc.perform(post("/api/v1/webhooks/telegram")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Telegram-Bot-Api-Secret-Token", "wrong")
                        .content("{\"update_id\":1}"))
                .andExpect(status().isUnauthorized());
    }
}
