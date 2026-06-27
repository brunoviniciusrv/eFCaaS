package br.com.efcaas.api.exception;

import br.com.efcaas.api.exception.ChannelValidationException;
import br.com.efcaas.api.exception.DuplicateContentException;
import br.com.efcaas.api.exception.RateLimitExceededException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import java.util.NoSuchElementException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tratamento global de erros seguindo RFC 7807 (Problem Details for HTTP APIs).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        pd.setTitle("Autenticação falhou");
        pd.setType(URI.create("https://efcaas.com/errors/unauthorized"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(DisabledException.class)
    public ProblemDetail handleDisabled(DisabledException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Usuário suspenso");
        pd.setTitle("Conta desativada");
        pd.setType(URI.create("https://efcaas.com/errors/account-disabled"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Permissão insuficiente para esta operação");
        pd.setTitle("Acesso negado");
        pd.setType(URI.create("https://efcaas.com/errors/forbidden"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ProblemDetail handleNotFound(NoSuchElementException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Recurso não encontrado");
        pd.setType(URI.create("https://efcaas.com/errors/not-found"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ProblemDetail> handleRateLimit(RateLimitExceededException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
        pd.setTitle("Limite de requisições excedido");
        pd.setType(URI.create("https://efcaas.com/errors/rate-limit"));
        pd.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(ex.retryAfterSeconds()))
                .body(pd);
    }

    @ExceptionHandler(DuplicateContentException.class)
    public ProblemDetail handleDuplicate(DuplicateContentException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Conteúdo duplicado");
        pd.setType(URI.create("https://efcaas.com/errors/duplicate"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(ChannelValidationException.class)
    public ProblemDetail handleChannelValidation(ChannelValidationException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        pd.setTitle("Validação de canal falhou");
        pd.setType(URI.create("https://efcaas.com/errors/channel-validation"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        pd.setTitle("Requisição inválida");
        pd.setType(URI.create("https://efcaas.com/errors/bad-request"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @ExceptionHandler(IllegalStateException.class)
    public ProblemDetail handleIllegalState(IllegalStateException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setTitle("Conflito de estado");
        pd.setType(URI.create("https://efcaas.com/errors/conflict"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    @Override
    protected ResponseEntity<Object> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.PAYLOAD_TOO_LARGE, "Arquivo excede o limite de 200 MB.");
        pd.setTitle("Arquivo muito grande");
        pd.setType(URI.create("https://efcaas.com/errors/payload-too-large"));
        pd.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(pd);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {

        Map<String, String> erros = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "inválido",
                        (existing, replacement) -> existing,
                        LinkedHashMap::new
                ));

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNPROCESSABLE_ENTITY, "Dados de entrada inválidos");
        pd.setTitle("Validação falhou");
        pd.setType(URI.create("https://efcaas.com/errors/validation"));
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("campos", erros);

        return ResponseEntity.unprocessableEntity().body(pd);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        logger.error("Erro não tratado", ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno. Por favor, tente novamente.");
        pd.setTitle("Erro interno");
        pd.setType(URI.create("https://efcaas.com/errors/internal"));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
