import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  Ban,
  ShieldOff,
  AlertTriangle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { StatusBadge } from './StatusBadge';
import { ResponsiveTabs } from './ResponsiveTabs';
import { NewsItem, Evidence, ReportStructure, FactLabel, View, LabelConfig, ReportStructureConfig, ThemeConfig, UserProfile, AgencyConfig } from '../types';
import { isAiModuleEnabled } from '../config/aiModules';
import { TOOLS } from '../constants';
import { apiService, ApiAuditoriaDto, normalizeReportStructure } from '../services/apiService';
import styles from './AnalysisView.module.css';

// ─── Auditoria helpers ──────────────────────────────────────────────────────

const NOMES_CAMPOS: Record<string, string> = {
  resumo_metodologia: 'Metodologia de Checagem',
  perguntas: 'Perguntas de Investigação',
  fontes: 'Fontes Consultadas',
  inverificavel: 'Status Inverificável',
  contato_autor: 'Contato com Autor',
  texto_parecer: 'Redação do Parecer',
};

function formatarCamposAlterados(acao: string, detalhes: string | null): string {
  if (acao === 'checagem_atribuida' && detalhes?.startsWith('checador:')) {
    return detalhes.replace('checador:', '');
  }
  if (acao === 'parecer_finalizado' && detalhes) {
    const etiqueta = detalhes.replace('etiqueta:', '');
    return `com etiqueta "${etiqueta}"`;
  }
  if (acao === 'evidencia_adicionada' && detalhes) {
    return `(${detalhes})`;
  }
  if (!detalhes) return '';
  const campos = detalhes.split(',')
    .map(c => NOMES_CAMPOS[c.trim()] ?? c.trim())
    .filter(Boolean);
  if (campos.length === 0) return '';
  if (campos.length === 1) return `"${campos[0]}"`;
  const ultimo = campos.pop();
  return `"${campos.join('", "')}" e "${ultimo}"`;
}

