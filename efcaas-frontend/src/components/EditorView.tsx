/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  History, 
  MessageSquare, 
  Link as LinkIcon, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  FileText, 
  Plus, 
  X, 
  Layout,
  ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { 
  NewsItem, 
  UserProfile, 
  EditorialArticle, 
  ArticleStatus, 
  ArticleTemplateType,
  EditorialComment,
  LabelConfig,
  ThemeConfig
} from '../types';
import { apiService } from '../services/apiService';
import { normalizeResourceUrl } from '../lib/apiBaseUrl';
import styles from './EditorView.module.css';

function parecerToEditorHtml(text: string): string {
  if (!text.trim()) return '';
  if (text.trim().startsWith('<')) return text;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function htmlToPlainText(value: string): string {
  if (!value.trim()) return '';
  if (!value.includes('<')) return value.trim();
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatCommentTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface EditorViewProps {
  user: UserProfile;
  news: NewsItem[];
  labels: LabelConfig[];
  onSaveArticle: (article: EditorialArticle) => Promise<void>;
  articles: EditorialArticle[];
  checkPermission: (permId: string) => boolean;
  themeConfig: ThemeConfig;
}

export function EditorView({ user, news, labels, onSaveArticle, articles, themeConfig }: EditorViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const newsItem = news.find(n => n.id === id);
  const [loadedArticle, setLoadedArticle] = useState<EditorialArticle | null>(null);
  const existingArticle = loadedArticle ?? articles.find(a => a.newsId === id);

  const [loadedNews, setLoadedNews] = useState<NewsItem | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const activeNews = loadedNews ?? newsItem;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ArticleStatus>(existingArticle?.status || 'draft');
  const [template, setTemplate] = useState<ArticleTemplateType>(existingArticle?.template || 'complete');
  const [comments, setComments] = useState<EditorialComment[]>(existingArticle?.comments || []);
  const [newComment, setNewComment] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorInitKeyRef = useRef('');

  const syncEditorContent = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const handleToolbarMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const handleInsertLink = () => {
    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(true);
  };

  const confirmInsertLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    const text = linkText.trim();
    if (text) {
      runEditorCommand('insertHTML', `<a href="${url}" target="_blank" rel="noreferrer">${text}</a>`);
    } else {
      runEditorCommand('createLink', url);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleInsertImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !activeNews?.id) return;
    setIsUploadingImage(true);
    try {
      const apiAnexo = await apiService.uploadAnexoConteudo(activeNews.id, file);
      runEditorCommand('insertImage', normalizeResourceUrl(apiAnexo.urlAcesso));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível enviar a imagem.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const setEditorContent = (value: string | ((prev: string) => string)) => {
    setContent((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (editorRef.current) {
        editorRef.current.innerHTML = next;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoadingNews(true);
    editorInitKeyRef.current = '';
    setLoadedArticle(null);

    apiService.obterConteudo(id)
      .then(async (item) => {
        if (cancelled) return;
        const relatorio = await apiService.obterRelatorioPublicacao(id);
        if (cancelled) return;
        setLoadedNews(item);
        setLoadedArticle(relatorio);
      })
      .catch(() => {
        if (!cancelled) setLoadedNews(newsItem ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingNews(false);
      });

    return () => { cancelled = true; };
  }, [id]);

  useLayoutEffect(() => {
    if (!activeNews || isLoadingNews || !editorRef.current) return;
    const initKey = `${activeNews.id}:${existingArticle?.id ?? 'new'}:${existingArticle?.updatedAt ?? activeNews.report ?? ''}`;
    if (editorInitKeyRef.current === initKey) return;

    const defaultTitle = existingArticle?.title?.trim() ? existingArticle.title : activeNews.title;
    const defaultContent = existingArticle?.content?.trim()
      ? existingArticle.content
      : activeNews.report ? parecerToEditorHtml(activeNews.report) : '';

    setTitle(defaultTitle);
    setContent(defaultContent);
    editorRef.current.innerHTML = defaultContent;
    if (existingArticle?.status) {
      setStatus(existingArticle.status === 'published' ? 'approved' : existingArticle.status);
    }
    if (existingArticle?.template) setTemplate(existingArticle.template);
    if (existingArticle?.comments) setComments(existingArticle.comments);
    editorInitKeyRef.current = initKey;
  }, [activeNews, existingArticle, isLoadingNews]);

  useEffect(() => {
    if (!isLoadingNews && !activeNews) navigate('/dashboard');
  }, [activeNews, isLoadingNews, navigate]);

  const handleSave = async () => {
    const plainExcerpt = content.replace(/<[^>]*>/g, '').trim();
    const article: EditorialArticle = {
      id: existingArticle?.id || '',
      newsId: id || '',
      title,
      content,
      excerpt: plainExcerpt ? `${plainExcerpt.substring(0, 150)}${plainExcerpt.length > 150 ? '...' : ''}` : title,
      status,
      template,
      authorId: user.id,
      createdAt: existingArticle?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments,
      versions: existingArticle?.versions || [],
    };
    setIsSaving(true);
    try {
      await onSaveArticle(article);
      navigate('/editorial-archive');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível salvar a matéria.');
    } finally {
      setIsSaving(false);
    }
  };

  const insertLabel = () => {
    const label = activeNews?.reportStructure?.label;
    const labelConfig = labels.find(l => l.name === label);
    if (!label) return;
    const labelHtml = `
      <div class="my-6 p-4 border-l-4 rounded-r-lg bg-gray-50 flex items-center gap-4" style="border-color: ${labelConfig?.color || '#333'}">
        <div class="font-display font-bold text-lg tracking-wider" style="color: ${labelConfig?.color || '#333'}">[${label.toUpperCase()}]</div>
        <div class="text-sm text-gray-600">Checagem oficial realizada pela plataforma eFCaaS em ${new Date().toLocaleDateString('pt-BR')}.</div>
      </div>
    `;
    setEditorContent((prev) => prev + labelHtml);
  };

  const insertSource = (source: string) => {
    const sourceHtml = `<p class="my-2 p-2 bg-blue-50 border border-blue-100 rounded text-sm text-blue-800">
      <strong>Fonte:</strong> <a href="${source}" target="_blank" class="underline">${source}</a>
    </p>`;
    setEditorContent((prev) => prev + sourceHtml);
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: EditorialComment = {
      id: `comm-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      text: newComment,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const getLabelBadgeClass = (label: string | undefined) => {
    if (label === 'Falso') return styles.labelBadgeFalso;
    if (label === 'Verdadeiro') return styles.labelBadgeVerdadeiro;
    return styles.labelBadgeOther;
  };

  if (isLoadingNews) {
    return (
      <div className={styles.loadingState} style={{ backgroundColor: themeConfig.dashboard.background }}>
        <p className={styles.loadingText}>Carregando parecer...</p>
      </div>
    );
  }

  if (!activeNews) return null;

  const parecerText = activeNews.report?.trim()
    ? htmlToPlainText(
        activeNews.report.trim().startsWith('<')
          ? activeNews.report
          : parecerToEditorHtml(activeNews.report),
      )
    : '';
  const evidenceSources = activeNews.evidence ?? [];

  return (
    <div className={styles.page} style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
      {/* Left Sidebar: Context & Evidence */}
      <aside className={styles.leftSidebar} style={{ backgroundColor: themeConfig.general.cardBackground, borderRightColor: themeConfig.general.border }}>
        <div className={styles.leftSidebarHeader} style={{ borderBottomColor: themeConfig.general.border, backgroundColor: themeConfig.general.tableHeaderBackground }}>
          <h2 className={styles.leftSidebarTitle} style={{ color: themeConfig.dashboard.text }}>
            <FileText className="w-4 h-4" /> Parecer da Checagem
          </h2>
        </div>
        
        <div className={styles.leftSidebarBody}>
          <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>Conclusão</label>
            <div className={styles.labelBadgeWrap} style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.border }}>
              <span className={getLabelBadgeClass(activeNews.reportStructure?.label)}>
                {activeNews.reportStructure?.label || 'Não definido'}
              </span>
              <button 
                onClick={insertLabel}
                className={styles.insertBtn}
                style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
                title="Inserir no editor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>Resumo da Evidência</label>
            <div className={styles.summaryText} style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.border, color: themeConfig.dashboard.text }}>
              {parecerText || 'Nenhum parecer registrado na checagem.'}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>Fontes de Apoio</label>
            <div className={styles.sourcesWrap}>
              {evidenceSources.length === 0 ? (
                <p className={styles.emptySources} style={{ color: themeConfig.general.mutedText }}>
                  Nenhuma evidência cadastrada na checagem.
                </p>
              ) : (
                evidenceSources.map((ev) => (
                  <div
                    key={ev.id}
                    className={styles.sourceItem}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.border }}
                  >
                    <div className={styles.sourceInfo}>
                      <span className={styles.sourceTitle} style={{ color: themeConfig.dashboard.text }}>
                        {ev.title?.trim() || 'Evidência'}
                      </span>
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.sourceLink}
                        style={{ color: themeConfig.general.accent }}
                        title={ev.url}
                      >
                        {ev.url}
                      </a>
                    </div>
                    <div className={styles.sourceActions}>
                      <a href={ev.url} target="_blank" rel="noreferrer" className={styles.sourceActionBtn} title="Abrir link">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => insertSource(ev.url)}
                        className={styles.sourceActionBtn}
                        title="Inserir no editor"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>Notas Técnicas</label>
            <ul className={styles.notesList}>
              {(activeNews.aiEvaluation?.characteristics ?? []).map((char, idx) => (
                <li key={idx} className={styles.noteItem}>
                  <div className={styles.noteDot} />
                  {char.replace(/\*\*/g, '')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content: The Editor */}
      <main className={styles.main} style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
        {/* Editor Toolbar */}
        <header className={styles.toolbar} style={{ borderBottomColor: themeConfig.general.border, backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}>
          <div className={styles.toolbarRight}>
            <button
              type="button"
              onClick={() => {
                setShowHistory(false);
                setShowComments(true);
              }}
              className={styles.commentsBtn}
              style={{
                borderColor: themeConfig.general.border,
                color: themeConfig.dashboard.text,
                backgroundColor: showComments ? `${themeConfig.general.accent}15` : themeConfig.general.inputBackground,
              }}
            >
              <MessageSquare className="w-4 h-4" />
              Comentários
              {comments.length > 0 && (
                <span className={styles.commentsBtnBadge} style={{ backgroundColor: themeConfig.general.accent }}>
                  {comments.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowComments(false);
                setShowHistory(true);
              }}
              className={styles.iconBtn}
              style={{
                color: showHistory ? themeConfig.general.accent : themeConfig.buttons.secondaryText,
                backgroundColor: showHistory ? `${themeConfig.general.accent}15` : 'transparent',
              }}
              title="Histórico de versões"
            >
              <History className="w-5 h-5" />
            </button>
            <div className={styles.toolbarDivider} style={{ backgroundColor: themeConfig.general.border }} />
            <div className="flex items-center gap-2">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className={styles.statusSelect}
                style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
              >
                <option value="draft">Rascunho</option>
                <option value="review">Para Revisão</option>
                <option value="approved">Aprovado</option>
              </select>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={styles.saveBtn}
                style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </header>

        {/* Editor Body */}
        <div className={styles.editorBody}>
          <div className={styles.editorPane}>
            <div className={styles.writingCanvas}>
              <textarea 
                placeholder="Título da matéria..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles.titleTextarea}
                rows={1}
              />

              <div className={styles.rtfToolbar}>
                <button type="button" className={styles.rtfBtn} title="Negrito" onMouseDown={handleToolbarMouseDown} onClick={() => runEditorCommand('bold')}>
                  <Bold className="w-4 h-4" />
                </button>
                <button type="button" className={styles.rtfBtn} title="Itálico" onMouseDown={handleToolbarMouseDown} onClick={() => runEditorCommand('italic')}>
                  <Italic className="w-4 h-4" />
                </button>
                <div className={styles.rtfDivider} />
                <button type="button" className={styles.rtfBtn} title="Título H2" onMouseDown={handleToolbarMouseDown} onClick={() => runEditorCommand('formatBlock', 'h2')}>
                  <Layout className="w-4 h-4" />
                </button>
                <button type="button" className={styles.rtfBtn} title="Citação" onMouseDown={handleToolbarMouseDown} onClick={() => runEditorCommand('formatBlock', 'blockquote')}>
                  <Quote className="w-4 h-4" />
                </button>
                <button type="button" className={styles.rtfBtn} title="Lista" onMouseDown={handleToolbarMouseDown} onClick={() => runEditorCommand('insertUnorderedList')}>
                  <List className="w-4 h-4" />
                </button>
                <div className={styles.rtfDivider} />
                <button type="button" className={styles.rtfBtn} title="Link" onMouseDown={handleToolbarMouseDown} onClick={handleInsertLink}>
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className={styles.rtfBtn}
                  title="Imagem"
                  disabled={isUploadingImage}
                  onMouseDown={handleToolbarMouseDown}
                  onClick={handleInsertImage}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileSelected}
                />
              </div>

              <div 
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContent(e.currentTarget.innerHTML)}
                className={styles.contentEditor}
                data-placeholder="Comece a escrever a sua checagem aqui..."
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modals: Comments / History */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            style={{ backgroundColor: themeConfig.general.modalOverlay }}
            onClick={() => setShowComments(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className={styles.modalPanel}
              style={{ backgroundColor: themeConfig.general.modalBackground, borderColor: themeConfig.general.border, color: themeConfig.general.modalText }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h3 className={styles.modalTitle}>
                  <MessageSquare className="w-4 h-4" />
                  Comentários editoriais
                </h3>
                <button type="button" onClick={() => setShowComments(false)} className={styles.modalClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.commentsWrap}>
                  {comments.length === 0 ? (
                    <div className={styles.commentEmpty}>
                      <MessageSquare className="w-10 h-10 opacity-20 mx-auto mb-3" />
                      <p className={styles.commentEmptyText}>Nenhum comentário ainda.</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={styles.commentCardPending}
                        style={{ borderColor: themeConfig.general.border, backgroundColor: `${themeConfig.dashboard.background}30` }}
                      >
                        <div className={styles.commentMeta}>
                          <span className={styles.commentUser} style={{ color: themeConfig.dashboard.text }}>
                            {comment.userName}
                          </span>
                          <span className={styles.commentTime}>
                            {formatCommentTimestamp(comment.timestamp)}
                          </span>
                        </div>
                        <p className={styles.commentText} style={{ color: themeConfig.dashboard.text }}>
                          {comment.text}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles.commentFormWrap} style={{ borderColor: themeConfig.general.border }}>
                  <textarea
                    placeholder="Escreva um comentário para a equipe..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={styles.commentTextarea}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                  />
                  <button
                    type="button"
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className={styles.commentSubmit}
                    style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                  >
                    Publicar comentário
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLinkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            style={{ backgroundColor: themeConfig.general.modalOverlay }}
            onClick={() => setShowLinkModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className={styles.modalPanel}
              style={{ backgroundColor: themeConfig.general.modalBackground, borderColor: themeConfig.general.border, color: themeConfig.general.modalText }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h3 className={styles.modalTitle}>
                  <LinkIcon className="w-4 h-4" />
                  Inserir link
                </h3>
                <button type="button" onClick={() => setShowLinkModal(false)} className={styles.modalClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.sidebarLabel}>URL *</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className={styles.commentTextarea}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, minHeight: 'auto', marginBottom: '1rem' }}
                />
                <label className={styles.sidebarLabel}>Texto (opcional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto do link"
                  className={styles.commentTextarea}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, minHeight: 'auto' }}
                />
                <button
                  type="button"
                  onClick={confirmInsertLink}
                  disabled={!linkUrl.trim()}
                  className={styles.commentSubmit}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText, marginTop: '1rem' }}
                >
                  Inserir link
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
            style={{ backgroundColor: themeConfig.general.modalOverlay }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className={styles.modalPanel}
              style={{ backgroundColor: themeConfig.general.modalBackground, borderColor: themeConfig.general.border, color: themeConfig.general.modalText }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h3 className={styles.modalTitle}>
                  <History className="w-4 h-4" />
                  Histórico de versões
                </h3>
                <button type="button" onClick={() => setShowHistory(false)} className={styles.modalClose}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.historyWrap}>
                  {!existingArticle?.versions?.length ? (
                    <div className={styles.historyEmpty}>
                      <History className="w-10 h-10 opacity-20 mx-auto mb-3" />
                      <p className={styles.historyEmptyText}>Você ainda não tem versões salvas.</p>
                    </div>
                  ) : (
                    existingArticle.versions.map((v, idx) => (
                      <div key={v.id} className={styles.historyCard} style={{ borderColor: themeConfig.general.border }}>
                        <div className={styles.historyCardMeta}>
                          <span className={styles.historyVersion}>Versão v{existingArticle.versions.length - idx}</span>
                          <span className={styles.historyTime}>{formatCommentTimestamp(v.timestamp)}</span>
                        </div>
                        <p className={styles.historyDesc}>{v.authorName} — modificações registradas</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
