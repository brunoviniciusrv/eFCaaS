
---

# Oportunidades de Refatoração — eFCaaS Backend (Spring Boot)

Levantamento das principais melhorias identificadas no backend Java. O projeto já tem pontos sólidos: `@RestControllerAdvice` com RFC 7807 `ProblemDetail`, `@Transactional` nos serviços, `open-in-view: false` e configuração externalizada no `application.yml`.

---

## 1. Problema N+1 nos endpoints de listagem · **Alto impacto**

**Problema:** Múltiplos repositórios disparam queries extras por item na lista. Exemplos:
- `ConteudoSuspeitoService.listar()` — ~3N queries extras por conteúdo (checagem, evidências, anexos)
- `ChecagemService.toDto()` — 3 queries separadas por checagem (parecer, investigação, evidências)
- `DashboardService.obterResumo()` — `findByChecadorId()` + lazy `ch.getConteudo()` por checagem
- `AuditoriaService.listarPorChecagem()` — lazy `a.getUsuario().getNome()` por linha

Apenas `RelatorioPublicacaoRepository` usa `JOIN FETCH` hoje.

**Arquivos afetados:** `ConteudoSuspeitoService`, `ChecagemService`, `DashboardService`, `AuditoriaService`

**Solução sugerida:** Adicionar `@Query` com `JOIN FETCH` ou `@EntityGraph` nos repositórios de lista. Usar projeções DTO com JPQL para endpoints de dashboard.

---

## 2. God services + modelo de domínio anêmico + magic strings · **Alto impacto**

**Problema:**
- `ChecagemService` (~300 linhas) mistura workflow, investigação, parecer, evidências, MinIO e stubs de IA
- `ConteudoSuspeitoService` (~230 linhas) mistura CRUD, atribuição, revisão e stubs de IA
- Todas as entidades são getters/setters puros — zero comportamento de domínio
- Status espalhados como strings hardcoded: `"pending"`, `"em_analise"`, `"aguardando_revisao"`, `"aprovado"`, `"published"` — **nenhum enum existe no backend**

**Arquivos afetados:** `ChecagemService.java`, `ConteudoSuspeitoService.java`, todas as entidades em `domain/`

**Solução sugerida:**
- Criar enums: `ConteudoStatus`, `ChecagemStatus`, `RevisaoStatus`, `StatusPublicacao`
- Mover transições de estado para métodos de domínio: `checagem.iniciarAnalise()`, `conteudo.aprovarRevisao()`
- Dividir serviços: `ChecagemWorkflowService`, `EvidenciaService`, `ConteudoTriageService`, `RevisaoService`

---

## 3. Cobertura de testes praticamente inexistente · **Alto impacto**

**Problema:** O projeto inteiro tem apenas 1 teste: `contextLoads()` em `EfcaasApiApplicationTests`. Nenhum teste de unidade, integração ou slice para uma plataforma de checagem com fluxo de trabalho crítico.

**Arquivos afetados:** `src/test/`

**Solução sugerida:**
- **Unidade:** transições de estado, mappers, token services
- **Integração:** `@WebMvcTest` para controllers + segurança, `@DataJpaTest` para repositórios e queries com `JOIN FETCH`
- **Slice:** fluxo de autenticação, upload/download de arquivos, workflow completo de revisão

---

## 4. Falhas e lacunas de autorização · **Alto impacto**

**Problema:**
- `PUT /api/v1/configuracao/agencia` está como `permitAll()` — endpoint de escrita sem autenticação
- A maioria dos endpoints usa apenas `authenticated()` sem `@PreAuthorize` por role/permissão:
  - `ConteudoSuspeitoController` — list, detail, `PATCH /status`, `POST /reabrir`
  - `ChecagemController` — detail, parecer, evidências, IA, auditoria
  - `UsuarioController.listar()` — qualquer usuário autenticado lista todos os usuários
- Credenciais padrão no `application.yml` para JWT e MinIO se variáveis de ambiente não estiverem definidas

**Arquivos afetados:** `SecurityConfig.java`, `ConteudoSuspeitoController.java`, `ChecagemController.java`, `UsuarioController.java`, `application.yml`

**Solução sugerida:** Aplicar `@PreAuthorize` consistentemente por permissão (`perform_analysis`, `manage_triage`, etc.). Falhar no startup em produção se `JWT_SECRET` for o valor padrão. Implementar verificação de posse do recurso (checador só acessa suas próprias checagens).

