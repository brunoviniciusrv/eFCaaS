import React, { useState, useMemo } from 'react';
import { 
  Layout, 
  Users, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MoreVertical, 
  UserPlus, 
  MessageSquare, 
  ArrowRight,
  Kanban,
  List,
  Check,
  X,
  ChevronRight,
  Info,
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
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  NewsItem, 
  UserProfile, 
  ThemeConfig, 
  NewsStatus, 
  AssignmentHistory 
} from '../types';
import { StatusBadge } from './StatusBadge';

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
  onAssign: (newsId: string, checkerId: string, briefing: string) => void;
  onApprove: (newsId: string, comments: string) => void;
  onReject: (newsId: string, comments: string) => void;
  onReopen: (newsId: string, reason: string) => void;
  setSelectedNewsId: (id: string | null) => void;
  onAddNews: (newsData: any) => void;
}

type CuratorTab = 'triage' | 'list' | 'kanban' | 'workload' | 'reviews';

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
  onAddNews
}: CuratorDashboardProps) => {
  const navigate = useNavigate();
  const isEditor = currentUser.role === 'editor';
  const [activeTab, setActiveTab] = useState<CuratorTab>(isEditor ? 'list' : 'triage');
  const [searchQuery, setSearchQuery] = useState('');
  const [gravityFilter, setGravityFilter] = useState<number>(0);
  const [urgencyFilter, setUrgencyFilter] = useState<number>(0);
  const [trendFilter, setTrendFilter] = useState<number>(0);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningNewsId, setAssigningNewsId] = useState<string | null>(null);
  const [selectedCheckerId, setSelectedCheckerId] = useState<string>('');
  const [briefing, setBriefing] = useState('');
  const [reviewingNewsId, setReviewingNewsId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [reopeningNewsId, setReopeningNewsId] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [detailedCheckerId, setDetailedCheckerId] = useState<string | null>(null);
  const [newNews, setNewNews] = useState({
    title: '',
    source: '',
    url: '',
    content: '',
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

  const executeAssign = () => {
    if (!selectedCheckerId) return;
    
    if (assigningNewsId) {
      onAssign(assigningNewsId, selectedCheckerId, briefing);
    } else {
      selectedNewsIds.forEach(id => onAssign(id, selectedCheckerId, briefing));
    }
    
    setIsAssignModalOpen(false);
    setAssigningNewsId(null);
    setSelectedNewsIds([]);
    setSelectedCheckerId('');
    setBriefing('');
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

  const handleSaveRegister = () => {
    if (!newNews.title || !newNews.source) {
      alert("Título e Fonte são obrigatórios.");
      return;
    }
    onAddNews(newNews);
    setIsRegisterModalOpen(false);
    setNewNews({ 
      title: '', 
      source: '', 
      url: '', 
      content: '', 
      priority: 'medium', 
      assignedTo: '', 
      briefing: '' 
    });
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
    
    setNews(prev => prev.map(n => n.id === draggableId ? { ...n, status: newStatus } : n));
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
          <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center relative hover:bg-slate-50 cursor-pointer transition-colors">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-2.5 right-2.5 border-2 border-white" />
            <Bell size={18} className="opacity-40" />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1 rounded-2xl border w-fit" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
        {[
          { id: 'triage', label: 'Triagem', icon: List, hideForEditor: true },
          { id: 'list', label: 'Notícias', icon: Activity },
          { id: 'kanban', label: 'Fluxo', icon: Kanban, hideForEditor: true },
          { id: 'workload', label: 'Equipe', icon: Users, hideForEditor: true },
          { id: 'reviews', label: 'Revisões', icon: CheckCircle }
        ].filter(tab => !isEditor || !(tab as any).hideForEditor).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as CuratorTab)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id ? "shadow-sm" : "opacity-40 hover:opacity-100"
            )}
            style={{ 
              backgroundColor: activeTab === tab.id ? themeConfig.sidebar.activeBackground : 'transparent',
              color: activeTab === tab.id ? themeConfig.sidebar.activeText : themeConfig.sidebar.text
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

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
              {!isEditor && (
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
                  "p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row gap-6",
                  selectedNewsIds.includes(item.id) ? "ring-2" : ""
                )}
                style={{ 
                  backgroundColor: themeConfig.general.cardBackground, 
                  borderColor: selectedNewsIds.includes(item.id) ? themeConfig.general.accent : themeConfig.general.border,
                  '--tw-ring-color': themeConfig.general.accent
                } as any}
              >
                <div className="flex items-start gap-4">
                  <input 
                    type="checkbox"
                    checked={selectedNewsIds.includes(item.id)}
                    onChange={() => handleToggleSelection(item.id)}
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} themeConfig={themeConfig} />
                      <span className="text-xs opacity-50">{item.source} • {item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{item.title}</h3>
                    <p className="text-sm opacity-70 line-clamp-2">{item.content}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between gap-4 min-w-[240px]">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                        <span>Gravidade</span>
                        <span>{item.aiScores?.gravity}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all" 
                          style={{ 
                            width: `${item.aiScores?.gravity}%`, 
                            backgroundColor: (item.aiScores?.gravity || 0) > 70 ? themeConfig.status.error : themeConfig.status.warning 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                        <span>Urgência</span>
                        <span>{item.aiScores?.urgency}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all" 
                          style={{ 
                            width: `${item.aiScores?.urgency}%`, 
                            backgroundColor: themeConfig.status.warning 
                          }} 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest opacity-50">
                        <span>Tendência</span>
                        <span>{item.aiScores?.trend}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all" 
                          style={{ 
                            width: `${item.aiScores?.trend}%`, 
                            backgroundColor: themeConfig.status.info 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleOpenAssign(item.id)}
                    className="w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2"
                    style={{ borderColor: themeConfig.general.border, hover: { backgroundColor: `${themeConfig.general.accent}10` } } as any}
                  >
                    <UserPlus size={14} />
                    Atribuir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listagem de Notícias View */}
      {activeTab === 'list' && (
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
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Notícia</th>
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
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
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
                          {!isEditor && (
                            <button 
                              onClick={() => handleOpenAssign(item.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Atribuir / Redistribuir"
                            >
                              <UserPlus size={18} />
                            </button>
                          )}
                          {item.status === 'completed' && !isEditor && (
                            <button 
                              onClick={() => setReopeningNewsId(item.id)}
                              className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Reabrir para Revisão"
                            >
                              <RotateCcw size={18} />
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
                <p className="text-lg font-bold">Nenhuma notícia encontrada</p>
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
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold opacity-60 hover:opacity-100"
                >
                  Cancelar
                </button>
                <button 
                  onClick={executeAssign}
                  disabled={!selectedCheckerId}
                  className="px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  Confirmar Atribuição
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
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Título da Notícia</label>
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
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Fonte / Veículo</label>
                    <input 
                      type="text"
                      value={newNews.source}
                      onChange={(e) => setNewNews({ ...newNews, source: e.target.value })}
                      placeholder="Ex: Portal de Notícias X"
                      className="w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
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
                        style={{ 
                          backgroundColor: themeConfig.general.inputBackground, 
                          borderColor: themeConfig.general.inputBorder,
                          color: themeConfig.general.inputText,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-50">Descrição / Resumo</label>
                    <textarea 
                      value={newNews.content}
                      onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                      placeholder="Breve descrição sobre o conteúdo da notícia..."
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
      </AnimatePresence>
    </div>
  );
};
