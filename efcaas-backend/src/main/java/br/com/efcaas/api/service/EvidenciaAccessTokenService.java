package br.com.efcaas.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;

@Service
public class EvidenciaAccessTokenService {

    private final byte[] secret;
    private final int expiryMinutes;

    public EvidenciaAccessTokenService(
            @Value("${efcaas.jwt.secret}") String jwtSecret,
            @Value("${efcaas.storage.presigned-url-expiry-minutes:1440}") int expiryMinutes) {
        this.secret = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.expiryMinutes = expiryMinutes;
    }

    public String gerarToken(Long checagemId, Long evidenciaId) {
        long exp = Instant.now().plusSeconds(expiryMinutes * 60L).getEpochSecond();
        String payload = checagemId + ":" + evidenciaId + ":" + exp;
        String signature = hmac(payload);
        String raw = payload + ":" + signature;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public void validar(String token, Long checagemId, Long evidenciaId) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Token de acesso ausente");
        }
        String raw = new String(Base64.getUrlDecoder().decode(token), StandardCharsets.UTF_8);
        String[] parts = raw.split(":");
        if (parts.length != 4) {
            throw new IllegalArgumentException("Token de acesso inválido");
        }

        long tokenChecagemId = Long.parseLong(parts[0]);
        long tokenEvidenciaId = Long.parseLong(parts[1]);
        long exp = Long.parseLong(parts[2]);
        String signature = parts[3];

        if (tokenChecagemId != checagemId || tokenEvidenciaId != evidenciaId) {
            throw new IllegalArgumentException("Token não corresponde à evidência solicitada");
        }
        if (Instant.now().getEpochSecond() > exp) {
            throw new IllegalArgumentException("Token de acesso expirado");
        }

        String payload = parts[0] + ":" + parts[1] + ":" + parts[2];
        if (!MessageDigest.isEqual(hmac(payload).getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Token de acesso inválido");
        }
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao assinar token de acesso", e);
        }
    }
}
