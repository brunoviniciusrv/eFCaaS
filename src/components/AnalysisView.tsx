import React from 'react';
import { 
  ArrowLeft, 
  Briefcase as Toolbox, 
  Save, 
  Plus, 
  Trash2, 
  Video as VideoIcon, 
  ImageIcon, 
  FileIcon, 
  Link as LinkIcon, 
  ExternalLink, 
  Wand2, 
  Sparkles, 
  Cpu, 
  History, 
  Info,
  CheckCircle,
  AlertCircle,
  FileText,
  XCircle,
  MinusCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Building2,
  Users,
  List,
  Box,
  RotateCcw,
  ArrowRight,
  Clock,
  UserPlus
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { StatusBadge } from './StatusBadge';
import { NewsItem, Evidence, ReportStructure, FactLabel, View, LabelConfig, ReportStructureConfig, ThemeConfig, UserProfile } from '../types';
import { TOOLS } from '../constants';

interface AnalysisViewProps {
  selectedNews: NewsItem | undefined;
  setSelectedNewsId: (id: string | null) => void;
  setCurrentView: (view: string) => void;
  isToolboxOpen: boolean;
  setIsToolboxOpen: (open: boolean) => void;
  handleSaveFinal: () => void;
  handleUpdateReportStructure: (updates: Partial<ReportStructure>) => void;
  handleGenerateDraft: () => void;
  handleReviewReport: () => void;
  handleUpdateReport: (text: string) => void;
  handleAddEvidence: (evidence: Omit<Evidence, 'id' | 'timestamp'>) => void;
  handleRemoveEvidence: (id: string) => void;
  isSaving: boolean;
  isGeneratingDraft: boolean;
  isReviewing: boolean;
  labels: LabelConfig[];
  reportConfig: ReportStructureConfig;
  themeConfig: ThemeConfig;
  currentUser: UserProfile;
  checkPermission: (permId: string) => boolean;
}

export const AnalysisView = ({
  selectedNews,
  setSelectedNewsId,
  setCurrentView,
  isToolboxOpen,
  setIsToolboxOpen,
  handleSaveFinal,
  handleUpdateReportStructure,
  handleGenerateDraft,
  handleReviewReport,
  handleUpdateReport,
  handleAddEvidence,
  handleRemoveEvidence,
  isSaving,
  isGeneratingDraft,
  isReviewing,
  labels,
  reportConfig,
  themeConfig,
  currentUser,
  checkPermission
}: AnalysisViewProps) => {
  if (!selectedNews) return null;

  const canEdit = checkPermission('perform_analysis');
  const [activeTab, setActiveTab] = React.useState<'content' | 'metrics' | 'investigation' | 'result'>('content');
  const [isEvaluationExpanded, setIsEvaluationExpanded] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isAddingLink, setIsAddingLink] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState('');
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');

    // Simulate upload
    setTimeout(() => {
      handleAddEvidence({
        type: 'document',
        title: file.name,
        url: URL.createObjectURL(file)
      });
      setIsUploading(false);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 1500);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;
    
    handleAddEvidence({
      type: 'link',
      title: linkInput,
      url: linkInput
    });
    setLinkInput('');
    setIsAddingLink(false);
    setUploadStatus('success');
    setTimeout(() => setUploadStatus('idle'), 3000);
  };

  const reportStructure = selectedNews.reportStructure || {
    summary: '',
    questions: [''],
    sources: [''],
    isInverifiable: false,
    contactWithAuthor: { hadContact: null },
    label: undefined
  };

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Search': return Search;
      case 'Info': return Info;
      case 'History': return History;
      case 'Cpu': return Cpu;
      default: return Search;
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: themeConfig.dashboard.background }}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header 
          className="border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50"
          style={{ 
            backgroundColor: themeConfig.header.background, 
            color: themeConfig.header.text,
            borderColor: themeConfig.header.border
          }}
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setSelectedNewsId(null); setCurrentView('dashboard'); }}
                className="p-2 rounded-full transition-colors hover:bg-black/5"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="font-bold line-clamp-1 max-w-[300px]" style={{ color: themeConfig.header.text }}>{selectedNews.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedNews.status} themeConfig={themeConfig} />
                  <span className="text-xs opacity-50">#{selectedNews.id}</span>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            <nav className="flex items-center gap-1">
              {[
                { id: 'content', label: '1. Conteúdo', icon: FileIcon },
                { id: 'metrics', label: '2. Métricas IA', icon: Sparkles },
                { id: 'investigation', label: '3. Investigação', icon: Search },
                { id: 'result', label: '4. Parecer', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                    activeTab === tab.id 
                      ? "shadow-sm" 
                      : "opacity-40 hover:opacity-100 hover:bg-black/5"
                  )}
                  style={{ 
                    backgroundColor: activeTab === tab.id ? themeConfig.sidebar.activeBackground : 'transparent',
                    color: activeTab === tab.id ? themeConfig.sidebar.activeText : themeConfig.header.text,
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <>
                <button 
                  onClick={() => setIsToolboxOpen(!isToolboxOpen)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    isToolboxOpen ? "" : "border"
                  )}
                  style={{ 
                    backgroundColor: isToolboxOpen ? themeConfig.buttons.primary : 'transparent',
                    color: isToolboxOpen ? themeConfig.buttons.primaryText : themeConfig.header.text,
                    borderColor: themeConfig.header.border
                  }}
                >
                  <Toolbox size={18} />
                  Ferramentas
                </button>
                <button 
                  onClick={handleSaveFinal}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: themeConfig.status.success, 
                    color: '#fff',
                    boxShadow: `0 10px 15px -3px ${themeConfig.status.success}30`
                  }}
                >
                  <Save size={18} />
                  {isSaving ? 'Salvando...' : 'Finalizar'}
                </button>
              </>
            )}
            {!canEdit && (
              <span className="text-xs font-bold opacity-50 px-3 py-1 bg-slate-100 rounded-full">Modo de Visualização</span>
            )}
          </div>
        </header>

        <div className="p-6 max-w-[1920px] mx-auto w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'content' && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* 1. Media Player & Original Content */}
                <section 
                  className="rounded-3xl border overflow-hidden shadow-sm"
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className="p-4 border-b flex items-center justify-between" style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
                    <h3 className="text-xs font-black uppercase tracking-widest opacity-60" style={{ color: themeConfig.dashboard.text }}>Conteúdo sob Análise</h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 opacity-60">REF: {selectedNews.id}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h2 className="text-2xl font-black leading-tight mb-4" style={{ color: themeConfig.dashboard.text }}>{selectedNews.title}</h2>
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200 mb-6 italic">
                       <p className="leading-relaxed text-sm" style={{ color: themeConfig.dashboard.text }}>"{selectedNews.content}"</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      {selectedNews.media?.map((m, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border bg-black/5" style={{ borderColor: themeConfig.general.border }}>
                          {m.type === 'image' && <img src={m.url} alt="Media" className="w-full h-auto" referrerPolicy="no-referrer" />}
                          {m.type === 'video' && (
                            <div className="relative group">
                              <video src={m.url} controls className="w-full aspect-video bg-black" />
                              <div className="absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-lg text-white text-[10px] uppercase font-bold tracking-widest">Vídeo Anexo</div>
                            </div>
                          )}
                          {m.type === 'audio' && (
                            <div className="p-10 flex flex-col items-center gap-6 bg-slate-50">
                              <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                              >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                              </div>
                              <div className="w-full max-w-xl">
                                <div className="text-center mb-4">
                                  <span className="text-xs font-black uppercase tracking-[.2em] opacity-40">Áudio Original</span>
                                </div>
                                <audio src={m.url} controls className="w-full" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Fonte Original / Veículo</label>
                              <div className="flex items-center gap-2">
                                <LinkIcon size={14} className="opacity-40" />
                                <span className="text-sm font-bold text-blue-600 truncate">{selectedNews.source}</span>
                              </div>
                           </div>
                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Data de Captura</label>
                              <div className="flex items-center gap-2">
                                 <Calendar size={14} className="opacity-40" />
                                 <span className="text-sm font-bold">{selectedNews.date}</span>
                              </div>
                           </div>
                           {(selectedNews.senderName || selectedNews.senderAddress) && (
                             <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-60 block mb-1">Remetente Externo</label>
                                <div className="flex items-center gap-2">
                                   <Users size={14} className="text-blue-600/40" />
                                   <div className="flex flex-col">
                                      <span className="text-sm font-bold truncate">{selectedNews.senderName || 'Desconhecido'}</span>
                                      {selectedNews.senderAddress && <span className="text-[10px] opacity-60 truncate">{selectedNews.senderAddress}</span>}
                                   </div>
                                </div>
                             </div>
                           )}
                           <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">ID Único do Sistema</label>
                              <div className="flex items-center gap-2">
                                 <Box size={14} className="opacity-40" />
                                 <span className="text-sm font-mono font-bold text-[10px]">{selectedNews.id}</span>
                              </div>
                           </div>
                           {selectedNews.receivedAt && (
                             <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Horário de Recebimento</label>
                                <div className="flex items-center gap-2">
                                   <Clock size={14} className="opacity-40" />
                                   <span className="text-sm font-bold">{new Date(selectedNews.receivedAt).toLocaleString()}</span>
                                </div>
                             </div>
                           )}
                        </div>
                      </div>
                    </section>

                    {/* Action History section */}
                    <section 
                      className="rounded-3xl border shadow-sm overflow-hidden mt-8"
                      style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                    >
                      <div className="p-5 border-b flex items-center justify-between" style={{ backgroundColor: `${themeConfig.dashboard.background}20`, borderColor: themeConfig.general.border }}>
                        <div className="flex items-center gap-2">
                          <History size={18} className="opacity-60" />
                          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Histórico de Ações</h3>
                        </div>
                      </div>
                      <div className="p-8">
                        <div className="space-y-6">
                          {selectedNews.assignmentHistory?.map((h, i) => (
                            <div key={h.id} className="relative flex gap-6 pb-2">
                              {i !== selectedNews.assignmentHistory!.length - 1 && (
                                <div className="absolute left-[11px] top-[24px] bottom-0 w-px bg-slate-100" />
                              )}
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10",
                                h.action === 'assigned' ? "bg-blue-100 text-blue-600" :
                                h.action === 'reopened' ? "bg-amber-100 text-amber-600" :
                                h.action === 'rejected' ? "bg-red-100 text-red-600" :
                                "bg-slate-100 text-slate-600"
                              )}>
                                {h.action === 'assigned' && <UserPlus size={12} />}
                                {h.action === 'reopened' && <RotateCcw size={12} />}
                                {h.action === 'rejected' && <XCircle size={12} />}
                                {h.action === 'reassigned' && <Users size={12} />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-bold uppercase tracking-widest">
                                    {h.action === 'assigned' ? 'Notícia Atribuída' : 
                                     h.action === 'reopened' ? 'Checagem Reaberta' :
                                     h.action === 'rejected' ? 'Revisão Rejeitada' :
                                     'Tarefa Reatribuída'}
                                  </p>
                                  <span className="text-[10px] opacity-40 font-medium">
                                    {new Date(h.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                                  <p className="opacity-70 mb-2 leading-relaxed">
                                    {h.action === 'assigned' && `Responsável definido para o fluxo de triagem.`}
                                    {h.action === 'reopened' && `A checagem foi recusada e enviada para correções.`}
                                    {h.action === 'rejected' && `A revisão foi reprovada pelo editor.`}
                                    {h.action === 'reassigned' && `Tarefa movida para outro responsável.`}
                                  </p>
                                  {h.reason && (
                                    <div className="pt-2 border-t border-slate-200 mt-2 italic opacity-60">
                                      "{h.reason}"
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200 opacity-60">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] uppercase font-bold tracking-tighter">Por</span>
                                      <span className="text-[10px] font-bold">{h.assignedBy}</span>
                                    </div>
                                    {h.assignedTo && (
                                      <>
                                        <ArrowRight size={10} />
                                        <div className="flex flex-col">
                                          <span className="text-[9px] uppercase font-bold tracking-tighter">Para</span>
                                          <span className="text-[10px] font-bold">{h.assignedTo}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {(!selectedNews.assignmentHistory || selectedNews.assignmentHistory.length === 0) && (
                            <div className="text-center py-6 opacity-30 italic text-xs">
                              Nenhum histórico registrado para esta notícia.
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

            {activeTab === 'metrics' && (
              <motion.div 
                key="metrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* 2. Automated Insights (GUT Metrics) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Sparkles size={16} className="text-blue-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Métricas Preliminares de I.A</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[
                      { label: 'Gravidade', value: selectedNews.aiScores.gravity, icon: AlertCircle, color: themeConfig.status.error },
                      { label: 'Urgência', value: selectedNews.aiScores.urgency, icon: Sparkles, color: themeConfig.status.warning },
                      { label: 'Tendência', value: selectedNews.aiScores.trend, icon: History, color: themeConfig.status.info }
                    ].map((score, idx) => (
                      <div 
                        key={idx} 
                        className="p-6 rounded-3xl border shadow-sm flex flex-col gap-4 transition-all hover:shadow-md bg-white border-slate-100"
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-3 rounded-2xl" style={{ backgroundColor: `${score.color}10`, color: score.color }}>
                            <score.icon size={20} />
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block leading-none mb-1">{score.label}</span>
                            <div className="flex items-baseline justify-end gap-0.5">
                              {selectedNews.isAIProcessing ? (
                                <span className="text-xs font-bold text-blue-500 animate-pulse">Calculando...</span>
                              ) : (
                                <>
                                  <span className="text-2xl font-black" style={{ color: themeConfig.dashboard.text }}>{score.value || 0}</span>
                                  <span className="text-[10px] opacity-30 font-bold">/100</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                           {selectedNews.isAIProcessing ? (
                             <div className="h-full w-1/2 bg-blue-400 animate-loading-shimmer" />
                           ) : (
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${score.value || 0}%` }}
                               className="h-full rounded-full"
                               style={{ backgroundColor: score.color }}
                             />
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2.1 AI Semantic Analysis */}
                <section 
                  className="rounded-3xl border shadow-sm overflow-hidden"
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className="p-6 border-b flex items-center justify-between bg-slate-50/50" style={{ borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                        <Cpu size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-tight" style={{ color: themeConfig.dashboard.text }}>Análise Semântica & Contextual</h3>
                        <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-none">Visão estrutural gerada por algoritmos</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    {(() => {
                      const analysisData = selectedNews.aiEvaluation || {
                        characteristics: [
                          "**Texto Padrão:** Avaliação em processamento ou não disponível.",
                          "**Dados Simulados:** Este é um espaço reservado simulado.",
                          "**Necessidade de Checagem:** Requer validação humana para confirmar conteúdos semânticos."
                        ],
                        entities: [
                          { name: "Entidade Indefinida", description: "Sem entidades detectadas no momento." }
                        ],
                        location: "Não detectado",
                        dates: ["-"]
                      };

                      return (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                                <AlertCircle size={14} className="text-amber-500" /> Gatilhos e Linguagem
                              </h4>
                              <ul className="space-y-3">
                                {analysisData.characteristics.map((char, idx) => (
                                  <li key={idx} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex gap-3 text-sm leading-relaxed" style={{ color: themeConfig.dashboard.text }}>
                                    <div className="markdown-body">
                                      <Markdown>{char}</Markdown>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50 flex items-center gap-2">
                                <Users size={14} className="text-blue-500" /> Personagens & Locais
                              </h4>
                              <div className="space-y-3">
                                {analysisData.entities.map((entity, idx) => (
                                  <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <p className="font-black text-sm mb-1">{entity.name}</p>
                                    <p className="text-xs opacity-60 leading-relaxed">{entity.description}</p>
                                  </div>
                                ))}
                                <div className="flex gap-4 pt-2">
                                  <div className="flex-1 space-y-2">
                                    <span className="text-[10px] font-bold uppercase opacity-40">Localização</span>
                                    <div className="p-2 px-3 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 flex items-center gap-2">
                                      <MapPin size={12} className="opacity-40" />
                                      {analysisData.location}
                                    </div>
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <span className="text-[10px] font-bold uppercase opacity-40">Período</span>
                                    <div className="flex flex-wrap gap-1">
                                      {analysisData.dates.map((d, i) => (
                                        <span key={i} className="px-2 py-1 bg-white border border-slate-100 rounded text-[9px] font-bold">{d}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'investigation' && (
              <motion.div 
                key="investigation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                 {/* 3. Investigation & Evidence List */}
                <section 
                  className="rounded-3xl border shadow-sm overflow-hidden"
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className="p-5 border-b flex items-center justify-between" style={{ backgroundColor: `${themeConfig.dashboard.background}20`, borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-2">
                      <Search size={18} className="opacity-60" />
                      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Investigação & Verificação</h3>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                    {/* Multi-modal Evidence Input Split */}
                    {canEdit && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* File Upload Option */}
                          <div className={cn(
                             "p-6 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer relative flex flex-col items-center justify-center text-center space-y-3 group overflow-hidden",
                             isUploading ? "bg-blue-50/20 border-blue-300" : "bg-slate-50/50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/10"
                          )}>
                             <input 
                               type="file" 
                               className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                               onChange={handleFileUpload}
                               disabled={isUploading}
                             />
                             
                             {isUploading ? (
                               <div className="flex flex-col items-center">
                                 <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-2" />
                                 <p className="text-[10px] font-bold text-blue-600">Subindo...</p>
                               </div>
                             ) : (
                               <>
                                 <div className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform border border-slate-50">
                                    <FileIcon size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm text-slate-800">Anexar Arquivo</p>
                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-tight">PDF, Imagem, Doc</p>
                                 </div>
                               </>
                             )}
                          </div>

                          {/* Link Option */}
                          <div className={cn(
                             "p-6 rounded-[2rem] border-2 border-dashed transition-all cursor-pointer relative flex flex-col items-center justify-center text-center space-y-3 group overflow-hidden",
                             isAddingLink ? "bg-purple-50/20 border-purple-300" : "bg-slate-50/50 border-slate-200 hover:border-purple-400 hover:bg-purple-50/10"
                          )}
                            onClick={() => !isAddingLink && setIsAddingLink(true)}
                          >
                             {isAddingLink ? (
                               <form onSubmit={handleLinkSubmit} className="flex flex-col items-center gap-2 w-full px-4 z-20">
                                 <input 
                                   autoFocus
                                   type="url" 
                                   placeholder="https://..."
                                   value={linkInput}
                                   onChange={(e) => setLinkInput(e.target.value)}
                                   className="w-full px-3 py-1.5 rounded-lg border text-xs focus:ring-2 focus:ring-purple-200 outline-none"
                                   onClick={(e) => e.stopPropagation()}
                                 />
                                 <div className="flex gap-2">
                                   <button 
                                     type="submit"
                                     className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                   >Adicionar</button>
                                   <button 
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); setIsAddingLink(false); }}
                                     className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                   >Cancelar</button>
                                 </div>
                               </form>
                             ) : (
                               <>
                                 <div className="w-10 h-10 rounded-xl bg-white shadow-lg flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform border border-slate-50">
                                    <LinkIcon size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm text-slate-800">Adicionar Link</p>
                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest leading-tight">URL externa / Fonte</p>
                                 </div>
                               </>
                             )}
                          </div>
                          
                          {uploadStatus === 'success' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="col-span-full py-2 bg-green-50 text-green-600 text-[10px] font-black text-center rounded-xl border border-green-100 uppercase tracking-widest"
                            >
                              Anexo adicionado com sucesso!
                            </motion.div>
                          )}
                       </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      {selectedNews.evidence.map(ev => (
                        <div 
                          key={ev.id} 
                          className="flex items-center gap-4 p-4 rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all group"
                          style={{ borderColor: themeConfig.general.border }}
                        >
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                            {ev.type === 'link' ? <LinkIcon size={18} className="text-blue-500" /> : <FileText size={18} className="text-slate-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black truncate text-slate-800">{ev.title}</h4>
                            <p className="text-[10px] opacity-50 truncate font-mono">{ev.url}</p>
                          </div>
                          {canEdit && (
                            <button 
                              onClick={() => handleRemoveEvidence(ev.id)} 
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                      {selectedNews.evidence.length === 0 && (
                        <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2 opacity-40">
                          <Info size={24} />
                          <p className="text-sm font-medium">Inicie a investigação anexando links ou documentos.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Step */}
                    <div className="mt-8 pt-8 border-t flex flex-col md:flex-row gap-8 items-start" style={{ borderColor: themeConfig.general.border }}>
                      <div className="w-full md:w-64 space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Tentativa de Contato</h4>
                        <p className="text-xs opacity-50 leading-relaxed">Fundamental para o contraditório e clareza editorial.</p>
                      </div>
                      <div className="flex-1 space-y-6">
                        <div className="flex gap-4">
                          {[
                            { label: 'Realizado', value: true, icon: CheckCircle },
                            { label: 'Não Realizado', value: false, icon: XCircle }
                          ].map((opt) => (
                            <button 
                              key={opt.label}
                              disabled={!canEdit}
                              onClick={() => handleUpdateReportStructure({ 
                                contactWithAuthor: { ...reportStructure.contactWithAuthor, hadContact: opt.value } 
                              })}
                              className="flex-1 py-3 px-6 rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-3"
                              style={{ 
                                backgroundColor: reportStructure.contactWithAuthor.hadContact === opt.value ? themeConfig.general.accent : 'transparent',
                                borderColor: reportStructure.contactWithAuthor.hadContact === opt.value ? themeConfig.general.accent : themeConfig.general.border,
                                color: reportStructure.contactWithAuthor.hadContact === opt.value ? '#fff' : themeConfig.dashboard.text
                              }}
                            >
                              <opt.icon size={16} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                        {reportStructure.contactWithAuthor.hadContact === true && (
                          <textarea 
                            value={reportStructure.contactWithAuthor.response || ''}
                            onChange={(e) => handleUpdateReportStructure({ contactWithAuthor: { ...reportStructure.contactWithAuthor, response: e.target.value } })}
                            placeholder="Quais foram as alegações do autor ou assessoria?"
                            rows={3}
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Questions and Methodology */}
                <section 
                  className="rounded-3xl border shadow-sm overflow-hidden bg-white"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className="p-6 border-b" style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-2">
                      <List size={18} className="opacity-40" />
                      <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Perguntas de Investigação</h3>
                    </div>
                  </div>
                  <div className="p-8 space-y-8">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Perguntas Balizadoras</label>
                        <div className="space-y-3">
                           {reportStructure.questions.map((q, idx) => (
                             <div key={idx} className="flex gap-3">
                                <input 
                                  value={q}
                                  onChange={(e) => {
                                    const newQuestions = [...reportStructure.questions];
                                    newQuestions[idx] = e.target.value;
                                    handleUpdateReportStructure({ questions: newQuestions });
                                  }}
                                  placeholder="Ex: Qual a origem do vídeo?"
                                  className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                                />
                                {idx > 0 && (
                                  <button onClick={() => {
                                    const newQuestions = [...reportStructure.questions];
                                    newQuestions.splice(idx, 1);
                                    handleUpdateReportStructure({ questions: newQuestions });
                                  }} className="p-4 text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={20} />
                                  </button>
                                )}
                             </div>
                           ))}
                           <button 
                             onClick={() => handleUpdateReportStructure({ questions: [...reportStructure.questions, ''] })}
                             className="flex items-center gap-2 text-xs font-black px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                           >
                             <Plus size={14} /> Adicionar Pergunta
                           </button>
                        </div>
                     </div>

                     <div className="pt-8 border-t space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Resumo da Metodologia de Checagem</label>
                        <textarea 
                          value={reportStructure.summary || ''}
                          onChange={(e) => handleUpdateReportStructure({ summary: e.target.value })}
                          placeholder="Como este conteúdo foi verificado?"
                          rows={3}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm focus:outline-none transition-all font-medium resize-none shadow-inner"
                        />
                     </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'result' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* AI Actions Hub */}
                {canEdit && (
                  <div 
                    className="rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group"
                    style={{ backgroundColor: themeConfig.general.accent, boxShadow: `0 30px 40px -10px ${themeConfig.general.accent}40` }}
                  >
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                      <Wand2 size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <span className="font-black text-xl block">Inteligência de Rede</span>
                          <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Suporte Editorial IA</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          onClick={handleGenerateDraft}
                          disabled={isGeneratingDraft}
                          className="flex-1 bg-white px-6 py-4 rounded-3xl text-sm font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 group/btn"
                          style={{ color: themeConfig.general.accent }}
                        >
                          <Wand2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                          {isGeneratingDraft ? 'Criando...' : 'Gerar Draft de Parecer'}
                        </button>
                        <button 
                          onClick={handleReviewReport}
                          disabled={isReviewing}
                          className="flex-1 bg-black/20 text-white px-6 py-4 rounded-3xl text-sm font-black hover:bg-black/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          <Cpu size={20} />
                          {isReviewing ? 'Lendo...' : 'Revisão Crítica IA'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Veredito */}
                <section 
                  className="rounded-[40px] border shadow-sm overflow-hidden bg-white"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className="p-6 border-b flex items-center justify-between" style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-500" />
                      <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Etiqueta de Veracidade</h3>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {labels.map((label) => (
                        <button 
                          key={label.id}
                          disabled={!canEdit}
                          onClick={() => handleUpdateReportStructure({ label: label.name })}
                          className={cn(
                            "flex flex-col items-start p-5 rounded-3xl border-2 transition-all text-left disabled:opacity-75 relative overflow-hidden",
                            reportStructure.label === label.name ? "shadow-lg scale-[1.02]" : "hover:border-slate-200"
                          )}
                          style={{ 
                            backgroundColor: reportStructure.label === label.name ? label.color : 'transparent', 
                            borderColor: reportStructure.label === label.name ? label.color : themeConfig.general.border,
                            color: reportStructure.label === label.name ? '#fff' : themeConfig.dashboard.text,
                          }}
                        >
                          <span className="text-xs font-black uppercase tracking-wider mb-2 z-10">{label.name}</span>
                          <span className="text-[10px] font-bold opacity-80 leading-tight z-10">{label.description}</span>
                          {reportStructure.label === label.name && (
                            <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
                              <CheckCircle size={60} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Dual Column Editor */}
                <section 
                  className="rounded-[40px] border shadow-sm overflow-hidden flex flex-col bg-white"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className="p-8 border-b flex items-center justify-between bg-slate-50" style={{ borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-2xl text-white">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight" style={{ color: themeConfig.dashboard.text }}>Redação do Parecer Editorial</h3>
                        <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">Editor & Preview em Tempo Real</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[700px]">
                    {/* Editor Column */}
                    <div className="p-8 border-r overflow-y-auto" style={{ borderColor: themeConfig.general.border }}>
                       <div className="flex items-center justify-between mb-4">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Editor de Parecer</label>
                          <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-100 rounded-lg opacity-40 transition-all hover:opacity-100"><History size={16} /></button>
                            <button className="p-2 hover:bg-slate-100 rounded-lg opacity-40 transition-all hover:opacity-100"><Info size={16} /></button>
                          </div>
                       </div>
                       <textarea 
                        value={selectedNews.report}
                        onChange={(e) => handleUpdateReport(e.target.value)}
                        placeholder="Inicie a redação do parecer final..."
                        readOnly={!canEdit}
                        className="w-full h-full min-h-[500px] bg-transparent border-none focus:outline-none leading-relaxed resize-none font-mono text-base placeholder:opacity-20"
                        style={{ color: themeConfig.general.inputText }}
                      />
                    </div>

                    {/* Preview Column */}
                    <div className="p-12 bg-slate-50/50 overflow-y-auto scrollbar-hide">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-8">Visualização de Publicação</label>
                       <div className="max-w-prose mx-auto">
                          {reportStructure.label && (
                            <div 
                              className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6"
                              style={{ 
                                backgroundColor: labels.find(l => l.name === reportStructure.label)?.color + '20',
                                color: labels.find(l => l.name === reportStructure.label)?.color,
                                border: `1px solid ${labels.find(l => l.name === reportStructure.label)?.color}40`
                              }}
                            >
                              {reportStructure.label}
                            </div>
                          )}
                          <h1 className="text-3xl font-black mb-8 leading-tight tracking-tight">{selectedNews.title}</h1>
                          <div className="markdown-body prose prose-slate prose-lg max-w-none">
                            <Markdown>{selectedNews.report || '_O rascunho aparecerá aqui conforme você escreve no editor ao lado._'}</Markdown>
                          </div>
                          
                          <div className="mt-12 pt-8 border-t border-slate-200">
                             <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4">Metodologia e Transparência</h4>
                             <p className="text-sm italic opacity-60 leading-relaxed mb-6">{reportStructure.summary || 'A metodologia será exibida após o preenchimento na aba de investigação.'}</p>
                             <div className="flex gap-4">
                                <div className="text-[10px] font-bold opacity-30 uppercase tracking-wider">Perguntas: {reportStructure.questions.length}</div>
                                <div className="text-[10px] font-bold opacity-30 uppercase tracking-wider">Fontes: {reportStructure.sources.length}</div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toolbox Sidebar */}
      <AnimatePresence>
        {isToolboxOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsToolboxOpen(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 w-96 h-screen shadow-2xl z-30 flex flex-col"
              style={{ backgroundColor: themeConfig.general.cardBackground }}
            >
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div className="flex items-center gap-2">
                  <Toolbox style={{ color: themeConfig.general.accent }} size={20} />
                  <h3 className="font-bold" style={{ color: themeConfig.dashboard.text }}>Ferramentas de Checagem</h3>
                </div>
                <button 
                  onClick={() => setIsToolboxOpen(false)} 
                  className="p-2 rounded-full hover:bg-black/5"
                  style={{ color: themeConfig.dashboard.text }}
                >
                  <ArrowLeft className="rotate-180" size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {TOOLS.map((tool, i) => {
                  const Icon = getToolIcon(tool.icon);
                  return (
                    <div 
                      key={i} 
                      className="p-5 rounded-3xl border transition-all group"
                      style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="p-2 rounded-xl shadow-sm transition-colors"
                          style={{ backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}
                        >
                          <Icon size={20} />
                        </div>
                        <h4 className="font-bold" style={{ color: themeConfig.dashboard.text }}>{tool.name}</h4>
                      </div>
                      <p className="text-xs opacity-60 mb-4 leading-relaxed" style={{ color: themeConfig.dashboard.text }}>{tool.description}</p>
                      <button 
                        className="w-full py-2 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        style={{ 
                          backgroundColor: themeConfig.general.cardBackground, 
                          borderColor: themeConfig.general.border,
                          color: themeConfig.dashboard.text
                        }}
                      >
                        Abrir Ferramenta
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
