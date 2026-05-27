import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Search, 
  AlertCircle,
  ChevronRight,
  GripVertical,
  Activity,
  Link as LinkIcon,
  Image as ImageIcon,
  History,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileText,
  Users as UsersIcon,
  Lock,
  Layout,
  Info,
  Calendar
} from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { NewsItem, UserProfile, ThemeConfig, PermissionProfile, AuditLog, LabelConfig } from '../types';
import { cn } from '../lib/utils';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  news: NewsItem[];
  user: UserProfile;
  setSelectedNewsId: (id: string | null) => void;
  handleStartAnalysis: (id: string) => void;
  handleMoveTask: (id: string, targetStatus: 'pending' | 'in_progress') => void;
  themeConfig: ThemeConfig;
  notifications: any[];
  onMarkNotifAsRead: (id: string) => void;
  onClearNotifs: () => void;
  checkPermission: (permId: string) => boolean;
  users?: UserProfile[];
  permissionProfiles?: PermissionProfile[];
  auditLogs?: AuditLog[];
  labels?: LabelConfig[];
}

export const Dashboard = ({ 
  news, 
  user, 
  setSelectedNewsId, 
  handleStartAnalysis,
  handleMoveTask,
  themeConfig,
  notifications,
  onMarkNotifAsRead,
  onClearNotifs,
  checkPermission,
  users = [],
  permissionProfiles = [],
  auditLogs = [],
  labels = []
}: DashboardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checagem' | 'redacao' | 'metricas'>(
    checkPermission('perform_analysis') || checkPermission('view_analysis') ? 'checagem' : 
    checkPermission('view_editor') || checkPermission('view_archive') ? 'redacao' :
    'metricas'
  );
  
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');

  const metricsData = useMemo(() => {
    const now = new Date();
    const rangeMap = {
      'all': 0,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000
    };
    
    const startTime = dateRange === 'all' ? 0 : now.getTime() - rangeMap[dateRange];
    
    // Filter audit logs based on the date range
    const filteredLogsForMetrics = auditLogs.filter(l => {
      const logDate = new Date(l.timestamp).getTime();
      return logDate >= startTime;
    });
    
    const totalLogs = filteredLogsForMetrics.length;
    
    // Daily audit volume for chart
    const dailyVolume: { date: string, count: number }[] = [];
    const lastN = dateRange === 'all' ? 30 : (dateRange === '7d' ? 7 : (dateRange === '30d' ? 30 : 90));
    
    for (let i = lastN - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = filteredLogsForMetrics.filter(l => l.timestamp.startsWith(dateStr)).length;
      dailyVolume.push({ date: dateStr, count });
    }

    // Status distribution
    const statusDist = [
      { name: 'Admins', value: users.filter(u => u.role === 'admin').length, color: themeConfig.status.info },
      { name: 'Editores', value: users.filter(u => u.role === 'editor').length, color: themeConfig.status.warning },
      { name: 'Checadores', value: users.filter(u => u.role === 'checker').length, color: themeConfig.status.success },
      { name: 'Curadores', value: users.filter(u => u.role === 'curator').length, color: themeConfig.status.error },
    ];

    return {
      activeUsers: users.filter(u => u.status === 'active').length,
      totalProfiles: permissionProfiles.length,
      totalLogs,
      totalLabels: labels.length,
      dailyVolume,
      statusDist,
    };
  }, [dateRange, themeConfig, users, permissionProfiles, auditLogs, labels]);

  const stats = [
    { name: 'Em Aberto', value: news.filter(n => n.status === 'pending').length, color: themeConfig.status.info, icon: Clock },
    { name: 'Minhas Tarefas', value: news.filter(n => ['in_progress', 'to_rectify'].includes(n.status) && n.assignedTo === user.id).length, color: themeConfig.status.warning, icon: Activity },
    { name: 'Concluídas', value: news.filter(n => n.status === 'completed').length, color: themeConfig.status.success, icon: CheckCircle2 },
    { name: 'Urgentes', value: news.filter(n => n.status !== 'completed' && n.priority === 'high').length, color: themeConfig.status.error, icon: AlertTriangle },
  ];

  const myTasks = news.filter(n => ['in_progress', 'to_rectify'].includes(n.status) && n.assignedTo === user.id);
  const availableQueue = news.filter(n => n.status === 'pending');

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (source.droppableId === 'available' && destination.droppableId === 'myTasks') {
      handleMoveTask(draggableId, 'in_progress');
    } else if (source.droppableId === 'myTasks' && destination.droppableId === 'available') {
      handleMoveTask(draggableId, 'pending');
    }
  };

  const handleExploreCuration = () => {
    if (checkPermission('view_admin')) {
      navigate('/admin');
    } else if (checkPermission('view_curator')) {
      navigate('/curator');
    }
  };

  return (
    <div 
      className="min-h-screen p-6 md:p-12 transition-colors duration-500"
      style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Welcome Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-[0.2em]"
              >
                <Sparkles size={14} />
                Plataforma de Inteligência
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl md:text-5xl font-black tracking-tight"
              >
                Olá, {user.name.split(' ')[0]}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg opacity-40 font-medium"
              >
                Monitorando a integridade da informação em tempo real.
              </motion.p>
           </div>
           
           <div className="flex flex-col items-end gap-6">
              <div className="flex items-center gap-4">
                <NotificationBell 
                  notifications={notifications}
                  onMarkAsRead={onMarkNotifAsRead}
                  onClearAll={onClearNotifs}
                  themeConfig={themeConfig}
                  currentUser={user}
                />
              </div>
              
              {/* Tabs Dropdown/Menu for switching contexts */}
              <div className="flex p-1 rounded-2xl border w-fit" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                {[
                  { id: 'checagem', label: 'Checagem', icon: Activity, permission: ['perform_analysis', 'view_analysis'] },
                  { id: 'redacao', label: 'Redação', icon: FileText, permission: ['view_editor', 'view_archive'] },
                  { id: 'metricas', label: 'Métricas', icon: TrendingUp, permission: ['view_admin'] },
                ].filter(tab => tab.permission.some(p => checkPermission(p))).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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
           </div>
        </section>

        {activeTab === 'checagem' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
            {/* Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  className="relative p-6 rounded-[2rem] border bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-2xl hover:bg-white hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className="flex items-start justify-between">
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{stat.name}</p>
                        <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                     </div>
                     <div className="p-3 rounded-2xl transition-all duration-500 group-hover:scale-110" style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                        <stat.icon size={22} />
                     </div>
                  </div>
                  <div 
                    className="absolute bottom-0 left-0 h-1 transition-all duration-700 w-0 group-hover:w-full opacity-60"
                    style={{ backgroundColor: stat.color }}
                  />
                </motion.div>
              ))}
            </section>

            {/* Performance & Queue */}
            <DragDropContext onDragEnd={onDragEnd}>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              
              {/* My Tasks */}
              <div className="lg:col-span-7 flex flex-col space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                       <LayoutDashboard size={20} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black uppercase tracking-tight">Minhas Tarefas</h2>
                       <p className="text-xs opacity-40 font-medium">Fluxo de análise ativa</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {myTasks.length} ATIVAS
                    </span>
                  </div>
                </div>

                <Droppable droppableId="myTasks">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "min-h-[400px] p-2 rounded-[2.5rem] border-2 transition-all duration-500",
                        snapshot.isDraggingOver ? "bg-blue-50/30 border-blue-200 border-solid" : "border-slate-100 border-dashed"
                      )}
                    >
                      <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                          {myTasks.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="outline-none"
                                >
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => handleStartAnalysis(item.id)}
                                    className={cn(
                                      "p-6 rounded-[2rem] border bg-white transition-all cursor-pointer group relative overflow-hidden",
                                      snapshot.isDragging ? "shadow-2xl scale-[1.02] border-blue-500 z-50 ring-8 ring-blue-100/50" : "hover:shadow-xl hover:border-slate-300 shadow-sm"
                                    )}
                                    style={{ 
                                      borderColor: themeConfig.general.border,
                                      opacity: snapshot.isDragging ? 0.95 : 1
                                    }}
                                  >
                                    <div 
                                      className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2"
                                      style={{ backgroundColor: item.priority === 'high' ? themeConfig.status.error : themeConfig.status.info }}
                                    />
                                    
                                    <div className="pl-3 space-y-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={item.status} themeConfig={themeConfig} />
                                          {item.priority === 'high' && (
                                            <div className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                              URGENTE
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-20 mt-1">{item.date}</span>
                                      </div>

                                      <div>
                                        <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                          {item.title}
                                        </h3>
                                        <p className="text-sm opacity-40 font-medium line-clamp-1">{item.content}</p>
                                      </div>

                                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-3">
                                          <div className="px-2 py-1 rounded-lg bg-slate-50 text-[9px] font-black text-slate-400 border border-slate-100 uppercase tracking-tight">
                                             {item.source}
                                          </div>
                                          <div className="flex items-center gap-2">
                                             <div className="flex items-center gap-1">
                                                <TrendingUp size={10} className="text-blue-400" />
                                                <span className="text-[9px] font-black opacity-30">{item.aiScores?.trend}% viral</span>
                                             </div>
                                          </div>
                                        </div>
                                        
                                        <button className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                                           Investigar <ArrowRight size={12} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-10 transition-opacity">
                                      <GripVertical size={24} />
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        
                        {myTasks.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center px-4 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                               <LayoutDashboard size={32} />
                            </div>
                            <div className="max-w-xs">
                               <p className="text-sm font-black uppercase tracking-widest mb-1">Fila Vazia</p>
                               <p className="text-xs font-medium">Arraste boatos para começar.</p>
                            </div>
                          </div>
                        )}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Queue */}
              <div className="lg:col-span-5 space-y-10">
                
                <div className="flex flex-col space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-100">
                         <Clock size={20} />
                      </div>
                      <div>
                         <h2 className="text-xl font-black uppercase tracking-tight">Triagem</h2>
                         <p className="text-xs opacity-40 font-medium">Entradas pendentes</p>
                      </div>
                    </div>
                  </div>

                  <Droppable droppableId="available">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(
                          "min-h-[300px] p-2 rounded-[2.5rem] border-2 transition-all duration-500",
                          snapshot.isDraggingOver ? "bg-amber-50/30 border-amber-200 border-solid" : "border-slate-100 border-dashed"
                        )}
                      >
                        <div className="space-y-4">
                          {availableQueue.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="outline-none"
                                >
                                  <div
                                    className={cn(
                                      "p-5 rounded-2xl border bg-white/70 backdrop-blur-sm transition-all cursor-grab active:cursor-grabbing group relative",
                                      snapshot.isDragging ? "shadow-2xl scale-[1.02] border-amber-500 z-50 rotate-1 shadow-amber-200/50" : "hover:border-slate-300 hover:shadow-lg"
                                    )}
                                    style={{ 
                                      borderColor: themeConfig.general.border,
                                      opacity: snapshot.isDragging ? 0.9 : 1
                                    }}
                                  >
                                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-20 transition-opacity">
                                      <GripVertical size={16} />
                                    </div>
                                    <div className="pl-4 space-y-3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                          <div className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                             {item.source}
                                          </div>
                                          {item.priority === 'high' && <span className="text-[8px] font-black text-red-600 uppercase tracking-widest bg-red-50/50 px-1.5 py-0.5 rounded">Prioritário</span>}
                                        </div>
                                      </div>
                                      <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.title}</h3>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                           <div className="flex flex-col">
                                              <span className="text-[8px] font-black uppercase tracking-widest opacity-20">Risco</span>
                                              <div className="w-12 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                 <div className="h-full bg-red-400" style={{ width: `${item.aiScores?.gravity}%` }} />
                                              </div>
                                           </div>
                                        </div>
                                        <button 
                                          onClick={() => handleStartAnalysis(item.id)}
                                          className="text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-black active:scale-95 transition-all shadow-lg shadow-slate-200"
                                        >
                                          Assumir
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {availableQueue.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 opacity-10 text-center px-4 space-y-3">
                              <Sparkles size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest">Tudo em ordem!</p>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* History Card */}
                <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 grayscale select-none">
                      <Sparkles size={250} />
                   </div>
                   <div className="relative z-10 space-y-8">
                      <div className="flex items-center justify-between border-b border-white/5 pb-6">
                         <div>
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                              Histórico Local
                            </h3>
                            <p className="text-[10px] opacity-40 font-medium uppercase tracking-widest">Atividades recentes</p>
                         </div>
                         <History size={20} className="text-white/20" />
                      </div>
                      <div className="space-y-6">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="flex gap-4 group/item cursor-pointer">
                              <div className="w-1 h-8 bg-blue-500/20 group-hover/item:bg-blue-500 transition-colors rounded-full" />
                              <div className="flex-1">
                                 <p className="text-xs font-bold leading-tight mb-1 group-hover/item:text-blue-400 transition-colors">Relatório #{Math.floor(Math.random() * 1000)} Arquivado</p>
                                 <p className="text-[10px] opacity-30 font-bold uppercase tracking-tighter">Há {i * 15} min • Agente {user.name.split(' ')[0]}</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </DragDropContext>
          </div>
        )}

        {activeTab === 'redacao' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Editor Sidebar or list */}
            <div className="lg:col-span-7 flex flex-col space-y-6">
               <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                     <FileText size={20} />
                  </div>
                  <div>
                     <h2 className="text-xl font-black uppercase tracking-tight">Fila de Redação</h2>
                     <p className="text-xs opacity-40 font-medium">Checagens aprovadas prontas para redação</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/editorial-archive')}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                >
                  Ver Acervo Editorial
                </button>
              </div>

              <div className="space-y-4">
                {news.filter(n => n.status === 'completed').map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => navigate(`/editor/${item.id}`)}
                    className="p-6 rounded-[2rem] border bg-white hover:shadow-xl transition-all cursor-pointer group"
                    style={{ borderColor: themeConfig.general.border }}
                  >
                     <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} themeConfig={themeConfig} />
                        {item.reportStructure?.label && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-slate-900">
                            {item.reportStructure.label}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-20">{item.date}</span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{item.source}</span>
                      <button className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest group-hover:gap-2 transition-all">
                         Escrever Matéria <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-8">
               <div className="p-8 rounded-[2.5rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000 grayscale select-none">
                    <Sparkles size={250} />
                 </div>
                 <div className="relative z-10 space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-6">
                       <div>
                          <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                            Histórico Editorial
                          </h3>
                          <p className="text-[10px] opacity-40 font-medium uppercase tracking-widest">Publicações recentes</p>
                       </div>
                       <History size={20} className="text-white/20" />
                    </div>
                    <div className="space-y-6">
                       {[1, 2, 3].map(i => (
                         <div key={i} className="flex gap-4 group/item cursor-pointer">
                            <div className="w-1 h-8 bg-blue-500/20 group-hover/item:bg-blue-500 transition-colors rounded-full" />
                            <div className="flex-1">
                               <p className="text-xs font-bold leading-tight mb-1 group-hover/item:text-blue-400 transition-colors">Artigo #{Math.floor(Math.random() * 1000)} Publicado</p>
                               <p className="text-[10px] opacity-30 font-bold uppercase tracking-tighter">Há {i * 15} min • Redator {user.name.split(' ')[0]}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'metricas' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 p-8 rounded-3xl" style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Métricas de Desempenho</h2>
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
                    <UsersIcon size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuários Ativos</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metricsData.activeUsers}</span>
                  <span className="text-xs opacity-50">na plataforma</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-green-600 text-xs font-bold">
                  <TrendingUp size={14} />
                  <span>Crescimento estável</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Lock size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perfis de Acesso</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metricsData.totalProfiles}</span>
                  <span className="text-xs opacity-50">criados</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-bold">
                  <Activity size={14} />
                  <span>Sistemas Seguros</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                    <Layout size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Módulos</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metricsData.totalLabels}</span>
                  <span className="text-xs opacity-50">etiquetas</span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <Info size={14} />
                  <span>Pronto para uso</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-50 text-slate-600 rounded-xl">
                    <History size={20} />
                  </div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Audições Resolvidas</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metricsData.totalLogs}</span>
                  <span className="text-xs opacity-50">logs de atividade</span>
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
                    <h3 className="font-bold text-slate-900">Volume de Auditoria</h3>
                    <p className="text-xs text-slate-500">Histórico diário de logs no sistema</p>
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
                        name="Ações (Logs)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="mb-8">
                  <h3 className="font-bold text-slate-900">Distribuição por Funções</h3>
                  <p className="text-xs text-slate-500">Membros ativos em cada papel no sistema</p>
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

      </div>
    </div>
  );
};

