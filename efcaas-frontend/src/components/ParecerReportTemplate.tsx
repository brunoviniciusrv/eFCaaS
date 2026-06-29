import React, { forwardRef, useState } from 'react';
import { formatAiScore } from '../lib/aiAnalysis';
import { ParecerReportData } from '../lib/parecerReportModel';
import styles from './ParecerReportTemplate.module.css';

interface ParecerReportTemplateProps {
  data: ParecerReportData;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.fieldBlock}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>{children}</div>
    </div>
  );
}

function ContentMediaGallery({ media }: { media: ParecerReportData['contentMedia'] }) {
  if (media.length === 0) return null;

  return (
    <div className={styles.mediaGallery}>
      {media.map((item, index) => (
        <figure key={`${item.url}-${index}`} className={styles.mediaFigure}>
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.title ?? 'Anexo do conteúdo investigado'}
              className={styles.contentMediaImg}
              crossOrigin="anonymous"
            />
          ) : (
            <div className={styles.mediaFallback}>
              {item.type}: {item.title?.trim() || item.url}
            </div>
          )}
          {item.title && <figcaption className={styles.mediaCaption}>{item.title}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

export const ParecerReportTemplate = forwardRef<HTMLDivElement, ParecerReportTemplateProps>(
  function ParecerReportTemplate({ data }, ref) {
    const [logoFailed, setLogoFailed] = useState(false);

    return (
      <div ref={ref} className={styles.root} data-parecer-report>
        <div className={styles.pageInner}>
          <header className={styles.header}>
            {data.logoUrl && !logoFailed ? (
              <img
                src={data.logoUrl}
                alt={data.agencyName}
                className={styles.logo}
                crossOrigin="anonymous"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <div className={styles.logoFallback}>{data.agencyName}</div>
            )}
            <div className={styles.headerMeta}>
              <p className={styles.agencyName}>{data.agencyName}</p>
              <h1 className={styles.docTitle}>Relatório de Verificação de Fatos</h1>
              <div className={styles.headerRefs}>
                {data.referenceNumber != null && <span>Nº {data.referenceNumber} · </span>}
                Gerado em {data.generatedAt}
              </div>
            </div>
          </header>

          <Field label="Data de abertura do processo">{data.processOpenedAt}</Field>
          <Field label="Verificadores (nomes completos)">{data.verifiers}</Field>
          <Field label="Data em que o conteúdo investigado foi publicado">{data.contentPublishedAt}</Field>

          <Field label="Conteúdo investigado">
            {data.investigatedContent}
            <ContentMediaGallery media={data.contentMedia} />
          </Field>

          <Field label="Quem é o autor da desinformação">{data.disinfoAuthor}</Field>

          {data.questions.length > 0 && (
            <>
              <h2 className={styles.sectionTitle}>Perguntas que a verificação responde</h2>
              {data.questions.map((item, index) => (
                <div key={index} className={styles.questionItem}>
                  <div className={styles.questionText}>{item.question}</div>
                  {item.answer && <div className={styles.answerText}>{item.answer}</div>}
                </div>
              ))}
            </>
          )}

          {data.aiSection && (
            <>
              <h2 className={styles.sectionTitle}>Indicadores da Análise de IA</h2>
              <div className={styles.aiGrid}>
                {data.aiSection.inveracidade != null && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Desinformação</span>
                    <span className={styles.aiValue}>{formatAiScore(data.aiSection.inveracidade)}</span>
                  </div>
                )}
                {data.aiSection.falsidade != null && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Falsidade</span>
                    <span className={styles.aiValue}>{formatAiScore(data.aiSection.falsidade)}</span>
                  </div>
                )}
                {data.aiSection.distorcaoMidia != null && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Distorção de mídia</span>
                    <span className={styles.aiValue}>{formatAiScore(data.aiSection.distorcaoMidia)}</span>
                  </div>
                )}
                {data.aiSection.riscoIlicitude != null && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Risco de ilicitude</span>
                    <span className={styles.aiValue}>{formatAiScore(data.aiSection.riscoIlicitude)}</span>
                  </div>
                )}
                {data.aiSection.avaliacaoRisco && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Avaliação de risco</span>
                    <span className={styles.aiValue}>{data.aiSection.avaliacaoRisco}</span>
                  </div>
                )}
                {data.aiSection.classificacaoOdio && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Discurso de ódio</span>
                    <span className={styles.aiValue}>{data.aiSection.classificacaoOdio}</span>
                  </div>
                )}
                {data.aiSection.classificacaoAntidemo && (
                  <div className={styles.aiItem}>
                    <span className={styles.aiLabel}>Antidemocrático</span>
                    <span className={styles.aiValue}>{data.aiSection.classificacaoAntidemo}</span>
                  </div>
                )}
              </div>
              {data.aiSection.explanationHtml && (
                <div
                  className={styles.aiExplanationProse}
                  dangerouslySetInnerHTML={{ __html: data.aiSection.explanationHtml }}
                />
              )}
            </>
          )}

          <div className={styles.publicationDivider}>
            <span>PUBLICAÇÃO</span>
          </div>

          <div
            className={styles.labelBadge}
            style={{
              backgroundColor: data.publicationLabelColor,
              color: data.publicationLabelTextColor,
            }}
          >
            Etiqueta: {data.publicationLabel}
          </div>

          <h2 className={styles.pubTitle}>{data.title}</h2>

          {data.olho && (
            <>
              <div className={styles.subsectionLabel}>Olho</div>
              <div className={styles.fieldValue}>{data.olho}</div>
            </>
          )}

          <div className={styles.subsectionLabel}>Metodologia da investigação</div>
          <div className={styles.fieldValue}>{data.lide || '—'}</div>

          <div className={styles.subsectionLabel}>Parecer</div>
          <div
            className={styles.bodyContent}
            dangerouslySetInnerHTML={{ __html: data.bodyHtml || '<p>—</p>' }}
          />

          <footer className={styles.footer}>
            <span>
              Checador: {data.checkerName}
              {data.completedAt ? ` · Concluído em ${data.completedAt}` : ''}
            </span>
            <span>Gerado por eFCaaS</span>
          </footer>
        </div>
      </div>
    );
  },
);
