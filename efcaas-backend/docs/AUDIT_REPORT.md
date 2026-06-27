# Relatório de Auditoria Técnica — eFCaaS

**Data:** 2026-06-27  
**Escopo:** Backend Spring Boot, frontend React, Docker, banco, segurança, testes e CI  
**Validador:** Arquiteto/Engenheiro Sênior (auditoria automatizada + evidência de runtime)

---

## Resumo executivo

| Critério | Status |
|----------|--------|
| Build Maven (`mvn verify`) | ✅ 38 testes, 0 falhas |
| Docker stack (`docker compose --profile full up`) | ✅ 5 containers operacionais |
| Smoke E2E (`scripts/smoke-test.ps1`) | ✅ 9/9 cenários OK |
| Frontend lint + build | ✅ OK (warning de bundle size) |
| Código morto crítico | ✅ Não identificado |
| Dependências não utilizadas | ✅ Removidas (Testcontainers, WireMock) |
| Reestruturação total de pacotes | ⏸ Adiada (risco de regressão) |
| Pronto para homologação | ✅ Sim, com ressalvas documentadas |

---

## 1. Problemas encontrados

### 1.1 Corrigidos nesta auditoria

| # | Problema | Severidade | Evidência |
|---|----------|------------|-----------|
| 1 | Dependências Maven declaradas sem uso (`testcontainers`, `wiremock-standalone`) | Baixa | Grep em `src/test` — zero referências |
| 2 | Smoke test não reexecutado após Docker subir (sessão anterior) | Média | Script falhava com API offline |
| 3 | Documentação de arquitetura desatualizada sobre deps de teste | Baixa | `ARCHITECTURE_PRODUCTION_ASSESSMENT.md` |

### 1.2 Corrigidos em sessões anteriores (Fase 1 omnichannel)

| # | Problema | Correção |
|---|----------|----------|
| 4 | Lombok não processava no JDK 26 local | Lombok 1.18.46 + `annotationProcessorPaths` |
| 5 | Rate limit retornava 500 (transação) | `@Transactional` em `RateLimitService` |
| 6 | Idempotência inconsistente | `applyIdempotencyKey` antes do anti-abuso |
| 7 | `WhatsAppMediaFetcher` com `ObjectMapper` órfão | Campo removido |
| 8 | Teste auth `/me` sem token esperava 401 | Ajustado para 403 (Spring Security) |

### 1.3 Pendentes / aceitos (não bloqueiam homologação)

| # | Item | Recomendação |
|---|------|--------------|
| 1 | Reestruturação de pacotes para layout `controller/service/domain/dto` separados | Incremental por bounded context |
| 2 | Pacote `stub/IaService` — nome confunde com mock | Renomear para `integration.port` |
| 3 | `Prototipo/` e `node_modules/` na raiz do repo | Arquivar ou adicionar ao `.gitignore` global |
| 4 | MinIO sem healthcheck no `docker-compose.yml` | Adicionar quando depender de readiness |
| 5 | JWT secret default em Docker dev | Obrigatório trocar em produção |
| 6 | Bundle frontend > 500 kB | Code-splitting futuro |
| 7 | Testes E2E frontend automatizados | Playwright/Cypress em CI |
| 8 | `mvn clean` falha no Windows com Docker rodando | Lock de arquivos em `target/` — usar `verify` sem `clean` |

---

## 2. Arquivos modificados nesta auditoria

| Arquivo | Alteração |
|---------|-----------|
| `efcaas-backend/pom.xml` | Remoção de Testcontainers e WireMock |
| `efcaas-backend/docs/ARCHITECTURE_PRODUCTION_ASSESSMENT.md` | Atualização status deps |
| `efcaas-backend/docs/AUDIT_REPORT.md` | Este relatório |

---

## 3. Estrutura atual do projeto

### 3.1 Backend (`efcaas-backend/src/main/java/br/com/efcaas/api/`)

