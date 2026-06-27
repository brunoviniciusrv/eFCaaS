# Mapeamento de métricas — Guaia IA Hub → eFCaaS

Referência campo a campo entre a API Guaia e a plataforma eFCaaS.

**Endpoints Guaia:** `POST /ia/publication/v1`, `POST /ia/text/classify/v1`  
**Disparo eFCaaS:** `POST /api/v1/conteudos/{id}/ia/analisar`  
**Persistência:** tabela `analise_ia` (Flyway V14 + V17)

---

## Eixo Desinformação (barras 0–100%)

| Campo Guaia | Campo API eFCaaS | Coluna DB | Rótulo na UI |
|-------------|------------------|-----------|--------------|
| `missinformation_potential` | `scoreInveracidade` | `score_inveracidade` | Potencial de desinformação |
| `resultado_texto.fake_score` | `scoreFalsidade` | `score_distorcao` | Score de falsidade |
| `resultados_midias[].resultado.distortion_level` (média) | `scoreDistorcaoMidia` | `score_fora_contexto` | Distorção de mídia (`null` sem anexos) |

## Eixo Ilicitudes

| Campo Guaia | Campo API eFCaaS | Coluna DB | Exibição na UI |
|-------------|------------------|-----------|----------------|
| `classificacao_odio` | `classificacaoOdio` | `classificacao_odio` | Badge |
| `classificacao_antidemocratica` | `classificacaoAntidemo` | `classificacao_antidemo` | Badge |
| `confianca` | `confiancaClassificacao` | `confianca_classificacao` | Confiança % |
| `categoria_final` | `categoriaFinal` | `categoria_final` | Badge |
| `risco_ilicitude.risco_percentual` | `scoreRiscoIlicitude` | `score_risco_ilicitude` | Barra % |

## Análise semântica

| Campo Guaia | Campo API eFCaaS | Coluna DB |
|-------------|------------------|-----------|
| `detailed_analysis_text` ?? `explanation_text` | `textoAnalise` | `texto_analise` |
| `attribute_*` ?? `resultado_texto.what/who/where/when` | `atributoWhat/Who/Where/When` | `atributo_*` |
| `resultado_texto.keywords` | `keywords` | `keywords` |
| `resultado_texto.pseudo_label` | `pseudoLabel` | `pseudo_label` |
| `resultado_texto.misinformation_features` | `misinformationFeatures` | `misinformation_features` |
| `resultado_texto.topic_match` | `topicMatch` | `topic_match` (JSON) |
| `resultado_alegacao_texto.certainty_score` | `certezaAlegacao` | `certeza_alegacao` |
| `resultado_alegacao_texto.certainty_band` | `faixaCertezaAlegacao` | `faixa_certeza_alegacao` |
| derivado de `missinformation_potential` | `avaliacaoRisco` | `avaliacao_risco` |

## Notas

- `certezaAlegacao` é exibido na UI como valor 0–1 (ex.: 0.46) no banner "Avaliação do Modelo IA".

- Análises salvas **antes** desta correção usam o mapeamento antigo; reexecute **Analisar com IA** para atualizar.
- Colunas `score_disc_odio` e `score_disc_antidemo` permanecem no schema mas não são mais populadas.
- Implementação: [`IaRealService.mapToDto`](../src/main/java/br/com/efcaas/api/service/IaRealService.java)
