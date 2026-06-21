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
  Image as ImageIcon, 
  Type, 
  Link as LinkIcon, 
  Bold, 
  Italic, 
  List, 
  Quote, 
  FileText, 
  Sparkles, 
  Plus, 
  X, 
  Download, 
  Globe,
  Maximize2,
  Smartphone,
  Monitor,
  Layout,
  ExternalLink
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
import { cn } from '../lib/utils';
import { generateArticleSuggestions } from '../services/geminiService';
import { apiService } from '../services/apiService';
import styles from './EditorView.module.css';

function parecerToEditorHtml(text: string): string {
  if (!text.trim()) return '';
  if (text.trim().startsWith('<')) return text;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
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

export function EditorView({ user, news, labels, onSaveArticle, articles, checkPermission, themeConfig }: EditorViewProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
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
  const editorInitKeyRef = useRef('');

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
    if (existingArticle?.status) setStatus(existingArticle.status);
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

  const handleAIAction = async (action: string) => {
    if (!activeNews) return;
    setIsAISuggesting(true);
    try {
      const result = await generateArticleSuggestions(activeNews.title, content);
      if (action === 'title') setTitle(result.titles[0]);
      if (action === 'lead') setEditorContent((prev) => result.excerpt + '<br><br>' + prev);
      if (action === 'summarize') setEditorContent(result.excerpt);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAISuggesting(false);
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
              {activeNews.aiEvaluation?.explanation || "Aguardando processamento..."}
            </div>
          </div>

          <div className={styles.sidebarSection}>
            <label className={styles.sidebarLabel}>Fontes de Apoio</label>
            <div className={styles.sourcesWrap}>
              {(activeNews.reportStructure?.sources ?? []).map((source, idx) => (
                <div key={idx} className={styles.sourceItem}>
                  <span className={styles.sourceUrl}>{source}</span>
                  <div className={styles.sourceActions}>
                    <a href={source} target="_blank" rel="noreferrer" className="p-1 hover:text-blue-600">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button onClick={() => insertSource(source)} className="p-1 hover:text-green-600">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {activeNews.evidence.map((ev) => (
                <div key={ev.id} className={styles.sourceItem}>
                  <span className={styles.sourceUrl}>{ev.title}</span>
                  <div className={styles.sourceActions}>
                    <a href={ev.url} target="_blank" rel="noreferrer" className="p-1 hover:text-blue-600">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <button onClick={() => insertSource(ev.url)} className="p-1 hover:text-green-600">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
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
          <div className={styles.toolbarLeft}>
            <div className={styles.tabGroup} style={{ backgroundColor: themeConfig.general.inputBackground }}>
              <button 
                onClick={() => setActiveTab('editor')}
                className={styles.tabBtn}
                style={{
                  backgroundColor: activeTab === 'editor' ? themeConfig.general.cardBackground : 'transparent',
                  color: activeTab === 'editor' ? themeConfig.general.accent : themeConfig.buttons.secondaryText
                }}
              >
                Editor
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={styles.tabBtn}
                style={{
                  backgroundColor: activeTab === 'preview' ? themeConfig.general.cardBackground : 'transparent',
                  color: activeTab === 'preview' ? themeConfig.general.accent : themeConfig.buttons.secondaryText
                }}
              >
                Preview
              </button>
            </div>
            
            <div className={styles.toolbarDivider} style={{ backgroundColor: themeConfig.general.border }} />
            
            <div className="flex items-center gap-2">
              <select 
                value={template}
                onChange={(e) => setTemplate(e.target.value as ArticleTemplateType)}
                className={styles.templateSelect}
                style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
              >
                <option value="short">Artigo Curto</option>
                <option value="breaking">Breaking News</option>
                <option value="complete">Análise Completa</option>
                <option value="quick_check">Fact-Check Rápido</option>
              </select>
            </div>
          </div>

          <div className={styles.toolbarRight}>
            <button 
              onClick={() => setShowComments(!showComments)}
              className={styles.iconBtn}
              style={{
                color: showComments ? themeConfig.general.accent : themeConfig.buttons.secondaryText,
                backgroundColor: showComments ? `${themeConfig.general.accent}15` : 'transparent'
              }}
            >
              <MessageSquare className="w-5 h-5" />
              {comments.filter(c => !c.resolved).length > 0 && (
                <span className={styles.commentBadge} style={{ borderColor: themeConfig.general.cardBackground }}>
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={styles.iconBtn}
              style={{
                color: showHistory ? themeConfig.general.accent : themeConfig.buttons.secondaryText,
                backgroundColor: showHistory ? `${themeConfig.general.accent}15` : 'transparent'
              }}
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
                <option value="published" disabled={!checkPermission('publish_article')}>Publicado</option>
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
          <AnimatePresence mode="wait">
            {activeTab === 'editor' ? (
              <motion.div 
                key="editor-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={styles.editorPane}
              >
                {/* AI Tools Bar */}
                <div className={styles.aiBar}>
                  <div className={styles.aiToolbar}>
                    <button onClick={() => handleAIAction('title')} disabled={isAISuggesting} className={styles.aiBtn}>
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" /> {isAISuggesting ? 'Gerando...' : 'Sugerir Título'}
                    </button>
                    <div className={styles.aiDivider} />
                    <button onClick={() => handleAIAction('lead')} disabled={isAISuggesting} className={styles.aiBtn}>
                      <Type className="w-3.5 h-3.5 text-purple-500" /> Lead Jornalístico
                    </button>
                    <div className={styles.aiDivider} />
                    <button onClick={() => handleAIAction('summarize')} disabled={isAISuggesting} className={styles.aiBtn}>
                      <FileText className="w-3.5 h-3.5 text-green-500" /> Resumir
                    </button>
                  </div>
                </div>

                {/* Cover Image Area */}
                <div className={styles.coverArea}>
                  <ImageIcon className={styles.coverIcon} />
                  <span className={styles.coverLabel}>Adicionar Capa</span>
                  <p className={styles.coverHint}>Recomendado: 1200x630 (aspecto 1.91:1)</p>
                </div>

                {/* Writing Canvas */}
                <div className={styles.writingCanvas}>
                  <textarea 
                    placeholder="Título da matéria..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={styles.titleTextarea}
                    rows={1}
                  />

                  <div className={styles.rtfToolbar}>
                    <button className={styles.rtfBtn} title="Negrito"><Bold className="w-4 h-4" /></button>
                    <button className={styles.rtfBtn} title="Itálico"><Italic className="w-4 h-4" /></button>
                    <div className={styles.rtfDivider} />
                    <button className={styles.rtfBtn} title="Título H2"><Layout className="w-4 h-4" /></button>
                    <button className={styles.rtfBtn} title="Citação"><Quote className="w-4 h-4" /></button>
                    <button className={styles.rtfBtn} title="Lista"><List className="w-4 h-4" /></button>
                    <div className={styles.rtfDivider} />
                    <button className={styles.rtfBtn} title="Link"><LinkIcon className="w-4 h-4" /></button>
                    <button className={styles.rtfBtn} title="Imagem"><ImageIcon className="w-4 h-4" /></button>
                    <div className="flex-1" />
                    <button className={styles.rtfCustomBlocks}>Blocos customizados</button>
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
              </motion.div>
            ) : (
              <motion.div 
                key="preview-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.previewPane}
              >
                {/* Preview Controls */}
                <div className={styles.previewControls}>
                  <button 
                    onClick={() => setPreviewMode('desktop')}
                    className={previewMode === 'desktop' ? styles.previewBtnActive : styles.previewBtnInactive}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setPreviewMode('mobile')}
                    className={previewMode === 'mobile' ? styles.previewBtnActive : styles.previewBtnInactive}
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview Container */}
                <div className={previewMode === 'desktop' ? styles.previewContainerDesktop : styles.previewContainerMobile}>
                  {previewMode === 'desktop' && (
                    <div className={styles.browserBar}>
                      <div className={styles.browserDots}>
                        <div className={styles.browserDotRed} />
                        <div className={styles.browserDotYellow} />
                        <div className={styles.browserDotGreen} />
                      </div>
                      <div className={styles.browserUrl}>
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className={styles.browserUrlText}>https://efcaas.com/news/{id}</span>
                      </div>
                    </div>
                  )}

                  <div className={previewMode === 'mobile' ? styles.previewBodyMobile : styles.previewBodyDesktop}>
                    <div className={styles.previewContent}>
                      <header className={styles.previewHeader}>
                        <div className={styles.previewTag}>
                          <span className={styles.previewTagLabel}>Fact-Check</span>
                          <span className={styles.previewTagDot}>•</span>
                          <span className={styles.previewTagDate}>{new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h1 className={styles.previewTitle}>{title || "Sem Título"}</h1>
                        <div className={styles.previewAuthorWrap}>
                          <img src={user.avatarUrl} alt={user.name} className={styles.previewAuthorImg} />
                          <div>
                            <p className={styles.previewAuthorName}>{user.name}</p>
                            <p className={styles.previewAuthorRole}>Editor @ eFCaaS</p>
                          </div>
                        </div>
                      </header>
                      <div className={styles.previewArticle}>
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Right Sidebar: Floating Panels (Comments / History) */}
      <AnimatePresence>
        {(showComments || showHistory) && (
          <motion.div 
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            className={styles.rightPanel}
          >
            <div className={styles.rightPanelHeader}>
              <h3 className={styles.rightPanelTitle}>
                {showComments ? <MessageSquare className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {showComments ? "Comentários e Notas" : "Histórico de Versões"}
              </h3>
              <button onClick={() => { setShowComments(false); setShowHistory(false); }} className={styles.rightPanelClose}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className={styles.rightPanelBody}>
              {showComments ? (
                <>
                  <div className={styles.commentsWrap}>
                    {comments.length === 0 ? (
                      <div className={styles.commentEmpty}>
                        <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                        <p className={styles.commentEmptyText}>Nenhum comentário editorial ainda.</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className={comment.resolved ? styles.commentCardResolved : styles.commentCardPending}>
                          <div className={styles.commentMeta}>
                            <span className={styles.commentUser}>{comment.userName}</span>
                            <span className={styles.commentTime}>{new Date(comment.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className={styles.commentText}>{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className={styles.commentFormWrap}>
                    <textarea 
                      placeholder="Adicionar nota para revisão..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className={styles.commentTextarea}
                    />
                    <button onClick={addComment} className={styles.commentSubmit}>Comentar</button>
                  </div>
                </>
              ) : (
                <div className={styles.historyWrap}>
                  {existingArticle?.versions?.length === 0 ? (
                    <div className={styles.historyEmpty}>
                      <History className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                      <p className={styles.historyEmptyText}>Você ainda não tem versões salvas.</p>
                    </div>
                  ) : (
                    existingArticle?.versions?.map((v, idx) => (
                      <div key={v.id} className={styles.historyCard}>
                        <div className={styles.historyCardMeta}>
                          <span className={styles.historyVersion}>Versão v{existingArticle.versions.length - idx}</span>
                          <span className={styles.historyTime}>{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className={styles.historyDesc}>{v.authorName} - Modificações menores</p>
                        <div className={styles.historyActions}>
                          <button className={styles.historyRestore}>Restaurar</button>
                          <button className={styles.historyCompare}>Comparar</button>
                        </div>
                      </div>
                    ))
                  )}
                  <div className={styles.historyNote}>
                    <p className={styles.historyNoteText}>Auto-save ativado. Próxima versão em 15m.</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile Only) */}
      <div className={styles.mobileFab}>
        <button className={styles.mobileFabBtn}>
          <Sparkles className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
