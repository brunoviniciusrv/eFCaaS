# API de Conteúdos Recebidos

Documentação do contrato para integração de **fontes externas** (WhatsApp, e-mail, Telegram, monitoramento social, etc.) com a plataforma eFCaaS.

---

## Visão geral

```
┌─────────────────────┐     POST /ingest/...          ┌──────────────────┐
│  Sistema externo    │ ────────────────────────────► │  eFCaaS API      │
│  (bot, webhook,     │     X-Ingest-Api-Key          │  PostgreSQL      │
│   coletor social)   │                               └────────┬─────────┘
└─────────────────────┘                                        │
                                                                 │ GET /conteudos-recebidos
                                                                 ▼
                                                        ┌──────────────────┐
                                                        │  Painel Curador  │
                                                        │  (polling 30s)   │
                                                        └──────────────────┘
```

1. O **sistema externo** envia conteúdos via API de ingestão (sem login de usuário).
2. O **curador** visualiza na aba *Conteúdos Recebidos* (atualização automática a cada 30 segundos).
3. O curador **encaminha para triagem** ou **exclui** pelo painel.

---

## Autenticação

### Ingestão externa (sistemas de fora)

| Header | Valor |
|--------|-------|
| `X-Ingest-Api-Key` | Chave configurada em `INGEST_API_KEY` |
| `Content-Type` | `application/json` |
| `Idempotency-Key` | *(opcional)* Deduplicação quando `idMensagemExterna` não está no body |

Não utiliza JWT. A rota `/api/v1/ingest/**` é pública no Spring Security, mas protegida pela chave de ingestão.

**Rate limiting:** limites por IP, token e canal (padrão 60/120/200 req/min). Resposta `429` com `Retry-After`. Ver [ABUSE_PROTECTION.md](ABUSE_PROTECTION.md).

**Webhooks nativos:** WhatsApp e Telegram (desabilitados por padrão) — ver [CHANNEL_WHATSAPP_SETUP.md](CHANNEL_WHATSAPP_SETUP.md) e [CHANNEL_TELEGRAM_SETUP.md](CHANNEL_TELEGRAM_SETUP.md). Arquitetura: [OMNICHANNEL_ARCHITECTURE.md](OMNICHANNEL_ARCHITECTURE.md).

### Gestão interna (plataforma web)

| Header | Valor |
|--------|-------|
| `Authorization` | `Bearer <token JWT>` |

Obtido em `POST /api/v1/auth/login`. Requer permissão `manage_received` (perfil Curador ou Administrador).

---

## Variável de ambiente

| Variável | Padrão (dev) | Descrição |
|----------|--------------|-----------|
| `INGEST_API_KEY` | `efcaas-ingest-dev-key` | Chave secreta para sistemas externos |

**Produção:** defina uma chave forte e única. Exemplo no `docker-compose.yml`:

```yaml
environment:
  INGEST_API_KEY: ${INGEST_API_KEY:-sua-chave-secreta-aqui}
```

---

## 1. Ingestão — registrar conteúdo externo

Registra um novo item na fila de conteúdos recebidos.

```
POST /api/v1/ingest/conteudos-recebidos
```

### Corpo da requisição

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `titulo` | string | ✅ | Título ou assunto (máx. 500 caracteres) |
| `conteudo` | string | ✅ | Texto completo do conteúdo |
| `resumo` | string | — | Trecho curto para listagem |
| `tipoFonte` | string | ✅ | Origem (ver tabela abaixo) |
| `nomeRemetente` | string | — | Nome de quem enviou |
| `enderecoRemetente` | string | — | Telefone, e-mail ou handle |
| `linkOriginal` | string | — | URL da publicação original |
| `idMensagemExterna` | string | — | ID único na fonte (evita duplicatas) |
| `notasInternas` | string | — | Observações técnicas |
| `midias` | array | — | Anexos (vídeo, imagem, etc.) |

#### Valores de `tipoFonte`

| Valor | Exibição no painel |
|-------|-------------------|
| `whatsapp` | WhatsApp |
| `facebook` | Facebook |
| `instagram` | Instagram |
| `telegram` | Telegram |
| `email` | E-mail |
| `youtube` | YouTube |
| `reddit` | Reddit |
| `tiktok` | TikTok |
| `other` | Other |

#### Objeto `midias[]`

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `tipo` | string | ✅ | `image`, `video`, `audio` ou `document` |
| `url` | string | ✅ | URL pública do arquivo |
| `titulo` | string | — | Nome descritivo |

### Resposta `201 Created`

Retornada quando o conteúdo é **novo**.

```json
{
  "id": 1,
  "titulo": "Mensagem no Telegram sobre falta de energia",
  "conteudo": "Canais locais reportando falta de energia...",
  "resumo": "Canais locais reportando...",
  "tipoFonte": "telegram",
  "nomeRemetente": "Desconhecido",
  "enderecoRemetente": null,
  "linkOriginal": null,
  "idMensagemExterna": "tg-msg-001",
  "notasInternas": null,
  "status": "received",
  "recebidoEm": "2026-06-26T00:21:25.074675Z",
  "conteudoTriagemId": null,
  "midias": []
}
```

### Resposta `200 OK` (idempotência)

Retornada quando o par `(tipoFonte, idMensagemExterna)` já existe, ou quando o header `Idempotency-Key` corresponde a um registro anterior. O corpo é o `ConteudoRecebidoDto` existente — **sem criar duplicata**.

### Idempotência

Formas aceitas:

1. **`idMensagemExterna` no JSON** — ID nativo da plataforma de origem.
2. **Header `Idempotency-Key`** — usado como `idMensagemExterna` quando o campo não vem no body.

