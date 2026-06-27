package br.com.efcaas.api.exception;

public class DuplicateContentException extends RuntimeException {

    public DuplicateContentException(String message) {
        super(message);
    }
}
