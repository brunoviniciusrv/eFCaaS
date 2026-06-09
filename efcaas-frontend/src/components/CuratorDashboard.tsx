import React, { useState, useMemo } from 'react';
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
  ReceivedNewsStatus
} from '../types';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { ResponsiveTabs } from './ResponsiveTabs';
import { TrendAnalyzer } from './TrendAnalyzer';
import { SpecializedNetworkView } from './SpecializedNetworkView';
import { apiService, YoutubeResultadoDto } from '../services/apiService';

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
  onApprove: (newsId: string, comments: string) => void;
  onReject: (newsId: string, comments: string) => void;
  onReopen: (newsId: string, reason: string) => void;
  setSelectedNewsId: (id: string | null) => void;
  onAddNews: (newsData: any) => void;
  onEditNews: (newsId: string, newsData: any) => void;
  receivedNews: ReceivedNewsItem[];
  onForwardToTriage: (news: ReceivedNewsItem) => void;
  onDeleteReceivedNews: (id: string) => void;
  notifications: any[];
  onMarkNotifAsRead: (id: string) => void;
  onClearNotifs: () => void;
  checkPermission: (permId: string) => boolean;
  onSendToSpecializedNetwork: (newsId: string) => void;
  specializedNetworkChecks: any[];
  onMoveTask?: (newsId: string, newStatus: NewsStatus) => Promise<void>;
}

type CuratorTab = 'triage' | 'received' | 'trends' | 'list' | 'kanban' | 'workload' | 'reviews' | 'specialized_network';

