# Setup — Canal WhatsApp (Meta Cloud API)

Guia para habilitar o webhook oficial do WhatsApp Business na eFCaaS.

## Pré-requisitos

- Conta [Meta for Developers](https://developers.facebook.com/)
- App com produto **WhatsApp** configurado
- Número de telefone registrado no WhatsApp Business Platform

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `WHATSAPP_ENABLED` | `true` para registrar adapter e controller |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número no Graph API |
| `WHATSAPP_ACCESS_TOKEN` | Token de acesso permanente ou de sistema |
| `WHATSAPP_APP_SECRET` | App Secret (validação `X-Hub-Signature-256`) |
| `WHATSAPP_VERIFY_TOKEN` | Token arbitrário para challenge GET do webhook |

Exemplo no `docker-compose.yml`:

```yaml
environment:
  WHATSAPP_ENABLED: "true"
  WHATSAPP_PHONE_NUMBER_ID: "123456789"
  WHATSAPP_ACCESS_TOKEN: "${WHATSAPP_ACCESS_TOKEN}"
  WHATSAPP_APP_SECRET: "${WHATSAPP_APP_SECRET}"
  WHATSAPP_VERIFY_TOKEN: "meu-token-de-verificacao"
```

## Endpoints expostos

| Método | Path | Uso |
|--------|------|-----|
| `GET` | `/api/v1/webhooks/whatsapp` | Verificação Meta (`hub.verify_token`) |
| `POST` | `/api/v1/webhooks/whatsapp` | Mensagens inbound |

URL pública de callback (exemplo):

```
https://sua-api.exemplo.com/api/v1/webhooks/whatsapp
```

## Configurar webhook no Meta

1. No painel do app → **WhatsApp → Configuration → Webhook**.
2. **Callback URL:** URL acima.
3. **Verify token:** mesmo valor de `WHATSAPP_VERIFY_TOKEN`.
4. Assine o campo **messages**.
5. Meta enviará `GET` com `hub.mode=subscribe`; a API responde com `hub.challenge`.

## Segurança

- POSTs com header `X-Hub-Signature-256` são validados com HMAC-SHA256 usando `WHATSAPP_APP_SECRET`.
- Se `app-secret` estiver vazio, a assinatura não é verificada (apenas log de aviso — **não use em produção**).
- Rotas `/api/v1/webhooks/**` são `permitAll` no Spring Security; a proteção é por assinatura Meta.

## Mídia

Mensagens com imagem/vídeo/documento disparam download via Graph API (`WhatsAppMediaFetcher`) e armazenamento via `IngestMidiaService` / MinIO.

## Desabilitado por padrão

Com `WHATSAPP_ENABLED=false` (padrão), adapter e controller **não** são registrados — startup não falha por falta de credenciais.

## Testes locais

Use ngrok ou similar para expor a API local. Verifique logs com MDC `channel=WHATSAPP`.

Documentação geral: [OMNICHANNEL_ARCHITECTURE.md](OMNICHANNEL_ARCHITECTURE.md)
