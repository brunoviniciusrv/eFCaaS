package br.com.efcaas.api.channel.abuse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

public final class IngestHashUtil {

    private IngestHashUtil() {}

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao calcular hash", e);
        }
    }

    public static String contentHash(String tipoFonte, String titulo, String conteudo, String remetente) {
        String normalized = (tipoFonte != null ? tipoFonte : "") + "|"
                + (titulo != null ? titulo.trim().toLowerCase() : "") + "|"
                + (conteudo != null ? conteudo.trim().toLowerCase() : "") + "|"
                + (remetente != null ? remetente.trim().toLowerCase() : "");
        return sha256(normalized);
    }

    public static String fingerprint(String ip, String userAgent, String channel, String senderId) {
        String raw = (ip != null ? ip : "") + "|"
                + (userAgent != null ? userAgent : "") + "|"
                + (channel != null ? channel : "") + "|"
                + (senderId != null ? senderId : "");
        return sha256(raw);
    }
}