```
api/
├── EfcaasApiApplication.java
├── channel/          # Omnichannel (REST, WA, TG, anti-abuso, observabilidade)
├── config/           # Properties, Redis, OpenAPI, Ingest
├── domain/           # Entidades JPA (incl. abuse tables V16)
├── exception/        # GlobalExceptionHandler
├── repository/       # Spring Data JPA
├── security/         # JWT, IngestApiKey, UserDetails, SecurityHeaders
├── service/          # Regras de negócio
├── stub/             # IaService (porta — implementação: IaRealService)
└── web/              # Controllers REST + DTOs + mappers
```

**174 classes Java** no `main`. A estrutura segue **monólito modular** com bounded contexts identificáveis; não foi aplicada migração big-bang para o layout sugerido no briefing (risco alto com 174 classes e contratos REST estáveis).

### 3.2 Frontend (`efcaas-frontend/`)

React 19 + Vite, componentes por view (Dashboard, Analysis, Login, etc.), serviço Gemini opcional.

### 3.3 Infraestrutura

| Artefato | Local |
|----------|-------|
| `docker-compose.yml` | Raiz — postgres, redis, minio, api, frontend (profile `full`) |
| `efcaas-backend/Dockerfile` | Multi-stage Maven 17 → JRE, usuário não-root |
| Flyway | V1–V16 em `src/main/resources/db/migration/` |
| CI | `.github/workflows/ci.yml` — backend `mvn verify`, frontend `tsc` |
| Smoke E2E | `scripts/smoke-test.ps1` |

---

## 4. Dependências removidas

| Dependência | Motivo |
|-------------|--------|
| `org.testcontainers:junit-jupiter` | Zero uso em testes |
| `org.testcontainers:postgresql` | Zero uso em testes |
| `org.wiremock:wiremock-standalone` | Zero uso em testes |
| Propriedade `testcontainers.version` | Órfã após remoção |

**Nota:** Reintroduzir Testcontainers/WireMock quando implementar testes de integração com PostgreSQL real ou mocks HTTP para fetch de mídia WhatsApp.

---

## 5. Melhorias arquiteturais (já implementadas)

| Melhoria | Descrição |
|----------|-----------|
| Camada omnichannel | `CommunicationChannel` + factory + adapters desacoplados |
| Anti-abuso | Rate limit, dedup, cooldown — Redis + fallback PostgreSQL |
| Idempotência | Header `Idempotency-Key`, 201 vs 200, race-safe |
| Observabilidade ingest | MDC + Micrometer por canal |
| Segurança ingest | API Key, sanitização OWASP, headers de segurança |
| Webhooks condicionais | `@ConditionalOnProperty` para WA/TG |

---

## 6. Melhorias de desempenho

| Área | Estado |
|------|--------|
| N+1 queries | Não auditado exaustivamente; sem alertas em testes |
| Rate limit Redis | ✅ Ativo no profile Docker `full` |
| Cache dedup | ✅ Fingerprint hash + Redis |
| Dockerfile cache | ✅ `dependency:go-offline` antes do `COPY src` |
| Frontend bundle | ⚠️ 1.68 MB JS — considerar lazy routes |

---

## 7. Melhorias de segurança

| Controle | Status |
|----------|--------|
| JWT + Spring Security | ✅ |
| Ingest API Key (`X-Ingest-Api-Key`) | ✅ |
| CORS configurável | ✅ |
| Rate limit / dedup ingest | ✅ |
| Webhook HMAC (Meta/Telegram) | ✅ quando habilitados |
| OWASP HTML sanitizer | ✅ |
| Security headers filter | ✅ |
| Usuário não-root no container | ✅ |
| Secrets default em dev | ⚠️ Documentar rotação obrigatória em prod |

---

## 8. Logs

| Verificação | Resultado |
|-------------|-----------|
| `System.out.println` em `src/main` | ✅ Nenhum |
| Instrumentação debug temporária | ✅ Nenhuma |
| Logging estruturado (SLF4J) | ✅ Padrão Spring |

---

## 9. Banco de dados

| Item | Detalhe |
|------|---------|
| Migrações Flyway | V1–V16, sequenciais |
| V16 omnichannel | `ingest_abuse_event`, `ingest_content_fingerprint`, `ingest_rate_limit_bucket` |
| Seed dev | V3 + usuário curador para testes |
| Scripts legados | `docs/scripts-criacao-banco-efcaas.sql` — referência histórica, Flyway é fonte da verdade |

