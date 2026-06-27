# Proteção anti-abuso (ingest omnichannel)

Camada aplicada **antes** de `ConteudoRecebidoService.registrarExterno()` em todos os canais.

## Mecanismos

| Mecanismo | Chave | Comportamento |
|-----------|-------|---------------|
| Rate limit por IP | `ip:{clientIp}` | Contador por janela temporal |
| Rate limit por token | `token:{hash}` | Hash SHA-256 do `X-Ingest-Api-Key` |
| Rate limit por canal | `channel:{REST\|WHATSAPP\|...}` | Limite agregado por tipo de canal |
| Cooldown | após exceder limite | Bloqueio temporário (`Retry-After`) |
| Deduplicação de conteúdo | hash SHA-256 normalizado | Janela configurável; opcional `409 Conflict` |
| Fingerprint | IP + User-Agent + canal + remetente | Auditoria e dedup secundária |

## Configuração (`efcaas.abuse.*`)

| Propriedade | Env | Padrão | Descrição |
|-------------|-----|--------|-----------|
| `redis.enabled` | `ABUSE_REDIS_ENABLED` | `true` | Cache Redis; `false` = só PostgreSQL |
| `rate-limit.per-ip` | `ABUSE_RATE_IP` | `60` | Máx. requisições/IP/janela |
| `rate-limit.per-token` | `ABUSE_RATE_TOKEN` | `120` | Máx. por API key/janela |
| `rate-limit.per-channel` | `ABUSE_RATE_CHANNEL` | `200` | Máx. por canal/janela |
| `rate-limit.window-seconds` | `ABUSE_WINDOW` | `60` | Duração da janela |
| `rate-limit.cooldown-seconds` | `ABUSE_COOLDOWN` | `300` | Bloqueio após estourar limite |
| `duplicate.window-seconds` | `ABUSE_DUP_WINDOW` | `300` | Janela de dedup de conteúdo |
| `duplicate.reject-duplicates` | — | `true` | `true` → `409`; `false` → apenas auditoria |

## Redis + fallback PostgreSQL

- **Redis disponível:** contadores quentes e dedup em TTL.
- **Redis indisponível ou `ABUSE_REDIS_ENABLED=false`:** tabelas `ingest_rate_limit_bucket`, `ingest_content_fingerprint`, `ingest_abuse_event` (migration V16).

## Respostas HTTP (RFC 7807)

| Status | Quando | Header extra |
|--------|--------|--------------|
| `429 Too Many Requests` | Rate limit | `Retry-After` (segundos) |
| `409 Conflict` | Conteúdo duplicado (`reject-duplicates=true`) | — |
| `401 Unauthorized` | Validação de canal (ex.: secret Telegram inválido) | — |

Corpo: `ProblemDetail` via `GlobalExceptionHandler`.

## Idempotência vs deduplicação

- **Idempotência de negócio:** `(tipoFonte, idMensagemExterna)` ou header `Idempotency-Key` → `200 OK` com registro existente.
- **Anti-spam:** hash de conteúdo sem `idMensagemExterna` → rejeição ou registro em `ingest_abuse_event`.

## Observabilidade

- **Logs MDC:** `channel`
- **Métricas Micrometer:** `ingest.requests`, `ingest.blocked`, `ingest.duplicate`, `ingest.duration`
- **Auditoria:** ações `ingest_received`, `ingest_blocked`

## Docker Compose

Serviço `redis:7-alpine` no profile `full`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

Variáveis na API: `REDIS_HOST=redis`, `ABUSE_REDIS_ENABLED=true`.

Ver também: [OMNICHANNEL_ARCHITECTURE.md](OMNICHANNEL_ARCHITECTURE.md)
