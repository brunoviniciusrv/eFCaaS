/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Send, 
  Eye, 
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
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Plus, 
  X, 
  ChevronRight, 
  Download, 
  Globe,
  Share2,
  Maximize2,
  Smartphone,
  Monitor,
  Layout,
  ExternalLink,
  Search
} from 'lucide-react';
import { 
  NewsItem, 
  UserProfile, 
  EditorialArticle, 
  ArticleStatus, 
  ArticleTemplateType,
  EditorialComment,
  ArticleVersion,
  LabelConfig,
  ThemeConfig
} from '../types';
import { cn } from '../lib/utils';
import { generateArticleSuggestions } from '../services/geminiService';
import { apiService } from '../services/apiService';

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
  
  // Find related news
  const newsItem = news.find(n => n.id === id);
  const [loadedArticle, setLoadedArticle] = useState<EditorialArticle | null>(null);
  const existingArticle = loadedArticle ?? articles.find(a => a.newsId === id);

  const [loadedNews, setLoadedNews] = useState<NewsItem | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const activeNews = loadedNews ?? newsItem;

  // Editor State
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

    return () => {
      cancelled = true;
    };
  }, [id]);

  useLayoutEffect(() => {
    if (!activeNews || isLoadingNews || !editorRef.current) return;

    const initKey = `${activeNews.id}:${existingArticle?.id ?? 'new'}:${existingArticle?.updatedAt ?? activeNews.report ?? ''}`;
    if (editorInitKeyRef.current === initKey) return;

    const defaultTitle = existingArticle?.title?.trim()
      ? existingArticle.title
      : activeNews.title;
    const defaultContent = existingArticle?.content?.trim()
      ? existingArticle.content
      : activeNews.report
        ? parecerToEditorHtml(activeNews.report)
        : '';

    setTitle(defaultTitle);
    setContent(defaultContent);
    editorRef.current.innerHTML = defaultContent;
    if (existingArticle?.status) setStatus(existingArticle.status);
    if (existingArticle?.template) setTemplate(existingArticle.template);
    if (existingArticle?.comments) setComments(existingArticle.comments);
    editorInitKeyRef.current = initKey;
  }, [activeNews, existingArticle, isLoadingNews]);

  useEffect(() => {
    if (!isLoadingNews && !activeNews) {
      navigate('/dashboard');
    }
  }, [activeNews, isLoadingNews, navigate]);

  const handleSave = async () => {
    const plainExcerpt = content.replace(/<[^>]*>/g, '').trim();
    const article: EditorialArticle = {
      id: existingArticle?.id || '',
      newsId: id || '',
      title,
      content,
      excerpt: plainExcerpt
        ? `${plainExcerpt.substring(0, 150)}${plainExcerpt.length > 150 ? '...' : ''}`
        : title,
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
      console.error('Erro ao salvar matéria:', err);
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
        <div class="font-display font-bold text-lg tracking-wider" style="color: ${labelConfig?.color || '#333'}">
          [${label.toUpperCase()}]
        </div>
        <div class="text-sm text-gray-600">
          Checagem oficial realizada pela plataforma eFCaaS em ${new Date().toLocaleDateString('pt-BR')}.
        </div>
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

  if (isLoadingNews) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: themeConfig.dashboard.background }}>
        <p className="text-sm opacity-50">Carregando parecer...</p>
      </div>
    );
  }

  if (!activeNews) return null;

  return (
    <div className="flex h-screen overflow-hidden font-sans transition-colors duration-300" style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
      {/* Left Sidebar: Context & Evidence */}
      <aside className="w-80 border-r overflow-y-auto hidden lg:flex flex-col" style={{ backgroundColor: themeConfig.general.cardBackground, borderRightColor: themeConfig.general.border }}>
        <div className="p-4 border-b" style={{ borderBottomColor: themeConfig.general.border, backgroundColor: themeConfig.general.tableHeaderBackground }}>
          <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: themeConfig.dashboard.text }}>
            <FileText className="w-4 h-4" /> Parecer da Checagem
          </h2>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Label Context */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conclusão</label>
            <div className="mt-2 text-sm font-medium p-3 border rounded-lg shadow-sm flex items-center justify-between group" style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.border }}>
              <span className={cn(
                "px-2 py-1 rounded text-white text-xs font-bold",
                activeNews.reportStructure?.label === 'Falso' ? 'bg-red-500' :
                activeNews.reportStructure?.label === 'Verdadeiro' ? 'bg-green-500' : 'bg-orange-500'
              )}>
                {activeNews.reportStructure?.label || 'Não definido'}
              </span>
              <button 
                onClick={insertLabel}
                className="p-1 rounded hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
                title="Inserir no editor"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Briefing Summary */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumo da Evidência</label>
            <div className="mt-2 text-xs rounded-lg leading-relaxed p-3 border" style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.border, color: themeConfig.dashboard.text }}>
              {activeNews.aiEvaluation?.explanation || "Aguardando processamento..."}
            </div>
          </div>

          {/* Sources List */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fontes de Apoio</label>
            <div className="mt-2 space-y-2">
              {(activeNews.reportStructure?.sources ?? []).map((source, idx) => (
                <div key={idx} className="group p-2 bg-white border border-slate-200 rounded-md text-xs flex items-center justify-between hover:border-blue-200 transition-all">
                  <span className="truncate max-w-[180px] text-slate-500">{source}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <div key={ev.id} className="group p-2 bg-white border border-slate-200 rounded-md text-xs flex items-center justify-between hover:border-blue-200">
                  <span className="truncate max-w-[180px] text-slate-500 font-medium">{ev.title}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
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

          {/* Tips / Analysis Notes */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notas Técnicas</label>
            <ul className="mt-2 space-y-2">
              {(activeNews.aiEvaluation?.characteristics ?? []).map((char, idx) => (
                <li key={idx} className="text-[10px] text-slate-500 flex gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  {char.replace(/\*\*/g, '')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Main Content: The Editor */}
      <main className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
        {/* Editor Toolbar */}
        <header className="h-16 border-b flex items-center justify-between px-6 shrink-0 z-10" style={{ borderBottomColor: themeConfig.general.border, backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}>
          <div className="flex items-center gap-4">
            <div className="flex p-1 rounded-lg" style={{ backgroundColor: themeConfig.general.inputBackground }}>
              <button 
                onClick={() => setActiveTab('editor')}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                )}
                style={{
                  backgroundColor: activeTab === 'editor' ? themeConfig.general.cardBackground : 'transparent',
                  color: activeTab === 'editor' ? themeConfig.general.accent : themeConfig.buttons.secondaryText
                }}
              >
                Editor
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-all"
                )}
                style={{
                  backgroundColor: activeTab === 'preview' ? themeConfig.general.cardBackground : 'transparent',
                  color: activeTab === 'preview' ? themeConfig.general.accent : themeConfig.buttons.secondaryText
                }}
              >
                Preview
              </button>
            </div>
            
            <div className="h-6 w-[1px] mx-2" style={{ backgroundColor: themeConfig.general.border }} />
            
            <div className="flex items-center gap-2">
              <select 
                value={template}
                onChange={(e) => setTemplate(e.target.value as ArticleTemplateType)}
                className="text-xs font-medium border rounded-md px-2 py-1 outline-none transition-all"
                style={{ 
                  backgroundColor: themeConfig.general.inputBackground, 
                  borderColor: themeConfig.general.inputBorder,
                  color: themeConfig.general.inputText
                }}
              >
                <option value="short">Artigo Curto</option>
                <option value="breaking">Breaking News</option>
                <option value="complete">Análise Completa</option>
                <option value="quick_check">Fact-Check Rápido</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowComments(!showComments)}
              className="p-2 rounded-full transition-colors relative"
              style={{
                color: showComments ? themeConfig.general.accent : themeConfig.buttons.secondaryText,
                backgroundColor: showComments ? `${themeConfig.general.accent}15` : 'transparent'
              }}
            >
              <MessageSquare className="w-5 h-5" />
              {comments.filter(c => !c.resolved).length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2" style={{ borderColor: themeConfig.general.cardBackground }}>
                  {comments.filter(c => !c.resolved).length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-full transition-colors"
              style={{
                color: showHistory ? themeConfig.general.accent : themeConfig.buttons.secondaryText,
                backgroundColor: showHistory ? `${themeConfig.general.accent}15` : 'transparent'
              }}
            >
              <History className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] mx-1" style={{ backgroundColor: themeConfig.general.border }} />
            <div className="flex items-center gap-2">
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="text-xs font-bold uppercase tracking-widest border rounded-md px-3 py-1.5 outline-none transition-all"
                style={{ 
                  backgroundColor: themeConfig.general.inputBackground, 
                  borderColor: themeConfig.general.inputBorder,
                  color: themeConfig.general.inputText
                }}
              >
                <option value="draft">Rascunho</option>
                <option value="review">Para Revisão</option>
                <option value="approved">Aprovado</option>
                <option value="published" disabled={!checkPermission('publish_article')}>Publicado</option>
              </select>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-md hover:opacity-95 disabled:opacity-50"
                style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </header>

        {/* Editor Body */}
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'editor' ? (
              <motion.div 
                key="editor-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-3xl mx-auto py-16 px-8 min-h-full"
              >
                {/* AI Tools Bar */}
                <div className="mb-12 flex justify-center">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 flex items-center gap-1">
                    <button 
                      onClick={() => handleAIAction('title')}
                      disabled={isAISuggesting}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" /> {isAISuggesting ? 'Gerando...' : 'Sugerir Título'}
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200" />
                    <button 
                      onClick={() => handleAIAction('lead')}
                      disabled={isAISuggesting}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Type className="w-3.5 h-3.5 text-purple-500" /> Lead Jornalístico
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200" />
                    <button 
                      onClick={() => handleAIAction('summarize')}
                      disabled={isAISuggesting}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <FileText className="w-3.5 h-3.5 text-green-500" /> Resumir
                    </button>
                  </div>
                </div>

                {/* Cover Image Area */}
                <div className="group relative mb-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 h-56 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all overflow-hidden">
                  <ImageIcon className="w-10 h-10 text-slate-300 group-hover:text-blue-400 mb-2 transition-colors" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-blue-500">Adicionar Capa</span>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Recomendado: 1200x630 (aspecto 1.91:1)</p>
                </div>

                {/* Writing Canvas */}
                <div className="space-y-6">
                  <textarea 
                    placeholder="Título da matéria..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-4xl lg:text-5xl font-display font-bold text-slate-900 border-none outline-none placeholder:text-slate-200 resize-none leading-tight"
                    rows={1}
                  />

                  {/* RTF Toolbar Placeholder */}
                  <div className="sticky top-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full shadow-lg p-1 flex items-center gap-1 z-20">
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Negrito"><Bold className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Itálico"><Italic className="w-4 h-4" /></button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Título H2"><Layout className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Citação"><Quote className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Lista"><List className="w-4 h-4" /></button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Link"><LinkIcon className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-slate-100 rounded-full text-slate-600" title="Imagem"><ImageIcon className="w-4 h-4" /></button>
                    <div className="flex-1" />
                    <button className="px-3 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-full uppercase tracking-widest">
                      Blocos customizados
                    </button>
                  </div>

                  <div 
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setContent(e.currentTarget.innerHTML)}
                    className="w-full min-h-[500px] text-lg lg:text-xl font-serif text-slate-700 outline-none placeholder:text-slate-200 leading-relaxed prose prose-slate prose-lg max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-200"
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
                className="flex-1 bg-slate-100 p-8 flex flex-col items-center"
              >
                {/* Preview Controls */}
                <div className="mb-6 flex gap-2">
                  <button 
                    onClick={() => setPreviewMode('desktop')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      previewMode === 'desktop' ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    <Monitor className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setPreviewMode('mobile')}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      previewMode === 'mobile' ? "bg-white text-blue-600 shadow-sm" : "bg-transparent text-slate-500 hover:bg-slate-200"
                    )}
                  >
                    <Smartphone className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview Container */}
                <div className={cn(
                  "bg-white shadow-2xl transition-all duration-500 overflow-y-auto scroll-smooth",
                  previewMode === 'desktop' ? "w-full max-w-4xl min-h-[1000px] rounded-t-xl" : "w-[375px] h-[667px] rounded-[3rem] border-[12px] border-slate-900"
                )}>
                  {/* Mock Browser Header for Desktop */}
                  {previewMode === 'desktop' && (
                    <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 max-w-md mx-auto h-6 bg-white border border-slate-200 rounded-md flex items-center px-3 gap-2">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-500 truncate">https://efcaas.com/news/{id}</span>
                      </div>
                    </div>
                  )}

                  <div className={cn(
                    "p-8 lg:p-16",
                    previewMode === 'mobile' && "p-6"
                  )}>
                    <div className="max-w-prose mx-auto">
                      <header className="mb-12">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-blue-600 text-xs font-bold uppercase tracking-widest">Fact-Check</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 text-xs">{new Date().toLocaleDateString('pt-BR')}</span>
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-display font-bold text-slate-900 leading-tight mb-6">
                          {title || "Sem Título"}
                        </h1>
                        <div className="flex items-center gap-3">
                          <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border border-slate-200" />
                          <div>
                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                            <p className="text-xs text-slate-500">Editor @ eFCaaS</p>
                          </div>
                        </div>
                      </header>

                      <div className="prose prose-slate prose-lg max-w-none font-serif leading-relaxed text-slate-800">
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
            className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-2xl z-20"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                {showComments ? <MessageSquare className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {showComments ? "Comentários e Notas" : "Histórico de Versões"}
              </h3>
              <button onClick={() => { setShowComments(false); setShowHistory(false); }} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {showComments ? (
                <>
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                        <p className="text-xs text-slate-400">Nenhum comentário editorial ainda.</p>
                      </div>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className={cn(
                          "p-4 rounded-xl border transition-all",
                          comment.resolved ? "bg-slate-50 border-slate-100 opacity-60" : "bg-yellow-50/30 border-yellow-100"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{comment.userName}</span>
                            <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-8 border-t border-slate-100 pt-4">
                    <textarea 
                      placeholder="Adicionar nota para revisão..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none min-h-[100px] resize-none"
                    />
                    <button 
                      onClick={addComment}
                      className="w-full mt-2 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors uppercase tracking-widest"
                    >
                      Comentar
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {existingArticle?.versions?.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                      <p className="text-xs text-slate-400">Você ainda não tem versões salvas.</p>
                    </div>
                  ) : (
                    existingArticle?.versions?.map((v, idx) => (
                      <div key={v.id} className="p-3 border border-slate-200 rounded-lg hover:border-blue-200 cursor-pointer transition-all group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700">Versão v{existingArticle.versions.length - idx}</span>
                          <span className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{v.authorName} - Modificações menores</p>
                        <div className="mt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Restaurar</button>
                          <button className="text-[10px] text-slate-400 font-bold uppercase hover:underline">Comparar</button>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="p-4 bg-slate-50 rounded-xl border border-dotted border-slate-300">
                    <p className="text-[10px] text-slate-500 font-medium text-center">
                      Auto-save ativado. Próxima versão em 15m.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 lg:hidden flex flex-col gap-2">
        <button className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-pulse">
          <Sparkles className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