---

## 10. Cobertura de testes

### 10.1 Unitários e integração (Maven)

| Classe de teste | Foco |
|-----------------|------|
| `IngestHashUtilTest` | Hash utilitário |
| `CommunicationChannelFactoryTest` | Factory de canais |
| `ChannelMessageMapperTest` | Mapeamento mensagens |
| `RestApiChannelAdapterTest` | Adapter REST |
| `WhatsAppBusinessChannelAdapterTest` | Adapter WA |
| `TelegramBotChannelAdapterTest` | Adapter TG |
| `RateLimitServiceIntegrationTest` | Rate limit |
| `DuplicateDetectionServiceIntegrationTest` | Dedup |
| `ConteudoRecebidoIngestIntegrationTest` | Ingest REST MockMvc |
| `DuplicateContentIngestIntegrationTest` | Duplicata |
| `RateLimitIngestIntegrationTest` | 429 |
| `WhatsAppWebhookIntegrationTest` | Webhook verify |
| `TelegramWebhookIntegrationTest` | Webhook TG |
| `AuthIntegrationTest` | Login JWT, `/me` |
| `TriagemFlowIntegrationTest` | Ingest → encaminhar triagem |
| `EfcaasApiApplicationTests` | Context load |

**Total: 38 testes, 0 falhas** (`mvn verify`, 2026-06-27).

Perfil de teste: H2 in-memory, Redis autoconfigure excluído, abuse com fallback PostgreSQL/H2.

### 10.2 End-to-end (Docker + smoke script)

| Cenário | Resultado |
|---------|-----------|
| Health `/actuator/health` | OK |
| Ingest REST 201 | OK |
| Idempotência 200 | OK |
| Ingest sem API key 401 | OK |
| Login curador + JWT | OK |
| GET `/me` autenticado | OK |
| Listar conteúdos recebidos | OK |
| Encaminhar para triagem | OK |
| WhatsApp webhook verify | OK |

### 10.3 Docker

```
efcaas-postgres   healthy
efcaas-redis      healthy
efcaas-minio      up
efcaas-backend    healthy
efcaas-frontend   up (profile full)
```

Comando: `docker compose --profile full up -d --build`

---

## 11. Build final

| Comando | Resultado |
|---------|-----------|
| `mvn verify` (efcaas-backend) | ✅ BUILD SUCCESS |
| `mvn clean verify` | ⚠️ Falha no Windows (lock em `target/` com Docker ativo) |
| `npm run lint` (efcaas-frontend) | ✅ OK |
| `npm run build` (efcaas-frontend) | ✅ OK |
| Docker build + up | ✅ OK |

---

## 12. Observações para evolução futura

1. **Microsserviços:** Extrair primeiro o bounded context `channel.*` (ingest) quando houver escala/equipe dedicada.
2. **Testcontainers:** Adicionar testes de contrato PostgreSQL + Redis reais no CI antes de extrair serviços.
3. **Observabilidade produção:** Prometheus/Grafana, tracing distribuído (OpenTelemetry).
4. **Secrets:** Vault ou variáveis injetadas pelo orchestrator; nunca `JWT_SECRET` default em prod.
5. **Frontend E2E:** Playwright no CI contra stack Docker.
6. **Renomeação `stub` → `integration.port`:** Baixo risco, alto ganho de clareza.
7. **MinIO healthcheck:** Adicionar ao `depends_on` da API se uploads falharem na subida.
8. **Code-splitting frontend:** Reduzir bundle inicial abaixo de 500 kB.

---

## 13. Conclusão

O projeto **atende aos critérios de homologação** com arquitetura modular consistente, Docker operacional, APIs validadas por testes automatizados e smoke E2E. A reestruturação física completa de pacotes e a extração de microsserviços foram **deliberadamente adiadas** para evitar regressões em 174 classes e contratos REST estáveis.

**Próximo passo recomendado:** deploy em ambiente de homologação com secrets de produção, monitoramento e rotação de credenciais.
