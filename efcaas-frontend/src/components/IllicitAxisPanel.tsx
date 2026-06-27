import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { AIEvaluation, NewsItem } from '../types';
import {
  formatAiScore,
  formatClassificationLabel,
  getClassificationTone,
  isSameClassification,
  toConfidenceScore,
} from '../lib/aiAnalysis';
import styles from './IllicitAxisPanel.module.css';

interface IllicitAxisPanelProps {
  contentId?: string;
  evaluation?: AIEvaluation;
  aiScores?: NewsItem['aiScores'];
  isLoading?: boolean;
}

function toneClass(tone: ReturnType<typeof getClassificationTone>): string {
  if (tone === 'negative') return styles.badgeNegative;
  if (tone === 'positive') return styles.badgePositive;
  return styles.badgeNeutral;
}

function ClassificationValue({ value }: { value?: string | null }) {
  const label = formatClassificationLabel(value);
  const tone = getClassificationTone(value);
  const className = toneClass(tone);

  if (label.length > 48) {
    return <p className={`${styles.classificationText} ${className}`}>{label}</p>;
  }

  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}

function MetricBar({
  label,
  value,
  barClass,
  isLoading,
  metricKey,
}: {
  label: string;
  value?: number;
  barClass: string;
  isLoading?: boolean;
  metricKey: string;
}) {
  const display = value != null ? formatAiScore(value) : '—';

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}>{label}</span>
        <span className={styles.metricValue}>{isLoading ? '...' : display}</span>
      </div>
      <div className={styles.metricBarTrack}>
        {isLoading ? (
          <div className={styles.metricBarFill} style={{ width: '30%', opacity: 0.4 }} />
        ) : value != null ? (
          <motion.div
            key={metricKey}
            className={`${styles.metricBarFill} ${barClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function IllicitAxisPanel({ contentId, evaluation, aiScores, isLoading }: IllicitAxisPanelProps) {
  const confianca = toConfidenceScore(evaluation?.confiancaClassificacao);
  const risco = aiScores?.riscoIlicitude;
  const categoria = evaluation?.categoriaFinal?.trim();
  const antidemo = evaluation?.classificacaoAntidemo?.trim();
  const showAntidemoSeparately = Boolean(antidemo && !isSameClassification(antidemo, categoria));

  const hasData = Boolean(
    evaluation?.classificacaoOdio
    || antidemo
    || categoria
    || confianca != null
    || risco != null
  );

  if (!hasData && !isLoading) {
    return (
      <section className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className={styles.title}>Eixo Ilicitudes</h3>
          </div>
          <p className={styles.subtitle}>
            Classificação de discurso de ódio, antidemocrático e risco de ilicitude (Guaia /ia/text/classify/v1).
          </p>
        </div>
        <p className={styles.emptyState}>
          Nenhum dado de ilicitude disponível. Execute &quot;Analisar com IA&quot; para obter a classificação.
        </p>
      </section>
    );
  }

  const metricsKey = `${contentId ?? 'na'}-${confianca ?? 'x'}-${risco ?? 'x'}-${categoria ?? 'x'}`;

  return (
    <section className={styles.panel} key={metricsKey}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className={styles.title}>Eixo Ilicitudes</h3>
        </div>
        <p className={styles.subtitle}>
          Classificação do texto pela Guaia (endpoint /ia/text/classify/v1). A confiança indica o quão
          seguro o modelo está na categoria atribuída; o risco de ilicitude é um percentual estimado de
          conduta ilícita no conteúdo.
        </p>
      </div>

      <div className={`${styles.fieldCard} ${styles.primaryClassificationCard}`}>
        <span className={styles.fieldLabel}>Classificação final do modelo</span>
        {isLoading ? (
          <span className={styles.fieldValue}>...</span>
        ) : (
          <ClassificationValue value={categoria ?? antidemo} />
        )}
      </div>

      <div className={styles.classificationRow}>
        <div className={styles.fieldCard}>
          <span className={styles.fieldLabel}>Discurso de ódio</span>
          {isLoading ? (
            <span className={styles.fieldValue}>...</span>
          ) : (
            <ClassificationValue value={evaluation?.classificacaoOdio} />
          )}
        </div>
        {showAntidemoSeparately && (
          <div className={styles.fieldCard}>
            <span className={styles.fieldLabel}>Discurso antidemocrático (detalhe)</span>
            {isLoading ? (
              <span className={styles.fieldValue}>...</span>
            ) : (
              <ClassificationValue value={antidemo} />
            )}
          </div>
        )}
      </div>

      <MetricBar
        label="Confiança na classificação"
        value={confianca}
        barClass={styles.metricBarConfidence}
        isLoading={isLoading}
        metricKey={`conf-${metricsKey}`}
      />

      <MetricBar
        label="Risco de ilicitude"
        value={risco}
        barClass={styles.metricBarRisk}
        isLoading={isLoading}
        metricKey={`risk-${metricsKey}`}
      />
    </section>
  );
}
