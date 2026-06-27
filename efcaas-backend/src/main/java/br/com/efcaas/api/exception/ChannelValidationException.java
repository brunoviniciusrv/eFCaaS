package br.com.efcaas.api.exception;

public class ChannelValidationException extends RuntimeException {

    public ChannelValidationException(String message) {
        super(message);
    }
}
