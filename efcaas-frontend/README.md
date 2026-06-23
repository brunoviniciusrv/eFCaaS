# efcaas-frontend

Interface web da plataforma **eFCaaS** — Checagem de Fatos como Serviço.

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 19 + TypeScript |
| Build | Vite 6 |
| Estilo | Tailwind CSS 4 |
| Roteamento | React Router 7 |
| IA (rascunhos/revisão) | Google Gemini API |
| Gráficos | Recharts |

---

## Pré-requisitos

- Node.js 20+
- API eFCaaS em execução (ver [`../README.md`](../README.md) ou [`../efcaas-backend/README.md`](../efcaas-backend/README.md))

---

## Configuração

```bash
cp .env.example .env.local
```

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `VITE_API_URL` | URL base da API REST | `http://localhost:8081/api/v1` (Docker) ou `http://localhost:8080/api/v1` (local) |
| `GEMINI_API_KEY` | Chave da API Gemini | Obtenha em https://aistudio.google.com/app/apikey |

---

## Executar

```bash
npm install
npm run dev
```

A aplicação ficará disponível em http://localhost:3000.

Outros scripts:

```bash
npm run build    # build de produção
npm run preview  # preview do build
npm run lint     # verificação TypeScript
```

---

## Executar via Docker (raiz do repositório)

```bash
docker compose --profile full up --build
```

O front-end sobe automaticamente na porta 3000, apontando para a API em `http://localhost:8081/api/v1`.

---

## Estrutura

```
efcaas-frontend/
├── src/
│   ├── components/     # Telas e componentes (Dashboard, AnalysisView, LoginView, …)
│   ├── services/       # apiClient, apiService, geminiService
│   ├── lib/            # Utilitários
│   ├── App.tsx         # Rotas e estado global
│   ├── types.ts        # Tipos TypeScript
│   └── constants.ts    # Dados iniciais e configurações
├── index.html
├── vite.config.ts
└── package.json
```

---

## Telas principais

| Rota / View | Perfil | Descrição |
|-------------|--------|-----------|
| `/dashboard` | Checador | Painel de checagens atribuídas |
| `/curator` | Curador | Triagem e atribuição de conteúdos |
| `/admin` | Administrador | Gestão de usuários e permissões |
| `/editorial-archive` | Curador / Editor | Arquivo e publicação editorial |
| Análise de conteúdo | Checador | Investigação, evidências e parecer |

---

## Credenciais de teste

Use o usuário seed da API: `admin@efcaas.com` / `Admin@2026!` (ver README raiz).
