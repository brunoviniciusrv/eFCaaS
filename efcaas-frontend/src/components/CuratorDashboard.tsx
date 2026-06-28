import React, { useState, useMemo, useRef } from 'react';
import { 
  Layout, 
  Users, 
  Filter, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MoreVertical, 
  ArrowRight,
  Kanban,
  List,
  Check,
  X,
  ChevronRight,
  Bell,
  ArrowUpDown,
  RotateCcw,
  ExternalLink,
  Activity,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Upload,
  FileText,
  Link as LinkIcon,
  Inbox,
  Trash2,
  Share2,
  MoreHorizontal,
  Mail,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  MessageCircle,
  MessageSquare,
  Send,
  Eye,
  ArrowUpRight,
  User,
  Info,
  TrendingUp,
  UserPlus,
  Box,
  Youtube as YoutubeIcon,
  Globe,
  Search as SearchIcon,
  Zap,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  NewsItem, 
  UserProfile, 
  ThemeConfig, 
  NewsStatus, 
  AssignmentHistory,
  ReceivedNewsItem,
  ReceivedNewsStatus,
  AgencyConfig,
} from '../types';
import { isAiModuleEnabled, isDesinfoMetricsEnabled } from '../config/aiModules';
import { formatAiScore, getDesinfoScore } from '../lib/aiAnalysis';
import { isNewsAssignedTo, resolveCheckerFromQuery } from '../lib/newsAssignment';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { ResponsiveTabs } from './ResponsiveTabs';
import { TrendAnalyzer } from './TrendAnalyzer';
import { SpecializedNetworkView } from './SpecializedNetworkView';
import { NewsAssignmentModal } from './NewsAssignmentModal';
import { CheckerNameAutocomplete } from './CheckerNameAutocomplete';
import { UserAvatar } from './UserAvatar';
import assignStyles from './CheckerAssign.module.css';
import styles from './CuratorDashboard.module.css';

import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult
} from '@hello-pangea/dnd';

interface CuratorDashboardProps {
  news: NewsItem[];
  setNews?: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  users: UserProfile[];
  currentUser: UserProfile;
  themeConfig: ThemeConfig;
  onAssign: (newsId: string, checkerId: string, briefing: string) => Promise<void>;
  onUnassign: (newsId: string, checkerId: string) => Promise<void>;
  onApprove: (newsId: string, comments: string) => void;
  onReject: (newsId: string, comments: string) => void;
  onReopen: (newsId: string, reason: string) => void;
  setSelectedNewsId: (id: string | null) => void;
  onAddNews: (newsData: any) => void;
  onEditNews: (newsId: string, newsData: any) => void;
  receivedNews: ReceivedNewsItem[];
  onForwardToTriage: (news: ReceivedNewsItem) => void;
  onDeleteReceivedNews: (id: string) => void;
  onDeleteNews?: (newsId: string) => Promise<void>;
  notifications: any[];
  onMarkNotifAsRead: (id: string) => void;
  onClearNotifs: () => void;
  checkPermission: (permId: string) => boolean;
  onSendToSpecializedNetwork: (newsId: string) => void;
  specializedNetworkChecks: any[];
  onMoveTask?: (newsId: string, newStatus: NewsStatus) => Promise<void>;
  agencyConfig: AgencyConfig;
}

type CuratorTab = 'triage' | 'received' | 'trends' | 'list' | 'kanban' | 'workload' | 'reviews' | 'specialized_network';

