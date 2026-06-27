# Arquitetura Omnichannel eFCaaS

A ingestão de conteúdos externos evoluiu de um endpoint REST monolítico para uma arquitetura **omnichannel desacoplada**, preservando o contrato existente e centralizando regras de negócio em `ConteudoRecebidoService`.

## Visão geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        Ingress (adapters)                        │
│  RestApiChannelAdapter │ WhatsAppBusinessAdapter │ TelegramBot  │
└────────────┬────────────────────┬────────────────────┬──────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              CommunicationChannelFactory                         │
│              InboundMessageProcessor                             │
│              ChannelMessageMapper                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              AbuseProtectionService                              │
│              RateLimitService │ DuplicateDetectionService        │
│              Redis (cache) + PostgreSQL (fallback/audit)         │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│              ConteudoRecebidoService.registrarExterno()            │
│              (único ponto de persistência de negócio)            │
└─────────────────────────────────────────────────────────────────┘
```

## Pacotes

| Pacote | Responsabilidade |
|--------|------------------|
| `br.com.efcaas.api.channel.core` | Contratos (`CommunicationChannel`, `ChannelContext`, `ChannelInboundMessage`), factory e orquestrador |
| `br.com.efcaas.api.channel.adapter.rest` | Adapter REST (contrato legado) |
| `br.com.efcaas.api.channel.adapter.whatsapp` | Webhook Meta Cloud API |
| `br.com.efcaas.api.channel.adapter.telegram` | Webhook Bot API |
| `br.com.efcaas.api.channel.abuse` | Rate limit, deduplicação, fingerprints |
| `br.com.efcaas.api.channel.observability` | MDC, métricas Micrometer |

## Fluxo de uma mensagem

1. **Adapter** valida autenticação/assinatura do canal e faz parse para `ChannelInboundMessage`.
2. **InboundMessageProcessor** aplica `Idempotency-Key`, executa anti-abuso e mapeia para `IngestConteudoRecebidoRequest`.
3. **ConteudoRecebidoService** persiste (ou retorna duplicata idempotente).
4. **Auditoria** registra `ingest_received` ou `ingest_blocked`.

Adapters **não** contêm regra de triagem, encaminhamento ou curadoria.

## Canais suportados (Fase 1)

| Canal | Endpoint | Habilitação |
|-------|----------|-------------|
| REST | `POST /api/v1/ingest/conteudos-recebidos` | Sempre |
| WhatsApp | `GET/POST /api/v1/webhooks/whatsapp` | `WHATSAPP_ENABLED=true` |
| Telegram | `POST /api/v1/webhooks/telegram` | `TELEGRAM_ENABLED=true` |

Enums reservados para Fase 2: `INSTAGRAM`, `EMAIL`, `EMBED_FORM`.

## Como adicionar um novo canal

1. Criar adapter implementando `CommunicationChannel` em `channel.adapter.<canal>`.
2. Registrar como `@Component` (use `@ConditionalOnProperty` se depender de credenciais).
3. Mapear payload externo → `ChannelInboundMessage` (campos canônicos).
4. Expor controller webhook ou reutilizar ingest REST.
5. Adicionar testes unitários de parse/validate e integração MockMvc.
6. Documentar setup em `docs/CHANNEL_<CANAL>_SETUP.md`.

## Configuração

Ver `application.yml` (`efcaas.abuse.*`, `efcaas.channels.*`) e [ABUSE_PROTECTION.md](ABUSE_PROTECTION.md).

## Documentação relacionada

- [CONTEUDOS_RECEBIDOS_API.md](CONTEUDOS_RECEBIDOS_API.md) — contrato REST
- [CHANNEL_WHATSAPP_SETUP.md](CHANNEL_WHATSAPP_SETUP.md)
- [CHANNEL_TELEGRAM_SETUP.md](CHANNEL_TELEGRAM_SETUP.md)
- [ABUSE_PROTECTION.md](ABUSE_PROTECTION.md)
