import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsItem, UserProfile, NewsStatus, AssignmentHistory, AuditLog } from '../types';
import { MOCK_USERS } from '../constants';
import { 
  Users as UsersIcon, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  UserPlus, 
  MoreVertical,
  ArrowUpDown,
  Search,
  Filter,
  ExternalLink,
  History,
  Shield,
  UserX,
  UserCheck,
  FileText,
  Activity,
  Plus,
  Settings as SettingsIcon,
  Tag,
  Layout,
  Trash2,
  Edit2,
  Check,
  Calendar,
  TrendingUp,
  PieChart as PieChartIcon,
  Info,
  Image as ImageIcon,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { LabelConfig, ReportStructureConfig, ThemeConfig, AgencyConfig } from '../types';

interface AdminDashboardProps {
  news: NewsItem[];
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  auditLogs: AuditLog[];
  labels: LabelConfig[];
  setLabels: React.Dispatch<React.SetStateAction<LabelConfig[]>>;
  reportConfig: ReportStructureConfig;
  setReportConfig: React.Dispatch<React.SetStateAction<ReportStructureConfig>>;
  themeConfig: ThemeConfig;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  agencyConfig: AgencyConfig;
  setAgencyConfig: React.Dispatch<React.SetStateAction<AgencyConfig>>;
  currentUser: UserProfile;
  setSelectedNewsId: (id: string | null) => void;
}

type AdminTab = 'dashboard' | 'users' | 'audit' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  news, 
  setNews, 
  users,
  setUsers,
  auditLogs,
  labels,
  setLabels,
  reportConfig,
  setReportConfig,
  themeConfig,
  setThemeConfig,
  agencyConfig,
  setAgencyConfig,
  currentUser,
  setSelectedNewsId
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');
  
  // Modal states
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'checker' as UserProfile['role'] });
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState<Omit<LabelConfig, 'id'>>({ name: 'Verdadeiro', description: '', color: '#94a3b8' });

  const metricsData = useMemo(() => {
    const now = new Date();
    const rangeMap = {
      'all': 0,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const startTime = dateRange === 'all' ? 0 : now.getTime() - rangeMap[dateRange];
    
    const filteredNewsForMetrics = news.filter(n => {
      const itemDate = new Date(n.date).getTime();
      return itemDate >= startTime;
    });

    const completedNews = filteredNewsForMetrics.filter(n => n.status === 'completed');
    const totalChecks = completedNews.length;
    
    // Average check time in hours
    const checkTimes = completedNews
      .filter(n => n.startTime && n.completedAt)
      .map(n => {
        const start = new Date(n.startTime!).getTime();
        const end = new Date(n.completedAt!).getTime();
        return (end - start) / (1000 * 60 * 60);
      });
    
    const avgCheckTime = checkTimes.length > 0 
      ? checkTimes.reduce((a, b) => a + b, 0) / checkTimes.length 
      : 0;
      
    const rectificationCount = filteredNewsForMetrics.filter(n => n.isRectified).length;
    const rectificationRate = filteredNewsForMetrics.length > 0 
      ? (rectificationCount / filteredNewsForMetrics.length) * 100 
      : 0;

    // Daily volume for chart
    const dailyVolume: { date: string, count: number }[] = [];
    const lastN = dateRange === 'all' ? 30 : (dateRange === '7d' ? 7 : (dateRange === '30d' ? 30 : 90));
    
    for (let i = lastN - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completedNews.filter(n => n.completedAt?.startsWith(dateStr)).length;
      dailyVolume.push({ date: dateStr, count });
    }

    // Status distribution
    const statusDist = [
      { name: 'Pendente', value: filteredNewsForMetrics.filter(n => n.status === 'pending').length, color: themeConfig.status.info },
      { name: 'Em Análise', value: filteredNewsForMetrics.filter(n => n.status === 'in_progress').length, color: themeConfig.status.warning },
      { name: 'Concluída', value: filteredNewsForMetrics.filter(n => n.status === 'completed').length, color: themeConfig.status.success },
      { name: 'Retificação', value: filteredNewsForMetrics.filter(n => n.status === 'to_rectify').length, color: themeConfig.status.error },
    ];

    return {
      totalChecks,
      avgCheckTime,
      rectificationRate,
      dailyVolume,
      statusDist,
      totalInPeriod: filteredNewsForMetrics.length
    };
  }, [news, dateRange, themeConfig]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => 
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [auditLogs, searchTerm]);

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? {
      ...u,
      status: u.status === 'active' ? 'suspended' : 'active'
    } : u));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    };
    setUsers(prev => [...prev, user]);
    setIsAddingUser(false);
    setNewUser({ name: '', email: '', role: 'checker' });
  };

  const handleSaveLabel = () => {
    if (!newLabel.name || !newLabel.description) return;
    
    // Check uniqueness
    if (!editingLabelId && labels.some(l => l.name === newLabel.name)) {
      alert('Já existe uma etiqueta com este nome.');
      return;
    }

    if (editingLabelId) {
      setLabels(prev => prev.map(l => l.id === editingLabelId ? { ...l, ...newLabel } : l));
      setEditingLabelId(null);
    } else {
      const label: LabelConfig = {
        id: Math.random().toString(36).substr(2, 9),
        ...newLabel
      };
      setLabels(prev => [...prev, label]);
    }
    setIsAddingLabel(false);
    setNewLabel({ name: 'Verdadeiro', description: '', color: 'bg-slate-500' });
  };

  const handleDeleteLabel = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta etiqueta?')) {
      setLabels(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleToggleMandatoryField = (field: string) => {
    setReportConfig(prev => ({
      ...prev,
      mandatoryFields: prev.mandatoryFields.includes(field)
        ? prev.mandatoryFields.filter(f => f !== field)
        : [...prev.mandatoryFields, field]
    }));
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

  const StatusBadge = ({ status }: { status: NewsStatus }) => {
    const config = {
      pending: { label: 'Fila da Agência', color: themeConfig.status.info, icon: Clock },
      in_progress: { label: 'Em Análise', color: themeConfig.status.warning, icon: AlertCircle },
      completed: { label: 'Concluída', color: themeConfig.status.success, icon: CheckCircle2 },
      to_rectify: { label: 'Em Retificação', color: themeConfig.status.error, icon: RotateCcw },
      final_review: { label: 'Revisão Final', color: '#8b5cf6', icon: CheckCircle2 },
    };
    
    const currentConfig = config[status] || { label: status, color: '#94a3b8', icon: AlertCircle };
    const { label, color, icon: Icon } = currentConfig;
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon size={12} />
        {label}
      </span>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" style={{ color: themeConfig.dashboard.text }}>
      <style>
        {`
          .custom-table-row:hover {
            background-color: ${themeConfig.general.tableRowHover} !important;
          }
        `}
      </style>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg -rotate-2">
             <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: themeConfig.header.text }}>Gestão Administrativa</h1>
            <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Painel de Controle Operacional</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {(activeTab === 'users' || activeTab === 'audit') && (
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity" size={16} />
              <input 
                type="text"
                placeholder={activeTab === 'users' ? "Filtrar integrantes..." : "Filtrar rastros..."}
                className="pl-11 pr-5 py-2.5 border rounded-xl text-xs font-bold focus:outline-none focus:ring-4 w-60 transition-all"
                style={{ 
                  backgroundColor: themeConfig.general.inputBackground, 
                  color: themeConfig.general.inputText,
                  borderColor: themeConfig.general.inputBorder,
                  '--tw-ring-color': `${themeConfig.general.accent}10` 
                } as any}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          {activeTab === 'users' && (
            <button 
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ 
                backgroundColor: themeConfig.buttons.primary, 
                color: themeConfig.buttons.primaryText,
                boxShadow: `0 8px 20px -6px ${themeConfig.buttons.primary}60`
              }}
            >
              <Plus size={14} />
              Novo Agente
            </button>
          )}
          
          <div className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center relative hover:bg-slate-50 cursor-pointer transition-colors">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute top-2.5 right-2.5 border-2 border-white" />
             <Activity size={18} className="opacity-40" />
          </div>
        </div>
      </header>

      {/* Tabs - Pill style */}
      <div className="flex p-1 rounded-2xl border w-fit" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'users', label: 'Equipe', icon: UsersIcon },
          { id: 'audit', label: 'Logs', icon: FileText },
          { id: 'settings', label: 'Ajustes', icon: SettingsIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as AdminTab); setSearchTerm(''); }}
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

      {/* Main Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'dashboard' && (
          <div 
            className="space-y-8 animate-in fade-in slide-in-from-bottom-4 p-8 rounded-3xl"
            style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold" style={{ color: themeConfig.dashboard.text }}>Métricas de Desempenho</h2>
                <p className="text-xs opacity-70">Acompanhamento estratégico da plataforma</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {[
                  { id: '7d', label: '7 Dias' },
                  { id: '30d', label: '30 Dias' },
                  { id: '90d', label: '90 Dias' },
                  { id: 'all', label: 'Tudo' },
                ].map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setDateRange(range.id as any)}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                      dateRange === range.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checagens Realizadas</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: themeConfig.dashboard.text }}>{metricsData.totalChecks}</span>
                  <span className="text-xs opacity-50">concluídas</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-green-600 text-xs font-bold">
                  <TrendingUp size={14} />
                  <span>+12% vs período anterior</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tempo Médio</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: themeConfig.dashboard.text }}>{metricsData.avgCheckTime.toFixed(1)}h</span>
                  <span className="text-xs opacity-50">por checagem</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-bold">
                  <Activity size={14} />
                  <span>Dentro do SLA (24h)</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <RotateCcw size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Taxa de Retificação</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: themeConfig.dashboard.text }}>{metricsData.rectificationRate.toFixed(1)}%</span>
                  <span className="text-xs opacity-50">das análises</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <Info size={14} />
                  <span>Meta: abaixo de 5%</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume Total</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold" style={{ color: themeConfig.dashboard.text }}>{metricsData.totalInPeriod}</span>
                  <span className="text-xs opacity-50">notícias recebidas</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <Calendar size={14} />
                  <span>No período selecionado</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-slate-900">Volume de Checagens Concluídas</h3>
                    <p className="text-xs text-slate-500">Histórico diário de finalizações</p>
                  </div>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData.dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke={themeConfig.dashboard.chartColors[0] || "#3b82f6"} 
                        strokeWidth={3} 
                        dot={{ r: 4, fill: themeConfig.dashboard.chartColors[0] || '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        name="Checagens"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="mb-8">
                  <h3 className="font-bold text-slate-900">Distribuição por Status</h3>
                  <p className="text-xs text-slate-500">Status atual das notícias no período</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricsData.statusDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {metricsData.statusDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {metricsData.statusDist.map((s) => (
                    <div key={s.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-600 font-medium">{s.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'users' && (
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Usuário</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>E-mail</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Função</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-right" style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="custom-table-row transition-colors" style={{ color: themeConfig.dashboard.text }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                        <span className="text-sm font-semibold" style={{ color: themeConfig.dashboard.text }}>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm opacity-70">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                        user.status === 'active' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {user.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Shield size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            user.status === 'active' ? "text-slate-400 hover:text-red-600 hover:bg-red-50" : "text-green-600 bg-green-50 hover:bg-green-100"
                          )}
                        >
                          {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Data / Hora</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Usuário</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Ação</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Alvo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: themeConfig.general.tableHeaderText }}>Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="custom-table-row transition-colors" style={{ color: themeConfig.dashboard.text }}>
                    <td className="px-6 py-4 text-xs opacity-60 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold" style={{ color: themeConfig.dashboard.text }}>{log.userName}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${themeConfig.general.accent}15`, color: themeConfig.general.accent }}>
                        {log.action.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm opacity-70">{log.target || '-'}</td>
                    <td className="px-6 py-4 text-xs opacity-60 italic">{log.details || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            {/* Agency Settings */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: themeConfig.dashboard.text }}>Configurações da Agência</h2>
                  <p className="text-sm opacity-60" style={{ color: themeConfig.dashboard.text }}>Identidade e marca da sua agência de checagem</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-8" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logo da Agência</label>
                    <div className="flex items-center gap-6">
                      <div className="relative group w-24 h-24">
                        <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50" style={{ borderColor: themeConfig.general.border }}>
                          {agencyConfig.logoUrl ? (
                            <img src={agencyConfig.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                          ) : (
                            <ImageIcon size={32} className="text-slate-300" />
                          )}
                        </div>
                        <label className="absolute inset-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center rounded-2xl">
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setAgencyConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                          <Plus className="text-white" size={24} />
                        </label>
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold" style={{ color: themeConfig.dashboard.text }}>Alterar Logotipo</p>
                        <p className="text-xs text-slate-500">Recomendado: PNG ou SVG com fundo transparente. Máx 1MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome de Exibição</label>
                    <input 
                      type="text"
                      value={agencyConfig.name}
                      onChange={(e) => setAgencyConfig(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText,
                        '--tw-ring-color': themeConfig.general.accent
                      } as any}
                      placeholder="Nome da sua agência"
                    />
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Labels Management */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Tag style={{ color: themeConfig.general.accent }} size={20} />
                  <h2 className="text-lg font-bold" style={{ color: themeConfig.dashboard.text }}>Gestão de Etiquetas</h2>
                </div>
                <button 
                  onClick={() => {
                    setNewLabel({ name: 'Verdadeiro', description: '', color: 'bg-slate-500' });
                    setEditingLabelId(null);
                    setIsAddingLabel(true);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  <Plus size={14} />
                  Nova Etiqueta
                </button>
              </div>

              <div className="rounded-xl border shadow-sm overflow-hidden" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                <div className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                  {labels.map((label) => (
                    <div key={label.id} className="p-4 flex items-center justify-between hover:bg-black/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                        <div>
                          <h4 className="text-sm font-bold" style={{ color: themeConfig.dashboard.text }}>{label.name}</h4>
                          <p className="text-xs opacity-60" style={{ color: themeConfig.dashboard.text }}>{label.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setNewLabel({ name: label.name, description: label.description, color: label.color });
                            setEditingLabelId(label.id);
                            setIsAddingLabel(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteLabel(label.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Layout style={{ color: themeConfig.general.accent }} size={20} />
                <h2 className="text-lg font-bold" style={{ color: themeConfig.dashboard.text }}>Estrutura de Relatórios</h2>
              </div>

              <div className="rounded-xl border shadow-sm p-6 space-y-8" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                {/* Mandatory Fields */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-70" style={{ color: themeConfig.dashboard.text }}>Campos Obrigatórios</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'summary', label: 'Resumo da Análise' },
                      { id: 'questions', label: 'Perguntas de Investigação' },
                      { id: 'sources', label: 'Fontes Consultadas' },
                      { id: 'label', label: 'Etiqueta de Veracidade' },
                      { id: 'contact', label: 'Contato com Autor' },
                    ].map((field) => (
                      <label key={field.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors" style={{ borderColor: themeConfig.general.border, backgroundColor: themeConfig.general.inputBackground }}>
                        <input 
                          type="checkbox"
                          checked={reportConfig.mandatoryFields.includes(field.id)}
                          onChange={() => handleToggleMandatoryField(field.id)}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ color: themeConfig.general.accent, '--tw-ring-color': themeConfig.general.accent } as any}
                        />
                        <span className="text-sm font-medium" style={{ color: themeConfig.general.inputText }}>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Limits */}
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-70" style={{ color: themeConfig.dashboard.text }}>Limites e Restrições</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: themeConfig.dashboard.text }}>Máximo de Perguntas</p>
                        <p className="text-xs opacity-60" style={{ color: themeConfig.dashboard.text }}>Limite de questões por relatório</p>
                      </div>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={reportConfig.maxQuestions}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, maxQuestions: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: themeConfig.general.inputBackground, 
                          color: themeConfig.general.inputText,
                          borderColor: themeConfig.general.inputBorder,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: themeConfig.dashboard.text }}>Máximo de Fontes</p>
                        <p className="text-xs opacity-60" style={{ color: themeConfig.dashboard.text }}>Limite de fontes citadas</p>
                      </div>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={reportConfig.maxSources}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, maxSources: parseInt(e.target.value) || 1 }))}
                        className="w-20 px-3 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2"
                        style={{ 
                          backgroundColor: themeConfig.general.inputBackground, 
                          color: themeConfig.general.inputText,
                          borderColor: themeConfig.general.inputBorder,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      />
                    </div>
                  </div>
                </div>

                {/* Font Selection */}
                <div className="space-y-4 pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider opacity-70" style={{ color: themeConfig.dashboard.text }}>Tipografia da Plataforma</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { id: 'Inter', name: 'Inter (Padrão)' },
                      { id: 'Outfit', name: 'Outfit (Moderno)' },
                      { id: 'Space Grotesk', name: 'Space Grotesk (Tech)' },
                      { id: 'Playfair Display', name: 'Playfair Display (Serif)' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setThemeConfig(prev => ({ ...prev, fontFamily: f.id }))}
                        className={cn(
                          "px-4 py-3 rounded-xl border text-left transition-all",
                          themeConfig.fontFamily === f.id ? "ring-2" : "opacity-70 hover:opacity-100"
                        )}
                        style={{ 
                          fontFamily: f.id,
                          borderColor: themeConfig.fontFamily === f.id ? themeConfig.general.accent : themeConfig.general.border,
                          backgroundColor: themeConfig.fontFamily === f.id ? `${themeConfig.general.accent}10` : themeConfig.general.inputBackground,
                          color: themeConfig.fontFamily === f.id ? themeConfig.general.accent : themeConfig.general.inputText,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: themeConfig.general.border }}>
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: `${themeConfig.status.warning}15`, color: themeConfig.status.warning }}>
                    <AlertCircle size={16} />
                    <p className="text-xs font-medium">Estas configurações serão aplicadas automaticamente a todos os novos relatórios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Customization */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <Activity className="text-blue-600" size={20} />
                <h2 className="text-lg font-bold text-slate-900">Personalização Visual da Plataforma</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dashboard Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Dashboard Administrativo</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.dashboard.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor do Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.dashboard.text}</span>
                      </div>
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Cores dos Gráficos</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {themeConfig.dashboard.chartColors.map((color, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex items-center gap-3">
                              <input 
                                type="color" 
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...themeConfig.dashboard.chartColors];
                                  newColors[idx] = e.target.value;
                                  setThemeConfig(prev => ({
                                    ...prev,
                                    dashboard: { ...prev.dashboard, chartColors: newColors }
                                  }));
                                }}
                                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                              />
                              <span className="text-[10px] font-mono text-slate-400 uppercase">{color}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Fluxo de Checagem</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor do Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Pendente</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockPending}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockPending: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockPending}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Em Análise</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockInProgress}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockInProgress: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockInProgress}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Concluído</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockCompleted}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockCompleted: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockCompleted}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Retificação</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockRectify}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockRectify: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockRectify}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Barra Lateral e Navegação</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor do Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo Ativo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.activeBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto Ativo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.activeText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Cabeçalho</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor do Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor da Borda</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, border: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Dashboard</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.dashboard.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor do Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.dashboard.text}</span>
                      </div>
                    </div>
                    <div className="col-span-full space-y-3">
                      <label className="block text-xs font-semibold text-slate-600">Cores dos Gráficos</label>
                      <div className="flex flex-wrap gap-4">
                        {themeConfig.dashboard.chartColors.map((color, index) => (
                          <div key={index} className="flex flex-col items-center gap-1">
                            <input 
                              type="color" 
                              value={color}
                              onChange={(e) => {
                                const newColors = [...themeConfig.dashboard.chartColors];
                                newColors[index] = e.target.value;
                                setThemeConfig(prev => ({
                                  ...prev,
                                  dashboard: { ...prev.dashboard, chartColors: newColors }
                                }));
                              }}
                              className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                            />
                            <span className="text-[10px] font-mono text-slate-400 uppercase">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Barra Lateral (Sidebar)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo Item Ativo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.activeBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto Item Ativo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.activeText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Borda</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, border: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.sidebar.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Cabeçalho (Header)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Borda</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.header.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, border: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.header.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Fluxo de Notícias</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo do Fluxo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, background: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.background}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto do Fluxo</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, text: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.text}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Pendente</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockPending}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockPending: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockPending}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco em Progresso</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockInProgress}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockInProgress: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockInProgress}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Concluído</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockCompleted}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockCompleted: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockCompleted}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Bloco Retificação</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockRectify}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockRectify: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.flow.blockRectify}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Botões e Ações</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Primário (Fundo)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.primary}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, primary: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.primary}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Primário (Texto)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.primaryText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.primaryText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Secundário (Fundo)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.secondary}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondary: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.secondary}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Secundário (Texto)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.secondaryText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.secondaryText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Perigo (Fundo)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.danger}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, danger: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.danger}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Perigo (Texto)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.buttons.dangerText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, dangerText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.buttons.dangerText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Status e Alertas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Sucesso</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.status.success}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, success: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.status.success}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Erro</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.status.error}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, error: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.status.error}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Aviso</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.status.warning}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, warning: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.status.warning}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Informação</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.status.info}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, info: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.status.info}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* General Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Geral e Superfícies</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo de Cards</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.cardBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, cardBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.cardBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Borda</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, border: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.border}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Cor de Destaque (Accent)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.accent}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, accent: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.accent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inputs Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Campos de Entrada (Inputs)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo do Input</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.inputBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.inputBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto do Input</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.inputText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.inputText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Borda do Input</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.inputBorder}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputBorder: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.inputBorder}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Placeholder</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.inputPlaceholder}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputPlaceholder: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.inputPlaceholder}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modals Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Modais</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo do Modal</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.modalBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.modalBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto do Modal</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.modalText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.modalText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Sobreposição (Overlay)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="text" 
                          value={themeConfig.general.modalOverlay}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalOverlay: e.target.value }
                          }))}
                          placeholder="rgba(0,0,0,0.5)"
                          className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tables Theme */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Tabelas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Fundo do Cabeçalho</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.tableHeaderBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableHeaderBackground: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.tableHeaderBackground}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Texto do Cabeçalho</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.tableHeaderText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableHeaderText: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.tableHeaderText}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-600">Hover da Linha</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={themeConfig.general.tableRowHover}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableRowHover: e.target.value }
                          }))}
                          className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100 p-0.5"
                        />
                        <span className="text-xs font-mono text-slate-400 uppercase">{themeConfig.general.tableRowHover}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Label Modal */}
      <AnimatePresence>
        {isAddingLabel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingLabel(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">
                  {editingLabelId ? 'Editar Etiqueta' : 'Nova Etiqueta'}
                </h2>
                <p className="text-sm opacity-70">Defina como as notícias serão classificadas</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider">Nome da Etiqueta</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    placeholder="Ex: Manipulado"
                    value={newLabel.name}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value as any }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider">Descrição</label>
                  <textarea 
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 h-24 resize-none"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    placeholder="Explique o significado desta etiqueta..."
                    value={newLabel.description}
                    onChange={(e) => setNewLabel(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.general.modalText }}>Cor de Identificação</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={newLabel.color.startsWith('bg-') ? '#94a3b8' : newLabel.color}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-100 p-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-mono uppercase tracking-wider opacity-60">
                        {newLabel.color.startsWith('bg-') ? '#94a3b8' : newLabel.color}
                      </p>
                      <p className="text-[10px] opacity-40">Escolha uma cor para esta etiqueta</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAddingLabel(false)}
                  className="px-4 py-2 text-sm font-medium opacity-70 hover:opacity-100"
                  style={{ color: themeConfig.general.modalText }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveLabel}
                  disabled={!newLabel.name || !newLabel.description}
                  className="px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
                >
                  {editingLabelId ? 'Salvar Alterações' : 'Criar Etiqueta'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingUser(false)}
              className="absolute inset-0 backdrop-blur-sm"
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className="p-6 border-b" style={{ borderColor: themeConfig.general.border }}>
                <h2 className="text-xl font-bold">Cadastrar Novo Usuário</h2>
                <p className="text-sm opacity-70">Um convite será enviado para o e-mail informado</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider">Nome Completo</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    placeholder="Ex: João Silva"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider">E-mail</label>
                  <input 
                    type="email"
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    placeholder="exemplo@agencia.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider">Função / Perfil</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                  >
                    <option value="checker">Checador</option>
                    <option value="editor">Editor</option>
                    <option value="curator">Curador</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="p-4 flex justify-end gap-3" style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 text-sm font-medium opacity-70 hover:opacity-100"
                  style={{ color: themeConfig.general.modalText }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email}
                  className="px-6 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
                >
                  Enviar Convite
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
