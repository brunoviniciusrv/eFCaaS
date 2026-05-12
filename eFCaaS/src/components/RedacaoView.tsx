import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  ChevronRight, 
  ExternalLink,
  History,
  AlertCircle,
  Eye,
  PenTool,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Quote,
  Minus,
  Bold,
  Italic,
  List,
  Type,
  PlusCircle,
  ChevronDown
} from 'lucide-react';
import { NewsItem, ThemeConfig, UserProfile, AuditLog } from '../types';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

interface RedacaoViewProps {
  news: NewsItem[];
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  currentUser: UserProfile;
  themeConfig: ThemeConfig;
  addAuditLog: (action: string, target?: string, details?: string) => void;
}

export const RedacaoView = ({ 
  news, 
  setNews, 
  currentUser, 
  themeConfig,
  addAuditLog
}: RedacaoViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const completedNews = useMemo(() => {
    return news.filter(n => n.status === 'completed' || n.status === 'final_review')
      .filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()) || n.id.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.completedAt || b.date).getTime() - new Date(a.completedAt || a.date).getTime());
  }, [news, searchTerm]);

  const selectedItem = useMemo(() => {
    return news.find(n => n.id === selectedId);
  }, [news, selectedId]);

  const handleSelectItem = (item: NewsItem) => {
    setSelectedId(item.id);
    setEditedText(item.report || '');
  };

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedText;
    const beforeText = text.substring(0, start);
    const selectedText = text.substring(start, end);
    const afterText = text.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    setEditedText(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertSnippet = (type: string) => {
    setIsInsertMenuOpen(false);
    switch(type) {
      case 'image':
        insertAtCursor('![Legenda da Imagem](https://via.placeholder.com/800x450?text=Imagem+Noticia)');
        break;
      case 'link':
        insertAtCursor('[Texto do Link](', ')');
        break;
      case 'table':
        insertAtCursor('\n| Cabeçalho 1 | Cabeçalho 2 |\n| ----------- | ----------- |\n| Dado 1 | Dado 2 |\n');
        break;
      case 'quote':
        insertAtCursor('\n> ');
        break;
      case 'divider':
        insertAtCursor('\n---\n');
        break;
      case 'summary':
        insertAtCursor(`\n\n### Resumo da Investigação\n${selectedItem?.reportStructure?.summary || ''}\n`);
        break;
      case 'sources':
        const sourcesMd = selectedItem?.reportStructure?.sources.map(s => `- ${s}`).join('\n') || '';
        insertAtCursor(`\n\n### Fontes Consultadas\n${sourcesMd}\n`);
        break;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    addAuditLog('copy_report', `News #${selectedId}`, 'Report text copied to clipboard for publication.');
  };

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate API integration
    setTimeout(() => {
      setIsPublishing(false);
      addAuditLog('publish_report', `News #${selectedId}`, 'Report published via editorial API integration.');
      alert('Publicado com sucesso no portal de notícias!');
    }, 2000);
  };

  const handleSaveDraft = () => {
    setNews(prev => prev.map(n => n.id === selectedId ? { ...n, report: editedText } : n));
    addAuditLog('save_report_draft', `News #${selectedId}`, 'Editorial draft saved by editor.');
  };

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Main content - Editor */}
      <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
        <AnimatePresence mode="wait">
          {selectedItem ? (
            <motion.div 
              key={selectedId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-4 bg-white border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div className="flex items-center gap-4">
                  {!isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(true)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600"
                      title="Abrir Fluxo de Redação"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-lg font-bold">{selectedItem.title}</h1>
                    <p className="text-xs opacity-50">Editando versão final para publicação</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleSaveDraft}
                    className="p-2 text-slate-500 hover:text-slate-900 transition-colors"
                    title="Salvar Rascunho Editorial"
                  >
                    <History size={20} />
                  </button>
                  <button 
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm",
                      copySuccess ? "bg-green-600 text-white" : "bg-white border text-slate-700 hover:bg-slate-50"
                    )}
                    style={{ borderColor: themeConfig.general.border }}
                  >
                    {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                    {copySuccess ? 'Copiado!' : 'Copiar Texto'}
                  </button>
                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Publicar
                  </button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="px-4 py-2 bg-white border-b flex items-center gap-1" style={{ borderColor: themeConfig.general.border }}>
                <div className="relative">
                  <button 
                    onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  >
                    <PlusCircle size={14} className="text-blue-600" />
                    Inserir
                    <ChevronDown size={12} className="opacity-50" />
                  </button>
                  
                  {isInsertMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsInsertMenuOpen(false)} />
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border z-20 py-1" style={{ borderColor: themeConfig.general.border }}>
                        <button onClick={() => handleInsertSnippet('image')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <ImageIcon size={14} className="text-slate-400" /> Inserir Imagem
                        </button>
                        <button onClick={() => handleInsertSnippet('link')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <LinkIcon size={14} className="text-slate-400" /> Inserir Link
                        </button>
                        <button onClick={() => handleInsertSnippet('table')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <TableIcon size={14} className="text-slate-400" /> Inserir Tabela
                        </button>
                        <button onClick={() => handleInsertSnippet('quote')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <Quote size={14} className="text-slate-400" /> Bloco de Citação
                        </button>
                        <button onClick={() => handleInsertSnippet('divider')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors">
                          <Minus size={14} className="text-slate-400" /> Linha Divisora
                        </button>
                        <div className="h-[1px] bg-slate-100 my-1" />
                        <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">Dados da Investigação</div>
                        <button onClick={() => handleInsertSnippet('summary')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors font-medium text-blue-600">
                          <AlertCircle size={14} /> Resumo Técnico
                        </button>
                        <button onClick={() => handleInsertSnippet('sources')} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs hover:bg-slate-50 transition-colors font-medium text-blue-600">
                          <ExternalLink size={14} /> Lista de Fontes
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                <button onClick={() => insertAtCursor('**', '**')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Negrito">
                  <Bold size={16} className="text-slate-600" />
                </button>
                <button onClick={() => insertAtCursor('*', '*')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Itálico">
                  <Italic size={16} className="text-slate-600" />
                </button>
                <button onClick={() => insertAtCursor('\n# ')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Título">
                  <Type size={16} className="text-slate-600" />
                </button>
                <button onClick={() => insertAtCursor('\n- ')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="Lista">
                  <List size={16} className="text-slate-600" />
                </button>
              </div>

              <div className="flex-1 p-6 flex gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden" style={{ borderColor: themeConfig.general.border }}>
                    <div className="px-4 py-2 bg-slate-50 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Área de Redação (Markdown)</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {editedText.split(/\s+/).filter(x => x).length} palavras
                      </span>
                    </div>
                    <textarea 
                      ref={textareaRef}
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      className="flex-1 p-8 outline-none resize-none font-mono text-sm leading-relaxed"
                      placeholder="Comece a redigir o texto final..."
                    />
                  </div>
                </div>

                <div className="w-96 flex flex-col gap-4">
                  <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col overflow-hidden" style={{ borderColor: themeConfig.general.border }}>
                    <div className="px-4 py-2 bg-slate-50 border-b flex items-center" style={{ borderColor: themeConfig.general.border }}>
                      <Eye size={12} className="mr-2 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Visualização do Leitor</span>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto prose prose-sm max-w-none prose-headings:font-bold prose-a:text-blue-600">
                      {editedText ? (
                        <div className="markdown-body">
                          <ReactMarkdown>{editedText}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-center p-8">
                          <FileText size={48} className="mb-4" />
                          <p className="text-xs">O texto formatado aparecerá aqui durante a redação.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-blue-800">
                      <AlertCircle size={14} />
                      <span className="text-xs font-bold uppercase">Parecer de Origem</span>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] text-blue-900 leading-relaxed italic">
                         "{selectedItem.reportStructure?.summary || 'Nenhum resumo técnico disponível.'}"
                       </p>
                       <div className="flex flex-wrap gap-1.5 pt-2 border-t border-blue-100">
                         {selectedItem.reportStructure?.sources.slice(0, 3).map((s, i) => (
                           <span key={i} className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-md truncate max-w-[150px]">
                             {s}
                           </span>
                         ))}
                         {selectedItem.reportStructure?.sources.length! > 3 && (
                           <span className="text-[9px] opacity-50">+{selectedItem.reportStructure?.sources.length! - 3}</span>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-50 h-full">
              <div className="flex items-center gap-4 mb-6">
                {!isSidebarOpen && (
                   <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 bg-white border shadow-sm rounded-full hover:bg-slate-50 transition-all text-blue-600 hover:scale-110"
                    title="Abrir Fluxo de Redação"
                  >
                    <ChevronRight size={24} className="rotate-180" />
                  </button>
                )}
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                  <PenTool size={48} />
                </div>
              </div>
              <h2 className="text-xl font-bold">Selecione um parecer concluído</h2>
              <p className="text-sm max-w-xs mt-2">
                Pareceres com status "Concluído" ou "Em Revisão Final" aparecerão na lista lateral para redação editorial.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Sidebar - List of completed items (Now on the Right) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l flex flex-col bg-white overflow-hidden" 
            style={{ borderColor: themeConfig.general.border }}
          >
            <div className="p-4 border-b space-y-3" style={{ borderColor: themeConfig.general.border }}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Fluxo de Redação</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-md transition-colors opacity-50 hover:opacity-100"
                  title="Recolher"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar pareceres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:ring-2 outline-none"
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {completedNews.length === 0 ? (
                <div className="p-8 text-center opacity-50 space-y-2">
                  <div className="flex justify-center"><FileText size={32} /></div>
                  <p className="text-xs">Nenhum parecer pronto para redação.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                  {completedNews.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={cn(
                        "w-full p-4 text-left transition-colors hover:bg-slate-50 relative",
                        selectedId === item.id && "bg-blue-50/50"
                      )}
                    >
                      {selectedId === item.id && (
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">#{item.id}</span>
                        <span className="text-[10px] opacity-50">{new Date(item.completedAt || item.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2 leading-tight">{item.title}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded">
                          {item.reportStructure?.label || 'Sem Selo'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

