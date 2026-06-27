import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AIEvaluation } from '../types';
import {
  formatCertaintyScore,
  getModelEvaluationStatus,
  hasModelEvaluationData,
  parseAttributeList,
} from '../lib/aiAnalysis';
import styles from './AiModelEvaluationPanel.module.css';

interface AiModelEvaluationPanelProps {
  evaluation?: AIEvaluation;
  isLoading?: boolean;
}

interface AccordionSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function AccordionSection({ title, defaultExpanded = false, children }: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span>{title}</span>
        <span className={styles.accordionToggle}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {expanded && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
}

function isLikelyEnglish(text: string): boolean {
  const sample = text.slice(0, 200).toLowerCase();
  const englishHints = ['the ', ' and ', ' of ', ' is ', ' are ', ' from '];
  return englishHints.filter((h) => sample.includes(h)).length >= 2;
}

export function AiModelEvaluationPanel({ evaluation, isLoading }: AiModelEvaluationPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <section className={styles.panel}>
        <h3 className={styles.panelTitle}>Avaliação do Modelo IA</h3>
        <p className={styles.loadingPlaceholder}>Processando análise do modelo...</p>
      </section>
    );
  }

  if (!evaluation || !hasModelEvaluationData(evaluation)) {
    return null;
  }

  const certaintyDisplay = formatCertaintyScore(evaluation.certezaAlegacao);
  const whoItems = evaluation.entities.flatMap((e) => parseAttributeList(e.name));
  const whenItems = evaluation.dates.flatMap((d) => parseAttributeList(d));
  const hasEnglishFeatures = evaluation.characteristics.some(isLikelyEnglish);

  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Avaliação do Modelo IA</h3>

      {evaluation.certezaAlegacao != null && (
        <div className={styles.certaintyBanner}>
          <AlertTriangle size={20} className={styles.certaintyBannerIcon} />
          <div>
            <p className={styles.certaintyBannerText}>
              A postagem obteve valor de{' '}
              <span className={styles.certaintyScore}>{certaintyDisplay}</span>
              {' '}na avaliação.
            </p>
            <p className={styles.certaintyBannerText}>
              Entenda mais como o modelo de IA chegou neste valor{' '}
              <button
                type="button"
                className={styles.certaintyLink}
                onClick={() => setModalOpen(true)}
              >
                clicando aqui
              </button>
              .
            </p>
          </div>
        </div>
      )}

      <AccordionSection title="Visualizar análise detalhada..." defaultExpanded>
        <div className={styles.statusRow}>
          <ExternalLink size={14} className={styles.statusIcon} />
          <span>{getModelEvaluationStatus(evaluation)}</span>
        </div>
        {evaluation.characteristics.length > 0 ? (
          <>
            <p className={styles.emptyMessage} style={{ marginBottom: '0.5rem', fontWeight: 500, color: '#374151' }}>
              Misinformation features enumerated from the text:
            </p>
            <ol className={styles.numberedList}>
              {evaluation.characteristics.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ol>
            {hasEnglishFeatures && (
              <p className={styles.translationNote}>
                Please note that these misinformation features are translations of the original text in Portuguese into English.
              </p>
            )}
          </>
        ) : (
          <p className={styles.emptyMessage}>Nenhuma característica de desinformação identificada.</p>
        )}
      </AccordionSection>

      <AccordionSection title="Temas mencionados na postagem" defaultExpanded>
        {evaluation.topics.length > 0 ? (
          <ol className={styles.numberedList}>
            {evaluation.topics.map((topic, idx) => (
              <li key={idx}>{topic}</li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyMessage}>Nenhum tema identificado na postagem.</p>
        )}
      </AccordionSection>

      <AccordionSection title="Quem está envolvido na postagem (Pessoa/Organização)">
        {whoItems.length > 0 ? (
          <ol className={styles.numberedList}>
            {whoItems.map((name, idx) => (
              <li key={idx}>{name}</li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyMessage}>Nenhuma pessoa ou organização identificada.</p>
        )}
      </AccordionSection>

      <AccordionSection title="Local">
        {evaluation.location?.trim() ? (
          <div className={styles.statusRow}>
            <ExternalLink size={14} className={styles.statusIcon} />
            <span>{evaluation.location}</span>
          </div>
        ) : (
          <p className={styles.emptyMessage}>
            O texto não fornece informações específicas de localização (país, estado, cidade),
            portanto não é possível listar onde os eventos ocorreram.
          </p>
        )}
      </AccordionSection>

      <AccordionSection title="Quando ocorreu o fato">
        {whenItems.length > 0 ? (
          <ol className={styles.numberedList}>
            {whenItems.map((date, idx) => (
              <li key={idx}>{date}</li>
            ))}
          </ol>
        ) : (
          <p className={styles.emptyMessage}>Nenhuma data ou período identificado no texto.</p>
        )}
      </AccordionSection>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              className={styles.modalCard}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="entenda-valor-title"
              aria-modal="true"
            >
              <div className={styles.modalHeader}>
                <h2 id="entenda-valor-title" className={styles.modalTitle}>
                  Entenda o Valor
                </h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.modalText}>
                  {evaluation.explanation?.trim()
                    || 'A explicação detalhada não foi retornada pela API nesta análise.'}
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCloseButton}
                  onClick={() => setModalOpen(false)}
                >
                  FECHAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
