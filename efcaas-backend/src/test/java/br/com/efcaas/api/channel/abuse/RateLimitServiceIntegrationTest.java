package br.com.efcaas.api.channel.abuse;

import br.com.efcaas.api.exception.RateLimitExceededException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "efcaas.abuse.rate-limit.per-ip=2",
        "efcaas.abuse.rate-limit.per-token=1000",
        "efcaas.abuse.rate-limit.per-channel=1000"
})
class RateLimitServiceIntegrationTest {

    @Autowired
    private RateLimitService rateLimitService;

    @Test
    void checkAndIncrement_allowsWithinLimit() {
        assertThatCode(() -> {
            rateLimitService.checkAndIncrement("ip:test-allow", 2);
            rateLimitService.checkAndIncrement("ip:test-allow", 2);
        }).doesNotThrowAnyException();
    }

    @Test
    void checkAndIncrement_blocksWhenLimitExceeded() {
        rateLimitService.checkAndIncrement("ip:test-block", 1);

        assertThatThrownBy(() -> rateLimitService.checkAndIncrement("ip:test-block", 1))
                .isInstanceOf(RateLimitExceededException.class);
    }
}
