# Oportunidades de Refatoração — eFCaaS Frontend

Levantamento de pontos de melhoria identificados após a migração de estilos para CSS Modules.
Ordenados por impacto e risco de execução.

---

## 1. `App.tsx` como componente deus · **Alto impacto**

**Problema:** ~1.580 linhas concentrando todo o estado global (15+ slices), 25+ handlers assíncronos, lógica de negócio, routing e sincronização com localStorage. Componentes filhos recebem até 25 props cada.

**Arquivos afetados:** `src/App.tsx`

**Solução sugerida:**
- Extrair custom hooks por domínio: `hooks/useNewsActions.ts`, `hooks/useEditorial.ts`, `hooks/useAgencyConfig.ts`, `hooks/useNotifications.ts`
- Mover helpers (`buildDraftArticleFromNews`, `buildSalvarRelatorioBody`, `getParecerTexto`) para `lib/editorialUtils.ts`
- Reduzir `App.tsx` a um shell de providers + router

---

## 2. Componentes dashboard com responsabilidades demais · **Alto impacto**

**Problema:**
- `CuratorDashboard.tsx` (~2.775 linhas) tem **41 `useState`** e mistura triage, kanban, modais, reviews e extração social
- `AnalysisView.tsx` (~1.587 linhas) agrupa 5 abas com upload, AI, auditoria e formulários
- `AdminDashboard.tsx` (~1.940 linhas) duplica blocos inteiros de configuração de tema

**Arquivos afetados:** `CuratorDashboard.tsx`, `AnalysisView.tsx`, `AdminDashboard.tsx`

**Solução sugerida:** Dividir em subpastas por aba/feature:
```
components/curator/{TriageTab, ReceivedTab, KanbanTab, ReviewsTab, ...}
components/analysis/{ContentTab, InvestigationTab, ParecerTab, ...}
components/admin/{UsersTab, AuditTab, SettingsTab, PermissionsTab}
```

---

## 3. Prop drilling sem Context · **Alto impacto**

**Problema:** `themeConfig`, `checkPermission`, `notifications` e seus handlers descem por toda a árvore sem qualquer React Context. `AnalysisRouteWrapper` é tipado como `props: any`.

**Arquivos afetados:** `App.tsx` e praticamente todos os componentes

**Solução sugerida:**
- `ThemeProvider` — expõe `themeConfig` e variáveis CSS
- `NotificationProvider` — bell + `addNotification` centralizados
- `PermissionProvider` — `checkPermission` e `permissionProfiles`
- Tipar `AnalysisRouteWrapper` com interface explícita

---

## 4. Status/labels como magic strings espalhadas · **Médio-alto impacto**

**Problema:** `getStatusLabel`, `getStatusIcon` e mapeamentos de cor existem duplicados em múltiplos arquivos. Mudar o label de um status exige edições em vários lugares.

**Arquivos afetados:** `StatusBadge.tsx`, `EditorialArchive.tsx`, `Dashboard.tsx`, `CuratorDashboard.tsx`, `App.tsx`

**Solução sugerida:** Criar `constants/statusMaps.ts`:
```ts
export const NEWS_STATUS_CONFIG: Record<NewsStatus, { label: string; color: string; icon: ... }>
export const ARTICLE_STATUS_CONFIG: Record<ArticleStatus, { label: string; icon: ... }>
export const PRIORITY_CONFIG
export const DATE_RANGE_OPTIONS
export const FILE_SIZE_LIMITS
```

---

## 5. ~80+ usos de `any` · **Médio impacto**

**Problema:** `CuratorDashboard.tsx` tem 39 sozinho. Estilos inline usam `as any` por falta de um helper tipado para `themeConfig → CSSProperties`. Payloads de formulários sem interface.

**Arquivos afetados:** `CuratorDashboard.tsx` (39×), `App.tsx`, `AdminDashboard.tsx` (14×), `Dashboard.tsx`, `ProfileView.tsx`

**Solução sugerida:**
- Definir `RegisterNewsPayload`, `EditNewsPayload`, `AnalysisRouteWrapperProps`
- Criar `themedInputStyle(theme: ThemeConfig): CSSProperties` em `lib/themeUtils.ts`
- Tipar `Notification[]` de forma consistente (tipo já existe em `types.ts`)

---

## 6. Tratamento de erros inconsistente, sem ErrorBoundary · **Médio impacto**

**Problema:** Mistura de `alert()`, `addNotification` e `console.error` sem padrão definido. Sem boundary na raiz, um erro em qualquer rota derruba a aplicação inteira.

**Arquivos afetados:** `main.tsx`, `App.tsx`, `AnalysisView.tsx`, `CuratorDashboard.tsx`

**Solução sugerida:**
- `ErrorBoundary` na raiz + boundaries por rota nos dashboards
- Hook `useAsyncAction` retornando `{ execute, loading, error }` com feedback via sistema de notificações
- Substituir todos os `alert()` pelo sistema de notificações existente
- Centralizar parsing de erros de API (`getErrorMessage(err)`) baseado no `apiClient.ts`

---

## 7. Lógica de negócio duplicada · **Médio impacto**

**Problema:**

| Lógica duplicada | Ocorrências |
|---|---|
| Inicialização de `reportStructure` | `App.tsx` (3×) + `constants.ts` (10×) |
| Limite de 200 MB para uploads | `AnalysisView.tsx` (2×), `CuratorDashboard.tsx` |
| Cálculo de métricas por período (`rangeMap`, `dailyVolume`) | `Dashboard.tsx` e `AdminDashboard.tsx` quase idênticos |
| `formatAttachmentSize` | Só em `CuratorDashboard.tsx`, poderia ser compartilhado |
| Construção do body de `salvarEstruturaRelatorio` | Duplicado em `handleSaveInvestigation` e `handleSaveFinal` |

**Solução sugerida:**
- `lib/reportStructure.ts` → `createEmptyReportStructure(config)`
- `lib/fileUtils.ts` → `MAX_UPLOAD_BYTES`, `formatFileSize`, `validateFileSize`
- `hooks/useDateRangeMetrics.ts` → hook compartilhado para Dashboard e AdminDashboard
- `lib/checagemApi.ts` → `buildEstruturaRelatorioBody(rs)` usado pelos dois handlers de save

---

## Melhorias adicionais (menor prioridade)

| Problema | Onde | Impacto |
|---|---|---|
| Variáveis CSS do tema (`themeCssVariables`) subutilizadas | A maioria dos componentes ainda usa inline style | Baixo-Médio |
| Hack `window.handleAppLogout` | `App.tsx` + `Sidebar.tsx` | Baixo |
| Lógica demo/mock em paths de produção | `handleForwardToTriage`, `INITIAL_RECEIVED_NEWS` | Baixo |
| Sem camada de data-fetching (React Query) | `AnalysisView`, `AdminDashboard`, `EditorView` chamam `apiService` diretamente | Médio |
| Dados mock mortos | `INITIAL_NEWS` em `constants.ts` (API já carrega dados reais) | Baixo |

---

## Ordem de execução sugerida

1. **Centralizar constants + utilitários de arquivo/report** — mudança cirúrgica, risco zero de regressão
2. **Criar os 3 Context providers** — elimina prop drilling sem quebrar comportamento
3. **Extrair hooks do `App.tsx`** — incremental, mantém comportamento estável
4. **Dividir `CuratorDashboard` e `AnalysisView`** — maior ganho de manutenibilidade a longo prazo
5. **Error boundaries + hook assíncrono unificado**
6. **Tipagem mais estrita** (especialmente payloads de API e `AnalysisRouteWrapper`)
