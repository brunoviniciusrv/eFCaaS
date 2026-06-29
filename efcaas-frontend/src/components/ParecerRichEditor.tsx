import React, { useLayoutEffect, useRef, useState } from 'react';
import { Bold, Eye, Italic, Link as LinkIcon, List, Quote } from 'lucide-react';
import { ThemeConfig } from '../types';
import { parecerToEditorHtml } from '../lib/parecerHtml';
import styles from './ParecerRichEditor.module.css';

interface ParecerRichEditorProps {
  value: string;
  syncKey: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
  themeConfig: ThemeConfig;
  onPreview?: () => void;
  onDownload?: () => void;
  canDownload?: boolean;
  isDownloading?: boolean;
}

export function ParecerRichEditor({
  value,
  syncKey,
  onChange,
  readOnly = false,
  themeConfig,
  onPreview,
  onDownload,
  canDownload = false,
  isDownloading = false,
}: ParecerRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initKeyRef = useRef('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const syncContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncContent();
  };

  const handleToolbarMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const confirmInsertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const text = linkText.trim();
    if (text) {
      runCommand('insertHTML', `<a href="${url}" target="_blank" rel="noreferrer">${text}</a>`);
    } else {
      runCommand('createLink', url);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  useLayoutEffect(() => {
    const key = `${syncKey}:${readOnly ? 'ro' : 'ed'}`;
    if (!editorRef.current || initKeyRef.current === key) return;
    initKeyRef.current = key;
    editorRef.current.innerHTML = parecerToEditorHtml(value);
  }, [syncKey, readOnly, value]);

  return (
    <div
      className={styles.editorWrapper}
      style={{ borderColor: themeConfig.general.border, backgroundColor: themeConfig.general.cardBackground }}
    >
      <div className={styles.toolbar} style={{ borderColor: themeConfig.general.border }}>
        <div className={styles.toolbarLeft}>
          <button
            type="button"
            disabled={readOnly}
            className={styles.rtfBtn}
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runCommand('bold')}
            title="Negrito"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            disabled={readOnly}
            className={styles.rtfBtn}
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runCommand('italic')}
            title="Itálico"
          >
            <Italic size={16} />
          </button>
          <div className={styles.rtfDivider} />
          <button
            type="button"
            disabled={readOnly}
            className={styles.rtfBtn}
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runCommand('insertUnorderedList')}
            title="Lista"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            disabled={readOnly}
            className={styles.rtfBtn}
            onMouseDown={handleToolbarMouseDown}
            onClick={() => runCommand('formatBlock', 'blockquote')}
            title="Citação"
          >
            <Quote size={16} />
          </button>
          <button
            type="button"
            disabled={readOnly}
            className={styles.rtfBtn}
            onMouseDown={handleToolbarMouseDown}
            onClick={() => setShowLinkModal(true)}
            title="Inserir link"
          >
            <LinkIcon size={16} />
          </button>
        </div>

        <div className={styles.toolbarRight}>
          {onPreview && (
            <button
              type="button"
              className={styles.actionBtn}
              style={{
                backgroundColor: themeConfig.general.inputBackground,
                color: themeConfig.dashboard.text,
                border: `1px solid ${themeConfig.general.border}`,
              }}
              onClick={onPreview}
            >
              <Eye size={16} />
              Visualizar PDF
            </button>
          )}
          {canDownload && onDownload && (
            <button
              type="button"
              disabled={isDownloading}
              className={styles.actionBtn}
              style={{
                backgroundColor: themeConfig.buttons.primary,
                color: themeConfig.buttons.primaryText,
              }}
              onClick={onDownload}
            >
              {isDownloading ? 'Gerando…' : 'Baixar PDF'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.editorBody}>
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          className={styles.contentEditor}
          style={{ color: themeConfig.general.inputText }}
          data-placeholder="Inicie a redação do parecer final..."
          onInput={readOnly ? undefined : syncContent}
          onBlur={readOnly ? undefined : syncContent}
        />
      </div>

      {showLinkModal && (
        <div className={styles.linkModalOverlay} onClick={() => setShowLinkModal(false)}>
          <div
            className={styles.linkModal}
            style={{
              backgroundColor: themeConfig.general.modalBackground,
              borderColor: themeConfig.general.border,
              color: themeConfig.general.modalText,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className={styles.linkModalTitle}>Inserir link</h4>
            <input
              className={styles.linkModalField}
              style={{
                backgroundColor: themeConfig.general.inputBackground,
                borderColor: themeConfig.general.inputBorder,
                color: themeConfig.general.inputText,
              }}
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
            <input
              className={styles.linkModalField}
              style={{
                backgroundColor: themeConfig.general.inputBackground,
                borderColor: themeConfig.general.inputBorder,
                color: themeConfig.general.inputText,
              }}
              placeholder="Texto do link (opcional)"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
            <div className={styles.linkModalActions}>
              <button
                type="button"
                className={styles.linkModalBtn}
                style={{ color: themeConfig.dashboard.text }}
                onClick={() => setShowLinkModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.linkModalBtn}
                style={{
                  backgroundColor: themeConfig.buttons.primary,
                  color: themeConfig.buttons.primaryText,
                }}
                onClick={confirmInsertLink}
              >
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
