# eFCaaS — Checagem de Fatos como Serviço

Plataforma web para apoiar equipes de checagem de fatos no ciclo completo de investigação, revisão e publicação de conteúdos verificados.

> Projeto desenvolvido pelo **Squad 4** na Residência em Sistemas de Informação — UFG.

---

## Objetivo do projeto

Oferecer uma solução **eFCaaS** (*electronic Fact Checking as a Service*) que centralize o fluxo de trabalho de agências e equipes de checagem: recebimento de conteúdos suspeitos, triagem, atribuição a checadores, coleta de evidências, revisão editorial e publicação de relatórios.

A plataforma integra análise de IA via hub **Guaia** (backend) e, opcionalmente, o **Trend Analyzer** com Google Gemini no front-end.

---

## Estrutura do repositório

```
Squad-4/
├── README.md                 # Este arquivo
├── docker-compose.yml        # PostgreSQL, MinIO, Redis, API e (opcional) front-end
├── .env.example              # Variáveis de ambiente para Docker e serviços
│
├── efcaas-backend/           # API REST — Spring Boot 3.4 + PostgreSQL + Flyway
│   └── README.md
│
├── efcaas-frontend/          # Interface web — React 19 + Vite + Tailwind CSS
│   └── README.md
│
├── app/                      # Espaço reservado para integração e configurações compartilhadas
│   └── README.md
│
└── docs/                     # Documentação de negócio, requisitos e modelagem (ver docs/README.md)
```

Consulte [`docs/README.md`](docs/README.md) para o índice e descrição dos documentos.

---

## O que já está implementado

| Camada | Funcionalidades |
|--------|-----------------|
| **Back-end** | Autenticação JWT, multi-tenant, gestão de usuários e perfis, conteúdos suspeitos, fluxo de checagem, evidências (MinIO), investigação, parecer PDF, auditoria, dashboard, etiquetas, ingestão externa, análise IA (Guaia) |
| **Front-end** | Login, dashboards por perfil (admin, curador, checador, editor), análise de conteúdo, parecer estruturado, preview/exportação PDF, arquivo editorial, Trend Analyzer (Gemini opcional) |
| **Infra** | Docker Compose com PostgreSQL 16, MinIO, Redis e API; perfil `full` inclui front-end em container |

---

## Pré-requisitos

| Ferramenta | Versão mínima | Uso |
|------------|---------------|-----|
| [Docker](https://www.docker.com/) + Docker Compose | recente | Forma recomendada de subir o ambiente |
| Java | 17+ | Back-end local (sem Docker) |
| Maven | 3.9+ | Build do back-end |
| Node.js | 20+ | Front-end local (sem Docker) |
| PostgreSQL / MinIO / Redis | — | Necessários apenas se rodar a API fora do Docker |

---

## Como executar

### Opção 1 — Docker Compose (recomendado)

Na raiz do repositório:

```bash
# 1. Configure variáveis de ambiente
cp .env.example .env
# Edite .env se necessário (JWT_SECRET, GEMINI_API_KEY, etc.)

# 2. Suba banco, MinIO, Redis e API
docker compose up --build
```

| Serviço | URL / Porta |
|---------|-------------|
| API | http://localhost:8081 |
| Swagger UI | http://localhost:8081/swagger-ui.html |
| Health check | http://localhost:8081/actuator/health |
| MinIO Console | http://localhost:9001 (API S3: `localhost:9000`) |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Para incluir o front-end em container:

```bash
docker compose --profile full up --build
```

Front-end disponível em http://localhost:3000 (já aponta para a API em `http://localhost:8081/api/v1`).

**Primeiro acesso:** use as [credenciais padrão](#credenciais-padrão-ambiente-de-desenvolvimento) abaixo.

### Opção 2 — Desenvolvimento local (back-end + front-end separados)

#### 2.1 Infraestrutura de apoio

A API depende de PostgreSQL, MinIO (evidências) e Redis (rate limit). A forma mais simples é subir só esses serviços via Docker:

```bash
# Na raiz do repositório
docker compose up -d postgres minio redis
```

Alternativa: instalar PostgreSQL 16, MinIO e Redis manualmente nas portas padrão.

#### 2.2 Back-end

```bash
cd efcaas-backend

# Variáveis mínimas (PowerShell)
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="efcaas"
$env:DB_USER="efcaas"
$env:DB_PASSWORD="efcaas"
$env:JWT_SECRET="meu-secret-local-com-pelo-menos-32-caracteres"

mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

API em http://localhost:8080.

Detalhes: [`efcaas-backend/README.md`](efcaas-backend/README.md).

#### 2.3 Front-end

```bash
cd efcaas-frontend
cp .env.example .env.local
```

| Cenário | `VITE_API_URL` em `.env.local` |
|---------|--------------------------------|
| API no Docker (`docker compose up`) | `http://localhost:8081/api/v1` |
| API local (`mvn spring-boot:run`) | `http://localhost:8080/api/v1` |

```bash
npm install
npm run dev
```

Interface em http://localhost:3000.

Detalhes: [`efcaas-frontend/README.md`](efcaas-frontend/README.md).

### Opção 3 — Railway (deploy online)

Guia completo, checklist de variáveis e arquivos `railway.toml`:

- [`docs/railway-deploy.md`](docs/railway-deploy.md)
- [`.env.railway.example`](.env.railway.example) — template para colar no painel

---

## Credenciais padrão (ambiente de desenvolvimento)

Inseridas automaticamente pelo Flyway (`V3__seed_dados_iniciais.sql`):

| Campo | Valor |
|-------|-------|
| E-mail | `admin@efcaas.com` |
| Senha | `Admin@2026!` |
| Perfil | Administrador |

---

## Documentação

- **Requisitos e modelagem:** [`docs/`](docs/)
- **API (Swagger):** http://localhost:8081/swagger-ui.html (Docker) ou http://localhost:8080/swagger-ui.html (local)
- **Back-end:** [`efcaas-backend/README.md`](efcaas-backend/README.md)
- **Front-end:** [`efcaas-frontend/README.md`](efcaas-frontend/README.md)

---

## Squad 4

Residência em Sistemas de Informação — Universidade Federal de Goiás (UFG).
