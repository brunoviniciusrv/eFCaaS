package br.com.efcaas.api.channel.abuse;

import br.com.efcaas.api.channel.core.ChannelInboundMessage;
import br.com.efcaas.api.channel.core.ChannelType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DuplicateDetectionServiceIntegrationTest {

    @Autowired
    private DuplicateDetectionService duplicateDetectionService;

    @Test
    void assertNotDuplicate_skipsWhenExternalIdPresent() {
        ChannelInboundMessage message = sampleMessage("ext-id-1");

        assertThatCode(() -> duplicateDetectionService.assertNotDuplicate(
                ChannelType.REST, message, "fp")).doesNotThrowAnyException();
    }

    @Test
    void assertNotDuplicate_doesNotThrowWhenRejectDisabled() {
        ChannelInboundMessage message = sampleMessage(null);

        assertThatCode(() -> duplicateDetectionService.assertNotDuplicate(
                ChannelType.REST, message, "fp")).doesNotThrowAnyException();
    }

    private static ChannelInboundMessage sampleMessage(String externalId) {
        return new ChannelInboundMessage(
                "Titulo", "Conteudo", null, "whatsapp", "Nome", "+5511",
                null, externalId, null, List.of(), null);
    }
}
