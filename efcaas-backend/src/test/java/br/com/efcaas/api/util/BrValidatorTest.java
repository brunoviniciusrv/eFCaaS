package br.com.efcaas.api.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class BrValidatorTest {

    @Test
    void validCnpj() {
        assertThat(BrValidator.isValidCnpj("11.444.777/0001-61")).isTrue();
        assertThat(BrValidator.isValidCnpj("11222333000181")).isTrue();
    }

    @Test
    void invalidCnpj() {
        assertThat(BrValidator.isValidCnpj("11.111.111/1111-11")).isFalse();
        assertThat(BrValidator.isValidCnpj("123")).isFalse();
    }

    @Test
    void validPhone() {
        assertThat(BrValidator.isValidBrazilianPhone("(62) 99999-8888")).isTrue();
        assertThat(BrValidator.isValidBrazilianPhone("6233334444")).isTrue();
    }

    @Test
    void validUf() {
        assertThat(BrValidator.isValidBrazilianUf("go")).isTrue();
        assertThat(BrValidator.isValidBrazilianUf("XX")).isFalse();
    }
}
