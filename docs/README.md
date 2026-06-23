# Documentação eFCaaS

Esta pasta concentra os artefatos de descoberta, requisitos, modelagem e apresentação do projeto **eFCaaS** (Checagem de Fatos como Serviço), produzidos pelo Squad 4.

Use as seções abaixo para descrever, quando quiser, o conteúdo de cada pasta e documento.

---

## Estrutura de pastas

```
docs/
├── Entregável 1/              # Descoberta e fundamentação do produto
├── Entregável 2/              # Protótipo de Alta Fidelidade / MVP
├── Entregável 3/              # Arquitetura Técnica, Segurança e Testes
├── Entregável 4/              # Roadmap, DevOps e Infraestrutura
├── Entregável 5/              # Documentação Final e Manuais
├── Entregável 6/              # Pitch, Apresentação e Materiais Finais
├── Diagramas/                 # Arquitetura, contexto e modelagem de dados
├── Fluxogramas/               # Processos de negócio (BPM)
├── Histórias de Usuário e Casos de Uso/   # Épicos e casos de uso por persona
├── Slides e Apresentações/    # Materiais de apresentação
├── Desatualizados/            # Versões anteriores substituídas
└── scripts-criacao-banco-efcaas.sql       # Script SQL legado (referência)
```

---

## Entregável 1

> Descoberta e fundamentação: visão de produto, análise de contexto, stakeholders e viabilidade.

| Arquivo | Descrição |
|---------|-----------|
| `Analise SWOT V2 .pdf` | Documento que apresenta a análise SWOT do projeto, identificando forças, fraquezas, oportunidades e ameaças relacionadas ao negócio e ao ambiente externo. |
| `Business Model Canvas - eFCaaS.jpg` | Representação visual do modelo de negócios do eFCaaS, contendo os principais elementos como proposta de valor, segmentos de clientes, canais, fontes de receita, recursos e atividades-chave. |
| `Canvas de hipoteses de negócios V2.pdf` | Artefato utilizado para registrar e validar as principais hipóteses relacionadas ao problema, público-alvo, solução proposta e viabilidade do negócio. |
| `eFCaaS - PRD.pdf` | Documento de Requisitos do Produto (Product Requirements Document), descrevendo objetivos, funcionalidades, requisitos e características esperadas para a solução eFCaaS. |
| `Estudo de Viabilidade Técnica.pdf` | Documento que avalia a viabilidade técnica da implementação da solução, considerando tecnologias, infraestrutura, limitações e riscos envolvidos no desenvolvimento. |
| `Mapa Stakeholder v2.0.pdf` | Mapeamento das partes interessadas do projeto, identificando os principais stakeholders, seus interesses, influência e relacionamento com a solução proposta. |

---

## Entregável 2

> Artefatos relacionados à validação da solução por meio de um protótipo navegável, implementação do MVP, demonstração das principais funcionalidades e definição dos padrões visuais da interface.

| Arquivo | Descrição |
|---------|-----------|
| Link do Protótipo Interativo | Protótipo de alta fidelidade contendo telas navegáveis e fluxos de interação alinhados aos requisitos e funcionalidades especificados no PRD. |
| `Repositório eFCaaS` | Repositório principal do MVP da solução eFCaaS, localizado na branch `main` do repositório `Squad-4`. Na estrutura do projeto, apresentada neste repositório, a implementação está dividida entre as pastas `efcaas-backend`, que concentra os componentes de backend e a lógica de negócio, e `efcaas-frontend`, responsável pela interface e experiência do usuário, permitindo a separação e organização das diferentes camadas da aplicação. |
| Vídeo de Demonstração | Gravação demonstrando as principais funcionalidades e jornadas de uso do sistema, evidenciando a execução prática dos requisitos definidos no PRD. |
| Guia de Estilo.pdf | Documento que reúne os padrões visuais da aplicação, incluindo paleta de cores, tipografia, componentes e diretrizes de interface e experiência do usuário. |
---

---

## Entregável 3

