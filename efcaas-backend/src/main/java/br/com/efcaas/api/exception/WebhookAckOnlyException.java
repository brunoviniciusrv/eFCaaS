package br.com.efcaas.api.exception;

/** Webhook recebido sem mensagem processável (ex.: status delivery). */
public class WebhookAckOnlyException extends RuntimeException {
    public WebhookAckOnlyException() {
        super("Webhook sem conteúdo processável");
    }
}
