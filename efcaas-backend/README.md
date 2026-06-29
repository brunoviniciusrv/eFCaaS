# efcaas-backend

Back-end REST da plataforma **eFCaaS** (Checagem de Fatos como Serviço).

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Java 17 LTS |
| Framework | Spring Boot 3.4 |
| Persistência | Spring Data JPA + Hibernate |
| Banco | PostgreSQL 16 |
| Migrações | Flyway |
| Segurança | Spring Security 6 + JWT (JJWT 0.12) |
| Documentação | Springdoc OpenAPI / Swagger UI |
| Build | Maven 3.9 |

---

## Pré-requisitos

- Java 17+ (recomendado: via [SDKMAN](https://sdkman.io))
- Maven 3.9+ **ou** Docker + Docker Compose
- Para execução local sem Docker: PostgreSQL 16, MinIO e Redis nas portas padrão (ou suba apenas a infra via compose — ver abaixo)

---

## Executar com Docker Compose (recomendado)

```bash
# Na raiz do repositório
cp .env.example .env          # ajuste as variáveis se necessário
docker compose up --build     # sobe postgres, minio, redis e api
```

Na primeira execução o Flyway cria automaticamente todas as tabelas e insere os dados iniciais (permissões, perfis e admin padrão).

| Serviço | URL / Porta |
|---------|-------------|
| API | http://localhost:8081 |
| Swagger UI | http://localhost:8081/swagger-ui.html |
| MinIO Console | http://localhost:9001 |
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |

Para subir também o front-end em container:

```bash
docker compose --profile full up --build
```

---

## Executar localmente (API fora do Docker)

### 1. Subir infraestrutura de apoio

```bash
# Na raiz do repositório
docker compose up -d postgres minio redis
```

### 2. Configure as variáveis de ambiente

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=efcaas
export DB_USER=efcaas
export DB_PASSWORD=efcaas
export JWT_SECRET=meu-secret-local-com-pelo-menos-32-caracteres
```

### 3. Compile e execute

```bash
mvn package -DskipTests
java -jar target/efcaas-api-*.jar --spring.profiles.active=dev
```

Ou no modo de desenvolvimento com hot-reload:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

API em http://localhost:8080.

O Flyway aplica as migrações automaticamente ao subir a aplicação — não é necessário rodar nenhum script SQL manualmente.

---

## Flyway — migrações

As migrações ficam em `src/main/resources/db/migration/` e são aplicadas na ordem (`V1`, `V2`, …).

| Versão | Arquivo | Conteúdo |
|---|---|---|
| V1 | `V1__baseline.sql` | Schema base |
| V2 | `V2__ajustes_schema.sql` | Ajustes de schema |
| V3 | `V3__seed_dados_iniciais.sql` | Permissões, etiquetas, perfis e admin padrão |
| V4–V28+ | `V4__…` … `V28__…` | Evolução incremental (multi-tenant, investigação, parecer, IA, etc.) |

Consulte os arquivos em `db/migration/` para o histórico completo.

---

## Endpoints principais

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | `/api/v1/auth/login` | — | Login → JWT |
| GET | `/api/v1/me` | Bearer | Usuário logado |
| PATCH | `/api/v1/me` | Bearer | Atualizar nome/bio |
| PATCH | `/api/v1/me/senha` | Bearer | Alterar senha |
| GET | `/actuator/health` | — | Health check |
| POST | `/api/v1/ingest/conteudos-recebidos` | X-Ingest-Api-Key | Ingestão externa de conteúdos |
| GET | `/api/v1/conteudos-recebidos` | Bearer | Listar conteúdos recebidos |
| GET | `/swagger-ui.html` | — | Documentação interativa |

---

## Usuário padrão (seed V3)

| Campo | Valor |
|---|---|
| E-mail | `admin@efcaas.com` |
| Senha | `Admin@2026!` |
| Perfil | Administrador (todas as permissões) |

> **Atenção:** Troque a senha do admin imediatamente após o primeiro login em produção.

---

## Variáveis de ambiente

| Variável | Padrão (dev) | Obrigatória em prod |
|---|---|---|
| `DB_HOST` | `localhost` | — |
| `DB_PORT` | `5432` | — |
| `DB_NAME` | `efcaas` | — |
| `DB_USER` | `efcaas` | ✅ |
| `DB_PASSWORD` | `efcaas` | ✅ |
| `JWT_SECRET` | valor de desenvolvimento | ✅ (min 32 chars) |
| `JWT_EXPIRATION_MINUTES` | `60` | — |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | ✅ |
| `INGEST_API_KEY` | `efcaas-ingest-dev-key` | ✅ (chave para ingestão externa) |
| `REDIS_HOST` / `REDIS_PORT` | `localhost` / `6379` | — |
| `MINIO_ENDPOINT` | `http://localhost:9000` | — |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | `efcaas` / `efcaas123456` | — |
| `PORT` | `8080` | — |

---

## API de Conteúdos Recebidos (ingestão externa)

Sistemas externos (bots, webhooks, coletores) enviam conteúdos para a plataforma via:

```
POST /api/v1/ingest/conteudos-recebidos
Header: X-Ingest-Api-Key: <INGEST_API_KEY>
```

O painel de curadoria lista e atualiza automaticamente (polling 30s) em `GET /api/v1/conteudos-recebidos`.

**Documentação completa:** [docs/CONTEUDOS_RECEBIDOS_API.md](docs/CONTEUDOS_RECEBIDOS_API.md)

---

## Estrutura do projeto

```
efcaas-backend/
├── pom.xml
├── Dockerfile
└── src/main/java/br/com/efcaas/api/
    ├── config/          # SecurityConfig, OpenApiConfig
    ├── domain/          # Entidades JPA
    ├── repository/      # Spring Data JPA
    ├── service/         # Regras de negócio (checagem, IA Guaia, …)
    ├── web/             # Controllers, DTOs, mappers
    ├── channel/         # Ingestão multi-canal (REST, WhatsApp, Telegram)
    ├── security/        # JwtUtil, JwtAuthenticationFilter
    └── exception/       # GlobalExceptionHandler (RFC 7807)
```