> Artefatos relacionados à definição da arquitetura técnica da solução, requisitos não-funcionais, segurança, modelagem de dados e validação dos critérios de aceite estabelecidos no PRD.

| Arquivo | Descrição |
|---------|-----------|
| Diagrama de Arquitetura de Solução | Documento contendo a arquitetura técnica do sistema eFCaaS, evidenciando a interação entre os componentes de frontend, backend, banco de dados e integrações externas por meio de APIs. |
| Documento de Requisitos Não-Funcionais (RNFs) | Documento que consolida os requisitos de desempenho, escalabilidade, disponibilidade e segurança da aplicação, derivados da seção técnica do PRD. |
| Relatório de Segurança e LGPD | Artefato que apresenta as medidas de proteção de dados adotadas pela solução, bem como as estratégias de autenticação, autorização e controle de permissões dos usuários, em conformidade com os princípios da LGPD. |
| Dicionário de Dados e Modelo Entidade-Relacionamento (DER) | Documento responsável por descrever as entidades, atributos, relacionamentos e regras de armazenamento das informações utilizadas pelo sistema. |
| Plano e Relatório de Testes | Conjunto de evidências e registros de testes funcionais realizados para validar os critérios de aceite e os requisitos definidos no PRD, demonstrando o comportamento esperado da solução. |

---

## Entregável 4

> Artefatos voltados para a evolução contínua do produto, automação do processo de desenvolvimento e configuração da infraestrutura da aplicação.

| Arquivo | Descrição |
|---------|-----------|
| Roadmap de Evolução do Produto | Linha do tempo que apresenta a evolução planejada do eFCaaS, contemplando funcionalidades classificadas como "Fora de Escopo" no PRD e possíveis expansões futuras da plataforma. |
| Mapeamento do Ciclo DevOps | Diagrama que representa a esteira de integração e entrega contínua (CI/CD), evidenciando os processos de versionamento, automação, testes e implantação da solução. |
| Configuração de Ambiente (IaC) | Conjunto de arquivos de infraestrutura e configuração, incluindo Dockerfile, docker-compose e scripts necessários para a padronização e execução dos ambientes da aplicação. |

---

## Entregável 5

> Documentação consolidada do projeto, reunindo informações técnicas, instruções de instalação e guias de utilização da solução.

| Arquivo | Descrição |
|---------|-----------|
| Relatório Final Consolidado | Documento elaborado a partir do template oficial disponibilizado pela disciplina, reunindo os conteúdos produzidos durante o projeto, utilizando o PRD como referência para os capítulos de introdução, requisitos e metodologia. |
| README.md do Repositório eFCaaS | Manual técnico de instalação e configuração da solução, contendo instruções para preparação do ambiente, execução dos componentes do sistema e demais informações necessárias para utilização do projeto. |
| Manual do Usuário | Guia prático destinado aos usuários da plataforma, contendo descrições dos fluxos principais e capturas de tela das funcionalidades implementadas, com base nas jornadas definidas no PRD. |

---

## Entregável 6

> Materiais destinados à apresentação acadêmica e comercial da solução eFCaaS, sintetizando os principais resultados obtidos durante o desenvolvimento do projeto.

| Arquivo | Descrição |
|---------|-----------|
| Slides da Apresentação | Conjunto de slides estruturados para apresentação do projeto, abordando o problema identificado, a solução proposta, a arquitetura do sistema, os resultados alcançados e o roadmap de evolução do produto. |
| Roteiro do Pitch (Script) | Documento de apoio para a apresentação oral da Squad 4, contendo a organização dos tópicos, falas e sequência lógica utilizada durante a exposição do projeto. |

---

## Diagramas

> Representações visuais de arquitetura, contexto do sistema e modelagem de dados.

## Fluxogramas

> Fluxos de processo de negócio e operacionais do produto.

## Histórias de Usuário e Casos de Uso

> Épicos, histórias e diagramas de casos de uso por persona (Administrador, Curador, Checador).

## Slides e Apresentações

> Materiais de apresentação do projeto.

## Desatualizados

> Versões anteriores de documentos substituídos por artefatos mais recentes. Não usar como fonte principal.