export const CuratorDashboard = ({
  news,
  setNews,
  users,
  currentUser,
  themeConfig,
  onAssign,
  onApprove,
  onReject,
  onReopen,
  setSelectedNewsId,
  onAddNews,
  onEditNews,
  receivedNews,
  onForwardToTriage,
  onDeleteReceivedNews,
  notifications,
  onMarkNotifAsRead,
  onClearNotifs,
  checkPermission,
  onSendToSpecializedNetwork,
  specializedNetworkChecks,
  onMoveTask,
}: CuratorDashboardProps) => {
  const navigate = useNavigate();
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
    if (s.includes('whatsapp')) return <MessageCircle size={16} className="text-green-500" />;
    if (s.includes('facebook')) return <FacebookIcon size={16} className="text-blue-600" />;
    if (s.includes('instagram')) return <InstagramIcon size={16} className="text-pink-600" />;
    if (s.includes('telegram')) return <Send size={16} className="text-sky-500" />;
    if (s.includes('e-mail') || s.includes('email')) return <Mail size={16} className="text-slate-500" />;
    if (s.includes('tiktok')) return <TrendingUp size={16} className="text-black" />;
    if (s.includes('twitter') || s.includes('x')) return <Info size={16} className="text-slate-800" />;
    return <Inbox size={16} className="text-slate-500" />;
  };
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assigningNewsId, setAssigningNewsId] = useState<string | null>(null);
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>('');
  const [briefing, setBriefing] = useState('');
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
  const [newNews, setNewNews] = useState({
    title: '',
    alegacao: '',
    descricao: '',
    source: '',
    url: '',
    priority: 'medium' as const,
    assignedTo: '',
    briefing: ''
  });
  const [selectedStatus, setSelectedStatus] = useState<NewsStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'assignedTo'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const checkers = useMemo(() => users.filter(u => u.role === 'checker'), [users]);

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.source.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGravity = (item.aiScores?.gravity || 0) >= gravityFilter;
      const matchesUrgency = (item.aiScores?.urgency || 0) >= urgencyFilter;
      const matchesTrend = (item.aiScores?.trend || 0) >= trendFilter;
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
  }, [news, searchQuery, gravityFilter, urgencyFilter, trendFilter, activeTab, selectedStatus, sortBy, sortOrder, users]);

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
    setAssignError('');
    if (id) {
      setAssigningNewsId(id);
    } else if (selectedNewsIds.length > 0) {
      setAssigningNewsId(null);
    } else {
      return;
    }
    setIsAssignModalOpen(true);
  };

  const executeAssign = async () => {
    if (!selectedCheckerId || isAssigning) return;

    setIsAssigning(true);
    setAssignError('');

    try {
      const ids = assigningNewsId ? [assigningNewsId] : selectedNewsIds;
      await Promise.all(
        ids.map(id => onAssign(id, selectedCheckerId, briefing)),
      );

      setIsAssignModalOpen(false);
      setAssigningNewsId(null);
      setSelectedNewsIds([]);
      setSelectedCheckerId('');
      setBriefing('');
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Não foi possível atribuir a checagem.');
    } finally {
      setIsAssigning(false);
    }
  };

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
    onAddNews(newNews);
    setIsRegisterModalOpen(false);
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
  };

  const mapYoutubeToReceivedNews = (dto: YoutubeResultadoDto): ReceivedNewsItem => ({
    id: 'yt-' + Math.random().toString(36).substr(2, 9),
    title: dto.titulo,
    content: dto.conteudo ?? dto.descricao ?? '',
    excerpt: dto.descricao ?? dto.conteudo?.substring(0, 120) ?? '',
    sourceType: 'YouTube',
    receivedAt: dto.publishedAt ?? new Date().toISOString(),
    status: 'received',
    senderName: dto.channelTitle ?? 'YouTube',
    originalLink: dto.url,
    media: dto.thumbnailHigh
      ? [{ type: 'image' as const, url: dto.thumbnailHigh }]
      : [],
  });

  const handleExecuteExtraction = async () => {
    if (!extractionParams.query.trim()) {
      alert('Informe um termo de busca antes de iniciar.');
      return;
    }
    setIsExtracting(true);
    try {
      const results = await apiService.buscarYoutube({
        query: extractionParams.query,
        limit: extractionParams.userLimit || 10,
        startDate: extractionParams.startDate || undefined,
        endDate: extractionParams.endDate || undefined,
      });

      setExtractionResults(results.map(mapYoutubeToReceivedNews));
      setIsExtractionModalOpen(false);
      setShowExtractionResults(true);
      setExtractionParams({
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
    } catch (err) {
      alert('Erro na busca do YouTube: ' + (err instanceof Error ? err.message : 'Tente novamente.'));
    } finally {
      setIsExtracting(false);
    }
  };

  const getSLAStatus = (startTime?: string) => {
    if (!startTime) return null;
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const hours = (now - start) / (1000 * 60 * 60);
    
    if (hours > 24) return { label: 'Atrasado', color: 'text-red-600 bg-red-50' };
    if (hours > 12) return { label: 'Alerta', color: 'text-amber-600 bg-amber-50' };
    return { label: 'No prazo', color: 'text-green-600 bg-green-50' };
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
      aiScores: {
        gravity: trend.misinformationRisk,
        urgency: Math.min(100, trend.misinformationRisk + 10),
        trend: 90
      }
    };
    onAddNews(newsData);
    setActiveTab('triage');
    alert("Tendência promovida para triagem com sucesso!");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" style={{ color: themeConfig.dashboard.text }}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg rotate-2">
             <Activity size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-black tracking-tight">Curadoria de Conteúdo</h1>
             <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Gestão e Distribuição Editorial</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
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
      <div className="w-full sm:w-fit">
        <ResponsiveTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab as any}
          themeConfig={themeConfig}
          tabs={[
            { id: 'received', label: 'Conteúdos Recebidos', icon: Inbox, permission: 'manage_received' },
            { id: 'trends', label: 'Analisador de Tendências', icon: TrendingUp, permission: 'manage_triage' },
            { id: 'specialized_network', label: 'Rede Especializada', icon: Globe, permission: 'manage_triage' },
            { id: 'triage', label: 'Triagem', icon: List, permission: 'manage_triage' },
            { id: 'list', label: 'Publicações', icon: Activity },
            { id: 'kanban', label: 'Fluxo', icon: Kanban, permission: 'assign_tasks' },
            { id: 'workload', label: 'Equipe', icon: Users, permission: 'assign_tasks' },
            { id: 'reviews', label: 'Revisões', icon: CheckCircle, permission: 'review_and_approve' }
          ].filter(tab => !tab.permission || checkPermission(tab.permission))}
        />
      </div>

      {/* Triage View */}
      {activeTab === 'received' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {!showExtractionResults ? (
            <>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Buscar nos Recebidos</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input 
                      type="text"
                      value={receivedSearchQuery}
                      onChange={(e) => setReceivedSearchQuery(e.target.value)}
                      placeholder="Título, conteúdo ou remetente..."
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>
                <div className="w-full md:w-auto flex gap-2">
                  <button 
                    onClick={() => setIsExtractionModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
                    style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                  >
                    <Zap size={16} />
                    Busca e Extração
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium opacity-60">
                  {filteredReceivedNews.length} conteúdos recebidos externos
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSortReceivedOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:bg-slate-50"
                    style={{ borderColor: themeConfig.general.border }}
                  >
                    {sortReceivedOrder === 'desc' ? 'Mais Recentes' : 'Mais Antigas'}
                    <ArrowUpDown size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReceivedNews.map(item => (
                  <div 
                    key={item.id}
                    className="p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between gap-4 group relative"
                    style={{ 
                      backgroundColor: themeConfig.general.cardBackground, 
                      borderColor: themeConfig.general.border
                    }}
                  >
                    {item.status === 'received' && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    )}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                          {getSourceIcon(item.sourceType)}
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{item.sourceType}</span>
                        </div>
                        <span className="text-[10px] opacity-40 font-medium">{new Date(item.receivedAt).toLocaleString()}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                        <p className="text-sm opacity-60 line-clamp-2">{item.excerpt}</p>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex -space-x-1">
                          {item.media?.map((m, i) => (
                            <div key={i} className="w-6 h-6 rounded-md bg-slate-100 border border-white flex items-center justify-center">
                              {m.type === 'image' && <Upload size={10} className="text-blue-500" />}
                              {m.type === 'video' && <TrendingUp size={10} className="text-red-500" />}
                              {m.type === 'audio' && <Bell size={10} className="text-green-500" />}
                              {m.type === 'document' && <FileText size={10} className="text-slate-500" />}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Remetente</span>
                          <span className="text-xs font-medium">{item.senderName || 'Desconhecido'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                      <button 
                        onClick={() => {
                          setSelectedReceivedItem(item);
                          setIsReceivedDetailOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={14} />
                        Visualizar
                      </button>
                      <button 
                        onClick={() => onForwardToTriage(item)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        style={{ backgroundColor: `${themeConfig.general.accent}15`, color: themeConfig.general.accent }}
                      >
                        <ArrowUpRight size={14} />
                        Triagem
                      </button>
                      <button 
                        onClick={() => onDeleteReceivedNews(item.id)}
                        className="p-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredReceivedNews.length === 0 && (
                <div className="text-center py-20 opacity-40">
                  <Inbox size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-bold">Nenhum conteúdo recebido</p>
                  <p className="text-sm">Não há conteúdo externo correspondente aos filtros.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <button 
                  onClick={() => setShowExtractionResults(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 hover:bg-slate-50 transition-all"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Localizar Publicações Encontradas</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input 
                      type="text"
                      value={extractionSearchQuery}
                      onChange={(e) => setExtractionSearchQuery(e.target.value)}
                      placeholder="Filtrar resultados da busca..."
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shadow-md">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Resultados da Busca Automática</p>
                    <p className="text-[10px] opacity-50 uppercase font-black tracking-widest">{filteredExtractionResults.length} Encontrados</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredExtractionResults.map(item => (
                  <div 
                    key={item.id}
                    className="p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between gap-4 group relative bg-blue-50/20"
                    style={{ 
                      borderColor: themeConfig.general.border
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white border" style={{ borderColor: themeConfig.general.border }}>
                          {getSourceIcon(item.sourceType)}
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{item.sourceType}</span>
                        </div>
                        <span className="text-[10px] opacity-40 font-medium">Extraído às {new Date(item.receivedAt).toLocaleTimeString()}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.title}</h3>
                        <p className="text-sm opacity-60 line-clamp-3 leading-relaxed">{item.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                      <button 
                        onClick={() => {
                          setSelectedReceivedItem(item);
                          setIsReceivedDetailOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-white border hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                        style={{ borderColor: themeConfig.general.border }}
                      >
                        <Eye size={14} />
                        Detalhes
                      </button>
                      <button
                        onClick={() => {
                          onAddNews({
                            title: item.title,
                            alegacao: item.content,
                            descricao: item.excerpt,
                            link: item.originalLink,
                            fonte: item.senderName,
                            priority: 'medium',
                          });
                          setExtractionResults(prev => prev.filter(r => r.id !== item.id));
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                        style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                      >
                        <ArrowUpRight size={14} />
                        Triagem
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredExtractionResults.length === 0 && (
                <div className="text-center py-20 opacity-40">
                  <SearchIcon size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-bold">Nenhum resultado corresponde ao filtro</p>
                  <p className="text-sm">Tente outro termo de busca.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Trend Analyzer View */}
      {activeTab === 'trends' && (
        <TrendAnalyzer 
          themeConfig={themeConfig} 
          onPromoteToFactCheck={handlePromoteTrend} 
        />
      )}

      {/* Triage View */}
      {activeTab === 'triage' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Buscar Notícias</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Título, conteúdo ou fonte..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText,
                    '--tw-ring-color': themeConfig.general.accent
                  } as any}
                />
              </div>
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label 
                className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
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
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all hover:h-2"
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.error} 0%, ${themeConfig.status.error} ${gravityFilter}%, #e2e8f0 ${gravityFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label 
                className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
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
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all hover:h-2"
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.warning} 0%, ${themeConfig.status.warning} ${urgencyFilter}%, #e2e8f0 ${urgencyFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label 
                className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
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
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all hover:h-2"
                style={{ 
                  background: `linear-gradient(to right, ${themeConfig.status.info} 0%, ${themeConfig.status.info} ${trendFilter}%, #e2e8f0 ${trendFilter}%, #e2e8f0 100%)`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium opacity-60">{filteredNews.length} notícias pendentes de triagem</p>
              {checkPermission('create_news') && (
                <button 
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                  style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                >
                  <Plus size={18} />
                  Registrar Notícia
                </button>
              )}
            </div>
            {selectedNewsIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in zoom-in">
                <span className="text-sm font-bold" style={{ color: themeConfig.general.accent }}>{selectedNewsIds.length} selecionadas</span>
                <button 
                  onClick={() => handleOpenAssign()}
                  className="px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  <UserPlus size={18} />
                  Atribuir em Massa
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredNews.map(item => (
              <div 
                key={item.id}
                className={cn(
                  "p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row md:items-start gap-6 cursor-pointer hover:shadow-md",
                  selectedNewsIds.includes(item.id) ? "ring-2" : ""
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
                <div className="flex items-start gap-4 flex-1 overflow-hidden">
                  <input 
                    type="checkbox"
                    checked={selectedNewsIds.includes(item.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelection(item.id);
                    }}
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} themeConfig={themeConfig} />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                        {getSourceIcon(item.source)}
                        <span className="text-[10px] font-bold uppercase opacity-60">{item.source}</span>
                      </div>
                      <span className="text-xs opacity-40">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight group-hover:text-blue-600 transition-colors">{item.title}</h3>
                    <p className="text-sm opacity-70 line-clamp-2">{item.content}</p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {(item.senderName || item.senderAddress) && (
                        <div className="flex items-center gap-1">
                          <User size={12} className="opacity-40" />
                          <span className="text-[10px] font-medium opacity-50">
                            {item.senderName || 'Remetente'} {item.senderAddress ? `(${item.senderAddress})` : ''}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <Box size={10} className="opacity-30" />
                        <span className="text-[10px] font-mono opacity-30">{item.id}</span>
                      </div>
                      {item.receivedAt && (
                        <div className="flex items-center gap-1 opacity-30">
                          <Clock size={10} />
                          <span className="text-[10px] font-bold">{new Date(item.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 w-full md:w-[280px] shrink-0">
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50/50 border" style={{ borderColor: themeConfig.general.border }}>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                          <span>Gravidade</span>
                          {item.isAIProcessing ? (
                            <span className="animate-pulse text-blue-500">Calculando...</span>
                          ) : (
                            <span>{item.aiScores?.gravity}%</span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          {item.isAIProcessing ? (
                            <div className="h-full w-1/3 bg-blue-400 animate-loading-shimmer" />
                          ) : (
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ 
                                width: `${item.aiScores?.gravity}%`, 
                                backgroundColor: (item.aiScores?.gravity || 0) > 70 ? themeConfig.status.error : themeConfig.status.warning 
                              }} 
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                          <span>Urgência</span>
                          {item.isAIProcessing ? (
                            <span className="animate-pulse text-blue-500">Calculando...</span>
                          ) : (
                            <span>{item.aiScores?.urgency}%</span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          {item.isAIProcessing ? (
                            <div className="h-full w-1/2 bg-blue-400 animate-loading-shimmer" />
                          ) : (
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ 
                                width: `${item.aiScores?.urgency}%`, 
                                backgroundColor: themeConfig.status.warning 
                              }} 
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                          <span>Tendência</span>
                          {item.isAIProcessing ? (
                            <span className="animate-pulse text-blue-500">Calculando...</span>
                          ) : (
                            <span>{item.aiScores?.trend}%</span>
                          )}
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          {item.isAIProcessing ? (
                            <div className="h-full w-2/3 bg-blue-400 animate-loading-shimmer" />
                          ) : (
                            <div 
                              className="h-full transition-all duration-1000" 
                              style={{ 
                                width: `${item.aiScores?.trend}%`, 
                                backgroundColor: themeConfig.status.info 
                              }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenAssign(item.id);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2"
                    style={{ borderColor: themeConfig.general.border } as any}
                  >
                    <UserPlus size={14} />
                    Atribuir Checador
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendToSpecializedNetwork(item.id);
                    }}
                    disabled={item.sentToSpecializedNetwork}
                    className="w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2"
                    style={{ 
                      borderColor: themeConfig.general.border, 
                      backgroundColor: item.sentToSpecializedNetwork ? '#f1f5f9' : 'transparent',
                      color: item.sentToSpecializedNetwork ? '#94a3b8' : 'inherit'
                    }}
                  >
                    <Globe size={14} />
                    {item.sentToSpecializedNetwork ? 'Encaminhado pra Rede' : 'Rede Especializada'}
                  </button>
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Buscar Publicações</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Título, fonte ou conteúdo..."
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText,
                    '--tw-ring-color': themeConfig.general.accent
                  } as any}
                />
              </div>
            </div>
            <div className="w-full md:w-48 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider opacity-50">Status</label>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2"
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

          <div className="rounded-2xl border shadow-sm overflow-hidden" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Publicação</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>
                    <button onClick={() => {
                      setSortBy('priority');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }} className="flex items-center gap-1 hover:opacity-80">
                      Prioridade <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>
                    <button onClick={() => {
                      setSortBy('assignedTo');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }} className="flex items-center gap-1 hover:opacity-80">
                      Responsável <ArrowUpDown size={12} />
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>SLA / Início</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                {filteredNews.map((item) => {
                  const assignedUser = users.find(u => u.id === item.assignedTo);
                  const sla = getSLAStatus(item.startTime);
                  
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedNewsId(item.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <h3 className="text-sm font-semibold line-clamp-1">{item.title}</h3>
                          <p className="text-xs opacity-60 mt-1">{item.source} • {item.date}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                          item.priority === 'high' ? 'text-red-600 bg-red-50' :
                          item.priority === 'medium' ? 'text-amber-600 bg-amber-50' :
                          'text-slate-600 bg-slate-50'
                        }`}>
                          {item.priority || 'low'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} themeConfig={themeConfig} />
                      </td>
                      <td className="px-6 py-4">
                        {assignedUser ? (
                          <div className="flex items-center gap-2">
                            <img src={assignedUser.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                            <span className="text-sm">{assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs opacity-40 italic">Não atribuído</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {item.startTime ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs">
                              {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {sla && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase w-fit ${sla.color}`}>
                                {sla.label}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs opacity-30">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          {checkPermission('assign_tasks') && (
                            <button 
                              onClick={() => handleOpenAssign(item.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Atribuir / Redistribuir"
                            >
                              <UserPlus size={18} />
                            </button>
                          )}
                          {item.status === 'completed' && checkPermission('review_and_approve') && (
                            <button 
                              onClick={() => setReopeningNewsId(item.id)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reabrir para Revisão"
                            >
                              <RotateCcw size={18} />
                            </button>
                          )}
                          {checkPermission('manage_triage') && item.status === 'pending' && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Editar Conteúdo"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedNewsId(item.id);
                              navigate(`/analysis/${item.id}`);
                            }}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
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
              <div className="text-center py-20 opacity-40">
                <Search size={48} className="mx-auto mb-4" />
                <p className="text-lg font-bold">Nenhuma publicação encontrada</p>
                <p className="text-sm">Tente ajustar seus filtros de busca.</p>
              </div>
            )}
          </div>
        </div>
      )}
      {activeTab === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {kanbanColumns.map(col => (
              <div key={col.id} className="flex flex-col h-[700px]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="font-bold flex items-center gap-2">
                    {col.title}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 opacity-60">
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
                        "flex-1 rounded-3xl border p-4 space-y-4 overflow-y-auto transition-colors",
                        snapshot.isDraggingOver ? "bg-slate-100/50" : ""
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
                                "p-4 rounded-2xl border shadow-sm space-y-3 group cursor-grab active:cursor-grabbing hover:shadow-md transition-all",
                                snapshot.isDragging ? "rotate-2 shadow-2xl z-50" : ""
                              )}
                              style={{ 
                                backgroundColor: themeConfig.general.cardBackground, 
                                borderColor: themeConfig.general.border,
                                ...provided.draggableProps.style
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{item.source}</span>
                                <TrendingUp size={14} className="opacity-30" />
                              </div>
                              <h4 className="text-sm font-bold leading-tight line-clamp-2">{item.title}</h4>
                              
                              {item.assignedTo && (
                                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: themeConfig.general.border }}>
                                  <img 
                                    src={users.find(u => u.id === item.assignedTo)?.avatarUrl} 
                                    alt="" 
                                    className="w-5 h-5 rounded-full" 
                                  />
                                  <span className="text-[10px] font-medium opacity-60">
                                    {users.find(u => u.id === item.assignedTo)?.name}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-1">
                                <div className="flex gap-1">
                                  <div className="w-1 h-2 rounded-full bg-red-500" style={{ opacity: Math.max(0.2, (item.aiScores?.gravity || 0) / 100) }}></div>
                                  <div className="w-1 h-2 rounded-full bg-orange-500" style={{ opacity: Math.max(0.2, (item.aiScores?.urgency || 0) / 100) }}></div>
                                  <div className="w-1 h-2 rounded-full bg-blue-500" style={{ opacity: Math.max(0.2, (item.aiScores?.trend || 0) / 100) }}></div>
                                </div>
                                <span className="text-[10px] opacity-40">{item.date}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {checkers.map(checker => {
            const checkerTasks = news.filter(n => n.assignedTo === checker.id);
            const pending = checkerTasks.filter(n => n.status === 'pending').length;
            const inProgress = checkerTasks.filter(n => n.status === 'in_progress').length;
            const review = checkerTasks.filter(n => n.status === 'final_review').length;
            const completed = checkerTasks.filter(n => n.status === 'completed').length;
            
            return (
              <div 
                key={checker.id}
                className="p-6 rounded-3xl border shadow-sm space-y-6"
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className="flex items-center gap-4">
                  <img src={checker.avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-bold text-lg">{checker.name}</h3>
                    <p className="text-xs opacity-60">{checker.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Disponível</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-2xl bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Total Ativas</p>
                    <p className="text-2xl font-black">{inProgress + pending + review}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">Concluídas</p>
                    <p className="text-2xl font-black">{completed}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider opacity-50">Distribuição de Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><Clock size={12} className="text-blue-500" /> Em Andamento</span>
                      <span className="font-bold">{inProgress}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(inProgress / (checkerTasks.length || 1)) * 100}%` }} />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2"><AlertTriangle size={12} className="text-amber-500" /> Revisão Final</span>
                      <span className="font-bold">{review}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(review / (checkerTasks.length || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setDetailedCheckerId(checker.id)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 hover:bg-slate-50"
                  style={{ borderColor: themeConfig.general.border }}
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredNews.map(item => (
              <div 
                key={item.id}
                className="p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-6"
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} themeConfig={themeConfig} />
                      <span className="text-xs opacity-50">Checador: {users.find(u => u.id === item.assignedTo)?.name}</span>
                    </div>
                    <span className="text-xs opacity-40">{item.date}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-dashed" style={{ borderColor: themeConfig.general.border }}>
                      <p className="text-sm font-bold mb-1 flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-500" /> Parecer do Checador:
                      </p>
                      <p className="text-sm opacity-70 italic">"{item.report || 'Nenhum parecer enviado.'}"</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-3 min-w-[180px]">
                  <button 
                    onClick={() => setReviewingNewsId(item.id)}
                    className="w-full py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                  >
                    <Search size={18} />
                    Revisar Agora
                  </button>
                </div>
              </div>
            ))}
            {filteredNews.length === 0 && (
              <div className="text-center py-20 opacity-40">
                <CheckCircle size={48} className="mx-auto mb-4" />
                <p className="text-lg font-bold">Nenhuma revisão pendente</p>
                <p className="text-sm">Tudo em dia por aqui!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extraction Modal */}
      <AnimatePresence>
        {isExtractionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExtractionModalOpen(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Busca e Extração de Conteúdos</h2>
                    <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Monitoramento Multi-Plataforma em Tempo Real</p>
                  </div>
                </div>
                <button onClick={() => setIsExtractionModalOpen(false)} className="p-2 opacity-40 hover:opacity-100"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Unified Search Field */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Termo de Busca / Palavras-chave</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                    <input 
                      type="text"
                      placeholder="Ex: vacinas, eleições 2024, fraude pix..."
                      value={extractionParams.query}
                      onChange={(e) => setExtractionParams({...extractionParams, query: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Limit */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50 flex items-center gap-2">
                      <Users size={14} /> Limite de Registros
                    </label>
                    <input 
                      type="number"
                      min="10"
                      max="1000"
                      value={extractionParams.userLimit}
                      onChange={(e) => setExtractionParams({...extractionParams, userLimit: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                    <p className="text-[10px] opacity-40 italic">Máximo sugerido: 1000 registros por extração.</p>
                  </div>

                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Onde Buscar</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'youtube', label: 'YouTube', icon: YoutubeIcon, color: 'text-red-600 bg-red-50' },
                        { id: 'reddit', label: 'Reddit', icon: Globe, color: 'text-orange-600 bg-orange-50' },
                        { id: 'facebook', label: 'Facebook', icon: FacebookIcon, color: 'text-blue-600 bg-blue-50' },
                        { id: 'telegram', label: 'Telegram', icon: Send, color: 'text-sky-600 bg-sky-50' }
                      ].map(platform => (
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
                            "flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all",
                            extractionParams.platforms[platform.id as keyof typeof extractionParams.platforms] 
                              ? `${platform.color} border-current` 
                              : "opacity-40 hover:opacity-100"
                          )}
                        >
                          <platform.icon size={14} />
                          {platform.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Data Inicial</label>
                    <input 
                      type="date"
                      value={extractionParams.startDate}
                      onChange={(e) => setExtractionParams({...extractionParams, startDate: e.target.value})}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Data Final</label>
                    <input 
                      type="date"
                      value={extractionParams.endDate}
                      onChange={(e) => setExtractionParams({...extractionParams, endDate: e.target.value})}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2"
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
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Observações de Contexto (Opcional)</label>
                  <textarea 
                    placeholder="Instruções adicionais para a IA de extração..."
                    value={extractionParams.comments}
                    onChange={(e) => setExtractionParams({...extractionParams, comments: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                  />
                </div>
              </div>

              <div className="p-8 flex items-center justify-between border-t" style={{ backgroundColor: `${themeConfig.dashboard.background}30`, borderColor: themeConfig.general.border }}>
                <p className="text-xs opacity-50 max-w-sm font-medium">A extração utiliza IA para filtrar ruídos e identificar padrões de desinformação automaticamente.</p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsExtractionModalOpen(false)}
                    className="px-6 py-3 text-sm font-bold opacity-60 hover:opacity-100"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleExecuteExtraction}
                    disabled={isExtracting || !extractionParams.query.trim() || !Object.values(extractionParams.platforms).some(v => v)}
                    className="px-10 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                  >
                    {isExtracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Iniciar Busca Completa
                      </>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailedCheckerId(null)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div className="flex items-center gap-4">
                  <img src={users.find(u => u.id === detailedCheckerId)?.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                  <div>
                    <h2 className="text-xl font-bold">Tarefas de {users.find(u => u.id === detailedCheckerId)?.name}</h2>
                    <p className="text-sm opacity-70">Lista detalhada de atribuições correntes.</p>
                  </div>
                </div>
                <button onClick={() => setDetailedCheckerId(null)} className="p-2 opacity-40 hover:opacity-100"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {news.filter(n => n.assignedTo === detailedCheckerId).length > 0 ? (
                  news.filter(n => n.assignedTo === detailedCheckerId).map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        setSelectedNewsId(item.id);
                        navigate(`/analysis/${item.id}`);
                      }}
                      className="p-4 rounded-2xl border hover:bg-slate-50 transition-all cursor-pointer group"
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={item.status} themeConfig={themeConfig} />
                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.source}</span>
                          </div>
                          <h4 className="text-sm font-bold group-hover:text-blue-600 transition-colors">{item.title}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] opacity-40">{item.date}</p>
                          <div className="flex gap-1 mt-1 justify-end">
                            <div className="w-2 h-0.5 rounded-full bg-red-500" style={{ opacity: (item.aiScores?.gravity || 0) / 100 }}></div>
                            <div className="w-2 h-0.5 rounded-full bg-orange-500" style={{ opacity: (item.aiScores?.urgency || 0) / 100 }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 opacity-30">
                     <p className="font-bold">Nenhuma tarefa atribuída</p>
                  </div>
                )}
              </div>
              <div className="p-4 flex justify-end" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setDetailedCheckerId(null)}
                  className="px-8 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg transition-all"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">Atribuir Tarefa</h2>
                <p className="text-sm opacity-70">
                  {assigningNewsId ? 'Selecione um checador para esta notícia.' : `Atribuindo ${selectedNewsIds.length} notícias selecionadas.`}
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Selecionar Checador</label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                    {checkers.map(checker => (
                      <button
                        key={checker.id}
                        onClick={() => setSelectedCheckerId(checker.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border transition-all text-left",
                          selectedCheckerId === checker.id ? "ring-2" : "hover:bg-slate-50"
                        )}
                        style={{ 
                          borderColor: selectedCheckerId === checker.id ? themeConfig.general.accent : themeConfig.general.border,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      >
                        <img src={checker.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                        <div className="flex-1">
                          <h4 className="text-sm font-bold">{checker.name}</h4>
                          <p className="text-[10px] opacity-60">{checker.activeTasksCount || 0} tarefas ativas</p>
                        </div>
                        {selectedCheckerId === checker.id && <Check size={18} style={{ color: themeConfig.general.accent }} />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Briefing / Orientações (Opcional)</label>
                  <textarea 
                    value={briefing}
                    onChange={(e) => setBriefing(e.target.value)}
                    placeholder="Adicione contexto ou instruções específicas para o checador..."
                    rows={4}
                    className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                  />
                </div>
                {assignError && (
                  <p className="text-xs font-bold text-red-500">{assignError}</p>
                )}
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isAssigning}
                  className="px-6 py-2.5 text-sm font-bold opacity-60 hover:opacity-100 disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeAssign}
                  disabled={!selectedCheckerId || isAssigning}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  {isAssigning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Atribuindo...
                    </>
                  ) : (
                    'Confirmar Atribuição'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingNewsId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingNewsId(null)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div>
                  <h2 className="text-xl font-bold">Revisão Final</h2>
                  <p className="text-sm opacity-70">Avalie a qualidade e precisão da checagem realizada.</p>
                </div>
                <button onClick={() => setReviewingNewsId(null)} className="p-2 opacity-40 hover:opacity-100"><X size={24} /></button>
              </div>
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Notícia Original</h4>
                    <p className="text-sm font-bold mb-1">{news.find(n => n.id === reviewingNewsId)?.title}</p>
                    <p className="text-xs opacity-70 line-clamp-3">{news.find(n => n.id === reviewingNewsId)?.content}</p>
                  </div>

                  <div className="p-4 rounded-2xl border" style={{ borderColor: themeConfig.general.border }}>
                    <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-2">Parecer do Checador</h4>
                    <div className="prose prose-sm max-w-none">
                      {news.find(n => n.id === reviewingNewsId)?.report}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Comentários de Revisão (Obrigatório se rejeitar)</label>
                    <textarea 
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Adicione observações para o checador ou justificativa da aprovação..."
                      rows={3}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
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
              <div className="p-6 flex gap-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                <button 
                  onClick={() => executeReview(false)}
                  disabled={!reviewComments.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ color: themeConfig.status.error, borderColor: themeConfig.status.error }}
                >
                  <X size={18} />
                  Rejeitar e Devolver
                </button>
                <button 
                  onClick={() => executeReview(true)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: themeConfig.status.success, color: '#fff' }}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReopeningNewsId(null)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">Reabrir para Revisão</h2>
                <p className="text-sm opacity-70">Justifique a necessidade de reabertura desta checagem.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Justificativa</label>
                  <textarea 
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="Especifique o que precisa ser corrigido ou revisado..."
                    rows={4}
                    className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                  />
                </div>
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setReopeningNewsId(null)}
                  className="px-6 py-2.5 text-sm font-bold opacity-60 hover:opacity-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleReopenAction}
                  disabled={!reopenReason.trim()}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                  style={{ backgroundColor: themeConfig.status.warning, color: '#fff' }}
                >
                  Confirmar Reabertura
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">Cadastrar Nova Notícia</h2>
                <p className="text-sm opacity-70">Insira as informações da notícia para triagem ou atribuição rápida.</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Título da Notícia *</label>
                    <input 
                      type="text"
                      value={newNews.title}
                      onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
                      placeholder="Ex: Nova variante de vírus detectada..."
                      className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Alegação Principal</label>
                    <textarea 
                      value={newNews.alegacao}
                      onChange={(e) => setNewNews({ ...newNews, alegacao: e.target.value })}
                      placeholder="Qual é a afirmação ou alegação que precisa ser verificada?"
                      rows={2}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Descrição / Contexto</label>
                    <textarea 
                      value={newNews.descricao}
                      onChange={(e) => setNewNews({ ...newNews, descricao: e.target.value })}
                      placeholder="Informações adicionais, contexto ou observações sobre o conteúdo..."
                      rows={2}
                      className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">Fonte / Veículo</label>
                      <input
                        type="text"
                        value={newNews.source}
                        onChange={(e) => setNewNews({ ...newNews, source: e.target.value })}
                        placeholder="Ex: Portal de Notícias X"
                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                        style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">URL da Matéria</label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40">
                          <LinkIcon size={14} />
                        </div>
                        <input 
                          type="url"
                          value={newNews.url}
                          onChange={(e) => setNewNews({ ...newNews, url: e.target.value })}
                          placeholder="https://..."
                          className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                          style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Anexos / Mídias</label>
                    <div 
                      className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors hover:bg-slate-50 cursor-pointer"
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <Upload size={24} className="mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-medium opacity-60">Arraste arquivos ou clique para selecionar</p>
                      <p className="text-[10px] opacity-40 mt-1 uppercase tracking-wider">PDF, JPG, PNG, MP4 (Máx 50MB)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                  <div className="flex items-center gap-2 mb-4">
                    <UserPlus size={18} className="opacity-60" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Atribuição Rápida (Opcional)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-50">Selecionar Checador</label>
                      <select 
                        value={newNews.assignedTo}
                        onChange={(e) => setNewNews({ ...newNews, assignedTo: e.target.value })}
                        className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: themeConfig.general.inputBackground, 
                          borderColor: themeConfig.general.inputBorder,
                          color: themeConfig.general.inputText,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      >
                        <option value="">Não atribuir agora (Fila)</option>
                        {checkers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                    {newNews.assignedTo && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-50">Briefing / Orientação</label>
                        <input 
                          type="text"
                          value={newNews.briefing}
                          onChange={(e) => setNewNews({ ...newNews, briefing: e.target.value })}
                          placeholder="Instruções para o checador..."
                          className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
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
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold opacity-60 hover:opacity-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveRegister}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  Salvar Notícia
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {editingNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingNews(null)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">Editar Conteúdo</h2>
                <p className="text-sm opacity-70">Atualize as informações da notícia cadastrada.</p>
              </div>
              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Título *</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Alegação Principal</label>
                  <textarea
                    value={editForm.alegacao}
                    onChange={(e) => setEditForm({ ...editForm, alegacao: e.target.value })}
                    placeholder="Qual é a afirmação ou alegação que precisa ser verificada?"
                    rows={2}
                    className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Descrição / Contexto</label>
                  <textarea
                    value={editForm.descricao}
                    onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                    placeholder="Informações adicionais, contexto ou observações..."
                    rows={2}
                    className="w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 resize-none"
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Fonte / Veículo</label>
                    <input
                      type="text"
                      value={editForm.source}
                      onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                      placeholder="Ex: Portal de Notícias X"
                      className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">URL da Matéria</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40"><LinkIcon size={14} /></div>
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        placeholder="https://..."
                        className="w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                        style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-50">Prioridade</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as any })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText, '--tw-ring-color': themeConfig.general.accent } as any}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button
                  onClick={() => setEditingNews(null)}
                  className="px-6 py-2.5 text-sm font-bold opacity-60 hover:opacity-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isReceivedDetailOpen && selectedReceivedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReceivedDetailOpen(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 100 }}
              className="relative rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsReceivedDetailOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border" style={{ borderColor: themeConfig.general.border }}>
                      {getSourceIcon(selectedReceivedItem.sourceType)}
                      <span className="text-xs font-bold uppercase tracking-wider">{selectedReceivedItem.sourceType}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs opacity-50 font-medium">{new Date(selectedReceivedItem.receivedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-3xl font-black leading-tight tracking-tight">{selectedReceivedItem.title}</h2>
                  
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border whitespace-nowrap" style={{ borderColor: themeConfig.general.border }}>
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-40">Remetente</p>
                        <p className="text-sm font-bold">{selectedReceivedItem.senderName || 'Não identificado'}</p>
                      </div>
                    </div>
                    {selectedReceivedItem.senderAddress && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border whitespace-nowrap" style={{ borderColor: themeConfig.general.border }}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-40">Contato</p>
                          <p className="text-sm font-bold">{selectedReceivedItem.senderAddress}</p>
                        </div>
                      </div>
                    )}
                    {selectedReceivedItem.messageId && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 border whitespace-nowrap" style={{ borderColor: themeConfig.general.border }}>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <Activity size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold opacity-40">ID Mensagem</p>
                          <p className="text-sm font-bold">{selectedReceivedItem.messageId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-lg leading-relaxed opacity-80 whitespace-pre-wrap">{selectedReceivedItem.content}</p>
                </div>

                {selectedReceivedItem.media && selectedReceivedItem.media.length > 0 && (
                  <div className="space-y-4 pt-6 border-t" style={{ borderColor: themeConfig.general.border }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <Upload size={18} className="text-blue-500" />
                      Mídias e Anexos ({selectedReceivedItem.media.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReceivedItem.media.map((m, i) => (
                        <div key={i} className="group relative rounded-2xl overflow-hidden border aspect-video bg-slate-100 flex items-center justify-center" style={{ borderColor: themeConfig.general.border }}>
                          {m.type === 'image' && <img src={m.url} alt="" className="w-full h-full object-cover" />}
                          {m.type === 'video' && <TrendingUp size={32} className="opacity-20" />}
                          {m.type === 'audio' && <Bell size={32} className="opacity-20" />}
                          {m.type === 'document' && <FileText size={32} className="opacity-20" />}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white rounded-full text-black">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-white/80 text-[10px] font-bold uppercase tracking-widest">{m.type}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReceivedItem.originalLink && (
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <LinkIcon className="text-blue-600" size={20} />
                      <div>
                        <p className="text-[10px] font-bold uppercase text-blue-600">Link Original</p>
                        <p className="text-sm font-medium truncate max-w-md">{selectedReceivedItem.originalLink}</p>
                      </div>
                    </div>
                    <a href={selectedReceivedItem.originalLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                )}

                {selectedReceivedItem.internalNotes && (
                  <div className="space-y-2 pt-6 border-t" style={{ borderColor: themeConfig.general.border }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-50">Observações Internas</h3>
                    <div className="p-4 rounded-2xl bg-slate-50 border italic text-sm opacity-70" style={{ borderColor: themeConfig.general.border }}>
                      {selectedReceivedItem.internalNotes}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-80 border-l p-8 space-y-6 flex flex-col justify-between" style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider">Ações da Curadoria</h3>
                    <button 
                      onClick={() => {
                        onForwardToTriage(selectedReceivedItem);
                        setIsReceivedDetailOpen(false);
                      }}
                      className="w-full py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
                    >
                      <ArrowUpRight size={24} />
                      <span>Encaminhar para Triagem</span>
                    </button>
                    <button 
                      onClick={() => {
                        onDeleteReceivedNews(selectedReceivedItem.id);
                        setIsReceivedDetailOpen(false);
                      }}
                      className="w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={18} />
                      Excluir Notícia
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-white border space-y-3" style={{ borderColor: themeConfig.general.border }}>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <Info size={12} />
                      Log de Recebimento
                    </h4>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold">Conteúdo Recebido</p>
                          <p className="text-[10px] opacity-50 font-medium">Auto-captura via {selectedReceivedItem.sourceType}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold">Processado pelo Sistema</p>
                          <p className="text-[10px] opacity-50 font-medium">Metadados extraídos com sucesso</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsReceivedDetailOpen(false)}
                  className="w-full py-3 rounded-2xl font-bold opacity-60 hover:opacity-100 transition-opacity border"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTriagePreviewOpen(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-8 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                 <div className="flex items-center gap-4">
                    <button onClick={() => setIsTriagePreviewOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">Pré-visualização da Notícia</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Status: {currentTriageItem.status}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        handleOpenAssign(currentTriageItem.id);
                        setIsTriagePreviewOpen(false);
                      }}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2"
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <UserPlus size={16} />
                      Atribuir Checador
                    </button>
                    <button 
                      onClick={() => {
                        onSendToSpecializedNetwork(currentTriageItem.id);
                        setIsTriagePreviewOpen(false);
                      }}
                      disabled={currentTriageItem.sentToSpecializedNetwork}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-2"
                      style={{ 
                        backgroundColor: currentTriageItem.sentToSpecializedNetwork ? '#f1f5f9' : themeConfig.general.accent, 
                        color: currentTriageItem.sentToSpecializedNetwork ? '#94a3b8' : '#fff' 
                      }}
                    >
                      <Globe size={16} />
                      {currentTriageItem.sentToSpecializedNetwork ? 'Encaminhado' : 'Rede Especializada'}
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 flex flex-col md:flex-row gap-10">
                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       {getSourceIcon(currentTriageItem.source)}
                       <span className="text-sm font-black uppercase tracking-widest opacity-40">{currentTriageItem.source}</span>
                       <span className="text-sm opacity-30">•</span>
                       <span className="text-sm opacity-40 font-medium">{currentTriageItem.date}</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight leading-tight">{currentTriageItem.title}</h1>
                  </div>

                  <div className="prose prose-slate max-w-none">
                    <p className="text-lg leading-relaxed text-slate-600 font-medium whitespace-pre-wrap">{currentTriageItem.content}</p>
                  </div>

                  {currentTriageItem.media && currentTriageItem.media.length > 0 && (
                    <div className="space-y-4 pt-8 border-t" style={{ borderColor: themeConfig.general.border }}>
                      <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                        <Upload size={16} />
                        Arquivos e Mídias ({currentTriageItem.media.length})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {currentTriageItem.media.map((m, i) => (
                          <div key={i} className="group relative rounded-2xl overflow-hidden border aspect-video bg-slate-50 flex items-center justify-center" style={{ borderColor: themeConfig.general.border }}>
                            {m.type === 'image' && <img src={m.url} alt="" className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <a href={m.url} target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-2xl text-black shadow-xl">
                                 <ExternalLink size={18} />
                               </a>
                            </div>
                            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/90 text-[8px] font-black uppercase tracking-widest border border-slate-100">{m.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-80 space-y-8">
                  <div className="p-8 rounded-[2rem] border bg-slate-50 space-y-6" style={{ borderColor: themeConfig.general.border }}>
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Indicadores AI</h3>
                    <div className="space-y-4">
                       <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Gravidade</span>
                            <span>{currentTriageItem.aiScores?.gravity}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${currentTriageItem.aiScores?.gravity}%` }} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Urgência</span>
                            <span>{currentTriageItem.aiScores?.urgency}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${currentTriageItem.aiScores?.urgency}%` }} />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Tendência</span>
                            <span>{currentTriageItem.aiScores?.trend}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${currentTriageItem.aiScores?.trend}%` }} />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
