package br.com.efcaas.api.channel.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class IngestClientInfoResolver {

    public String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public String resolveUserAgent(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }

    public String hashApiKey(String apiKey) {
        if (apiKey == null || apiKey.isBlank()) {
            return null;
        }
        return br.com.efcaas.api.channel.abuse.IngestHashUtil.sha256(apiKey);
    }
}
