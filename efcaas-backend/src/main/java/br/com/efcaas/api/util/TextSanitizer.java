package br.com.efcaas.api.util;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;

public final class TextSanitizer {

    private static final PolicyFactory POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.BLOCKS);

    private TextSanitizer() {}

    public static String sanitize(String value) {
        if (value == null) {
            return null;
        }
        return POLICY.sanitize(value.trim());
    }
}
