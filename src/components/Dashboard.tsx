import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { NewsItem, UserProfile, ThemeConfig } from '../types';
import { cn } from '../lib/utils';

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
  checkPermission
}: DashboardProps) => {
  const navigate = useNavigate();
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
    } else if (checkPermission('view_newsroom')) {
      navigate('/newsroom');
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
           <div className="flex items-center gap-4">
              <NotificationBell 
                notifications={notifications}
                onMarkAsRead={onMarkNotifAsRead}
                onClearAll={onClearNotifs}
                themeConfig={themeConfig}
                currentUser={user}
              />
           </div>
        </section>

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

        {checkPermission('perform_check') && (
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
        )}

        {/* Executive focus - If not checker, show summary stats or welcome only */}
        {!checkPermission('perform_check') && (
          <div className="py-20 flex flex-col items-center opacity-30">
            <LayoutDashboard size={48} className="mb-4" />
            <p className="text-sm font-black uppercase tracking-widest leading-none">Console Administrativo</p>
          </div>
        )}
      </div>
    </div>
  );
};

