package br.com.efcaas.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
public class JwtUtil {

    private final SecretKey secretKey;
    private final long expirationMillis;

    public JwtUtil(
            @Value("${efcaas.jwt.secret}") String secret,
            @Value("${efcaas.jwt.expiration-minutes:60}") long expirationMinutes) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMillis = expirationMinutes * 60 * 1000;
    }

    public String generateToken(Long userId, String email, List<String> permissoes) {
        return generateToken(userId, email, permissoes, null, null, false);
    }

    public String generateToken(
            Long userId,
            String email,
            List<String> permissoes,
            Long tenantId,
            String tenantSlug,
            boolean platformAdmin) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);

        var builder = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("permissoes", permissoes)
                .claim("platformAdmin", platformAdmin)
                .issuedAt(now)
                .expiration(expiry);

        if (tenantId != null) {
            builder.claim("tenantId", tenantId);
        }
        if (tenantSlug != null) {
            builder.claim("tenantSlug", tenantSlug);
        }

        return builder.signWith(secretKey).compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    public List<String> getPermissoes(String token) {
        return (List<String>) parseToken(token).get("permissoes");
    }

    public String getSubject(String token) {
        return parseToken(token).getSubject();
    }

    public Long getTenantId(String token) {
        return toLong(parseToken(token).get("tenantId"));
    }

    public String getTenantSlug(String token) {
        Object value = parseToken(token).get("tenantSlug");
        return value != null ? value.toString() : null;
    }

    public boolean isPlatformAdmin(String token) {
        Object value = parseToken(token).get("platformAdmin");
        return value instanceof Boolean b && b;
    }

    private static Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }
}
