package br.com.efcaas.api.util;

import java.util.Set;
import java.util.regex.Pattern;

public final class BrValidator {

    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> BRAZILIAN_UFS = Set.of(
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
            "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO");

    private BrValidator() {}

    public static String digitsOnly(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\D", "");
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL.matcher(email.trim()).matches();
    }

    public static boolean isBrazilCountry(String pais) {
        if (pais == null || pais.isBlank()) {
            return true;
        }
        String normalized = pais.trim().toLowerCase();
        return normalized.equals("brasil") || normalized.equals("brazil") || normalized.equals("br");
    }

    public static boolean isValidCnpj(String cnpj) {
        String digits = digitsOnly(cnpj);
        if (digits.length() != 14 || digits.chars().distinct().count() == 1) {
            return false;
        }

        int[] w1 = {5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int[] w2 = {6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2};
        int d1 = checkDigit(digits.substring(0, 12), w1);
        int d2 = checkDigit(digits.substring(0, 12) + d1, w2);
        return digits.substring(12).equals("" + d1 + d2);
    }

    public static boolean isValidBrazilianPhone(String phone) {
        String digits = digitsOnly(phone);
        return digits.length() == 10 || digits.length() == 11;
    }

    public static boolean isValidBrazilianUf(String uf) {
        return uf != null && BRAZILIAN_UFS.contains(uf.trim().toUpperCase());
    }

    public static String formatCnpj(String digits) {
        String d = digitsOnly(digits);
        if (d.length() != 14) {
            return d;
        }
        return String.format("%s.%s.%s/%s-%s",
                d.substring(0, 2), d.substring(2, 5), d.substring(5, 8), d.substring(8, 12), d.substring(12));
    }

    private static int checkDigit(String base, int[] weights) {
        int sum = 0;
        for (int i = 0; i < weights.length; i++) {
            sum += Character.getNumericValue(base.charAt(i)) * weights[i];
        }
        int mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
    }
}
