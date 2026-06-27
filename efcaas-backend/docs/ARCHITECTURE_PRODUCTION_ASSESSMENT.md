# Avaliação arquitetural e roadmap de produção — eFCaaS

Documento de auditoria (baseline pós-Fase 1 omnichannel) e plano de evolução para produção.

**Validação runtime (2026-06-27):** `mvn verify` no `efcaas-backend` — **38 testes, 0 falhas** (inclui auth JWT + fluxo ingest→encaminhar triagem).

---

## 1. Estado atual

| Componente | Tecnologia | Observação |
|------------|------------|------------|
| Backend | Spring Boot 3.4, Java 17 | Monólito modular (~174 classes Java) |
| Frontend | React 19 + Vite | SPA consumindo REST `/api/v1` |
| Banco | PostgreSQL 16 + Flyway V1–V16 | Schema único compartilhado |
| Cache | Redis 7 (profile `full`) | Rate limit / dedup ingest |
| Storage | MinIO (S3) | Evidências e mídias |
| IA (backend) | Guaia IA Hub (`IaRealService`) | Implementação real via HTTP |
| IA (frontend) | Gemini (`geminiService.ts`) | Opcional; degrada se `GEMINI_API_KEY` ausente |
| Ingest | Omnichannel (REST + WA/TG webhooks) | Ver `OMNICHANNEL_ARCHITECTURE.md` |

**Decisão arquitetural:** manter **monólito modular desacoplado** na Fase atual. Microsserviços físicos só se justificam após métricas de escala, equipes independentes e infra de deploy (K8s, service mesh, observabilidade distribuída).

---

## 2. Bounded contexts (domínios)

```
┌─────────────────────────────────────────────────────────────────┐
│                     efcaas-backend (monólito)                    │
├─────────────┬─────────────┬──────────────┬────────────────────┤
│ Identity    │ Ingest      │ Triage       │ Investigation        │
│ AuthService │ channel.*   │ Conteudo     │ ChecagemService      │
│ Usuario*    │ Conteudo    │ Suspeito*    │ Investigacao*        │
│ JWT/Security│ Recebido*   │              │ Parecer*             │
├─────────────┼─────────────┼──────────────┼────────────────────┤
│ Publication │ Storage     │ Audit        │ Agency Config        │
│ Relatorio*  │ Storage*    │ Auditoria*   │ ConfiguracaoAgencia* │
│ Etiqueta*   │ IngestMidia*│              │                      │
└─────────────┴─────────────┴──────────────┴────────────────────┘
```

| Contexto | Controllers | Persistência | Candidato a microsserviço? |
|----------|-------------|--------------|----------------------------|
| **Identity & Access** | `AuthController`, `UsuarioController` | `usuario`, `tipo_usuario`, permissões | Fase 2 — alto acoplamento transacional hoje |
| **Ingest / Omnichannel** | `ConteudoRecebidoIngestController`, webhooks WA/TG | `conteudo_recebido`, abuse tables | Fase 2 — já desacoplado via `channel.*` |
| **Triage** | `ConteudoRecebidoController`, `ConteudoSuspeitoController` | `conteudo_recebido`, `conteudo_suspeito` | Fase 3 |
| **Investigation** | `ChecagemController` | `checagem`, `investigacao`, `parecer`, `revisao` | Fase 3 |
| **Publication** | `RelatorioPublicacaoController`, `EtiquetaController` | `relatorio_publicacao`, `etiqueta` | Fase 4 |
| **Storage** | `IngestMidiaController` (parcial) | MinIO + metadados | Fase 2 — API S3 isolável |
| **Audit** | (transversal) | `auditoria` | Fase 2 — event-driven ideal |

---

## 3. Auditoria — código morto e fictício

| Item | Status | Ação recomendada |
|------|--------|------------------|
| `stub/IaService.java` | **Porta (interface)**, não mock | Renomear pacote para `port` ou `integration` (cosmético) |
| `IaRealService` | Implementação real Guaia | Manter |
| `Prototipo/` (raiz repo) | Não rastreado / duplicado | Remover do repo ou mover para branch archive |
| `node_modules/` na raiz | Playwright solto, não no `.gitignore` global | Adicionar ao `.gitignore`; usar devDependency no projeto certo |
| WhatsApp simulator (frontend) | **Removido** | — |
| `geminiService.ts` | IA auxiliar editor (não core) | Manter; documentar como opcional |
| WireMock / Testcontainers no `pom.xml` | **Removidos** (2026-06-27) | Reintroduzir quando houver testes de mídia WA/TG com containers |