Em caso de corrida (dois POST simultâneos com o mesmo ID), a API trata violação de índice único como duplicata e responde `200 OK`, não `500`.

### Erros comuns

| HTTP | Causa |
|------|-------|
| `401` | `X-Ingest-Api-Key` ausente ou inválida |
| `503` | `INGEST_API_KEY` não configurada no servidor |
| `400` | JSON inválido ou `tipoFonte` não reconhecido |
| `429` | Rate limit excedido (ver `Retry-After`) |
| `409` | Conteúdo duplicado na janela anti-spam (sem ID externo) |

---

## 2. Listagem — painel do curador

```
GET /api/v1/conteudos-recebidos?status=received
Authorization: Bearer <token>
```

| Query | Padrão | Descrição |
|-------|--------|-----------|
| `status` | `received` | Filtrar por status |

Retorna array de `ConteudoRecebidoDto` (mesmo formato da ingestão).

O front-end faz **polling a cada 30 segundos** enquanto o usuário está logado com permissão `manage_received`.

---

## 3. Encaminhar para triagem

```
POST /api/v1/conteudos-recebidos/{id}/encaminhar
Authorization: Bearer <token>
```

Cria um `ConteudoSuspeito` na fila de triagem e marca o recebido como `in_triage`.

**Resposta:** `ConteudoSuspeitoDto` do novo conteúdo.

---

## 4. Excluir (arquivar)

```
DELETE /api/v1/conteudos-recebidos/{id}
Authorization: Bearer <token>
```

Marca o item como `deleted` (soft delete). Resposta: `204 No Content`.

---

## Exemplos de uso

### cURL — Telegram

```bash
curl -X POST http://localhost:8081/api/v1/ingest/conteudos-recebidos \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Api-Key: efcaas-ingest-dev-key" \
  -d '{
    "titulo": "Mensagem no Telegram sobre falta de energia",
    "conteudo": "Canais locais reportando falta de energia em 5 bairros.",
    "resumo": "Canais locais reportando...",
    "tipoFonte": "telegram",
    "nomeRemetente": "Desconhecido",
    "idMensagemExterna": "tg-msg-001"
  }'
```

### cURL — WhatsApp com mídia

```bash
curl -X POST http://localhost:8081/api/v1/ingest/conteudos-recebidos \
  -H "Content-Type: application/json" \
  -H "X-Ingest-Api-Key: efcaas-ingest-dev-key" \
  -d '{
    "titulo": "Vídeo viral sobre eleições",
    "conteudo": "Texto encaminhado no grupo...",
    "tipoFonte": "whatsapp",
    "nomeRemetente": "João Silva",
    "enderecoRemetente": "+55 41 99999-9999",
    "idMensagemExterna": "wa-msg-789",
    "midias": [
      { "tipo": "video", "url": "https://exemplo.com/video.mp4", "titulo": "video.mp4" }
    ]
  }'
```

### PowerShell (Windows)

```powershell
$body = @{
  titulo = "Denúncia por e-mail"
  conteudo = "Texto completo da denúncia..."
  tipoFonte = "email"
  nomeRemetente = "Denunciante Anônimo"
  enderecoRemetente = "denuncia@exemplo.org"
  idMensagemExterna = "mail-2026-001"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:8081/api/v1/ingest/conteudos-recebidos" `
  -Method POST `
  -Headers @{ "X-Ingest-Api-Key" = "efcaas-ingest-dev-key" } `
  -ContentType "application/json" `
  -Body $body
```

### Python

```python
import requests

response = requests.post(
    "http://localhost:8081/api/v1/ingest/conteudos-recebidos",
    headers={
        "X-Ingest-Api-Key": "efcaas-ingest-dev-key",
        "Content-Type": "application/json",
    },
    json={
        "titulo": "Post Facebook sobre nova lei",
        "conteudo": "Texto do post compartilhado...",
        "tipoFonte": "facebook",
        "nomeRemetente": "Maria Oliveira",
        "linkOriginal": "https://facebook.com/post/123",
        "idMensagemExterna": "fb-post-123",
    },
    timeout=30,
)
response.raise_for_status()
print(response.json())
```

### Node.js

```javascript
const response = await fetch('http://localhost:8081/api/v1/ingest/conteudos-recebidos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Ingest-Api-Key': process.env.INGEST_API_KEY,
  },
  body: JSON.stringify({
    titulo: 'Thread Reddit sobre saúde',
    conteudo: 'Discussão capturada no r/SaudePublica...',
    tipoFonte: 'reddit',
    idMensagemExterna: 'reddit-thread-456',
  }),
});

if (!response.ok) throw new Error(await response.text());
console.log(await response.json());
```

---

## Fluxo recomendado para integradores

1. Configure `INGEST_API_KEY` no ambiente da API e no seu sistema externo.
2. A cada mensagem/post recebido na fonte, monte o JSON e chame `POST /ingest/conteudos-recebidos`.
3. Use sempre `idMensagemExterna` com o ID nativo da plataforma (evita reenvios duplicados).
4. Envie `midias` com URLs acessíveis publicamente (HTTPS).
5. O curador verá o item em até **30 segundos** no painel (polling automático).
6. Após triagem, o item some da aba Recebidos e aparece em Publicações.

---

## Swagger

Documentação interativa disponível em:

- <http://localhost:8081/swagger-ui.html> (tag **Ingestão Externa** e **Conteúdos Recebidos**)

---

## Ciclo de vida do status

| Status | Significado |
|--------|-------------|
| `received` | Aguardando curadoria (visível na aba Recebidos) |
| `in_triage` | Encaminhado para triagem |
| `deleted` | Excluído pelo curador |
