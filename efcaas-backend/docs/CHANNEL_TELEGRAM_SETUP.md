# Setup — Canal Telegram Bot API

Guia para receber mensagens via webhook oficial do Telegram.

## Pré-requisitos

- Bot criado via [@BotFather](https://t.me/BotFather)
- Token do bot (`bot-token`)

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `TELEGRAM_ENABLED` | `true` para registrar adapter e controller |
| `TELEGRAM_BOT_TOKEN` | Token do BotFather |
| `TELEGRAM_SECRET_TOKEN` | Secret token opcional (header `X-Telegram-Bot-Api-Secret-Token`) |

Exemplo:

```yaml
environment:
  TELEGRAM_ENABLED: "true"
  TELEGRAM_BOT_TOKEN: "${TELEGRAM_BOT_TOKEN}"
  TELEGRAM_SECRET_TOKEN: "token-secreto-webhook"
```

## Endpoint

```
POST /api/v1/webhooks/telegram
Content-Type: application/json
X-Telegram-Bot-Api-Secret-Token: <TELEGRAM_SECRET_TOKEN>  # se configurado
```

## Registrar webhook no Telegram

Substitua `<TOKEN>` e `<URL>`:

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://sua-api.exemplo.com/api/v1/webhooks/telegram" \
  -d "secret_token=token-secreto-webhook"
```

Verificar:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

## Payload suportado

- Mensagens de texto
- Fotos, vídeos e documentos (download via `TelegramMediaFetcher`)

Updates sem `message` (ex.: `edited_message` vazio) retornam `200 OK` sem persistir (`WebhookAckOnlyException`).

## Segurança

- Se `TELEGRAM_SECRET_TOKEN` estiver definido, requisições sem header correto recebem `401`.
- Rotas webhook são públicas no Spring Security; validação é feita pelo secret token.

## Desabilitado por padrão

Com `TELEGRAM_ENABLED=false`, nenhum bean de Telegram é carregado.

Documentação geral: [OMNICHANNEL_ARCHITECTURE.md](OMNICHANNEL_ARCHITECTURE.md)