export const CuratorDashboard = ({
  news,
  setNews,
  users,
  currentUser,
  themeConfig,
  onAssign,
  onUnassign,
  onApprove,
  onReject,
  onReopen,
  setSelectedNewsId,
  onAddNews,
  onEditNews,
  receivedNews,
  onForwardToTriage,
  onDeleteReceivedNews,
  onDeleteNews,
  notifications,
  onMarkNotifAsRead,
  onClearNotifs,
  checkPermission,
  onSendToSpecializedNetwork,
  specializedNetworkChecks,
  onMoveTask,
  agencyConfig,
}: CuratorDashboardProps) => {
  const navigate = useNavigate();
  const socialSearchEnabled = isAiModuleEnabled(agencyConfig, 'enableSocialSearch');
  const aiMetricsEnabled = isDesinfoMetricsEnabled(agencyConfig);
  const specializedNetworkEnabled = isAiModuleEnabled(agencyConfig, 'enableSpecializedNetwork');
  const [activeTab, setActiveTab] = useState<CuratorTab>(
    checkPermission('manage_received') ? 'received' : 
    checkPermission('review_and_approve') ? 'reviews' : 'list'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedSearchQuery, setReceivedSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortReceivedBy, setSortReceivedBy] = useState<'receivedAt'>('receivedAt');
  const [sortReceivedOrder, setSortReceivedOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedReceivedItem, setSelectedReceivedItem] = useState<ReceivedNewsItem | null>(null);
  const [isReceivedDetailOpen, setIsReceivedDetailOpen] = useState(false);
  const [selectedTriageItemId, setSelectedTriageItemId] = useState<string | null>(null);
  const [isTriagePreviewOpen, setIsTriagePreviewOpen] = useState(false);
  const currentTriageItem = useMemo(() => 
    news.find(n => n.id === selectedTriageItemId), 
  [news, selectedTriageItemId]);
  const [gravityFilter, setGravityFilter] = useState<number>(0);
  const [urgencyFilter, setUrgencyFilter] = useState<number>(0);
  const [trendFilter, setTrendFilter] = useState<number>(0);

  const getSourceIcon = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('whatsapp')) return <MessageCircle size={16} className={styles.iconGreen} />;
    if (s.includes('facebook')) return <FacebookIcon size={16} className={styles.iconBlue600} />;
    if (s.includes('instagram')) return <InstagramIcon size={16} className={styles.iconPink} />;
    if (s.includes('telegram')) return <Send size={16} className={styles.iconSky} />;
    if (s.includes('e-mail') || s.includes('email')) return <Mail size={16} className={styles.iconSlate} />;
    if (s.includes('tiktok')) return <TrendingUp size={16} className={styles.iconBlack} />;
    if (s.includes('twitter') || s.includes('x')) return <Info size={16} className={styles.iconDark} />;
    return <Inbox size={16} className={styles.iconSlate} />;
  };
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningNewsId, setAssigningNewsId] = useState<string | null>(null);
  const [registerAssignQuery, setRegisterAssignQuery] = useState('');
  const [reviewingNewsId, setReviewingNewsId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reopeningNewsId, setReopeningNewsId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editForm, setEditForm] = useState({ title: '', alegacao: '', descricao: '', source: '', url: '', priority: 'medium' as const });
  const [isExtractionModalOpen, setIsExtractionModalOpen] = useState(false);
  const [extractionResults, setExtractionResults] = useState<ReceivedNewsItem[]>([]);
  const [showExtractionResults, setShowExtractionResults] = useState(false);
  const [extractionSearchQuery, setExtractionSearchQuery] = useState('');
  const [extractionParams, setExtractionParams] = useState({
    query: '',
    userLimit: 100,
    comments: '',
    startDate: '',
    endDate: '',
    platforms: {
      youtube: true,
      reddit: true,
      facebook: true,
      telegram: true
    }
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [detailedCheckerId, setDetailedCheckerId] = useState<string | null>(null);

  React.useEffect(() => {
    if (socialSearchEnabled) return;
    setExtractionParams((prev) => ({
      ...prev,
      platforms: {
        youtube: false,
        reddit: false,
        facebook: false,
        telegram: false,
      },
    }));
    setIsExtractionModalOpen(false);
  }, [socialSearchEnabled]);

  React.useEffect(() => {
    if (specializedNetworkEnabled) return;
    if (activeTab === 'specialized_network') {
      setActiveTab(checkPermission('manage_received') ? 'received' : 'triage');
    }
  }, [specializedNetworkEnabled, activeTab, checkPermission]);

  React.useEffect(() => {
    if (socialSearchEnabled) return;
    if (activeTab === 'trends') {
      setActiveTab(checkPermission('manage_received') ? 'received' : 'triage');
    }
  }, [socialSearchEnabled, activeTab, checkPermission]);

  const extractionPlatforms = useMemo(
    () =>
      socialSearchEnabled
        ? [
            { id: 'youtube', label: 'YouTube', icon: YoutubeIcon, color: 'text-red-600 bg-red-50' },
            { id: 'reddit', label: 'Reddit', icon: Globe, color: 'text-orange-600 bg-orange-50' },
            { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-blue-600 bg-blue-50' },
            { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-600 bg-sky-50' },
          ]
        : [],
    [socialSearchEnabled]
  );

  const curatorTabs = useMemo(
    () =>
      [
        { id: 'received', label: 'Conteúdos Recebidos', icon: Inbox, permission: 'manage_received' },
        ...(socialSearchEnabled
          ? [{ id: 'trends', label: 'Analisador de Tendências', icon: TrendingUp, permission: 'manage_triage' }]
          : []),
        ...(specializedNetworkEnabled
          ? [{ id: 'specialized_network', label: 'Rede Especializada', icon: Globe, permission: 'manage_triage' }]
          : []),
        { id: 'triage', label: 'Triagem', icon: List, permission: 'manage_triage' },
        { id: 'list', label: 'Publicações', icon: Activity },
        { id: 'kanban', label: 'Fluxo', icon: Kanban, permission: 'assign_tasks' },
        { id: 'workload', label: 'Equipe', icon: Users, permission: 'assign_tasks' },
        { id: 'reviews', label: 'Revisões', icon: CheckCircle, permission: 'review_and_approve' },
      ].filter((tab) => !tab.permission || checkPermission(tab.permission)),
    [socialSearchEnabled, specializedNetworkEnabled, checkPermission]
  );

  const [newNews, setNewNews] = useState({
    title: '',
    alegacao: '',
    descricao: '',
    source: '',
    url: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    briefing: ''
  });
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const registerFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_ATTACHMENT_BYTES = 200 * 1024 * 1024;
  const [selectedStatus, setSelectedStatus] = useState<NewsStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'assignedTo'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const checkers = useMemo(() => users.filter(u => u.role === 'checker'), [users]);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.source.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGravity = !aiMetricsEnabled || (getDesinfoScore(item.aiScores, 'inveracidade') ?? 0) >= gravityFilter;
      const matchesUrgency = !aiMetricsEnabled || (getDesinfoScore(item.aiScores, 'falsidade') ?? 0) >= urgencyFilter;
      const matchesTrend = !aiMetricsEnabled || (getDesinfoScore(item.aiScores, 'distorcaoMidia') ?? 0) >= trendFilter;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
      
      if (activeTab === 'triage') {
        return item.status === 'pending' && matchesSearch && matchesGravity && matchesUrgency && matchesTrend;
      }
      if (activeTab === 'list') {
        return matchesSearch && matchesStatus;
      }
      if (activeTab === 'reviews') {
        return item.status === 'final_review' && matchesSearch;
      }
      return matchesSearch;
    }).sort((a, b) => {
      if (activeTab !== 'list') return 0;
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'priority') {
        const priorityMap = { low: 1, medium: 2, high: 3 };
        comparison = (priorityMap[a.priority || 'low']) - (priorityMap[b.priority || 'low']);
      } else if (sortBy === 'assignedTo') {
        const nameA = users.find(u => u.id === a.assignedTo)?.name || '';
        const nameB = users.find(u => u.id === b.assignedTo)?.name || '';
        comparison = nameA.localeCompare(nameB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [news, searchQuery, gravityFilter, urgencyFilter, trendFilter, activeTab, selectedStatus, sortBy, sortOrder, users, aiMetricsEnabled]);

  const filteredExtractionResults = useMemo(() => {
    return extractionResults.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(extractionSearchQuery.toLowerCase()) || 
                           item.content.toLowerCase().includes(extractionSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [extractionResults, extractionSearchQuery]);

  const filteredReceivedNews = useMemo(() => {
    return receivedNews.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(receivedSearchQuery.toLowerCase()) || 
                           item.content.toLowerCase().includes(receivedSearchQuery.toLowerCase()) ||
                           item.senderName?.toLowerCase().includes(receivedSearchQuery.toLowerCase()) ||
                           item.senderAddress?.toLowerCase().includes(receivedSearchQuery.toLowerCase());
      const matchesSource = sourceFilter === 'all' || item.sourceType === sourceFilter;
      const matchesDate = !dateFilter || item.receivedAt.startsWith(dateFilter);
      const isVisible = item.status === 'received';
      
      return matchesSearch && matchesSource && matchesDate && isVisible;
    }).sort((a, b) => {
      let comparison = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
      return sortReceivedOrder === 'asc' ? comparison : -comparison;
    });
  }, [receivedNews, receivedSearchQuery, sourceFilter, dateFilter, sortReceivedOrder]);

  const kanbanColumns = [
    { id: 'pending', title: 'A Fazer', status: 'pending' as NewsStatus },
    { id: 'in_progress', title: 'Em Andamento', status: 'in_progress' as NewsStatus },
    { id: 'final_review', title: 'Revisão Final', status: 'final_review' as NewsStatus },
    { id: 'completed', title: 'Concluído', status: 'completed' as NewsStatus }
  ];

  const handleToggleSelection = (id: string) => {
    setSelectedNewsIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenAssign = (id?: string) => {
    if (id) {
      setAssigningNewsId(id);
    } else if (selectedNewsIds.length > 0) {
      setAssigningNewsId(null);
    } else {
      return;
    }
    setIsAssignModalOpen(true);
  };

  const assigningNewsItem = assigningNewsId ? news.find((n) => n.id === assigningNewsId) ?? null : null;

  const executeReview = (approved: boolean) => {
    if (!reviewingNewsId) return;
    if (approved) {
      onApprove(reviewingNewsId, reviewComments);
    } else {
      onReject(reviewingNewsId, reviewComments);
    }
    setReviewingNewsId(null);
    setReviewComments('');
  };

  const handleReopenAction = () => {
    if (reopeningNewsId && reopenReason.trim()) {
      onReopen(reopeningNewsId, reopenReason);
      setReopeningNewsId(null);
      setReopenReason('');
    }
  };

  const handleOpenEdit = (item: NewsItem) => {
    setEditForm({
      title:    item.title    ?? '',
      alegacao: item.alegacao ?? item.content ?? '',
      descricao: item.descricao ?? '',
      source:   item.fonte   ?? item.source  ?? '',
      url:      item.link    ?? '',
      priority: (item.priority as any) ?? 'medium',
    });
    setEditingNews(item);
  };

  const handleSaveEdit = () => {
    if (!editingNews || !editForm.title) {
      alert("Título é obrigatório.");
      return;
    }
    onEditNews(editingNews.id, editForm);
    setEditingNews(null);
  };

  const handleSaveRegister = () => {
    if (!newNews.title) {
      alert("Título é obrigatório.");
      return;
    }
    const resolvedAssignee = newNews.assignedTo
      || resolveCheckerFromQuery(registerAssignQuery, checkers)
      || '';
    onAddNews({
      ...newNews,
      assignedTo: resolvedAssignee,
      attachments: pendingAttachments,
    });
    setIsRegisterModalOpen(false);
    setPendingAttachments([]);
    setNewNews({ 
      title: '',
      alegacao: '',
      descricao: '',
      source: '',
      url: '',
      priority: 'medium',
      assignedTo: '',
      briefing: ''
    });
    setRegisterAssignQuery('');
  };

  const formatAttachmentSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addPendingAttachments = (files: FileList | File[]) => {
    const incoming = Array.from(files);
    const valid: File[] = [];
    for (const file of incoming) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        alert(`"${file.name}" excede o limite de 200 MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length === 0) return;
    setPendingAttachments((prev) => {
      const names = new Set(prev.map((f) => `${f.name}-${f.size}`));
      return [...prev, ...valid.filter((f) => !names.has(`${f.name}-${f.size}`))];
    });
  };

  const handleRegisterFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) addPendingAttachments(e.target.files);
    e.target.value = '';
  };

  const handleRegisterDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addPendingAttachments(e.dataTransfer.files);
  };

  const handleExecuteExtraction = () => {
    setIsExtracting(false);
    setIsExtractionModalOpen(false);
    window.alert('A extração de conteúdo de redes sociais ainda não está integrada à API.');
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !setNews) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as NewsStatus;
    const item = news.find(n => n.id === draggableId);
    if (!item || item.status === newStatus) return;

    // completed e to_rectify exigem ação formal (aprovar/rejeitar)
    if (newStatus === 'completed') {
      alert('Para concluir, use a aba "Revisões" e clique em "Aprovar e Publicar".\nIsso garante o registro formal da revisão no banco.');
      return;
    }
    if (newStatus === 'to_rectify') {
      alert('Para rejeitar e retificar, use a aba "Revisões" e clique em "Solicitar Correções".');
      return;
    }

    // Para pending, in_progress e final_review: persiste via API
    setNews(prev => prev.map(n => n.id === draggableId ? { ...n, status: newStatus } : n));
    if (onMoveTask) {
      onMoveTask(draggableId, newStatus).catch(() => {
        // Reverte em caso de erro
        setNews(prev => prev.map(n => n.id === draggableId ? { ...n, status: item.status } : n));
        alert('Não foi possível atualizar o status. Tente novamente.');
      });
    }
  };

  const handlePromoteTrend = (trend: any) => {
    const newsData = {
      title: `[TENDÊNCIA] ${trend.title}`,
      source: trend.platform,
      content: `${trend.description}\n\nMotivo da Tendência: ${trend.reason}\n\nAssunto: ${trend.topic}`,
      priority: trend.misinformationRisk > 70 ? 'high' : trend.misinformationRisk > 40 ? 'medium' : 'low',
    };
    onAddNews(newsData);
    setActiveTab('triage');
    alert("Tendência promovida para triagem com sucesso!");
  };

  const handleDeleteContent = async (newsId: string, onSuccess?: () => void) => {
    if (!onDeleteNews) return;
    await onDeleteNews(newsId);
    setSelectedNewsIds(prev => prev.filter(id => id !== newsId));
    onSuccess?.();
  };

  const canDeleteContent = (item: NewsItem) =>
    Boolean(onDeleteNews) && checkPermission('manage_triage') && item.status !== 'completed';

  return (
    <div className={styles.wrapper} style={{ color: themeConfig.dashboard.text }}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
           <div className={styles.headerIcon}>
             <Activity size={24} />
           </div>
           <div>
             <h1 className={styles.headerTitle}>Curadoria de Conteúdo</h1>
             <p className={styles.headerSubtitle}>Gestão e Distribuição Editorial</p>
           </div>
        </div>
        <div className={styles.headerActions}>
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={onMarkNotifAsRead}
            onClearAll={onClearNotifs}
            themeConfig={themeConfig}
            currentUser={currentUser}
          />
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabsWrapper}>
        <ResponsiveTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab as any}
          themeConfig={themeConfig}
          tabs={curatorTabs}
        />
      </div>

      {/* Received View */}
      {activeTab === 'received' && (
        <div className={styles.tabPanel}>
          {!showExtractionResults ? (
            <>
              <div className={styles.filterRow}>
                <div className={styles.filterField}>
                  <label className={styles.fieldLabel}>Buscar nos Recebidos</label>
                  <div className={styles.inputWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input 
                      type="text"
                      value={receivedSearchQuery}
                      onChange={(e) => setReceivedSearchQuery(e.target.value)}
                      placeholder="Título, conteúdo ou remetente..."
                      className={styles.searchInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>
                <div className={styles.filterActionsWrapper}>
                  {socialSearchEnabled && (
                  <button 
                    onClick={() => setIsExtractionModalOpen(true)}
                    className={styles.extractionButton}
                    style={{ backgroundColor: themeConfig.general.accent, color: themeConfig.buttons.primaryText }}
                  >
                    <Zap size={16} />
                    Busca e Extração
                  </button>
                  )}
                </div>
              </div>

              <div className={styles.listMetaRow}>
                <p className={styles.listCount}>
                  {filteredReceivedNews.length} conteúdos recebidos externos
                </p>
                <div className={styles.sortActionsRow}>
                  <button 
                    onClick={() => setSortReceivedOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className={styles.sortButton}
                    style={{ borderColor: themeConfig.general.border }}
                  >
                    {sortReceivedOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigas'}
                    <ArrowUpDown size={14} />
                  </button>
                </div>
              </div>

              <div className={styles.cardGrid}>
                {filteredReceivedNews.map(item => (
                  <div 
                    key={item.id}
                    className={styles.receivedCard}
                    style={{ 
                      backgroundColor: themeConfig.general.cardBackground, 
                      borderColor: themeConfig.general.border
                    }}
                  >
                    {item.status === 'received' && (
                      <div className={styles.newDot} />
                    )}
                    <div className={styles.cardContent}>
                      <div className={styles.cardTop}>
                        <div className={styles.sourceBadge} style={{ borderColor: themeConfig.general.border }}>
                          {getSourceIcon(item.sourceType)}
                          <span className={styles.sourceBadgeText}>{item.sourceType}</span>
                        </div>
                        <span className={styles.cardDate}>{new Date(item.receivedAt).toLocaleString()}</span>
                      </div>
                      
                      <div className={styles.cardTitleBlock}>
                        <h3 className={styles.cardTitle}>{item.title}</h3>
                        <p className={styles.cardExcerpt}>{item.excerpt}</p>
                      </div>

                      <div className={styles.cardMeta}>
                        <div className={styles.mediaStack}>
                          {item.media?.map((m, i) => (
                            <div key={i} className={styles.mediaThumb}>
                              {m.type === 'image' && <img src={m.url} alt="" className={styles.mediaThumbPreview} />}
                              {m.type === 'video' && <video src={m.url} muted className={styles.mediaThumbPreview} />}
                              {m.type === 'audio' && <Bell size={10} className={styles.iconGreen} />}
                              {m.type === 'document' && <FileText size={10} className={styles.iconSlate} />}
                            </div>
                          ))}
                        </div>
                        <div className={styles.senderBlock}>
                          <span className={styles.senderLabel}>Remetente</span>
                          <span className={styles.senderNameText}>{item.senderName || 'Desconhecido'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.cardActions} style={{ borderColor: themeConfig.general.border }}>
                      <button 
                        onClick={() => {
                          setSelectedReceivedItem(item);
                          setIsReceivedDetailOpen(true);
                        }}
                        className={styles.viewButton}
                        style={{
                          backgroundColor: themeConfig.general.mutedBackground,
                          color: themeConfig.general.mutedText,
                        }}
                      >
                        <Eye size={14} />
                        Visualizar
                      </button>
                      <button 
                        onClick={() => onForwardToTriage(item)}
                        className={styles.triageButton}
                        style={{ backgroundColor: `${themeConfig.general.accent}15`, color: themeConfig.general.accent }}
                      >
                        <ArrowUpRight size={14} />
                        Triagem
                      </button>
                      <button 
                        onClick={() => onDeleteReceivedNews(item.id)}
                        className={styles.deleteButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredReceivedNews.length === 0 && (
                <div className={styles.emptyState}>
                  <Inbox size={48} className={styles.emptyStateIcon} />
                  <p className={styles.emptyTitle}>Nenhum conteúdo recebido</p>
                  <p className={styles.emptySubtext}>Não há conteúdo externo correspondente aos filtros.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className={styles.filterRow}>
                <button 
                  onClick={() => setShowExtractionResults(false)}
                  className={styles.backButton}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <div className={styles.filterField}>
                  <label className={styles.fieldLabel}>Localizar Publicações Encontradas</label>
                  <div className={styles.inputWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input 
                      type="text"
                      value={extractionSearchQuery}
                      onChange={(e) => setExtractionSearchQuery(e.target.value)}
                      placeholder="Filtrar resultados da busca..."
                      className={styles.searchInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.extractionResultsHeader}>
                <div className={styles.extractionResultsBadgeBlock}>
                  <div className={styles.extractionResultsIconBadge}>
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className={styles.extractionResultsTitle}>Resultados da Busca Automática</p>
                    <p className={styles.extractionResultsCount}>{filteredExtractionResults.length} Encontrados</p>
                  </div>
                </div>
              </div>

              <div className={styles.cardGrid}>
                {filteredExtractionResults.map(item => (
                  <div 
                    key={item.id}
                    className={styles.extractionCard}
                    style={{ 
                      borderColor: themeConfig.general.border
                    }}
                  >
                    <div className={styles.cardContent}>
                      <div className={styles.cardTop}>
                        <div className={styles.extractionWhiteBadge} style={{ borderColor: themeConfig.general.border }}>
                          {getSourceIcon(item.sourceType)}
                          <span className={styles.sourceBadgeText}>{item.sourceType}</span>
                        </div>
                        <span className={styles.cardDate}>Extraído às {new Date(item.receivedAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className={styles.cardTitleBlock}>
                        <h3 className={styles.extractionCardTitle}>{item.title}</h3>
                        <p className={styles.extractionCardExcerpt}>{item.content}</p>
                      </div>
                    </div>

                    <div className={styles.cardActions} style={{ borderColor: themeConfig.general.border }}>
                      <button 
                        onClick={() => {
                          setSelectedReceivedItem(item);
                          setIsReceivedDetailOpen(true);
                        }}
                        className={styles.extractionViewButton}
                        style={{
                          backgroundColor: themeConfig.general.mutedBackground,
                          color: themeConfig.general.mutedText,
                          borderColor: themeConfig.general.border,
                        }}
                      >
                        <Eye size={14} />
                        Detalhes
                      </button>
                      <button 
                        onClick={() => onForwardToTriage(item)}
                        className={styles.extractionTriageButton}
                        style={{ backgroundColor: themeConfig.general.accent, color: themeConfig.buttons.primaryText }}
                      >
                        <ArrowUpRight size={14} />
                        Triagem
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredExtractionResults.length === 0 && (
                <div className={styles.emptyState}>
                  <SearchIcon size={48} className={styles.emptyStateIcon} />
                  <p className={styles.emptyTitle}>Nenhum resultado corresponde ao filtro</p>
                  <p className={styles.emptySubtext}>Tente outro termo de busca.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trend Analyzer View */}
      {activeTab === 'trends' && socialSearchEnabled && (
        <TrendAnalyzer 
          themeConfig={themeConfig} 
          onPromoteToFactCheck={handlePromoteTrend} 
        />
      )}

      {/* Triage View */}
      {activeTab === 'triage' && (
        <div className={styles.tabPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Buscar Notícias</label>
              <div className={styles.inputWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Título, conteúdo ou fonte..."
                  className={styles.searchInput}
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText,
                    '--tw-ring-color': themeConfig.general.accent
                  } as any}
                />
              </div>
            </div>
            {aiMetricsEnabled && (
            <>
            <div className={styles.filterFieldSmall}>
              <label 
                className={styles.rangeLabel}
                style={{ color: gravityFilter > 10 ? themeConfig.status.error : 'inherit', opacity: gravityFilter > 10 ? 1 : 0.5 }}
              >
                Gravidade ({gravityFilter}%)
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={gravityFilter}
                onChange={(e) => setGravityFilter(parseInt(e.target.value))}
                className={styles.rangeInput}
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.error} 0%, ${themeConfig.status.error} ${gravityFilter}%, #e2e8f0 ${gravityFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            <div className={styles.filterFieldSmall}>
              <label 
                className={styles.rangeLabel}
                style={{ color: urgencyFilter > 10 ? themeConfig.status.warning : 'inherit', opacity: urgencyFilter > 10 ? 1 : 0.5 }}
              >
                Urgência ({urgencyFilter}%)
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(parseInt(e.target.value))}
                className={styles.rangeInput}
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.warning} 0%, ${themeConfig.status.warning} ${urgencyFilter}%, #e2e8f0 ${urgencyFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            <div className={styles.filterFieldSmall}>
              <label 
                className={styles.rangeLabel}
                style={{ color: trendFilter > 10 ? themeConfig.status.info : 'inherit', opacity: trendFilter > 10 ? 1 : 0.5 }}
              >
                Tendência ({trendFilter}%)
              </label>
              <input 
                type="range"
                min="0"
                max="100"
                value={trendFilter}
                onChange={(e) => setTrendFilter(parseInt(e.target.value))}
                className={styles.rangeInput}
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.info} 0%, ${themeConfig.status.info} ${trendFilter}%, #e2e8f0 ${trendFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            </>
            )}
          </div>

          <div className={styles.triageToolbar}>
            <div className={styles.triageToolbarLeft}>
              <p className={styles.listCount}>{filteredNews.length} notícias pendentes de triagem</p>
              {checkPermission('create_news') && (
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className={styles.registerNewsButton}
                  style={{ backgroundColor: themeConfig.general.accent, color: themeConfig.buttons.primaryText }}
                >
                  <Plus size={18} />
                  Registrar Notícia
                </button>
              )}
            </div>
            {selectedNewsIds.length > 0 && (
              <div className={styles.bulkActionsRow}>
                <span className={styles.bold} style={{ color: themeConfig.general.accent }}>{selectedNewsIds.length} selecionadas</span>
                <button 
                  onClick={() => handleOpenAssign()}
                  className={styles.bulkAssignButton}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  <UserPlus size={18} />
                  Atribuir em Massa
                </button>
              </div>
            )}
          </div>

          <div className={styles.triageList}>
            {filteredNews.map(item => (
              <div 
                key={item.id}
                className={cn(
                  styles.triageCard,
                  selectedNewsIds.includes(item.id) ? styles.triageCardSelected : ''
                )}
                style={{ 
                  backgroundColor: themeConfig.general.cardBackground, 
                  borderColor: selectedNewsIds.includes(item.id) ? themeConfig.general.accent : themeConfig.general.border,
                  '--tw-ring-color': themeConfig.general.accent
                } as any}
                onClick={() => {
                  setSelectedTriageItemId(item.id);
                  setIsTriagePreviewOpen(true);
                }}
              >
                <div className={styles.triageCardLeft}>
                  <input 
                    type="checkbox"
                    checked={selectedNewsIds.includes(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelection(item.id);
                    }}
                    className={styles.triageCheckbox}
                  />
                  <div className={styles.triageCardInfo}>
                    <div className={styles.triageCardMetaRow}>
                      <StatusBadge status={item.status} themeConfig={themeConfig} />
                      <div className={styles.triageSourceBadge} style={{ borderColor: themeConfig.general.border }}>
                        {getSourceIcon(item.source)}
                        <span className={styles.triageSourceText}>{item.source}</span>
                      </div>
                      <span className={styles.triageDate}>{item.date}</span>
                    </div>
                    <h3 className={styles.triageTitle}>{item.title}</h3>
                    <p className={styles.triageContent}>{item.content}</p>
                    {(() => {
                      const ids = item.assignedToIds?.length
                        ? item.assignedToIds
                        : item.assignedTo
                          ? [item.assignedTo]
                          : [];
                      const names = ids
                        .map((id) => users.find((u) => u.id === id)?.name)
                        .filter(Boolean);
                      if (names.length === 0) return null;
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAssign(item.id);
                          }}
                          className={assignStyles.clickableAssignee}
                          style={{ marginTop: '0.35rem' }}
                        >
                          <span className={assignStyles.assigneeNameText} style={{ opacity: 0.75 }}>
                            Atribuídos: {names.join(', ')}
                          </span>
                        </button>
                      );
                    })()}
                    <div className={styles.triageCardFooter}>
                      {(item.senderName || item.senderAddress) && (
                        <div className={styles.triageSenderBlock}>
                          <User size={12} className={styles.iconMuted} />
                          <span className={styles.triageSenderText}>
                            {item.senderName || 'Remetente'} {item.senderAddress ? `(${item.senderAddress})` : ''}
                          </span>
                        </div>
                      )}
                      <div className={styles.triageIdBlock}>
                        <Box size={10} className={styles.iconVeryMuted} />
                        <span className={styles.triageId}>{item.id}</span>
                      </div>
                      {item.receivedAt && (
                        <div className={styles.triageTimeBlock}>
                          <Clock size={10} />
                          <span className={styles.triageTimeText}>{new Date(item.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.triageCardRight}>
                  {aiMetricsEnabled && (
                  <div className={styles.aiScoresPanel} style={{ borderColor: themeConfig.general.border }}>
                    <div className={styles.aiScoresInner}>
                      <div className={styles.aiScoreItem}>
                        <div className={styles.aiScoreHeader}>
                          <span>Pot. desinformação</span>
                          <span>{formatAiScore(getDesinfoScore(item.aiScores, 'inveracidade'))}</span>
                        </div>
                        <div className={styles.aiScoreBarBg}>
                          {getDesinfoScore(item.aiScores, 'inveracidade') != null ? (
                            <div 
                              className={styles.aiScoreBarFill}
                              style={{ 
                                width: `${getDesinfoScore(item.aiScores, 'inveracidade')}%`, 
                                backgroundColor: (getDesinfoScore(item.aiScores, 'inveracidade') || 0) > 70 ? themeConfig.status.error : themeConfig.status.warning 
                              }} 
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.aiScoreItem}>
                        <div className={styles.aiScoreHeader}>
                          <span>Falsidade</span>
                          <span>{formatAiScore(getDesinfoScore(item.aiScores, 'falsidade'))}</span>
                        </div>
                        <div className={styles.aiScoreBarBg}>
                          {getDesinfoScore(item.aiScores, 'falsidade') != null ? (
                            <div 
                              className={styles.aiScoreBarFill}
                              style={{ 
                                width: `${getDesinfoScore(item.aiScores, 'falsidade')}%`, 
                                backgroundColor: themeConfig.status.warning 
                              }} 
                            />
                          ) : null}
                        </div>
                      </div>
                      <div className={styles.aiScoreItem}>
                        <div className={styles.aiScoreHeader}>
                          <span>Distorção mídia</span>
                          <span>{formatAiScore(getDesinfoScore(item.aiScores, 'distorcaoMidia'))}</span>
                        </div>
                        <div className={styles.aiScoreBarBg}>
                          {getDesinfoScore(item.aiScores, 'distorcaoMidia') != null ? (
                            <div 
                              className={styles.aiScoreBarFill}
                              style={{ 
                                width: `${getDesinfoScore(item.aiScores, 'distorcaoMidia')}%`, 
                                backgroundColor: themeConfig.status.info 
                              }} 
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssign(item.id);
                    }}
                    className={styles.triageAssignButton}
                    style={{ borderColor: themeConfig.general.border } as any}
                  >
                    <UserPlus size={14} />
                    Atribuir Checador
                  </button>
                  {specializedNetworkEnabled && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToSpecializedNetwork(item.id);
                    }}
                    disabled={item.sentToSpecializedNetwork}
                    className={styles.triageAssignButton}
                    style={{ 
                      borderColor: themeConfig.general.border, 
                      backgroundColor: item.sentToSpecializedNetwork ? '#f1f5f9' : 'transparent',
                      color: item.sentToSpecializedNetwork ? '#94a3b8' : 'inherit'
                    }}
                  >
                    <Globe size={14} />
                    {item.sentToSpecializedNetwork ? 'Encaminhado pra Rede' : 'Rede Especializada'}
                  </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Specialized Network View */}
      {activeTab === 'specialized_network' && (
        <SpecializedNetworkView 
          checks={specializedNetworkChecks} 
          news={news} 
          themeConfig={themeConfig} 
        />
      )}

      {/* Listagem de Publicações View */}
      {activeTab === 'list' && (
        <div className={styles.listView}>
          <div className={styles.filterRow}>
            <div className={styles.filterField}>
              <label className={styles.fieldLabel}>Buscar Publicações</label>
              <div className={styles.inputWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Título, fonte ou conteúdo..."
                  className={styles.searchInput}
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText,
                    '--tw-ring-color': themeConfig.general.accent
                  } as any}
                />
              </div>
            </div>
            <div className={styles.statusSelectWrapper}>
              <label className={styles.fieldLabel}>Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className={styles.statusSelect}
                style={{ 
                  backgroundColor: themeConfig.general.inputBackground, 
                  borderColor: themeConfig.general.inputBorder,
                  color: themeConfig.general.inputText,
                  '--tw-ring-color': themeConfig.general.accent
                } as any}
              >
                <option value="all">Todos os Status</option>
                <option value="pending">Fila da Agência</option>
                <option value="in_progress">Em Análise</option>
                <option value="final_review">Revisão Final</option>
                <option value="to_rectify">Em Retificação</option>
                <option value="completed">Concluída</option>
              </select>
            </div>
          </div>

          <div className={styles.tableWrapper} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeaderRow} style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className={styles.tableHeaderCell} style={{ color: themeConfig.general.tableHeaderText }}>Publicação</th>
                  <th className={styles.tableHeaderCell} style={{ color: themeConfig.general.tableHeaderText }}>
                    <button onClick={() => {
                      setSortBy('priority');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }} className={styles.tableSortButton}>
                      Prioridade <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className={styles.tableHeaderCell} style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className={styles.tableHeaderCell} style={{ color: themeConfig.general.tableHeaderText }}>
                    <button onClick={() => {
                      setSortBy('assignedTo');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }} className={styles.tableSortButton}>
                      Responsável <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className={styles.tableHeaderCell} style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody} style={{ borderColor: themeConfig.general.border }}>
                {filteredNews.map((item) => {
                  const assigneeIds = item.assignedToIds?.length
                    ? item.assignedToIds
                    : item.assignedTo
                      ? [item.assignedTo]
                      : [];
                  const assignedUsers = assigneeIds
                    .map((id) => users.find((u) => u.id === id))
                    .filter((u): u is UserProfile => Boolean(u));
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={styles.tableRow}
                      onClick={() => setSelectedNewsId(item.id)}
                    >
                      <td className={styles.tableCell}>
                        <div className={styles.tableTitleMax}>
                          <h3 className={styles.tableTitle}>{item.title}</h3>
                          <p className={styles.tableSubtext}>{item.source} • {item.date}</p>
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span className={cn(
                          styles.priorityBadge,
                          item.priority === 'high' ? styles.priorityHigh :
                          item.priority === 'medium' ? styles.priorityMedium :
                          styles.priorityLow
                        )}>
                          {item.priority || 'low'}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <StatusBadge status={item.status} themeConfig={themeConfig} />
                      </td>
                      <td className={styles.tableCell}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (checkPermission('assign_tasks')) {
                              handleOpenAssign(item.id);
                            }
                          }}
                          className={assignStyles.clickableAssignee}
                          title={checkPermission('assign_tasks') ? 'Gerenciar atribuições' : undefined}
                        >
                          {assignedUsers.length > 0 ? (
                            <div className={styles.assignedRow}>
                              <UserAvatar src={assignedUsers[0].avatarUrl} name={assignedUsers[0].name} className={styles.assignedAvatar} />
                              <span className={cn(styles.slaTime, assignStyles.assigneeNameText)}>
                                {assignedUsers.map((u) => u.name).join(', ')}
                              </span>
                            </div>
                          ) : (
                            <span className={styles.unassignedText}>
                              {checkPermission('assign_tasks') ? 'Atribuir checador...' : 'Não atribuído'}
                            </span>
                          )}
                        </button>
                      </td>
                      <td className={styles.tableRightCell}>
                        <div className={styles.tableActionsRow}>
                          {checkPermission('assign_tasks') && (
                            <button 
                              onClick={() => handleOpenAssign(item.id)}
                              className={styles.tableActionButton}
                              style={{ color: themeConfig.general.mutedText }}
                              title="Atribuir / Redistribuir"
                            >
                              <UserPlus size={18} />
                            </button>
                          )}
                          {item.status === 'completed' && checkPermission('review_and_approve') && (
                            <button 
                              onClick={() => setReopeningNewsId(item.id)}
                              className={styles.tableActionButton}
                              style={{ color: themeConfig.general.mutedText }}
                              title="Reabrir para Revisão"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                          {checkPermission('manage_triage') && item.status === 'pending' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(item);
                              }}
                              className={styles.tableActionButton}
                              style={{ color: themeConfig.general.mutedText }}
                              title="Editar Conteúdo"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {canDeleteContent(item) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContent(item.id);
                              }}
                              className={styles.tableActionButton}
                              style={{ color: themeConfig.status.error }}
                              title="Excluir Conteúdo"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedNewsId(item.id);
                              navigate(`/analysis/${item.id}`);
                            }}
                            className={styles.tableActionButton}
                            style={{ color: themeConfig.general.mutedText }}
                            title="Visualizar Conteúdo"
                          >
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredNews.length === 0 && (
              <div className={styles.emptyState}>
                <Search size={48} className={styles.emptyStateIcon} />
                <p className={styles.emptyTitle}>Nenhuma publicação encontrada</p>
                <p className={styles.emptySubtext}>Tente ajustar seus filtros de busca.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className={styles.kanbanGrid}>
            {kanbanColumns.map(col => (
              <div key={col.id} className={styles.kanbanColumn}>
                <div className={styles.kanbanColumnHeader}>
                  <h3 className={styles.kanbanColumnTitle}>
                    {col.title}
                    <span className={styles.kanbanColumnCount}>
                      {news.filter(n => n.status === col.status).length}
                    </span>
                  </h3>
                </div>
                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        styles.kanbanDropzone,
                        snapshot.isDraggingOver ? styles.kanbanDropzoneActive : ''
                      )}
                      style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}
                    >
                      {news.filter(n => n.status === col.status).map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => {
                                setSelectedNewsId(item.id);
                                navigate(`/analysis/${item.id}`);
                              }}
                              className={cn(
                                styles.kanbanCard,
                                snapshot.isDragging ? styles.kanbanCardDragging : ''
                              )}
                              style={{ 
                                backgroundColor: themeConfig.general.cardBackground, 
                                borderColor: themeConfig.general.border,
                                ...provided.draggableProps.style
                              }}
                            >
                              <div className={styles.kanbanCardHeader}>
                                <span className={styles.kanbanCardSource}>{item.source}</span>
                                <TrendingUp size={14} className={styles.iconVeryMuted} />
                              </div>
                              <h4 className={styles.kanbanCardTitle}>{item.title}</h4>
                              
                              {(item.assignedToIds?.length ? item.assignedToIds : item.assignedTo ? [item.assignedTo] : []).length > 0 && (
                                <div className={styles.kanbanCardAssignee} style={{ borderColor: themeConfig.general.border }}>
                                  <UserAvatar
                                    src={users.find(u => u.id === (item.assignedToIds?.[0] ?? item.assignedTo))?.avatarUrl}
                                    name={users.find(u => u.id === (item.assignedToIds?.[0] ?? item.assignedTo))?.name}
                                    className={styles.kanbanCardAvatar}
                                  />
                                  <span className={styles.kanbanCardAssigneeName}>
                                    {(item.assignedToIds?.length ? item.assignedToIds : [item.assignedTo!])
                                      .map((id) => users.find(u => u.id === id)?.name)
                                      .filter(Boolean)
                                      .join(', ')}
                                  </span>
                                </div>
                              )}

                              <div className={styles.kanbanCardFooter}>
                                <div className={styles.kanbanScores}>
                                  <div className={styles.kanbanScoreRed} style={{ opacity: Math.max(0.2, (item.aiScores?.gravity || 0) / 100) }}></div>
                                  <div className={styles.kanbanScoreOrange} style={{ opacity: Math.max(0.2, (item.aiScores?.urgency || 0) / 100) }}></div>
                                  <div className={styles.kanbanScoreBlue} style={{ opacity: Math.max(0.2, (item.aiScores?.trend || 0) / 100) }}></div>
                                </div>
                                <span className={styles.kanbanDate}>{item.date}</span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Workload View */}
      {activeTab === 'workload' && (
        <div className={styles.workloadGrid}>
          {checkers.map(checker => {
            const checkerTasks = news.filter(n => isNewsAssignedTo(n, checker.id));
            const pending = checkerTasks.filter(n => n.status === 'pending').length;
            const inProgress = checkerTasks.filter(n => n.status === 'in_progress').length;
            const review = checkerTasks.filter(n => n.status === 'final_review').length;
            const completed = checkerTasks.filter(n => n.status === 'completed').length;
            
            return (
              <div 
                key={checker.id}
                className={styles.checkerCard}
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className={styles.checkerHeader}>
                  <UserAvatar src={checker.avatarUrl} name={checker.name} className={styles.checkerAvatar} />
                  <div>
                    <h3 className={styles.checkerName}>{checker.name}</h3>
                    <p className={styles.checkerEmail}>{checker.email}</p>
                    <div className={styles.checkerOnlineRow}>
                      <span className={styles.checkerOnlineDot}></span>
                      <span className={styles.checkerOnlineText}>Disponível</span>
                    </div>
                  </div>
                </div>

                <div className={styles.checkerStatsGrid}>
                  <div className={styles.checkerStatBox} style={{ borderColor: themeConfig.general.border }}>
                    <p className={styles.checkerStatLabel}>Total Ativas</p>
                    <p className={styles.checkerStatValue}>{inProgress + pending + review}</p>
                  </div>
                  <div className={styles.checkerStatBox} style={{ borderColor: themeConfig.general.border }}>
                    <p className={styles.checkerStatLabel}>Concluídas</p>
                    <p className={styles.checkerStatValue}>{completed}</p>
                  </div>
                </div>

                <div className={styles.checkerDistribBlock}>
                  <h4 className={styles.checkerDistribTitle}>Distribuição de Status</h4>
                  <div className={styles.checkerDistribItems}>
                    <div className={styles.checkerDistribRow}>
                      <span className={styles.checkerDistribItem}><Clock size={12} className={styles.iconBlue500} /> Em Andamento</span>
                      <span className={styles.bold}>{inProgress}</span>
                    </div>
                    <div className={styles.checkerDistribBarBg}>
                      <div className={styles.checkerBarBlue} style={{ width: `${(inProgress / (checkerTasks.length || 1)) * 100}%` }} />
                    </div>
                    
                    <div className={styles.checkerDistribRow}>
                      <span className={styles.checkerDistribItem}><AlertTriangle size={12} className={styles.iconAmber} /> Revisão Final</span>
                      <span className={styles.bold}>{review}</span>
                    </div>
                    <div className={styles.checkerDistribBarBg}>
                      <div className={styles.checkerBarAmber} style={{ width: `${(review / (checkerTasks.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setDetailedCheckerId(checker.id)}
                  className={styles.checkerViewButton}
                  style={{
                    borderColor: themeConfig.general.border,
                    backgroundColor: themeConfig.general.mutedBackground,
                    color: themeConfig.general.mutedText,
                  }}
                >
                  Ver Tarefas Detalhadas
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews View */}
      {activeTab === 'reviews' && (
        <div className={styles.reviewsPanel}>
          <div className={styles.reviewsList}>
            {filteredNews.map(item => (
              <div 
                key={item.id}
                className={styles.reviewCard}
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className={styles.reviewCardLeft}>
                  <div className={styles.reviewCardTop}>
                    <div className={styles.reviewMetaLeft}>
                      <StatusBadge status={item.status} themeConfig={themeConfig} />
                      <span className={styles.reviewCheckerName}>Checador: {users.find(u => u.id === item.assignedTo)?.name}</span>
                    </div>
                    <span className={styles.reviewDate}>{item.date}</span>
                  </div>
                  <div>
                    <h3 className={styles.reviewTitle}>{item.title}</h3>
                    <div className={styles.reviewReportBox} style={{ borderColor: themeConfig.general.border }}>
                      <p className={styles.reviewReportTitle}>
                        <CheckCircle size={16} className={styles.iconGreen} /> Parecer do Checador:
                      </p>
                      <p className={styles.reviewReportText}>"{item.report || 'Nenhum parecer enviado.'}"</p>
                    </div>
                  </div>
                </div>
                <div className={styles.reviewCardRight}>
                  <button 
                    onClick={() => setReviewingNewsId(item.id)}
                    className={styles.reviewNowButton}
                    style={{ backgroundColor: themeConfig.general.accent, color: themeConfig.buttons.primaryText }}
                  >
                    <Search size={18} />
                    Revisar Agora
                  </button>
                </div>
              </div>
            ))}
            {filteredNews.length === 0 && (
              <div className={styles.emptyState}>
                <CheckCircle size={48} className={styles.emptyStateIcon} />
                <p className={styles.emptyTitle}>Nenhuma revisão pendente</p>
                <p className={styles.emptySubtext}>Tudo em dia por aqui!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extraction Modal */}
      <AnimatePresence>
        {isExtractionModalOpen && socialSearchEnabled && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtractionModalOpen(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeaderFlexBig} style={{ borderColor: themeConfig.general.border }}>
                <div className={styles.extractionModalHeaderLeft}>
                  <div className={styles.extractionModalIcon}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className={styles.extractionModalTitle}>Busca e Extração de Conteúdos</h2>
                    <p className={styles.extractionModalSubtitle}>Monitoramento Multi-Plataforma em Tempo Real</p>
                  </div>
                </div>
                <button onClick={() => setIsExtractionModalOpen(false)} className={styles.modalCloseButton}><X size={24} /></button>
              </div>

              <div className={styles.modalBodyBig}>
                {/* Unified Search Field */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Termo de Busca / Palavras-chave</label>
                  <div className={styles.inputWrapper}>
                    <Search className={styles.searchIconLeft4} size={18} />
                    <input 
                      type="text"
                      placeholder="Ex: vacinas, eleições 2024, fraude pix..."
                      value={extractionParams.query}
                      onChange={(e) => setExtractionParams({...extractionParams, query: e.target.value})}
                      className={styles.extractionInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>

                <div className={styles.extractionGrid}>
                  {/* User Limit */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.extractionLimitLabel}>
                      <Users size={14} /> Limite de Registros
                    </label>
                    <input 
                      type="number"
                      min="10"
                      max="1000"
                      value={extractionParams.userLimit}
                      onChange={(e) => setExtractionParams({...extractionParams, userLimit: parseInt(e.target.value)})}
                      className={styles.extractionNumberInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                    <p className={styles.extractionLimitNote}>Máximo sugerido: 1000 registros por extração.</p>
                  </div>

                  {/* Platform Selection */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Onde Buscar</label>
                    <div className={styles.platformsGrid}>
                      {extractionPlatforms.map(platform => (
                        <button
                          key={platform.id}
                          onClick={() => setExtractionParams({
                            ...extractionParams,
                            platforms: {
                              ...extractionParams.platforms,
                              [platform.id as any]: !extractionParams.platforms[platform.id as keyof typeof extractionParams.platforms]
                            }
                          })}
                          className={cn(
                            styles.platformButton,
                            extractionParams.platforms[platform.id as keyof typeof extractionParams.platforms] 
                              ? `${platform.color} border-current` 
                              : styles.platformButtonInactive
                          )}
                        >
                          <platform.icon size={14} />
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.extractionGrid}>
                  {/* Date Range */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Data Inicial</label>
                    <input 
                      type="date"
                      value={extractionParams.startDate}
                      onChange={(e) => setExtractionParams({...extractionParams, startDate: e.target.value})}
                      className={styles.extractionNumberInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Data Final</label>
                    <input 
                      type="date"
                      value={extractionParams.endDate}
                      onChange={(e) => setExtractionParams({...extractionParams, endDate: e.target.value})}
                      className={styles.extractionNumberInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>

                {/* Comments */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Observações de Contexto (Opcional)</label>
                  <textarea 
                    placeholder="Instruções adicionais para a IA de extração..."
                    value={extractionParams.comments}
                    onChange={(e) => setExtractionParams({...extractionParams, comments: e.target.value})}
                    rows={3}
                    className={styles.briefingTextarea}
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                  />
                </div>
              </div>

              <div className={styles.extractionModalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                <div className={styles.extractionModalButtons}>
                  <button 
                    onClick={() => setIsExtractionModalOpen(false)}
                    className={styles.extractionModalCancelButton}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleExecuteExtraction}
                    disabled={isExtracting || !extractionParams.query.trim() || !Object.values(extractionParams.platforms).some(v => v)}
                    className={styles.extractionSubmitButton}
                    style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                  >
                    {isExtracting ? (
                      <>
                        <div className={styles.extractionModalSpinner} />
                        Processando...
                      </>
                    ) : (
                      'Inicia busca'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Tasks Modal */}
      <AnimatePresence>
        {detailedCheckerId && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedCheckerId(null)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeaderFlex} style={{ borderColor: themeConfig.general.border }}>
                <div className={styles.detailModalHeaderLeft}>
                  <UserAvatar
                    src={users.find(u => u.id === detailedCheckerId)?.avatarUrl}
                    name={users.find(u => u.id === detailedCheckerId)?.name}
                    className={styles.detailCheckerAvatar}
                  />
                  <div>
                    <h2 className={styles.detailModalTitle}>Tarefas de {users.find(u => u.id === detailedCheckerId)?.name}</h2>
                    <p className={styles.detailModalSubtitle}>Lista detalhada de atribuições correntes.</p>
                  </div>
                </div>
                <button onClick={() => setDetailedCheckerId(null)} className={styles.modalCloseButton}><X size={24} /></button>
              </div>
              <div className={styles.detailContent}>
                {news.filter(n => isNewsAssignedTo(n, detailedCheckerId)).length > 0 ? (
                  news.filter(n => isNewsAssignedTo(n, detailedCheckerId)).map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setSelectedNewsId(item.id);
                        navigate(`/analysis/${item.id}`);
                      }}
                      className={styles.detailTaskCard}
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <div className={styles.detailTaskInner}>
                        <div className={styles.detailTaskInfo}>
                          <div className={styles.detailTaskMeta}>
                            <StatusBadge status={item.status} themeConfig={themeConfig} />
                            <span className={styles.detailTaskSource}>{item.source}</span>
                          </div>
                          <h4 className={styles.detailTaskTitle}>{item.title}</h4>
                        </div>
                        <div className={styles.detailTaskRight}>
                          <p className={styles.detailTaskDate}>{item.date}</p>
                          <div className={styles.detailTaskScores}>
                            <div className={styles.detailScoreRed} style={{ opacity: (item.aiScores?.gravity || 0) / 100 }}></div>
                            <div className={styles.detailScoreOrange} style={{ opacity: (item.aiScores?.urgency || 0) / 100 }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.detailEmptyState}>
                     <p className={styles.bold}>Nenhuma tarefa atribuída</p>
                  </div>
                )}
              </div>
              <div className={styles.detailModalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setDetailedCheckerId(null)}
                  className={styles.detailCloseButton}
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <NewsAssignmentModal
            open={isAssignModalOpen}
            onClose={() => {
              setIsAssignModalOpen(false);
              setAssigningNewsId(null);
              setSelectedNewsIds([]);
            }}
            newsItem={assigningNewsItem}
            bulkNewsIds={assigningNewsId ? [] : selectedNewsIds}
            users={users}
            checkers={checkers}
            themeConfig={themeConfig}
            onAssign={onAssign}
            onUnassign={onUnassign}
            canManage={checkPermission('assign_tasks')}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingNewsId && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingNewsId(null)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeaderFlex} style={{ borderColor: themeConfig.general.border }}>
                <div>
                  <h2 className={styles.modalTitle}>Revisão Final</h2>
                  <p className={styles.modalSubtitle}>Avalie a qualidade e precisão da checagem realizada.</p>
                </div>
                <button onClick={() => setReviewingNewsId(null)} className={styles.modalCloseButton}><X size={24} /></button>
              </div>
              <div className={styles.modalBodyScrollable}>
                <div className={styles.formSection}>
                  <div className={styles.reviewOriginalBox} style={{ borderColor: themeConfig.general.border }}>
                    <h4 className={styles.reviewBoxLabel}>Notícia Original</h4>
                    <p className={styles.reviewNewsTitle}>{news.find(n => n.id === reviewingNewsId)?.title}</p>
                    <p className={styles.reviewNewsExcerpt}>{news.find(n => n.id === reviewingNewsId)?.content}</p>
                  </div>

                  <div className={styles.reviewReportPanel} style={{ borderColor: themeConfig.general.border }}>
                    <h4 className={styles.reviewBoxLabel}>Parecer do Checador</h4>
                    <div className={styles.reviewProse}>
                      {news.find(n => n.id === reviewingNewsId)?.report}
                    </div>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Comentários de Revisão (Obrigatório se rejeitar)</label>
                    <textarea 
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Adicione observações para o checador ou justificativa da aprovação..."
                      rows={3}
                      className={styles.reviewCommentTextarea}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.reviewActions} style={{ borderColor: themeConfig.general.border }}>
                <button 
                  onClick={() => executeReview(false)}
                  disabled={!reviewComments.trim()}
                  className={styles.reviewRejectButton}
                  style={{ color: themeConfig.status.error, borderColor: themeConfig.status.error }}
                >
                  <X size={18} />
                  Rejeitar e Devolver
                </button>
                <button 
                  onClick={() => executeReview(true)}
                  className={styles.reviewApproveButton}
                  style={{ backgroundColor: themeConfig.status.success, color: themeConfig.buttons.primaryText }}
                >
                  <Check size={18} />
                  Aprovar e Publicar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reopen Modal */}
      <AnimatePresence>
        {reopeningNewsId && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReopeningNewsId(null)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modalLg}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h2 className={styles.modalTitle}>Reabrir para Revisão</h2>
                <p className={styles.modalSubtitle}>Justifique a necessidade de reabertura desta checagem.</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Justificativa</label>
                  <textarea 
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Especifique o que precisa ser corrigido ou revisado..."
                    rows={4}
                    className={styles.reopenTextarea}
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                  />
                </div>
              </div>
              <div className={styles.modalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setReopeningNewsId(null)}
                  className={styles.modalCancelButton}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReopenAction}
                  disabled={!reopenReason.trim()}
                  className={styles.reopenSubmitButton}
                  style={{ backgroundColor: themeConfig.status.warning, color: themeConfig.buttons.primaryText }}
                >
                  Confirmar Reabertura
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isRegisterModalOpen && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterModalOpen(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h2 className={styles.modalTitle}>Cadastrar Nova Notícia</h2>
                <p className={styles.modalSubtitle}>Insira as informações da notícia para triagem ou atribuição rápida.</p>
              </div>
              <div className={styles.registerModalBody}>
                <div className={styles.registerGrid}>
                  <div className={styles.registerFieldFull}>
                    <label className={styles.fieldLabel}>Título da Notícia *</label>
                    <input 
                      type="text"
                      value={newNews.title}
                      onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                      placeholder="Ex: Nova variante de vírus detectada..."
                      className={styles.registerInput}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className={styles.registerFieldFull}>
                    <label className={styles.fieldLabel}>Alegação Principal</label>
                    <textarea 
                      value={newNews.alegacao}
                      onChange={(e) => setNewNews({ ...newNews, alegacao: e.target.value })}
                      placeholder="Qual é a afirmação ou alegação que precisa ser verificada?"
                      rows={2}
                      className={styles.registerTextareaSmall}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className={styles.registerFieldFull}>
                    <label className={styles.fieldLabel}>Descrição / Contexto</label>
                    <textarea 
                      value={newNews.descricao}
                      onChange={(e) => setNewNews({ ...newNews, descricao: e.target.value })}
                      placeholder="Informações adicionais, contexto ou observações sobre o conteúdo..."
                      rows={2}
                      className={styles.registerTextareaSmall}
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className={styles.registerInnerGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Fonte / Veículo</label>
                      <input
                        type="text"
                        value={newNews.source}
                        onChange={(e) => setNewNews({ ...newNews, source: e.target.value })}
                        placeholder="Ex: Portal de Notícias X"
                        className={styles.registerInput}
                        style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>URL da Matéria</label>
                      <div className={styles.urlInputWrapper}>
                        <div className={styles.urlInputIcon}>
                          <LinkIcon size={14} />
                        </div>
                        <input 
                          type="url"
                          value={newNews.url}
                          onChange={(e) => setNewNews({ ...newNews, url: e.target.value })}
                          placeholder="https://..."
                          className={styles.urlInput}
                          style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Prioridade</label>
                    <select
                      value={newNews.priority}
                      onChange={(e) => setNewNews({ ...newNews, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className={styles.statusSelect}
                      style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                  <div className={styles.registerFieldFull}>
                    <label className={styles.fieldLabel}>Anexos / Mídias</label>
                    <div 
                      className={styles.dropzone}
                      style={{
                        borderColor: themeConfig.general.border,
                        backgroundColor: themeConfig.general.mutedBackground,
                        color: themeConfig.general.mutedText,
                      }}
                      onClick={() => registerFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleRegisterDrop}
                    >
                      <Upload size={24} className={styles.dropzoneIcon} />
                      <p className={styles.dropzoneTitle}>Arraste arquivos ou clique para selecionar</p>
                      <p className={styles.dropzoneSubtext}>
                        Documentos, imagens, vídeos ou áudio (máx. 200 MB cada)
                      </p>
                      <input
                        ref={registerFileInputRef}
                        type="file"
                        multiple
                        className={styles.hiddenInput}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                        onChange={handleRegisterFilesSelect}
                      />
                    </div>
                    {pendingAttachments.length > 0 && (
                      <ul className={styles.attachmentsList}>
                        {pendingAttachments.map((file, index) => (
                          <li
                            key={`${file.name}-${file.size}-${index}`}
                            className={styles.attachmentItem}
                            style={{
                              borderColor: themeConfig.general.border,
                              backgroundColor: themeConfig.general.cardBackground,
                              color: themeConfig.dashboard.text,
                            }}
                          >
                            <div className={styles.attachmentItemLeft}>
                              <FileText size={16} className={styles.attachmentIcon} />
                              <span className={styles.attachmentName}>{file.name}</span>
                              <span className={styles.attachmentSize}>
                                {formatAttachmentSize(file.size)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingAttachments((prev) => prev.filter((_, i) => i !== index))
                              }
                              className={styles.attachmentRemove}
                              style={{ color: themeConfig.general.mutedText }}
                              title="Remover arquivo"
                            >
                              <X size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={styles.quickAssignSection} style={{ borderColor: themeConfig.general.border }}>
                  <div className={styles.quickAssignHeader}>
                    <UserPlus size={18} className={styles.quickAssignIcon} />
                    <h3 className={styles.quickAssignTitle}>Atribuição Rápida (Opcional)</h3>
                  </div>
                  <div className={styles.quickAssignGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Checador</label>
                      <CheckerNameAutocomplete
                        checkers={checkers}
                        value={registerAssignQuery}
                        onChange={(v) => {
                          setRegisterAssignQuery(v);
                          if (!v.trim()) return;
                          setNewNews((prev) => {
                            if (!prev.assignedTo) return prev;
                            const selected = checkers.find((c) => c.id === prev.assignedTo);
                            if (selected && selected.name.toLowerCase() === v.trim().toLowerCase()) {
                              return prev;
                            }
                            return { ...prev, assignedTo: '', briefing: '' };
                          });
                        }}
                        onSelect={(checker) => {
                          setNewNews((prev) => ({ ...prev, assignedTo: String(checker.id) }));
                          setRegisterAssignQuery(checker.name);
                        }}
                        placeholder="Digite o nome do checador..."
                        themeConfig={themeConfig}
                      />
                    </div>
                    {newNews.assignedTo && (
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Briefing / Orientação</label>
                        <input 
                          type="text"
                          value={newNews.briefing}
                          onChange={(e) => setNewNews({ ...newNews, briefing: e.target.value })}
                          placeholder="Instruções para o checador..."
                          className={styles.registerInput}
                          style={{ 
                            backgroundColor: themeConfig.general.inputBackground, 
                            borderColor: themeConfig.general.inputBorder,
                            color: themeConfig.general.inputText,
                            '--tw-ring-color': themeConfig.general.accent
                          } as any}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => {
                    setIsRegisterModalOpen(false);
                    setPendingAttachments([]);
                    setRegisterAssignQuery('');
                  }}
                  className={styles.modalCancelButton}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRegister}
                  className={styles.modalSaveButton}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  Salvar Notícia
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingNews && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingNews(null)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h2 className={styles.modalTitle}>Editar Conteúdo</h2>
                <p className={styles.modalSubtitle}>Atualize as informações da notícia cadastrada.</p>
              </div>
              <div className={styles.editModalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Título *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className={styles.registerInput}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Alegação Principal</label>
                  <textarea
                    value={editForm.alegacao}
                    onChange={(e) => setEditForm({ ...editForm, alegacao: e.target.value })}
                    placeholder="Qual é a afirmação ou alegação que precisa ser verificada?"
                    rows={2}
                    className={styles.registerTextareaSmall}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Descrição / Contexto</label>
                  <textarea
                    value={editForm.descricao}
                    onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                    placeholder="Informações adicionais, contexto ou observações..."
                    rows={2}
                    className={styles.registerTextareaSmall}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className={styles.editGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Fonte / Veículo</label>
                    <input
                      type="text"
                      value={editForm.source}
                      onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      placeholder="Ex: Portal de Notícias X"
                      className={styles.registerInput}
                      style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>URL da Matéria</label>
                    <div className={styles.urlInputWrapper}>
                      <div className={styles.urlInputIcon}><LinkIcon size={14} /></div>
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        placeholder="https://..."
                        className={styles.urlInput}
                        style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Prioridade</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className={styles.statusSelect}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button
                  onClick={() => setEditingNews(null)}
                  className={styles.modalCancelButton}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={styles.modalSaveButton}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isReceivedDetailOpen && selectedReceivedItem && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceivedDetailOpen(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 100 }}
              className={styles.receivedDetailModal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.receivedDetailLeft}>
                <div className={styles.receivedDetailHeaderRow}>
                  <div className={styles.receivedDetailHeaderLeft}>
                    <button onClick={() => setIsReceivedDetailOpen(false)} className={styles.receivedDetailBackButton} style={{ color: themeConfig.general.mutedText }}>
                      <ArrowLeft size={20} />
                    </button>
                    <div className={styles.receivedDetailSourceBadge} style={{ borderColor: themeConfig.general.border }}>
                      {getSourceIcon(selectedReceivedItem.sourceType)}
                      <span className={styles.receivedDetailSourceText}>{selectedReceivedItem.sourceType}</span>
                    </div>
                  </div>
                  <div className={styles.receivedDetailHeaderRight}>
                    <span className={styles.receivedDetailDateTime}>{new Date(selectedReceivedItem.receivedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h2 className={styles.receivedDetailTitle}>{selectedReceivedItem.title}</h2>
                  
                  <div className={styles.receivedDetailMetaRow}>
                    <div className={styles.receivedDetailMetaItem} style={{ borderColor: themeConfig.general.border }}>
                      <div className={styles.receivedDetailMetaIconBlue}>
                        <Users size={16} />
                      </div>
                      <div>
                        <p className={styles.receivedDetailMetaLabel}>Remetente</p>
                        <p className={styles.receivedDetailMetaValue}>{selectedReceivedItem.senderName || 'Não identificado'}</p>
                      </div>
                    </div>
                    {selectedReceivedItem.senderAddress && (
                      <div className={styles.receivedDetailMetaItem} style={{ borderColor: themeConfig.general.border }}>
                        <div className={styles.receivedDetailMetaIconGray}>
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <p className={styles.receivedDetailMetaLabel}>Contato</p>
                          <p className={styles.receivedDetailMetaValue}>{selectedReceivedItem.senderAddress}</p>
                        </div>
                      </div>
                    )}
                    {selectedReceivedItem.messageId && (
                      <div className={styles.receivedDetailMetaItem} style={{ borderColor: themeConfig.general.border }}>
                        <div className={styles.receivedDetailMetaIconGray}>
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className={styles.receivedDetailMetaLabel}>ID Mensagem</p>
                          <p className={styles.receivedDetailMetaValue}>{selectedReceivedItem.messageId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.receivedDetailProse}>
                  <p className={styles.receivedDetailProseText}>{selectedReceivedItem.content}</p>
                </div>

                {selectedReceivedItem.media && selectedReceivedItem.media.length > 0 && (
                  <div className={styles.receivedDetailMediaSection} style={{ borderColor: themeConfig.general.border }}>
                    <h3 className={styles.receivedDetailMediaTitle}>
                      <Upload size={18} className={styles.iconBlue500} />
                      Mídias e Anexos ({selectedReceivedItem.media.length})
                    </h3>
                    <div className={styles.receivedDetailMediaGrid}>
                      {selectedReceivedItem.media.map((m, i) => (
                        <div key={i} className={styles.receivedDetailMediaItem} style={{ borderColor: themeConfig.general.border }}>
                          {m.type === 'image' && <img src={m.url} alt="" className={styles.mediaImg} />}
                          {m.type === 'video' && <video src={m.url} controls className={styles.mediaImg} />}
                          {m.type === 'audio' && <Bell size={32} className={styles.iconFaint} />}
                          {m.type === 'document' && <FileText size={32} className={styles.iconFaint} />}
                          <div className={styles.mediaOverlay}>
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className={styles.mediaOverlayLink}>
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <div className={styles.mediaTypeBadge}>{m.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReceivedItem.originalLink && (
                  <div className={styles.originalLinkBox}>
                    <div className={styles.originalLinkLeft}>
                      <LinkIcon className={styles.iconBlue600} size={20} />
                      <div>
                        <p className={styles.originalLinkLabel}>Link Original</p>
                        <p className={styles.originalLinkText}>{selectedReceivedItem.originalLink}</p>
                      </div>
                    </div>
                    <a href={selectedReceivedItem.originalLink} target="_blank" rel="noopener noreferrer" className={styles.originalLinkButton}>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                )}

                {selectedReceivedItem.internalNotes && (
                  <div className={styles.internalNotesSection} style={{ borderColor: themeConfig.general.border }}>
                    <h3 className={styles.internalNotesTitle}>Observações Internas</h3>
                    <div className={styles.internalNotesContent} style={{ borderColor: themeConfig.general.border }}>
                      {selectedReceivedItem.internalNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.receivedDetailSidebar} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
                <div className={styles.sidebarActionsBlock}>
                  <div className={styles.sidebarActionsSection}>
                    <h3 className={styles.sidebarActionsTitle}>Ações da Curadoria</h3>
                    <button 
                      onClick={() => {
                        onForwardToTriage(selectedReceivedItem);
                        setIsReceivedDetailOpen(false);
                      }}
                      className={styles.sidebarPrimaryButton}
                      style={{ backgroundColor: themeConfig.general.accent, color: themeConfig.buttons.primaryText }}
                    >
                      <ArrowUpRight size={24} />
                      <span>Encaminhar para Triagem</span>
                    </button>
                    <button 
                      onClick={() => {
                        onDeleteReceivedNews(selectedReceivedItem.id);
                        setIsReceivedDetailOpen(false);
                      }}
                      className={styles.sidebarDeleteButton}
                    >
                      <Trash2 size={18} />
                      Excluir Notícia
                    </button>
                  </div>

                  <div className={styles.logCard} style={{ borderColor: themeConfig.general.border }}>
                    <h4 className={styles.logTitle}>
                      <Info size={12} />
                      Log de Recebimento
                    </h4>
                    <div className={styles.logItems}>
                      <div className={styles.logItem}>
                        <div className={styles.logDotBlue} />
                        <div>
                          <p className={styles.logItemTitle}>Conteúdo Recebido</p>
                          <p className={styles.logItemSubtext}>Auto-captura via {selectedReceivedItem.sourceType}</p>
                        </div>
                      </div>
                      <div className={styles.logItem}>
                        <div className={styles.logDotGray} />
                        <div>
                          <p className={styles.logItemTitle}>Processado pelo Sistema</p>
                          <p className={styles.logItemSubtext}>Metadados extraídos com sucesso</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsReceivedDetailOpen(false)}
                  className={styles.receivedDetailBackButton2}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  Voltar para Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Triage Preview Modal */}
      <AnimatePresence>
        {isTriagePreviewOpen && currentTriageItem && (
          <div className={styles.modalOverlay}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTriagePreviewOpen(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.triagePreviewModal}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.triagePreviewHeader} style={{ borderColor: themeConfig.general.border }}>
                 <div className={styles.triagePreviewHeaderLeft}>
                    <button onClick={() => setIsTriagePreviewOpen(false)} className={styles.triagePreviewBackButton} style={{ color: themeConfig.general.mutedText }}>
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className={styles.triagePreviewTitle}>Pré-visualização da Notícia</h2>
                      <p className={styles.triagePreviewStatus}>Status: {currentTriageItem.status}</p>
                    </div>
                 </div>
                 <div className={styles.triagePreviewHeaderRight}>
                    {canDeleteContent(currentTriageItem) && (
                    <button
                      onClick={() => {
                        handleDeleteContent(currentTriageItem.id, () => setIsTriagePreviewOpen(false));
                      }}
                      className={styles.sidebarDeleteButton}
                      title="Excluir conteúdo"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                    )}
                    <button 
                      onClick={() => {
                        handleOpenAssign(currentTriageItem.id);
                        setIsTriagePreviewOpen(false);
                      }}
                      className={styles.triagePreviewAssignButton}
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <UserPlus size={16} />
                      Atribuir Checador
                    </button>
                    {specializedNetworkEnabled && (
                    <button 
                      onClick={() => {
                        onSendToSpecializedNetwork(currentTriageItem.id);
                        setIsTriagePreviewOpen(false);
                      }}
                      disabled={currentTriageItem.sentToSpecializedNetwork}
                      className={styles.extractionTriageButton}
                      style={{ 
                        backgroundColor: currentTriageItem.sentToSpecializedNetwork ? '#f1f5f9' : themeConfig.general.accent, 
                        color: currentTriageItem.sentToSpecializedNetwork ? '#94a3b8' : '#fff' 
                      }}
                    >
                      <Globe size={16} />
                      {currentTriageItem.sentToSpecializedNetwork ? 'Encaminhado' : 'Rede Especializada'}
                    </button>
                    )}
                 </div>
              </div>

              <div className={styles.triagePreviewBody}>
                <div className={styles.triagePreviewLeft}>
                  <div className={styles.triagePreviewMetaBlock}>
                    <div className={styles.triagePreviewMetaRow}>
                       {getSourceIcon(currentTriageItem.source)}
                       <span className={styles.triagePreviewSource}>{currentTriageItem.source}</span>
                       <span className={styles.triagePreviewDot}>•</span>
                       <span className={styles.triagePreviewDate}>{currentTriageItem.date}</span>
                    </div>
                    <h1 className={styles.triagePreviewTitle2}>{currentTriageItem.title}</h1>
                  </div>

                  <div className={styles.triagePreviewProse}>
                    <p className={styles.triagePreviewProseText}>{currentTriageItem.content}</p>
                  </div>

                  {currentTriageItem.media && currentTriageItem.media.length > 0 && (
                    <div className={styles.triagePreviewMediaSection} style={{ borderColor: themeConfig.general.border }}>
                      <h3 className={styles.triagePreviewMediaTitle}>
                        <Upload size={16} />
                        Arquivos e Mídias ({currentTriageItem.media.length})
                      </h3>
                      <div className={styles.triagePreviewMediaGrid}>
                        {currentTriageItem.media.map((m, i) => (
                          <div key={i} className={styles.triagePreviewMediaItem} style={{ borderColor: themeConfig.general.border }}>
                            {m.type === 'image' && <img src={m.url} alt="" className={styles.mediaImg} />}
                            {m.type === 'video' && <video src={m.url} controls className={styles.mediaImg} />}
                            <div className={styles.triagePreviewMediaOverlay}>
                               <a href={m.url} target="_blank" rel="noopener noreferrer" className={styles.triagePreviewMediaLink}>
                                 <ExternalLink size={18} />
                               </a>
                            </div>
                            <div className={styles.triagePreviewMediaBadge}>{m.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.triagePreviewRight}>
                  {aiMetricsEnabled && (
                  <div className={styles.triagePreviewAiPanel} style={{ borderColor: themeConfig.general.border }}>
                    <h3 className={styles.triagePreviewAiTitle}>Indicadores AI</h3>
                    <div className={styles.triagePreviewAiItems}>
                       <div className={styles.triagePreviewAiItem}>
                          <div className={styles.triagePreviewAiHeader}>
                            <span>Pot. desinformação</span>
                            <span>{formatAiScore(getDesinfoScore(currentTriageItem.aiScores, 'inveracidade'))}</span>
                          </div>
                          <div className={styles.triagePreviewAiBarBg}>
                            {getDesinfoScore(currentTriageItem.aiScores, 'inveracidade') != null && (
                              <div className={styles.aiBarRed} style={{ width: `${getDesinfoScore(currentTriageItem.aiScores, 'inveracidade')}%` }} />
                            )}
                          </div>
                       </div>
                       <div className={styles.triagePreviewAiItem}>
                          <div className={styles.triagePreviewAiHeader}>
                            <span>Falsidade</span>
                            <span>{formatAiScore(getDesinfoScore(currentTriageItem.aiScores, 'falsidade'))}</span>
                          </div>
                          <div className={styles.triagePreviewAiBarBg}>
                            {getDesinfoScore(currentTriageItem.aiScores, 'falsidade') != null && (
                              <div className={styles.aiBarOrange} style={{ width: `${getDesinfoScore(currentTriageItem.aiScores, 'falsidade')}%` }} />
                            )}
                          </div>
                       </div>
                       <div className={styles.triagePreviewAiItem}>
                          <div className={styles.triagePreviewAiHeader}>
                            <span>Distorção mídia</span>
                            <span>{formatAiScore(getDesinfoScore(currentTriageItem.aiScores, 'distorcaoMidia'))}</span>
                          </div>
                          <div className={styles.triagePreviewAiBarBg}>
                            {getDesinfoScore(currentTriageItem.aiScores, 'distorcaoMidia') != null && (
                              <div className={styles.aiBarBlue} style={{ width: `${getDesinfoScore(currentTriageItem.aiScores, 'distorcaoMidia')}%` }} />
                            )}
                          </div>
                       </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