**Não encontrado:** FakeService ativo no backend, endpoints obsoletos óbvios, ou simuladores de ingest no frontend.

---

## 4. Segurança (checklist)

| Controle | Status |
|----------|--------|
| JWT + Spring Security | ✅ |
| Ingest API Key | ✅ |
| Rate limit ingest | ✅ (Redis + PG) |
| Webhook signature (Meta/Telegram) | ✅ (quando habilitados) |
| HTML sanitization (ingest) | ✅ OWASP |
| Security headers filter | ✅ |
| CORS configurável | ✅ |
| Auditoria ingest | ✅ |
| CSRF | N/A (API stateless JWT) |
| Multi-tenant API keys | ❌ Fase 2 |

---

## 5. Testes — cobertura atual

| Camada | Arquivos | Escopo |
|--------|----------|--------|
| Unitários | 8 classes em `channel/` | Hash, factory, adapters, mapper |
| Integração MockMvc | 5 classes | Ingest 201/200/401/429/409, webhooks |
| Integração Spring | 2 classes | Rate limit, dedup |
| Context load | 1 | `EfcaasApiApplicationTests` |
| **Auth + triagem E2E** | ✅ | `AuthIntegrationTest`, `TriagemFlowIntegrationTest` |
| **Frontend** | ❌ | Sem testes automatizados |

---

## 6. Roadmap recomendado (não executar tudo de uma vez)

### Fase A — Estabilização (1–2 sprints) ✅ parcialmente feito
- [x] Omnichannel ingest + anti-abuso
- [x] Testes integração auth + triagem (encaminhar)
- [x] `.gitignore` raiz (node_modules, debug logs)
- [x] CI GitHub Actions: `mvn verify` + `npm run lint` (`.github/workflows/ci.yml`)
- [ ] Smoke manual: `docker compose --profile full` (requer Docker Desktop)

### Fase B — Modular monolith (2–3 sprints)
- Reorganizar pacotes por bounded context (`identity`, `ingest`, `triage`, …)
- Extrair ports/adapters explícitos (Hexagonal)
- Eventos internos Spring (`ApplicationEvent`) para auditoria desacoplada

### Fase C — Extração seletiva (quando houver demanda)
1. **Ingest Service** — já isolado em `channel.*`
2. **Storage Service** — MinIO + presigned URLs
3. **Identity Service** — JWT issuance + usuários
4. Demais domínios permanecem no monólito até volume/equipe justificar

### Fase D — Mensageria (opcional)
- RabbitMQ/Kafka para ingest assíncrono, notificações, audit fan-out
- **Não implementado** — plano omnichannel manteve ingest síncrono de propósito

---

## 7. Comunicação entre módulos (hoje)

Toda comunicação é **in-process** (injeção Spring). Contratos externos:

| API | Documentação |
|-----|--------------|
| REST `/api/v1/*` | Swagger `/swagger-ui.html` |
| Ingest externo | `CONTEUDOS_RECEBIDOS_API.md` |
| Webhooks | `CHANNEL_*_SETUP.md` |

---

## 8. Variáveis de ambiente críticas (produção)

Ver `docker-compose.yml` e `application.yml`: `JWT_SECRET`, `INGEST_API_KEY`, `DB_*`, `MINIO_*`, `REDIS_HOST`, `ABUSE_*`, `WHATSAPP_*`, `TELEGRAM_*`, `GUAIA_*`.

---

## 9. Conclusão

O sistema **compila, testa e inicia** com arquitetura omnichannel Fase 1 entregue. A migração para microsserviços **não deve ser big-bang**: o monólito já possui separação lógica (`channel.*`, serviços por domínio) preparada para extração gradual.

Próximo passo concreto sugerido: **expandir testes de integração** para auth + fluxo curador (encaminhar triagem) antes de qualquer split físico de serviços.
