# Deploy no Railway — eFCaaS

Guia para publicar o projeto [brunoviniciusrv/eFCaaS](https://github.com/brunoviniciusrv/eFCaaS) no [Railway](https://railway.com).

## Visão geral

| Serviço | Root Directory | Obrigatório | Descrição |
|---------|----------------|-------------|-----------|
| **PostgreSQL** | *(plugin)* | Sim | Banco de dados (Flyway roda na API) |
| **API** | `efcaas-backend` | Sim | Spring Boot — `railway.toml` + `Dockerfile` |
| **Frontend** | `efcaas-frontend` | Sim | React/Vite — `railway.toml` + `Dockerfile` |
| **MinIO** | `deploy/minio` | Recomendado | Storage S3-compatível (uploads) |
| **Redis** | *(plugin)* | Opcional | Rate limit de ingest; pode ficar desligado |

## Passo a passo no Railway

### 1. Criar projeto

1. Acesse [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo**.
2. Selecione `brunoviniciusrv/eFCaaS` (branch `main`).

### 2. PostgreSQL

1. No projeto: **+ New** → **Database** → **PostgreSQL**.
2. Anote as variáveis geradas (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`).

### 3. API (backend)

1. **+ New** → **GitHub Repo** → mesmo repositório.
2. **Settings** → **Root Directory** → `efcaas-backend`.
3. O Railway detecta `railway.toml` e usa o `Dockerfile`.
4. Em **Variables**, configure as variáveis da seção [API](#variáveis-da-api) abaixo.
5. Mapeie o Postgres (veja [Referências entre serviços](#referências-entre-serviços)).
6. **Settings** → **Networking** → **Generate Domain** (ex.: `https://efcaas-api-production.up.railway.app`).

### 4. Frontend

1. **+ New** → **GitHub Repo** → mesmo repositório.
2. **Root Directory** → `efcaas-frontend`.
3. Configure `VITE_API_URL` **antes do primeiro deploy** (build argument).
4. **Generate Domain** (ex.: `https://efcaas-web-production.up.railway.app`).
5. Volte na **API** e atualize `CORS_ORIGINS` e `FRONTEND_URL` com a URL pública do front.

### 5. MinIO (recomendado)

1. **+ New** → **GitHub Repo** → **Root Directory** → `deploy/minio`.
2. **Generate Domain** na porta **9000** (API S3).
3. Na **API**, configure `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.
4. Use os mesmos valores de `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` definidos no `deploy/minio/Dockerfile` (ou sobrescreva no Railway).

### 6. Redis (opcional)

1. **+ New** → **Database** → **Redis**.
2. Na API: `ABUSE_REDIS_ENABLED=true` e referencie `REDIS_HOST` / `REDIS_PORT`.

Para teste inicial sem Redis: `ABUSE_REDIS_ENABLED=false`.

---

## Referências entre serviços

No Railway, use **Variable Reference** (ícone de link) para apontar de um serviço a outro.

| Variável na API | Origem sugerida |
|-----------------|-----------------|
| `DB_HOST` | `${{Postgres.PGHOST}}` |
| `DB_PORT` | `${{Postgres.PGPORT}}` |
| `DB_NAME` | `${{Postgres.PGDATABASE}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `REDIS_HOST` | `${{Redis.REDIS_HOST}}` |
| `REDIS_PORT` | `${{Redis.REDIS_PORT}}` |

---

## Variáveis da API

Copie no painel **Variables** do serviço `efcaas-backend`.

### Obrigatórias

| Variável | Exemplo | Notas |
|----------|---------|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Já definido no Dockerfile |
| `PORT` | *(Railway injeta)* | Não alterar manualmente |
| `DB_HOST` | `${{Postgres.PGHOST}}` | Referência ao plugin Postgres |
| `DB_PORT` | `${{Postgres.PGPORT}}` | |
| `DB_NAME` | `${{Postgres.PGDATABASE}}` | |
| `DB_USER` | `${{Postgres.PGUSER}}` | |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` | |
| `JWT_SECRET` | *(string aleatória ≥ 32 chars)* | **Trocar** — nunca usar valor de dev |
| `CORS_ORIGINS` | `https://seu-front.up.railway.app` | URL pública do front (sem barra final) |
| `FRONTEND_URL` | `https://seu-front.up.railway.app` | Links em e-mails de aprovação |
| `API_PUBLIC_URL` | `https://sua-api.up.railway.app/api/v1` | URL pública da API + `/api/v1` |

### Storage (MinIO)

| Variável | Exemplo | Notas |
|----------|---------|-------|
| `MINIO_ENDPOINT` | `https://seu-minio.up.railway.app` | URL pública do MinIO |
| `MINIO_ACCESS_KEY` | `efcaas` | Igual ao `MINIO_ROOT_USER` |
| `MINIO_SECRET_KEY` | *(senha forte)* | Igual ao `MINIO_ROOT_PASSWORD` |
| `MINIO_BUCKET` | `efcaas-evidencias` | Criado automaticamente na subida |

### Recomendadas para teste

| Variável | Valor sugerido | Notas |
|----------|----------------|-------|
| `JWT_EXPIRATION_MINUTES` | `60` | |
| `ABUSE_REDIS_ENABLED` | `false` | `true` só com Redis provisionado |
| `INGEST_API_KEY` | *(string aleatória)* | Webhook/ingest REST |
| `INGEST_DEFAULT_TENANT_SLUG` | `dev` | Tenant padrão do seed |
| `MAIL_ENABLED` | `false` | Sem SMTP, links vão para log da API |

### E-mail (opcional)

| Variável | Exemplo |
|----------|---------|
| `MAIL_ENABLED` | `true` |
| `MAIL_FROM` | `noreply@seudominio.com` |
| `SPRING_MAIL_HOST` | `smtp.seudominio.com` |
| `SPRING_MAIL_PORT` | `587` |
| `SPRING_MAIL_USERNAME` | `...` |
| `SPRING_MAIL_PASSWORD` | `...` |
| `SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH` | `true` |

### IA Guaia (opcional)

| Variável | Notas |
|----------|-------|
| `GUAIA_BASE_URL` | Padrão: hub UFG |
| `GUAIA_USERNAME` | Credencial do hub |
| `GUAIA_PASSWORD` | Credencial do hub |

### Canais omnichannel (opcional)

| Variável | Padrão |
|----------|--------|
| `WHATSAPP_ENABLED` | `false` |
| `TELEGRAM_ENABLED` | `false` |

---

## Variáveis do Frontend

Configure no serviço `efcaas-frontend` (**antes do build**).

| Variável | Exemplo | Obrigatória |
|----------|---------|-------------|
| `VITE_API_URL` | `https://sua-api.up.railway.app/api/v1` | Sim |
| `GEMINI_API_KEY` | *(chave Google AI Studio)* | Para rascunhos/revisão por IA no browser |

> `VITE_API_URL` é injetada em **build time** via `railway.toml` → `build.args`. Após mudar, faça **Redeploy**.

---

## Variáveis do MinIO

| Variável | Padrão no Dockerfile | Notas |
|----------|----------------------|-------|
| `MINIO_ROOT_USER` | `efcaas` | Trocar em produção |
| `MINIO_ROOT_PASSWORD` | `efcaas123456` | Trocar em produção |

Exponha a porta **9000** no domínio público do Railway.

---

## Checklist rápido

- [ ] Postgres criado e referenciado na API
- [ ] API com domínio público e health em `/actuator/health`
- [ ] `JWT_SECRET` único em produção
- [ ] Front com `VITE_API_URL` apontando para a API
- [ ] `CORS_ORIGINS` e `FRONTEND_URL` com URL do front
- [ ] MinIO (ou storage compatível) para uploads
- [ ] `ABUSE_REDIS_ENABLED=false` se não houver Redis
- [ ] Redeploy do front após alterar `VITE_API_URL`

---

## Credenciais iniciais (seed)

Após o primeiro deploy, o Flyway cria o tenant `dev` e usuários de teste:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Plataforma | `platform@efcaas.com` | `Admin@2026!` |
| Admin tenant dev | `admin@efcaas.com` | `Admin@2026!` |

**Troque essas senhas** antes de expor publicamente.

---

## Ordem de deploy recomendada

```text
1. PostgreSQL
2. API  → aguardar /actuator/health OK
3. MinIO (opcional)
4. Frontend (com VITE_API_URL já definida)
5. Ajustar CORS_ORIGINS / FRONTEND_URL na API
6. Redeploy API se necessário
```

---

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Front não chama API | `VITE_API_URL` errada ou build antigo | Corrigir variável e **Redeploy** do front |
| CORS no browser | `CORS_ORIGINS` sem URL do front | Adicionar URL exata do front na API |
| Login 401 para todos | JWT/DB incorretos | Conferir Postgres e `JWT_SECRET` |
| Upload falha | MinIO inacessível | Provisionar MinIO e variáveis `MINIO_*` |
| API não sobe | Postgres não referenciado | Mapear `DB_*` com Variable Reference |
| E-mail não chega | SMTP off | `MAIL_ENABLED=false` — ver logs `[EMAIL-DEV]` na API |

---

## Arquivos de configuração

| Arquivo | Serviço |
|---------|---------|
| `efcaas-backend/railway.toml` | API |
| `efcaas-backend/Dockerfile` | API |
| `efcaas-frontend/railway.toml` | Frontend |
| `efcaas-frontend/Dockerfile` | Frontend |
| `deploy/minio/railway.toml` | MinIO |
| `deploy/minio/Dockerfile` | MinIO |
