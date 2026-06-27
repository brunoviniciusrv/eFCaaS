package br.com.efcaas.api.channel.web;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "efcaas.channels.whatsapp.enabled=true",
        "efcaas.channels.whatsapp.verify-token=verify-test",
        "efcaas.channels.whatsapp.app-secret=wa-secret",
        "efcaas.channels.whatsapp.access-token=token",
        "efcaas.channels.whatsapp.phone-number-id=phone"
})
class WhatsAppWebhookIntegrationTest {

    private static final String APP_SECRET = "wa-secret";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void verifyChallenge_returnsHubChallenge() throws Exception {
        mockMvc.perform(get("/api/v1/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "verify-test")
                        .param("hub.challenge", "999"))
                .andExpect(status().isOk())
                .andExpect(content().string("999"));
    }

    @Test
    void webhook_acceptsSignedTextMessage() throws Exception {
        String body = """
                {
                  "entry": [{
                    "changes": [{
                      "value": {
                        "messages": [{
                          "id": "wamid.webhook-1",
                          "from": "5511888888888",
                          "type": "text",
                          "text": { "body": "Webhook test" }
                        }],
                        "contacts": [{ "profile": { "name": "Webhook User" } }]
                      }
                    }]
                  }]
                }
                """;

        mockMvc.perform(post("/api/v1/webhooks/whatsapp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-Hub-Signature-256", "sha256=" + hmac(body, APP_SECRET))
                        .content(body))
                .andExpect(status().isOk());
    }

    private static String hmac(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
