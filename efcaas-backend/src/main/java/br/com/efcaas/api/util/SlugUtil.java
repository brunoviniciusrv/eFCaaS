package br.com.efcaas.api.util;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtil {

    private SlugUtil() {}

    public static String fromName(String name) {
        if (name == null || name.isBlank()) {
            return "agencia";
        }
        String normalized = Normalizer.normalize(name.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return slug.isBlank() ? "agencia" : slug.substring(0, Math.min(slug.length(), 60));
    }

    public static String uniqueSlug(String base, java.util.function.Predicate<String> exists) {
        String slug = base;
        int i = 1;
        while (exists.test(slug)) {
            slug = base + "-" + i++;
        }
        return slug;
    }
}
