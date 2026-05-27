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
- PostgreSQL 16 rodando (ou use o Docker Compose)

---

## Executar com Docker Compose (recomendado)

```bash
# Na raiz do repositório (eFCaaS/)
cp .env.example .env          # ajuste as variáveis se necessário
docker compose up --build     # sobe postgres + api
```

Na primeira execução o Flyway cria automaticamente todas as tabelas e insere os dados iniciais (permissões, perfis e admin padrão).

A API ficará disponível em <http://localhost:8080>.

Para subir também o front-end em container:

```bash
docker compose --profile full up --build
```

---

## Executar localmente (sem Docker)

### 1. Configure as variáveis de ambiente

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=efcaas
export DB_USER=efcaas
export DB_PASSWORD=efcaas
export JWT_SECRET=meu-secret-local-com-pelo-menos-32-caracteres
```

### 2. Compile e execute

```bash
mvn package -DskipTests
java -jar target/efcaas-api-*.jar --spring.profiles.active=dev
```

Ou no modo de desenvolvimento com hot-reload:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

O Flyway aplica as migrações automaticamente ao subir a aplicação — não é necessário rodar nenhum script SQL manualmente.

---

## Flyway — migrações

| Versão | Arquivo | Conteúdo |
|---|---|---|
| V1 | `V1__baseline.sql` | Cria todas as 14 tabelas do schema base |
| V2 | `V2__ajustes_schema.sql` | Ampliar senha, adicionar colunas de status/prioridade |
| V3 | `V3__seed_dados_iniciais.sql` | 18 permissões, 6 etiquetas, 4 perfis, 1 admin padrão |

---

## Endpoints principais (Fase 0)

| Método | Endpoint | Auth | Descrição |
|---|---|---|---|
| POST | `/api/v1/auth/login` | — | Login → JWT |
| GET | `/api/v1/me` | Bearer | Usuário logado |
| PATCH | `/api/v1/me` | Bearer | Atualizar nome/bio |
| PATCH | `/api/v1/me/senha` | Bearer | Alterar senha |
| GET | `/actuator/health` | — | Health check |
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
| `PORT` | `8080` | — |

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
    ├── service/         # Regras de negócio
    ├── web/             # Controllers, DTOs, mappers
    │   └── dto/
    ├── security/        # JwtUtil, JwtAuthenticationFilter, UserDetailsService
    ├── stub/            # IaService interface + IaStubService (MVP)
    └── exception/       # GlobalExceptionHandler (RFC 7807)
```

---

## Próximos passos (Fase 1)

- CRUD `ConteudoSuspeito` e fluxo `Checagem` ponta a ponta
- Evidências, Parecer e Revisão persistidos
- Dashboard com métricas reais
- Stubs de IA integrados aos controllers de checagem
