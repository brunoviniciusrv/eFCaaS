import React from 'react';
import { Download, X } from 'lucide-react';
import { ThemeConfig } from '../types';
import { ParecerReportData } from '../lib/parecerReportModel';
import { exportParecerReportPdf } from '../lib/parecerPdfExport';
import { ParecerReportTemplate } from './ParecerReportTemplate';
import styles from './ParecerPdfPreviewModal.module.css';

interface ParecerPdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: ParecerReportData;
  themeConfig: ThemeConfig;
  canDownload: boolean;
  isDownloading: boolean;
  onDownloadStart: () => void;
  onDownloadEnd: () => void;
}

export function ParecerPdfPreviewModal({
  open,
  onClose,
  data,
  themeConfig,
  canDownload,
  isDownloading,
  onDownloadStart,
  onDownloadEnd,
}: ParecerPdfPreviewModalProps) {
  if (!open) return null;

  const handleDownload = async () => {
    if (!canDownload) return;
    onDownloadStart();
    try {
      await exportParecerReportPdf(data);
    } finally {
      onDownloadEnd();
    }
  };

  return (
    <div className={styles.overlay} style={{ backgroundColor: themeConfig.general.modalOverlay }}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden />
      <div
        className={styles.modal}
        style={{
          backgroundColor: themeConfig.general.modalBackground,
          borderColor: themeConfig.general.border,
        }}
      >
        <header
          className={styles.header}
          style={{
            backgroundColor: themeConfig.general.cardBackground,
            borderColor: themeConfig.general.border,
          }}
        >
          <h2 className={styles.title} style={{ color: themeConfig.dashboard.text }}>
            Pré-visualização do PDF
          </h2>
          <div className={styles.actions}>
            {canDownload && (
              <button
                type="button"
                disabled={isDownloading}
                className={styles.primaryBtn}
                style={{
                  backgroundColor: themeConfig.buttons.primary,
                  color: themeConfig.buttons.primaryText,
                }}
                onClick={handleDownload}
              >
                <Download size={16} />
                {isDownloading ? 'Gerando…' : 'Baixar PDF'}
              </button>
            )}
            <button
              type="button"
              className={styles.iconBtn}
              style={{ color: themeConfig.dashboard.text }}
              onClick={onClose}
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className={styles.body}>
          <div className={styles.previewScaled}>
            <ParecerReportTemplate data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}