function formatarDataAuditoria(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const AUDITORIA_ACAO_CONFIG: Record<string, { verbo: string; color: string; icon: React.ReactNode }> = {
  checagem_atribuida:  { verbo: 'atribuiu tarefa ao checador', color: '#3b82f6', icon: <UserPlus size={12} /> },
  checagem_iniciada:   { verbo: 'iniciou a checagem',          color: '#3b82f6', icon: <Clock size={12} /> },
  investigacao_salva:  { verbo: 'alterou',                     color: '#8b5cf6', icon: <Save size={12} /> },
  parecer_salvo:       { verbo: 'salvou',                      color: '#8b5cf6', icon: <FileText size={12} /> },
  parecer_finalizado:  { verbo: 'finalizou o Parecer',         color: '#10b981', icon: <CheckCircle size={12} /> },
  evidencia_adicionada:{ verbo: 'adicionou Evidência',         color: '#f59e0b', icon: <Plus size={12} /> },
  evidencia_removida:  { verbo: 'removeu uma Evidência',       color: '#ef4444', icon: <Trash2 size={12} /> },
  _default:            { verbo: 'realizou uma ação',           color: '#64748b', icon: <History size={12} /> },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface AnalysisViewProps {
  selectedNews: NewsItem | undefined;
  setSelectedNewsId: (id: string | null) => void;
  setCurrentView: (view: string) => void;
  isToolboxOpen: boolean;
  setIsToolboxOpen: (open: boolean) => void;
  handleSaveFinal: () => void;
  handleSaveInvestigation: () => Promise<boolean>;
  handleUpdateReportStructure: (updates: Partial<ReportStructure>) => void;
  handleGenerateDraft: () => void;
  handleReviewReport: () => void;
  handleUpdateReport: (text: string) => void;
  handleAddEvidence: (evidence: Omit<Evidence, 'id' | 'timestamp'>) => void;
  handleUploadEvidenceFile: (file: File) => Promise<void>;
  handleRemoveEvidence: (id: string) => void;
  handleUploadMediaFile: (file: File) => Promise<void>;
  handleRemoveMedia: (anexoId: string) => Promise<void>;
  isSaving: boolean;
  isGeneratingDraft: boolean;
  isReviewing: boolean;
  labels: LabelConfig[];
  reportConfig: ReportStructureConfig;
  themeConfig: ThemeConfig;
  currentUser: UserProfile;
  agencyConfig: AgencyConfig;
  onNewsUpdated?: (news: NewsItem) => void;
}

export const AnalysisView = ({
  selectedNews,
  setSelectedNewsId,
  setCurrentView,
  isToolboxOpen,
  setIsToolboxOpen,
  handleSaveFinal,
  handleSaveInvestigation,
  handleUpdateReportStructure,
  handleGenerateDraft,
  handleReviewReport,
  handleUpdateReport,
  handleAddEvidence,
  handleUploadEvidenceFile,
  handleRemoveEvidence,
  handleUploadMediaFile,
  handleRemoveMedia,
  isSaving,
  isGeneratingDraft,
  isReviewing,
  labels,
  reportConfig,
  themeConfig,
  currentUser,
  agencyConfig,
  onNewsUpdated,
}: AnalysisViewProps) => {
  const navigate = useNavigate();
  const [isAnalyzingAI, setIsAnalyzingAI] = React.useState(false);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [aiToast, setAiToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const dismissToast = React.useCallback(() => setAiToast(null), []);
  React.useEffect(() => {
    if (!aiToast) return;
    const t = setTimeout(dismissToast, 5000);
    return () => clearTimeout(t);
  }, [aiToast, dismissToast]);

  const [isEditingContent, setIsEditingContent] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editAlegacao, setEditAlegacao] = React.useState('');
  const [isSavingContent, setIsSavingContent] = React.useState(false);

  const startEditContent = () => {
    setEditTitle(selectedNews.title ?? '');
    setEditAlegacao(selectedNews.alegacao ?? selectedNews.content ?? '');
    setIsEditingContent(true);
  };

  const cancelEditContent = () => setIsEditingContent(false);

  const saveEditContent = async () => {
    setIsSavingContent(true);
    try {
      await apiService.editarConteudo(selectedNews.id, {
        titulo: editTitle.trim(),
        alegacao: editAlegacao.trim(),
      });
      // Atualiza apenas os campos editados para não sobrescrever dados locais não salvos
      onNewsUpdated?.({
        ...selectedNews,
        title: editTitle.trim(),
        alegacao: editAlegacao.trim(),
      });
      setIsEditingContent(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar alterações.');
    } finally {
      setIsSavingContent(false);
    }
  };

  if (!selectedNews) return null;

  const showMisinfoAxis = isAiModuleEnabled(agencyConfig, 'enableTrendAnalyzer');
  const showIllicitAxis = isAiModuleEnabled(agencyConfig, 'enableMisinfoRisk');
  const showSemanticAnalysis = isAiModuleEnabled(agencyConfig, 'enableAI');
  const showMetricsTab = showMisinfoAxis || showIllicitAxis || showSemanticAnalysis;

  const isEditor = currentUser.role === 'editor';
  const isChecker = currentUser.role === 'checker';
  const isReadOnly = isEditor && selectedNews.status !== 'in_progress'; // Wait, let's be safe: if editor, always read-only in this view.
  // Actually, if editor is accessing from list, it should be read-only.
  // Full curators/admins can edit.
  const canEdit = currentUser.role === 'checker' || currentUser.role === 'admin' || currentUser.role === 'curator';
  const [activeTab, setActiveTab] = React.useState<'content' | 'metrics' | 'tools' | 'investigation' | 'result'>('content');
  const [isEvaluationExpanded, setIsEvaluationExpanded] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);

  useEffect(() => {
    if (!showMetricsTab && activeTab === 'metrics') {
      setActiveTab('content');
    }
  }, [showMetricsTab, activeTab]);

  const [auditoriaLogs, setAuditoriaLogs] = useState<ApiAuditoriaDto[]>([]);
  const [auditoriaLoading, setAuditoriaLoading] = useState(false);

  const checagemId = selectedNews?.checagemId;

  useEffect(() => {
    if (!checagemId) return;
    setAuditoriaLoading(true);
    apiService.listarAuditoria(checagemId)
      .then(setAuditoriaLogs)
      .catch(() => setAuditoriaLogs([]))
      .finally(() => setAuditoriaLoading(false));
  }, [checagemId]);

  // Para cada par (checador + tipo de ação) exibe apenas a ocorrência mais recente.
  // Como o backend retorna ordenado por timestamp DESC, basta pegar a primeira ocorrência.
  const auditoriaLogsUnicos = useMemo(() => {
    const vistos = new Set<string>();
    return auditoriaLogs.filter(log => {
      const chave = `${log.usuarioNome}:${log.acao}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
  }, [auditoriaLogs]);
  const [isAddingLink, setIsAddingLink] = React.useState(false);
  const [linkInput, setLinkInput] = React.useState('');
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isContentUploading, setIsContentUploading] = React.useState(false);
  const [contentUploadStatus, setContentUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [showInvestigationSaveSuccess, setShowInvestigationSaveSuccess] = useState(false);

  const handleSaveInvestigationClick = async () => {
    const saved = await handleSaveInvestigation();
    if (saved) {
      setShowInvestigationSaveSuccess(true);
    }
  };

  useEffect(() => {
    if (!showInvestigationSaveSuccess) return;
    const timer = setTimeout(() => setShowInvestigationSaveSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [showInvestigationSaveSuccess]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 200 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert('O arquivo excede o limite de 200 MB.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      await handleUploadEvidenceFile(file);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
      setUploadStatus('error');
      alert(err instanceof Error ? err.message : 'Falha ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleContentFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = 200 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert('O arquivo excede o limite de 200 MB.');
      e.target.value = '';
      return;
    }

    setIsContentUploading(true);
    setContentUploadStatus('idle');

    try {
      await handleUploadMediaFile(file);
      setContentUploadStatus('success');
      setTimeout(() => setContentUploadStatus('idle'), 3000);
    } catch (err) {
      console.error('Erro ao enviar anexo:', err);
      setContentUploadStatus('error');
      alert(err instanceof Error ? err.message : 'Falha ao enviar o arquivo.');
    } finally {
      setIsContentUploading(false);
      e.target.value = '';
    }
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

  const reportStructure = normalizeReportStructure(selectedNews.reportStructure);

  const aiScores = selectedNews.aiScores ?? { gravity: 0, urgency: 0, trend: 0 };

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
    <div className={styles.pageContainer} style={{ backgroundColor: themeConfig.dashboard.background }}>

      {/* Toast de análise IA */}
      <AnimatePresence>
        {aiToast && (
          <motion.div
            key="ai-toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            className={styles.aiToast}
            style={{
              backgroundColor: aiToast.type === 'success' ? '#10b981' : '#ef4444',
            }}
          >
            {aiToast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{aiToast.message}</span>
            <button onClick={dismissToast} className={styles.aiToastClose}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header */}
        <header 
          className={styles.pageHeader}
          style={{ 
            backgroundColor: themeConfig.header.background, 
            color: themeConfig.header.text,
            borderColor: themeConfig.header.border
          }}
        >
          <div className={styles.headerLeft}>
            <div className={styles.headerBrand}>
              <button 
                onClick={() => { setSelectedNewsId(null); setCurrentView('dashboard'); }}
                className={styles.backButton}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className={styles.headerTitle} style={{ color: themeConfig.header.text }}>{selectedNews.title}</h2>
                <div className={styles.headerBadge}>
                  <StatusBadge status={selectedNews.status} themeConfig={themeConfig} />
                  <span className={styles.newsId}>#{selectedNews.id}</span>
                </div>
              </div>
            </div>

            <div className={styles.headerDivider} />

            <nav className={styles.navWrapper}>
               <ResponsiveTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab as any}
                  themeConfig={themeConfig}
                  tabs={[
                    { id: 'content', label: 'Conteúdo', icon: FileIcon },
                    ...(showMetricsTab ? [{ id: 'metrics', label: isAnalyzingAI ? 'Métricas IA ◌' : 'Métricas IA', icon: Sparkles }] : []),
                    ...(canEdit ? [{ id: 'tools', label: 'Ferramentas', icon: Toolbox }] : []),
                    { id: 'investigation', label: 'Investigação', icon: Search },
                    { id: 'result', label: 'Parecer', icon: FileText },
                  ]}
                  buttonClassName={styles.tabButton}
                  inactiveButtonClassName={styles.tabButtonInactive}
               />
            </nav>
          </div>
          <div className={styles.headerActions}>
            {canEdit && activeTab === 'investigation' && (
              <button
                onClick={handleSaveInvestigationClick}
                disabled={isSaving}
                className={styles.saveButton}
                style={{
                  backgroundColor: themeConfig.status.success,
                  color: '#fff',
                  boxShadow: `0 10px 15px -3px ${themeConfig.status.success}30`,
                }}
              >
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar Investigação'}
              </button>
            )}
            {canEdit && activeTab === 'result' && (
              <button 
                onClick={handleSaveFinal}
                disabled={isSaving}
                className={styles.saveButton}
                style={{ 
                  backgroundColor: themeConfig.status.success, 
                  color: '#fff',
                  boxShadow: `0 10px 15px -3px ${themeConfig.status.success}30`
                }}
              >
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Finalizar'}
              </button>
            )}
            {selectedNews.status === 'completed' && (
              <button 
                onClick={() => navigate(`/editorial-archive`)}
                className={styles.archiveButton}
              >
                <FileText size={18} />
                Ver no Acervo
              </button>
            )}
            {!canEdit && selectedNews.status !== 'completed' && (
              <span className={styles.viewModeTag}>Modo de Visualização</span>
            )}
          </div>
        </header>

        <div className={styles.tabContent}>
          <AnimatePresence mode="wait">
            {activeTab === 'content' && (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.tabSection}
              >
                {/* 1. Media Player & Original Content */}
                <section 
                  className={styles.card}
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className={styles.cardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
                    <h3 className={styles.cardHeaderTitle} style={{ color: themeConfig.dashboard.text }}>Conteúdo sob Análise</h3>
                    <div className={styles.cardHeaderBadges}>
                      <span className={styles.refBadge}>REF: {selectedNews.id}</span>
                    </div>
                  </div>
                  <div className={styles.cardBody}>
                    {isEditingContent ? (
                      <div className={styles.contentEditForm}>
                        <div className={styles.contentEditField}>
                          <label className={styles.contentEditLabel}>Título</label>
                          <input
                            className={styles.contentEditInput}
                            style={{ backgroundColor: themeConfig.general.inputBackground, color: themeConfig.general.inputText, borderColor: themeConfig.general.inputBorder }}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="Título do conteúdo"
                          />
                        </div>
                        <div className={styles.contentEditField}>
                          <label className={styles.contentEditLabel}>Alegação</label>
                          <textarea
                            className={styles.contentEditTextarea}
                            style={{ backgroundColor: themeConfig.general.inputBackground, color: themeConfig.general.inputText, borderColor: themeConfig.general.inputBorder }}
                            value={editAlegacao}
                            onChange={(e) => setEditAlegacao(e.target.value)}
                            placeholder="Alegação principal do conteúdo"
                            rows={4}
                          />
                        </div>
                        <div className={styles.contentEditActions}>
                          <button
                            onClick={cancelEditContent}
                            className={styles.contentEditCancelBtn}
                            disabled={isSavingContent}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveEditContent}
                            className={styles.contentEditSaveBtn}
                            style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                            disabled={isSavingContent || !editTitle.trim()}
                          >
                            {isSavingContent ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.contentViewBlock}>
                        <div className={styles.contentViewHeader}>
                          <h2 className={styles.newsTitle} style={{ color: themeConfig.dashboard.text }}>{selectedNews.title}</h2>
                          {canEdit && (
                            <button onClick={startEditContent} className={styles.contentEditBtn} title="Editar título e alegação">
                              <Wand2 size={14} />
                              Editar
                            </button>
                          )}
                        </div>
                        <div className={styles.newsContentBlock}>
                          <p className={styles.newsContentText} style={{ color: themeConfig.dashboard.text }}>"{selectedNews.alegacao ?? selectedNews.content}"</p>
                        </div>
                      </div>
                    )}

                    <div className={styles.mediaSection}>
                      <div className={styles.mediaSectionHeader}>
                        <label className={styles.sectionLabel}>
                          Mídias e Anexos {selectedNews.media?.length ? `(${selectedNews.media.length})` : ''}
                        </label>
                      </div>

                      {canEdit && (
                        <div
                          className={cn(
                            styles.uploadZone,
                            isContentUploading ? styles.uploadZoneUploading : styles.uploadZoneDefault
                          )}
                        >
                          <input
                            type="file"
                            className={styles.fileInput}
                            onChange={handleContentFileUpload}
                            disabled={isContentUploading}
                            accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                          />
                          {isContentUploading ? (
                            <div className={styles.uploadingState}>
                              <div className={styles.uploadSpinner} />
                              <p className={styles.uploadingText}>Subindo...</p>
                            </div>
                          ) : (
                            <>
                              <div className={styles.uploadIconWrapper}>
                                <FileIcon size={20} />
                              </div>
                              <div>
                                <p className={styles.uploadLabel}>Anexar Arquivo</p>
                                <p className={styles.uploadSubLabel}>
                                  PDF, Imagem, Vídeo, Áudio, Doc
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {contentUploadStatus === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={styles.uploadSuccessMessage}
                        >
                          Anexo adicionado com sucesso!
                        </motion.div>
                      )}

                      <div className={styles.mediaGrid}>
                        {(selectedNews.media ?? []).map((m, i) => (
                          <div
                            key={m.id ?? i}
                            className={styles.mediaItem}
                            style={{ borderColor: themeConfig.general.border }}
                          >
                            {m.type === 'image' && (
                              <img src={m.url} alt={m.title ?? 'Imagem'} className={styles.mediaImage} referrerPolicy="no-referrer" />
                            )}
                            {m.type === 'video' && (
                              <div className={styles.mediaVideoWrapper}>
                                <video src={m.url} controls className={styles.mediaVideo} />
                                <div className={styles.videoLabel}>
                                  Vídeo Anexo
                                </div>
                              </div>
                            )}
                            {m.type === 'audio' && (
                              <div className={styles.audioWrapper}>
                                <div
                                  className={styles.audioIconWrapper}
                                  style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                                >
                                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                                </div>
                                <div className={styles.audioPlayerWrapper}>
                                  <div className={styles.audioTitleWrapper}>
                                    <span className={styles.audioTitleText}>Áudio Original</span>
                                  </div>
                                  <audio src={m.url} controls className={styles.audioElement} />
                                </div>
                              </div>
                            )}
                            {m.type === 'document' && (
                              <div className={styles.documentWrapper}>
                                <div className={styles.documentIcon}>
                                  <FileText size={18} className="text-slate-400" />
                                </div>
                                <div className={styles.documentInfo}>
                                  <a
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.documentLink}
                                  >
                                    {m.title ?? 'Documento'}
                                  </a>
                                  <p className={styles.documentUrl}>{m.url}</p>
                                </div>
                              </div>
                            )}

                            {canEdit && m.id && (
                              <button
                                onClick={async () => {
                                  try {
                                    await handleRemoveMedia(m.id!);
                                  } catch (err) {
                                    alert(err instanceof Error ? err.message : 'Falha ao remover o anexo.');
                                  }
                                }}
                                className={styles.removeMediaButton}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {(selectedNews.media ?? []).length === 0 && !canEdit && (
                        <div className={styles.noMediaEmptyState}>
                          <Info size={24} />
                          <p className={styles.emptyStateMessage}>Nenhum anexo disponível para este conteúdo.</p>
                        </div>
                      )}
                    </div>

                        <div className={styles.metaGrid}>
                           <div className={styles.metaCard}>
                              <label className={styles.metaLabel}>Fonte Original / Veículo</label>
                              <div className={styles.metaValue}>
                                <LinkIcon size={14} className="opacity-40 shrink-0" />
                                {selectedNews.link ? (
                                  <a
                                    href={selectedNews.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.sourceLink}
                                    title={selectedNews.link}
                                  >
                                    {selectedNews.fonte || selectedNews.source || selectedNews.link}
                                  </a>
                                ) : (
                                  <span className={styles.sourceText}>
                                    {selectedNews.fonte || selectedNews.source || '—'}
                                  </span>
                                )}
                              </div>
                           </div>
                           <div className={styles.metaCard}>
                              <label className={styles.metaLabel}>Data de Captura</label>
                              <div className={styles.metaValue}>
                                 <Calendar size={14} className="opacity-40" />
                                 <span className={styles.metaValueText}>{selectedNews.date}</span>
                              </div>
                           </div>
                           {(selectedNews.senderName || selectedNews.senderAddress) && (
                             <div className={styles.senderCard}>
                                <label className={styles.senderLabel}>Remetente Externo</label>
                                <div className={styles.metaValue}>
                                   <Users size={14} className="text-blue-600/40" />
                                   <div className={styles.senderInfo}>
                                      <span className={styles.senderName}>{selectedNews.senderName || 'Desconhecido'}</span>
                                      {selectedNews.senderAddress && <span className={styles.senderAddress}>{selectedNews.senderAddress}</span>}
                                   </div>
                                </div>
                             </div>
                           )}
                           <div className={styles.metaCard}>
                              <label className={styles.metaLabel}>ID Único do Sistema</label>
                              <div className={styles.metaValue}>
                                 <Box size={14} className="opacity-40" />
                                 <span className={styles.metaValueMono}>{selectedNews.id}</span>
                              </div>
                           </div>
                           {selectedNews.receivedAt && (
                             <div className={styles.metaCard}>
                                <label className={styles.metaLabel}>Horário de Recebimento</label>
                                <div className={styles.metaValue}>
                                   <Clock size={14} className="opacity-40" />
                                   <span className={styles.metaValueText}>{new Date(selectedNews.receivedAt).toLocaleString()}</span>
                                </div>
                             </div>
                           )}
                        </div>
                      </div>
                    </section>

                    {/* Action History section */}
                    <section
                      className={styles.historyCard}
                      style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                    >
                      <div className={styles.historyCardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}20`, borderColor: themeConfig.general.border }}>
                        <div className={styles.historyCardHeaderLeft}>
                          <History size={18} className="opacity-60" />
                          <h3 className={styles.historyTitle} style={{ color: themeConfig.dashboard.text }}>Histórico de Ações</h3>
                        </div>
                        {auditoriaLogsUnicos.length > 0 && (
                          <span className={styles.historyCount}>
                            {auditoriaLogsUnicos.length} {auditoriaLogsUnicos.length === 1 ? 'registro' : 'registros'}
                          </span>
                        )}
                      </div>
                      <div className={styles.historyBody}>
                        {auditoriaLoading ? (
                          <div className={styles.historyLoadingText}>Carregando histórico...</div>
                        ) : auditoriaLogsUnicos.length === 0 ? (
                          <div className={styles.historyEmptyText}>
                            Nenhuma ação registrada para esta checagem.
                          </div>
                        ) : (
                          <div className={styles.historyList}>
                            {auditoriaLogsUnicos.map((log, i) => {
                              const campos = formatarCamposAlterados(log.acao, log.detalhes);
                              const acaoConfig = AUDITORIA_ACAO_CONFIG[log.acao] ?? AUDITORIA_ACAO_CONFIG['_default'];
                              return (
                                <div key={log.id} className={styles.historyItem}>
                                  {i !== auditoriaLogsUnicos.length - 1 && (
                                    <div className={styles.historyConnector} />
                                  )}
                                  <div
                                    className={styles.historyItemIcon}
                                    style={{ backgroundColor: `${acaoConfig.color}20`, color: acaoConfig.color }}
                                  >
                                    {acaoConfig.icon}
                                  </div>
                                  <div className={styles.historyItemContent}>
                                    <div className={styles.historyItemRow}>
                                      <p className={styles.historyItemText} style={{ color: themeConfig.dashboard.text }}>
                                        {log.usuarioNome}
                                        <span className={styles.historyItemVerb}>{acaoConfig.verbo}</span>
                                        {campos && (
                                          <span className={styles.historyItemCampos}>
                                            {campos}
                                          </span>
                                        )}
                                      </p>
                                      <span className={styles.historyItemTime}>
                                        {formatarDataAuditoria(log.timestamp)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                className={styles.tabSection}
              >
                <div className={styles.tabSection}>
                  <div className={styles.metricsHeader}>
                    <Sparkles size={16} className="text-blue-500" />
                    <h3 className={styles.metricsTitle}>Métricas Preliminares de I.A</h3>
                    <button
                      onClick={() => {
                        if (isAnalyzingAI) return;
                        setIsAnalyzingAI(true);
                        setAiError(null);
                        apiService.analisarConteudo(selectedNews.id)
                          .then((updated) => {
                            // Passa apenas os campos de IA; o App.tsx fará merge com
                            // { ...n, ...aiOnly }, preservando edições locais não salvas.
                            onNewsUpdated?.({
                              id: selectedNews.id,
                              aiScores: updated.aiScores,
                              aiEvaluation: updated.aiEvaluation,
                              isAIProcessing: updated.isAIProcessing,
                            } as NewsItem);
                            setAiToast({ type: 'success', message: 'Análise de IA concluída com sucesso!' });
                          })
                          .catch((err) => {
                            const msg = err instanceof Error ? err.message : 'Erro ao analisar com IA.';
                            setAiError(msg);
                            setAiToast({ type: 'error', message: msg });
                          })
                          .finally(() => setIsAnalyzingAI(false));
                      }}
                      disabled={isAnalyzingAI || selectedNews.isAIProcessing}
                      className={styles.analyzeAiButton}
                      style={{
                        backgroundColor: themeConfig.buttons.primary,
                        color: themeConfig.buttons.primaryText,
                        opacity: isAnalyzingAI || selectedNews.isAIProcessing ? 0.6 : 1,
                        cursor: isAnalyzingAI || selectedNews.isAIProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isAnalyzingAI ? (
                        <>
                          <div className={styles.analyzeSpinner} />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Cpu size={14} />
                          Analisar com IA
                        </>
                      )}
                    </button>
                  </div>
                  {aiError && (
                    <p className={styles.aiErrorMsg}>{aiError}</p>
                  )}

                  <div className={styles.metricsAxisSection}>
                    {showMisinfoAxis && (
                    <>
                    <div className={styles.metricsHeader}>
                      <AlertCircle size={16} className="text-orange-500" />
                      <h3 className={styles.metricsAxisTitleMisinfo}>Eixo Desinformação</h3>
                    </div>

                    <div className={styles.metricsGrid}>
                      {[
                        { label: 'Inveracidade', value: aiScores.inveracidade || aiScores.gravity || 0, icon: AlertCircle, color: themeConfig.status.error },
                        { label: 'Distorção', value: aiScores.distorcao || aiScores.urgency || 0, icon: Sparkles, color: themeConfig.status.warning },
                        { label: 'Fora de Contexto', value: aiScores.foraDeContexto || aiScores.trend || 0, icon: History, color: themeConfig.status.info }
                      ].map((score, idx) => (
                        <div 
                          key={idx} 
                          className={styles.metricCard}
                        >
                          <div className={styles.metricCardInner}>
                            <div className={styles.metricCardTop}>
                              <div className={styles.metricIconWrapper} style={{ backgroundColor: `${score.color}10`, color: score.color }}>
                                <score.icon size={18} />
                              </div>
                              <div className={styles.metricCardRight}>
                                <span className={styles.metricCardLabel}>{score.label}</span>
                                <div className={styles.metricValueRow}>
                                  {selectedNews.isAIProcessing ? (
                                    <span className={styles.metricValueProcessing}>...</span>
                                  ) : (
                                    <span className={styles.metricValue} style={{ color: themeConfig.dashboard.text }}>{score.value}%</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={styles.metricBarWrapper}>
                               {selectedNews.isAIProcessing ? (
                                 <div className={styles.metricBarShimmer} />
                               ) : (
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${score.value}%` }}
                                   className={styles.metricBar}
                                   style={{ backgroundColor: score.color }}
                                 />
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                    )}
                  </div>

                  <div className={styles.metricsAxisSection}>
                    {showIllicitAxis && (
                    <>
                    <div className={styles.metricsHeader}>
                      <AlertTriangle size={16} className="text-red-500" />
                      <h3 className={styles.metricsAxisTitleIllicit}>Eixo Ilicitudes</h3>
                    </div>

                    <div className={styles.metricsGrid}>
                      {[
                        { label: 'Golpe', value: aiScores.golpe || Math.floor((aiScores.gravity || 0) * 0.7), icon: AlertTriangle, color: '#ef4444' },
                        { label: 'Fraude', value: aiScores.fraude || Math.floor((aiScores.urgency || 0) * 0.8), icon: AlertTriangle, color: '#f97316' },
                        { label: 'Ataques', value: aiScores.ataques || Math.floor((aiScores.trend || 0) * 0.6), icon: AlertTriangle, color: '#8b5cf6' },
                        { label: 'Disc. Ódio', value: aiScores.discursoDeOdio || Math.floor((aiScores.gravity || 0) * 0.9), icon: AlertTriangle, color: '#ec4899' },
                        { label: 'Disc. Antidemocrático', value: aiScores.discursoAntidemocratico || Math.floor((aiScores.gravity || 0) * 0.5), icon: AlertTriangle, color: '#ef4444' }
                      ].map((score, idx) => (
                        <div 
                          key={idx} 
                          className={styles.metricCard}
                        >
                          <div className={styles.metricCardInner}>
                            <div className={styles.metricCardTop}>
                              <div className={styles.metricIconWrapper} style={{ backgroundColor: `${score.color}10`, color: score.color }}>
                                <score.icon size={18} />
                              </div>
                              <div className={styles.metricCardRight}>
                                <span className={styles.metricCardLabel}>{score.label}</span>
                                <div className={styles.metricValueRow}>
                                  {selectedNews.isAIProcessing ? (
                                    <span className={styles.metricValueProcessingSmall}>...</span>
                                  ) : (
                                    <span className={styles.metricValue} style={{ color: themeConfig.dashboard.text }}>{score.value}%</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={styles.metricBarWrapper}>
                               {selectedNews.isAIProcessing ? (
                                 <div className={styles.metricBarShimmer} />
                               ) : (
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${score.value}%` }}
                                   className={styles.metricBar}
                                   style={{ backgroundColor: score.color }}
                                 />
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    </>
                    )}
                  </div>
                </div>

                {/* 2.1 AI Semantic Analysis */}
                {showSemanticAnalysis && (
                <section 
                  className={styles.semanticCard}
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className={styles.semanticCardHeader} style={{ borderColor: themeConfig.general.border }}>
                    <div className={styles.semanticCardHeaderLeft}>
                      <div className={styles.semanticCardIconWrapper}>
                        <Cpu size={18} />
                      </div>
                      <div>
                        <h3 className={styles.semanticCardTitle} style={{ color: themeConfig.dashboard.text }}>Análise Semântica & Contextual</h3>
                        <p className={styles.semanticCardSubtitle}>Visão estrutural gerada por algoritmos</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.semanticCardBody}>
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
                        <div className={styles.semanticGrid}>
                          <div className={styles.semanticColumn}>
                            <div className={styles.semanticColumn}>
                              <h4 className={styles.semanticSectionHeader}>
                                <AlertCircle size={14} className="text-amber-500" /> Gatilhos e Linguagem
                              </h4>
                              <ul className={styles.semanticList}>
                                {analysisData.characteristics.map((char, idx) => (
                                  <li key={idx} className={styles.semanticListItem} style={{ color: themeConfig.dashboard.text }}>
                                    <div className="markdown-body">
                                      <Markdown>{char}</Markdown>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className={styles.semanticColumn}>
                            <div className={styles.semanticColumn}>
                              <h4 className={styles.semanticSectionHeader}>
                                <Users size={14} className="text-blue-500" /> Personagens & Locais
                              </h4>
                              <div className={styles.semanticList}>
                                {analysisData.entities.map((entity, idx) => (
                                  <div key={idx} className={styles.entityCard}>
                                    <p className={styles.entityName}>{entity.name}</p>
                                    <p className={styles.entityDescription}>{entity.description}</p>
                                  </div>
                                ))}
                                <div className={styles.locationRow}>
                                  <div className={styles.locationItem}>
                                    <span className={styles.locationLabel}>Localização</span>
                                    <div className={styles.locationValue}>
                                      <MapPin size={12} className="opacity-40" />
                                      {analysisData.location}
                                    </div>
                                  </div>
                                  <div className={styles.locationItem}>
                                    <span className={styles.locationLabel}>Período</span>
                                    <div className={styles.dateBadgeList}>
                                      {analysisData.dates.map((d, i) => (
                                        <span key={i} className={styles.dateBadge}>{d}</span>
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
                )}
              </motion.div>
            )}

            {activeTab === 'investigation' && (
              <motion.div 
                key="investigation"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.tabSection}
              >
                {/* Questions and Methodology */}
                <section 
                  className={styles.investigationCard}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className={styles.investigationCardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                    <div className={styles.investigationCardHeaderLeft}>
                      <List size={18} className="opacity-40" />
                      <h3 className={styles.investigationCardTitle} style={{ color: themeConfig.dashboard.text }}>Perguntas de Investigação</h3>
                    </div>
                  </div>
                  <div className={styles.investigationCardBody}>
                     <div className={styles.questionsSection}>
                        <label className={styles.sectionLabel}>Perguntas Balizadoras</label>
                        <div className={styles.questionsList}>
                           {reportStructure.questions.map((q, idx) => (
                             <div key={idx} className={styles.questionItem}>
                                <input 
                                  value={q}
                                  onChange={(e) => {
                                    const newQuestions = [...reportStructure.questions];
                                    newQuestions[idx] = e.target.value;
                                    handleUpdateReportStructure({ questions: newQuestions });
                                  }}
                                  placeholder="Ex: Qual a origem do vídeo?"
                                  className={styles.questionInput}
                                />
                                {idx > 0 && (
                                  <button onClick={() => {
                                    const newQuestions = [...reportStructure.questions];
                                    newQuestions.splice(idx, 1);
                                    handleUpdateReportStructure({ questions: newQuestions });
                                  }} className={styles.removeQuestionButton}>
                                    <Trash2 size={20} />
                                  </button>
                                )}
                             </div>
                           ))}
                           <button 
                             onClick={() => handleUpdateReportStructure({ questions: [...reportStructure.questions, ''] })}
                             className={styles.addQuestionButton}
                           >
                             <Plus size={14} /> Adicionar Pergunta
                           </button>
                        </div>
                     </div>

                     <div className={styles.methodologySection}>
                        <label className={styles.sectionLabel}>Resumo da Metodologia de Checagem</label>
                        <textarea 
                          value={reportStructure.summary || ''}
                          onChange={(e) => handleUpdateReportStructure({ summary: e.target.value })}
                          placeholder="Como este conteúdo foi verificado?"
                          rows={3}
                          className={styles.methodologyTextarea}
                        />
                     </div>
                  </div>
                </section>

                {/* Inverificável toggle */}
                <section>
                  {reportStructure.isInverifiable ? (
                    <div className={styles.inverificavelBanner}>
                      <div className={styles.inverificavelIconWrapper}>
                        <Ban size={22} className="text-white" />
                      </div>
                      <div className={styles.inverificavelContent}>
                        <p className={styles.inverificavelTitle}>
                          Conteúdo marcado como Inverificável
                        </p>
                        <p className={styles.inverificavelDescription}>
                          Este conteúdo não pode ser verificado com as ferramentas e fontes disponíveis.
                          A classificação final deverá refletir essa condição.
                        </p>
                      </div>
                      {canEdit && (
                        <button
                          onClick={() => handleUpdateReportStructure({ isInverifiable: false })}
                          className={styles.inverificavelUndoButton}
                        >
                          <ShieldOff size={14} />
                          Desfazer
                        </button>
                      )}
                    </div>
                  ) : (
                    canEdit && (
                      <button
                        onClick={() => handleUpdateReportStructure({ isInverifiable: true })}
                        className={styles.markAsInverificavelButton}
                        style={{ borderColor: themeConfig.general.border }}
                      >
                        <div className={styles.markAsInverificavelIconWrapper}>
                          <Ban size={18} />
                        </div>
                        <div>
                          <p className={styles.markAsInverificavelLabel}>
                            Marcar como Inverificável
                          </p>
                          <p className={styles.markAsInverificavelSubLabel}>
                            Não é possível verificar este conteúdo
                          </p>
                        </div>
                      </button>
                    )
                  )}
                </section>

                 {/* Investigação & Verificação */}
                <section 
                  className={styles.evidenceCard}
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className={styles.evidenceCardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}20`, borderColor: themeConfig.general.border }}>
                    <div className={styles.evidenceCardHeaderLeft}>
                      <Search size={18} className="opacity-60" />
                      <h3 className={styles.evidenceCardTitle} style={{ color: themeConfig.dashboard.text }}>Investigação & Verificação</h3>
                    </div>
                  </div>
                  <div className={styles.evidenceCardBody}>
                    {/* Multi-modal Evidence Input Split */}
                    {canEdit && (
                       <div className={styles.evidenceUploadGrid}>
                          {/* File Upload Option */}
                          <div className={cn(
                             styles.evidenceUploadZone,
                             isUploading ? styles.evidenceUploadZoneActive : styles.evidenceUploadZoneDefault
                          )}>
                             <input 
                               type="file" 
                               className={styles.fileInput}
                               onChange={handleFileUpload}
                               disabled={isUploading}
                               accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                             />
                             
                             {isUploading ? (
                               <div className={styles.uploadingState}>
                                 <div className={styles.uploadSpinner} />
                                 <p className={styles.uploadingText}>Subindo...</p>
                               </div>
                             ) : (
                               <>
                                 <div className={styles.uploadIconWrapper}>
                                    <FileIcon size={20} />
                                 </div>
                                 <div>
                                    <p className={styles.uploadLabel}>Anexar Arquivo</p>
                                    <p className={styles.uploadSubLabel}>PDF, Imagem, Vídeo, Doc</p>
                                 </div>
                               </>
                             )}
                          </div>

                          {/* Link Option */}
                          <div className={cn(
                             styles.linkZone,
                             isAddingLink ? styles.linkZoneActive : styles.linkZoneDefault
                          )}
                            onClick={() => !isAddingLink && setIsAddingLink(true)}
                          >
                             {isAddingLink ? (
                               <form onSubmit={handleLinkSubmit} className={styles.linkForm}>
                                 <input 
                                   autoFocus
                                   type="url" 
                                   placeholder="https://..."
                                   value={linkInput}
                                   onChange={(e) => setLinkInput(e.target.value)}
                                   className={styles.linkInput}
                                   onClick={(e) => e.stopPropagation()}
                                 />
                                 <div className={styles.linkFormButtons}>
                                   <button 
                                     type="submit"
                                     className={styles.addLinkButton}
                                   >Adicionar</button>
                                   <button 
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); setIsAddingLink(false); }}
                                     className={styles.cancelLinkButton}
                                   >Cancelar</button>
                                 </div>
                               </form>
                             ) : (
                               <>
                                 <div className={styles.linkIconWrapper}>
                                    <LinkIcon size={20} />
                                 </div>
                                 <div>
                                    <p className={styles.uploadLabel}>Adicionar Link</p>
                                    <p className={styles.uploadSubLabel}>URL externa / Fonte</p>
                                 </div>
                               </>
                             )}
                          </div>
                          
                          {uploadStatus === 'success' && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={styles.colSpanFullSuccessMessage}
                            >
                              Anexo adicionado com sucesso!
                            </motion.div>
                          )}
                       </div>
                    )}
                    <div className={styles.evidenceList}>
                      {selectedNews.evidence.map(ev => (
                        <div
                          key={ev.id}
                          className={styles.evidenceItem}
                          style={{ borderColor: themeConfig.general.border }}
                        >
                          {ev.type === 'video' && ev.url && (
                            <video
                              src={ev.url}
                              controls
                              preload="metadata"
                              crossOrigin="anonymous"
                              className={styles.evidenceItemVideo}
                            />
                          )}
                          {ev.type === 'image' && ev.url && (
                            <a href={ev.url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={ev.url}
                                alt={ev.title}
                                className={styles.evidenceItemImage}
                              />
                            </a>
                          )}
                          <div className={styles.evidenceItemFooter}>
                            <div className={styles.evidenceItemIcon}>
                              {ev.type === 'link' && <LinkIcon size={18} className="text-blue-500" />}
                              {ev.type === 'video' && <VideoIcon size={18} className="text-violet-500" />}
                              {ev.type === 'image' && <ImageIcon size={18} className="text-emerald-500" />}
                              {ev.type === 'document' && <FileText size={18} className="text-slate-400" />}
                              {!['link', 'video', 'image', 'document'].includes(ev.type) && (
                                <FileText size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div className={styles.evidenceItemInfo}>
                              {ev.url ? (
                                <a
                                  href={ev.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.evidenceItemLink}
                                >
                                  {ev.title}
                                </a>
                              ) : (
                                <h4 className={styles.evidenceItemTitle}>{ev.title}</h4>
                              )}
                              <p className={styles.evidenceItemUrl}>{ev.url}</p>
                            </div>
                            {canEdit && (
                              <button
                                onClick={() => handleRemoveEvidence(ev.id)}
                                className={styles.removeEvidenceButton}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {selectedNews.evidence.length === 0 && (
                        <div className={styles.evidenceEmptyState}>
                          <Info size={24} />
                          <p className={styles.emptyStateMessage}>Inicie a investigação anexando links, documentos, imagens ou vídeos.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Contact Step */}
                    <div className={styles.contactSection} style={{ borderColor: themeConfig.general.border }}>
                      <div className={styles.contactLeft}>
                        <h4 className={styles.contactTitle}>Tentativa de contato com o autor da alegação</h4>
                        <p className={styles.contactSubtitle}>Fundamental para o contraditório e clareza editorial.</p>
                      </div>
                      <div className={styles.contactRight}>
                        <div className={styles.contactOptions}>
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
                              className={styles.contactOptionButton}
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
                            className={styles.contactResponseTextarea}
                          />
                        )}
                      </div>
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
                className={styles.tabSection}
              >
                {/* AI Actions Hub */}
                {canEdit && (
                  <div 
                    className={styles.aiHub}
                    style={{ backgroundColor: themeConfig.general.accent, boxShadow: `0 30px 40px -10px ${themeConfig.general.accent}40` }}
                  >
                    <div className={styles.aiHubDecoration}>
                      <Wand2 size={120} />
                    </div>
                    <div className={styles.aiHubContent}>
                      <div className={styles.aiHubHeader}>
                        <div className={styles.aiHubIconWrapper}>
                          <Sparkles size={24} />
                        </div>
                        <div>
                          <span className={styles.aiHubTitle}>Inteligência de Rede</span>
                          <span className={styles.aiHubSubtitle}>Suporte Editorial IA</span>
                        </div>
                      </div>
                      <div className={styles.aiHubActions}>
                        <button 
                          onClick={handleGenerateDraft}
                          disabled={isGeneratingDraft}
                          className={styles.generateDraftButton}
                          style={{ color: themeConfig.general.accent }}
                        >
                          <Wand2 size={20} className="group-hover/btn:rotate-12 transition-transform" />
                          {isGeneratingDraft ? 'Criando...' : 'Gerar Rascunho de Parecer'}
                        </button>
                        <button 
                          onClick={handleReviewReport}
                          disabled={isReviewing}
                          className={styles.reviewButton}
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
                  className={styles.verdictCard}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className={styles.verdictCardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                    <div className={styles.verdictCardHeaderLeft}>
                      <CheckCircle size={18} className="text-green-500" />
                      <h3 className={styles.verdictCardTitle} style={{ color: themeConfig.dashboard.text }}>Etiqueta de Veracidade</h3>
                    </div>
                  </div>
                  <div className={styles.verdictCardBody}>
                    <div className={styles.labelsGrid}>
                      {labels.map((label) => (
                        <button 
                          key={label.id}
                          disabled={!canEdit}
                          onClick={() => handleUpdateReportStructure({ label: label.name })}
                          className={cn(
                            styles.labelButton,
                            reportStructure.label === label.name ? styles.labelButtonSelected : styles.labelButtonUnselected
                          )}
                          style={{ 
                            backgroundColor: reportStructure.label === label.name ? label.color : 'transparent', 
                            borderColor: reportStructure.label === label.name ? label.color : themeConfig.general.border,
                            color: reportStructure.label === label.name ? '#fff' : themeConfig.dashboard.text,
                          }}
                        >
                          <span className={styles.labelButtonText}>{label.name}</span>
                          <span className={styles.labelButtonDesc}>{label.description}</span>
                          {reportStructure.label === label.name && (
                            <div className={styles.labelButtonCheck}>
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
                  className={styles.reportCard}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className={styles.reportCardHeader} style={{ borderColor: themeConfig.general.border }}>
                    <div className={styles.reportCardHeaderLeft}>
                      <div className={styles.reportCardIconWrapper}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className={styles.reportCardTitle} style={{ color: themeConfig.dashboard.text }}>Redação do Parecer Editorial</h3>
                        <p className={styles.reportCardSubtitle}>Editor & Preview em Tempo Real</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.reportEditorGrid}>
                    {/* Editor Column */}
                    <div className={styles.reportEditorColumn} style={{ borderColor: themeConfig.general.border }}>
                       <div className={styles.reportEditorColumnHeader}>
                          <label className={styles.reportEditorLabel}>Editor de Parecer</label>
                          <div className={styles.reportEditorActions}>
                            <button className={styles.reportEditorActionButton}><History size={16} /></button>
                            <button className={styles.reportEditorActionButton}><Info size={16} /></button>
                          </div>
                       </div>
                       <textarea 
                        value={selectedNews.report}
                        onChange={(e) => handleUpdateReport(e.target.value)}
                        placeholder="Inicie a redação do parecer final..."
                        readOnly={!canEdit}
                        className={styles.reportEditorTextarea}
                        style={{ color: themeConfig.general.inputText }}
                      />
                    </div>

                    {/* Preview Column */}
                    <div className={styles.reportPreviewColumn}>
                       <label className={styles.reportPreviewLabel}>Visualização de Publicação</label>
                       <div className={styles.reportPreviewContent}>
                          {reportStructure.label && (
                            <div 
                              className={styles.reportPreviewLabelBadge}
                              style={{ 
                                backgroundColor: labels.find(l => l.name === reportStructure.label)?.color + '20',
                                color: labels.find(l => l.name === reportStructure.label)?.color,
                                border: `1px solid ${labels.find(l => l.name === reportStructure.label)?.color}40`
                              }}
                            >
                              {reportStructure.label}
                            </div>
                          )}
                          <h1 className={styles.reportPreviewTitle}>{selectedNews.title}</h1>
                          <div className="markdown-body prose prose-slate prose-lg max-w-none">
                            <Markdown>{selectedNews.report || '_O rascunho aparecerá aqui conforme você escreve no editor ao lado._'}</Markdown>
                          </div>
                          
                          <div className={styles.reportPreviewFooter}>
                             <h4 className={styles.reportPreviewFooterTitle}>Metodologia e Transparência</h4>
                             <p className={styles.reportPreviewFooterText}>{reportStructure.summary || 'A metodologia será exibida após o preenchimento na aba de investigação.'}</p>
                             <div className={styles.reportPreviewStats}>
                                <div className={styles.reportPreviewStat}>Perguntas: {reportStructure.questions.length}</div>
                                <div className={styles.reportPreviewStat}>Fontes: {reportStructure.sources.length}</div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
            {activeTab === 'tools' && (
              <motion.div 
                key="tools"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={styles.toolsTabSection}
              >
                <section 
                  className={styles.toolsCard}
                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                >
                  <div className={styles.toolsCardHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
                    <h3 className={styles.toolsCardHeaderTitle} style={{ color: themeConfig.dashboard.text }}>Ferramentas Analíticas</h3>
                  </div>
                  <div className={styles.toolsCardBody}>
                    <p className={styles.toolsDescription}>Use essas ferramentas externas e assistentes integrados para auxiliar na checagem e consolidação de evidências.</p>
                    <div className={styles.toolsGrid}>
                      {TOOLS.map((tool, i) => {
                        const Icon = getToolIcon(tool.icon);
                        return (
                          <div 
                            key={i} 
                            className={styles.toolCard}
                            style={{ borderColor: themeConfig.general.border }}
                          >
                            <div className={styles.toolCardHeader}>
                              <div className={styles.toolCardTop}>
                                <div 
                                  className={styles.toolCardIconWrapper}
                                  style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
                                >
                                  <Icon size={18} style={{ color: themeConfig.general.accent }} />
                                </div>
                                <h4 className={styles.toolCardName} style={{ color: themeConfig.dashboard.text }}>{tool.name}</h4>
                              </div>
                              <p className={styles.toolCardDesc}>{tool.description}</p>
                            </div>
                            <button 
                              className={styles.toolCardButton}
                              style={{ 
                                backgroundColor: themeConfig.general.cardBackground, 
                                borderColor: themeConfig.general.border,
                                color: themeConfig.dashboard.text
                              }}
                            >
                              Abrir Utilitário
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        );
                      })}
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
              className={styles.toolboxOverlay}
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={styles.toolboxSidebar}
              style={{ backgroundColor: themeConfig.general.cardBackground }}
            >
              <div className={styles.toolboxHeader} style={{ borderColor: themeConfig.general.border }}>
                <div className={styles.toolboxHeaderLeft}>
                  <Toolbox style={{ color: themeConfig.general.accent }} size={20} />
                  <h3 className={styles.toolboxTitle} style={{ color: themeConfig.dashboard.text }}>Ferramentas de Checagem</h3>
                </div>
                <button 
                  onClick={() => setIsToolboxOpen(false)} 
                  className={styles.toolboxCloseButton}
                  style={{ color: themeConfig.dashboard.text }}
                >
                  <ArrowLeft className="rotate-180" size={20} />
                </button>
              </div>
              <div className={styles.toolboxBody}>
                {TOOLS.map((tool, i) => {
                  const Icon = getToolIcon(tool.icon);
                  return (
                    <div 
                      key={i} 
                      className={styles.toolboxToolCard}
                      style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}
                    >
                      <div className={styles.toolboxToolCardHeader}>
                        <div 
                          className={styles.toolboxToolIconWrapper}
                          style={{ backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}
                        >
                          <Icon size={20} />
                        </div>
                        <h4 className={styles.toolboxToolName} style={{ color: themeConfig.dashboard.text }}>{tool.name}</h4>
                      </div>
                      <p className={styles.toolboxToolDesc} style={{ color: themeConfig.dashboard.text }}>{tool.description}</p>
                      <button 
                        className={styles.toolboxToolButton}
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

      <AnimatePresence>
        {showInvestigationSaveSuccess && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInvestigationSaveSuccess(false)}
              className={styles.saveSuccessOverlay}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={styles.saveSuccessModal}
            >
              <div
                className={styles.saveSuccessCard}
                style={{
                  backgroundColor: themeConfig.general.cardBackground,
                  borderColor: themeConfig.general.border,
                }}
              >
                <div
                  className={styles.saveSuccessIconWrapper}
                  style={{ backgroundColor: `${themeConfig.status.success}20` }}
                >
                  <CheckCircle size={32} style={{ color: themeConfig.status.success }} />
                </div>
                <h3
                  className={styles.saveSuccessTitle}
                  style={{ color: themeConfig.dashboard.text }}
                >
                  Investigação salva!
                </h3>
                <p className={styles.saveSuccessText}>
                  As informações da investigação foram salvas com sucesso no banco de dados.
                </p>
                <button
                  onClick={() => setShowInvestigationSaveSuccess(false)}
                  className={styles.saveSuccessButton}
                  style={{ backgroundColor: themeConfig.status.success }}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
