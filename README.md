# eFCaaS — Checagem de Fatos como Serviço

Plataforma web para apoiar equipes de checagem de fatos no ciclo completo de investigação, revisão e publicação de conteúdos verificados.

> Projeto desenvolvido pelo **Squad 4** na Residência em Sistemas de Informação — UFG.

---

## Objetivo do projeto

Oferecer uma solução **eFCaaS** (*electronic Fact Checking as a Service*) que centralize o fluxo de trabalho de agências e equipes de checagem: recebimento de conteúdos suspeitos, triagem, atribuição a checadores, coleta de evidências, revisão editorial e publicação de relatórios.
A plataforma oferece integração com ferramentas de inteligência Artificial que apoiam na checagem de fatos, permitindo a extração de contéudo e apoio no processo de checagem.

---

## Estrutura do repositório

```
Squad-4/
├── README.md                 # Este arquivo
├── docker-compose.yml        # Orquestração: PostgreSQL, MinIO, API e (opcional) front-end
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
| **Back-end** | Autenticação JWT, gestão de usuários e perfis, conteúdos suspeitos, fluxo de checagem, evidências (MinIO), investigação, auditoria, dashboard, etiquetas |
| **Front-end** | Login, dashboards por perfil (admin, curador, checador), análise de conteúdo, arquivo editorial, perfil do usuário, integração com API e Gemini (rascunhos/revisão por IA) |
| **Infra** | Docker Compose com PostgreSQL 16, MinIO e API; perfil `full` inclui front-end em container |

---

## Pré-requisitos

| Ferramenta | Versão mínima | Uso |
|------------|---------------|-----|
| [Docker](https://www.docker.com/) + Docker Compose | recente | Forma recomendada de subir o ambiente |
| Java | 17+ | Back-end local (sem Docker) |
| Maven | 3.9+ | Build do back-end |
| Node.js | 20+ | Front-end local (sem Docker) |
| PostgreSQL | 16 | Banco local (sem Docker) |

---

## Como executar

### Opção 1 — Docker Compose (recomendado)

Na raiz do repositório:

```bash
# 1. Configure variáveis de ambiente
cp .env.example .env
# Edite .env se necessário (JWT_SECRET, GEMINI_API_KEY, etc.)

# 2. Suba banco, MinIO e API
docker compose up --build
```

| Serviço | URL |
|---------|-----|
| API | http://localhost:8081 |
| Swagger UI | http://localhost:8081/swagger-ui.html |
| Health check | http://localhost:8081/actuator/health |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | `localhost:5432` |

Para incluir o front-end em container:

```bash
docker compose --profile full up --build
```

Front-end disponível em http://localhost:3000.

### Opção 2 — Desenvolvimento local (back-end + front-end separados)

**Back-end** — consulte [`efcaas-backend/README.md`](efcaas-backend/README.md).

```bash
cd efcaas-backend
# Configure DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET (ver README do backend)
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

API em http://localhost:8080.

**Front-end** — consulte [`efcaas-frontend/README.md`](efcaas-frontend/README.md).

```bash
cd efcaas-frontend
cp .env.example .env.local
# Ajuste VITE_API_URL e GEMINI_API_KEY
npm install
npm run dev
```

Interface em http://localhost:3000.

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
- **API (Swagger):** http://localhost:8081/swagger-ui.html (com Docker) ou http://localhost:8080/swagger-ui.html (local)
- **Back-end:** [`efcaas-backend/README.md`](efcaas-backend/README.md)
- **Front-end:** [`efcaas-frontend/README.md`](efcaas-frontend/README.md)

---

## Squad 4

Residência em Sistemas de Informação — Universidade Federal de Goiás (UFG).
