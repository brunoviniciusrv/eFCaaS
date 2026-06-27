package br.com.efcaas.api.channel.abuse;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IngestHashUtilTest {

    @Test
    void sha256_isDeterministic() {
        String hash1 = IngestHashUtil.sha256("test");
        String hash2 = IngestHashUtil.sha256("test");
        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).hasSize(64);
    }

    @Test
    void contentHash_normalizesCaseAndWhitespace() {
        String a = IngestHashUtil.contentHash("whatsapp", "  Title ", "  Body ", "Sender");
        String b = IngestHashUtil.contentHash("whatsapp", "title", "body", "sender");
        assertThat(a).isEqualTo(b);
    }

    @Test
    void fingerprint_includesAllParts() {
        String fp1 = IngestHashUtil.fingerprint("1.2.3.4", "Agent", "REST", "user1");
        String fp2 = IngestHashUtil.fingerprint("1.2.3.4", "Agent", "REST", "user2");
        assertThat(fp1).isNotEqualTo(fp2);
    }
}