---

## 5. Lógica de download de arquivo duplicada · **Médio impacto**

**Problema:**
- `ChecagemService.downloadEvidencia()` e `AnexoConteudoService.download()` têm ~80 linhas quase idênticas de parsing de byte-range, headers HTTP e `StreamingResponseBody`
- `inferirTipoEvidencia()` / `inferirTipo()` duplicados em ambos os serviços
- `EvidenciaAccessTokenService` e `AnexoConteudoAccessTokenService` — implementações paralelas
- `Long.parseLong(auth.getName())` repetido **20+ vezes** nos controllers

**Arquivos afetados:** `ChecagemService.java`, `AnexoConteudoService.java`, controllers em geral

**Solução sugerida:** Extrair `FileDownloadService` (range parsing + streaming), `MediaTypeInferrer`, `SignedDownloadTokenService` unificado, e um `@CurrentUserId` argument resolver ou `AuthUtils.currentUserId(Authentication)`.

---

## 6. Validação de entrada incompleta · **Médio impacto**

**Problema:**
- `SalvarInvestigacaoRequest`, `SalvarParecerRequest` — sem Bean Validation; controllers omitem `@Valid`
- `AtualizarConteudoStatusRequest` — aceita qualquer string (sem enum ou `@Pattern`)
- `AdicionarEvidenciaRequest.tipo` — texto livre sem restrição de valores
- Upload de arquivo sem validação de tipo/tamanho no nível do controller
- `RevisaoRequest.justificativa` — campo opcional sem `@Size` mínimo

**Arquivos afetados:** DTOs em `web/dto/`, controllers em `web/`

**Solução sugerida:** Adicionar `@Valid` em todos os endpoints de escrita. Usar enums ou `@Pattern` para campos de status/tipo. Adicionar `@Size`, `@NotBlank` nos campos de texto obrigatórios. Considerar `@AssertTrue` para regras cruzadas.

---

## 7. Violações de camada e inconsistências nos controllers · **Médio impacto**

**Problema:**
- `ChecagemService` e `AnexoConteudoService` retornam `ResponseEntity<StreamingResponseBody>` — preocupações HTTP no serviço
- `UsuarioController` e `EtiquetaController` chamam repositórios diretamente, sem camada de serviço; `EtiquetaController` tem mapeamento inline
- `ChecagemService.toJson()` engole exceções silenciosamente e retorna `null`
- `NoSuchElementException` e `IllegalArgumentException` genéricas em vez de exceções de domínio tipadas

**Arquivos afetados:** `ChecagemService.java`, `AnexoConteudoService.java`, `UsuarioController.java`, `EtiquetaController.java`

**Solução sugerida:** Serviços retornam objetos de domínio ou DTO; controllers constroem `ResponseEntity`. Criar `UsuarioService` e `EtiquetaService`. Adicionar exceções tipadas (`ChecagemNotFoundException`, `InvalidStatusTransitionException`) mapeadas no `GlobalExceptionHandler`.

---

## Melhorias adicionais (menor prioridade)

| Problema | Onde | Impacto |
|---|---|---|
| Mapeamento DTO manual verboso | `web/mapper/*` | Baixo-Médio — MapStruct reduziria boilerplate |
| Colunas JSON armazenadas como `String` | `Investigacao.perguntas`, `fontes` | Médio — considerar `@JdbcTypeCode(SqlTypes.JSON)` |
| Inconsistência REST: `POST` para aprovar/rejeitar | `RevisaoController` | Baixo — preferir `PATCH` |
| `catch (Exception e)` no `GlobalExceptionHandler` | `GlobalExceptionHandler.java` | Baixo — mascara bugs inesperados |

---

## Ordem de execução sugerida (backend)

1. **Segurança + validação** — ganhos rápidos, reduz risco em produção
2. **Correção dos N+1** — ganho mensurável de performance nas listagens e dashboard
3. **Enums + métodos de domínio** — previne transições de estado inválidas
4. **Extrair utilitários de download/autenticação** — reduz duplicação antes de dividir os god services
5. **Dividir os god services** — mais fácil após as fronteiras estarem claras
6. **Suite de testes** — consolida o comportamento esperado durante a refatoração
