import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileText,
  GripVertical
} from 'lucide-react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { ResponsiveTabs } from './ResponsiveTabs';
import { NewsItem, UserProfile, ThemeConfig, PermissionProfile, AuditLog, LabelConfig } from '../types';
import { cn } from '../lib/utils';
import { getDesinfoScore } from '../lib/aiAnalysis';
import { isNewsAssignedTo } from '../lib/newsAssignment';
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
import styles from './Dashboard.module.css';

interface DashboardProps {
  news: NewsItem[];
  user: UserProfile;
  setSelectedNewsId: (id: string | null) => void;
  handleStartAnalysis: (id: string) => void;
  handleMoveTask: (id: string, targetStatus: 'pending' | 'in_progress') => void;
  handleMoveRedacao?: (id: string, assigned: boolean) => void;
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
  handleMoveRedacao,
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
  const [checkFilter, setCheckFilter] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const metricsData = useMemo(() => {
    const now = new Date();
    const rangeMap = { 'all': 0, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000, '90d': 90 * 24 * 60 * 60 * 1000 };
    const startTime = dateRange === 'all' ? 0 : now.getTime() - rangeMap[dateRange];
    
    const filteredNews = news.filter(n => {
      const nDate = new Date(n.receivedAt || n.date).getTime();
      if (startTime > 0 && nDate < startTime) return false;
      if (filterUser !== 'all' && !isNewsAssignedTo(n, filterUser)) return false;
      if (filterStatus !== 'all' && n.status !== filterStatus) return false;
      if (filterPriority !== 'all' && n.priority !== filterPriority) return false;
      return true;
    });
    
    const totalNews = filteredNews.length;
    const completedNews = filteredNews.filter(n => n.status === 'completed').length;
    const pendingNews = filteredNews.filter(n => ['pending', 'in_progress', 'to_rectify'].includes(n.status)).length;
    const urgentNews = filteredNews.filter(n => n.priority === 'high').length;
    
    const lastN = dateRange === 'all' ? 30 : (dateRange === '7d' ? 7 : (dateRange === '30d' ? 30 : 90));
    const dailyVolume: { date: string, count: number, completed: number }[] = [];
    
    for (let i = lastN - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const created = filteredNews.filter(n => { const dStr = (n.receivedAt || n.date); return dStr && dStr.startsWith(dateStr); }).length;
      const completed = filteredNews.filter(n => n.status === 'completed' && n.completedAt && n.completedAt.startsWith(dateStr)).length;
      dailyVolume.push({ date: dateStr, count: created, completed });
    }

    const statusDist = [
      { name: 'Em Aberto', value: filteredNews.filter(n => n.status === 'pending').length, color: themeConfig.status.info },
      { name: 'Em Progresso', value: filteredNews.filter(n => n.status === 'in_progress').length, color: themeConfig.status.warning },
      { name: 'Concluídos', value: filteredNews.filter(n => n.status === 'completed').length, color: themeConfig.status.success },
      { name: 'Retificar', value: filteredNews.filter(n => n.status === 'to_rectify').length, color: themeConfig.status.error },
    ];

    return { totalNews, completedNews, pendingNews, urgentNews, dailyVolume, statusDist };
  }, [dateRange, filterUser, filterStatus, filterPriority, news, themeConfig]);

  const stats = [
    { id: 'pending', name: 'Em Aberto', value: news.filter(n => n.status === 'pending').length, color: themeConfig.status.info, icon: Clock },
    { id: 'in_progress', name: 'Minhas Tarefas', value: news.filter(n => ['in_progress', 'to_rectify'].includes(n.status) && isNewsAssignedTo(n, user.id)).length, color: themeConfig.status.warning, icon: Activity },
    { id: 'urgent', name: 'Urgentes', value: news.filter(n => n.status !== 'completed' && n.priority === 'high').length, color: themeConfig.status.error, icon: AlertTriangle },
    { id: 'completed', name: 'Concluídas', value: news.filter(n => n.status === 'completed').length, color: themeConfig.status.success, icon: CheckCircle2 },
  ];

  const myTasks = news.filter(n => ['in_progress', 'to_rectify'].includes(n.status) && isNewsAssignedTo(n, user.id))
                      .filter(n => checkFilter ? (checkFilter === 'urgent' ? n.priority === 'high' : checkFilter === 'in_progress') : true);
  const availableQueue = news.filter(n => n.status === 'pending')
                             .filter(n => checkFilter ? (checkFilter === 'urgent' ? n.priority === 'high' : checkFilter === 'pending') : true);
  const checkDataList = checkFilter === 'completed' ? news.filter(n => n.status === 'completed') : 
                        checkFilter === 'urgent' ? news.filter(n => n.priority === 'high' && n.status !== 'completed') :
                        checkFilter === 'pending' ? news.filter(n => n.status === 'pending') :
                        checkFilter === 'in_progress' ? news.filter(n => ['in_progress', 'to_rectify'].includes(n.status) && isNewsAssignedTo(n, user.id)) :
                        [];

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (source.droppableId === 'available' && destination.droppableId === 'myTasks') handleMoveTask(draggableId, 'in_progress');
    else if (source.droppableId === 'myTasks' && destination.droppableId === 'available') handleMoveTask(draggableId, 'pending');
    else if (source.droppableId === 'redacaoQueue' && destination.droppableId === 'myRedacao') { if (handleMoveRedacao) handleMoveRedacao(draggableId, true); }
    else if (source.droppableId === 'myRedacao' && destination.droppableId === 'redacaoQueue') { if (handleMoveRedacao) handleMoveRedacao(draggableId, false); }
  };

  const redacaoQueue = news.filter(n => n.status === 'completed' && !n.assignedToEditor);
  const myRedacao = news.filter(n => n.status === 'completed' && n.assignedToEditor === user.id);

  const TaskCard = ({ item, onClickHandler, isDragging, titleClass = styles.taskTitle }: { item: NewsItem; onClickHandler: () => void; isDragging: boolean; titleClass?: string }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClickHandler}
      className={cn(styles.taskCard, isDragging ? styles.taskCardDragging : styles.taskCardIdle)}
      style={{ borderColor: themeConfig.general.border, opacity: isDragging ? 0.95 : 1 }}
    >
      <div className={styles.taskSidebar} style={{ backgroundColor: item.priority === 'high' ? themeConfig.status.error : themeConfig.status.info }} />
      <div className={styles.taskBody}>
        <div className={styles.taskMeta}>
          <div className={styles.taskBadges}>
            <StatusBadge status={item.status} themeConfig={themeConfig} />
            {item.priority === 'high' && <div className={styles.urgentBadge}>URGENTE</div>}
          </div>
          <span className={styles.taskDate}>{item.date}</span>
        </div>
        <div>
          <h3 className={titleClass}>{item.title}</h3>
          <p className={styles.taskExcerpt}>{item.content}</p>
        </div>
        <div className={styles.taskFooter}>
          <div className={styles.taskFooterLeft}>
            <div className={styles.sourceTag}>{item.source}</div>
            {getDesinfoScore(item.aiScores, 'inveracidade') != null && (
            <div className={styles.trendWrap}>
              <div className={styles.trendInner}>
                <TrendingUp size={10} className="text-blue-400" />
                <span className={styles.trendText}>{getDesinfoScore(item.aiScores, 'inveracidade')}% desinformação</span>
              </div>
            </div>
            )}
          </div>
          <button className={styles.analyzeBtn} style={{ color: themeConfig.general.accent }}>
            Investigar <ArrowRight size={12} />
          </button>
        </div>
      </div>
      <div className={styles.dragHandle}><GripVertical size={24} /></div>
    </motion.div>
  );

  return (
    <div className={styles.page} style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
      <div className={styles.inner}>
        
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
           <div className={styles.welcomeLeft}>
              <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.welcomeTitle}>
                Olá, {user.name.split(' ')[0]}
              </motion.h1>
              <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.welcomeSubtitle}>
                Monitorando a integridade da informação em tempo real.
              </motion.p>
           </div>
           
           <div className={styles.welcomeRight}>
              <div className={styles.notifRow}>
                <NotificationBell notifications={notifications} onMarkAsRead={onMarkNotifAsRead} onClearAll={onClearNotifs} themeConfig={themeConfig} currentUser={user} />
              </div>
              <div className={styles.tabsRow}>
                <ResponsiveTabs
                   activeTab={activeTab}
                   setActiveTab={setActiveTab as any}
                   themeConfig={themeConfig}
                   tabs={[
                     { id: 'checagem', label: 'Checagem', icon: Activity, permission: ['perform_analysis', 'view_analysis'] },
                     { id: 'redacao', label: 'Redação', icon: FileText, permission: ['view_editor', 'view_archive'] },
                     { id: 'metricas', label: 'Métricas', icon: TrendingUp, permission: ['view_admin'] },
                   ].filter(tab => tab.permission.some(p => checkPermission(p)))}
                />
              </div>
           </div>
        </section>

        {activeTab === 'checagem' && (
          <div className={styles.tabSection}>
            {/* Stats Grid */}
            <section className={styles.statsGrid}>
              {stats.map((stat: any, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  onClick={() => setCheckFilter(checkFilter === stat.id ? null : stat.id)}
                  className={cn(
                    styles.statCard,
                    checkFilter === stat.id ? styles.statCardActive : '',
                    checkFilter && checkFilter !== stat.id ? styles.statCardDimmed : ''
                  )}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className={styles.statTop}>
                     <div className={styles.statInfo}>
                        <p className={styles.statName}>{stat.name}</p>
                        <h3 className={styles.statValue}>{stat.value}</h3>
                     </div>
                     <div className={styles.statIconWrap} style={{ backgroundColor: `${stat.color}10`, color: stat.color }}>
                        <stat.icon size={22} />
                     </div>
                  </div>
                  <div className={styles.statBar} style={{ backgroundColor: stat.color }} />
                </motion.div>
              ))}
            </section>

            {checkFilter !== null && checkFilter === 'completed' ? (
              <div className={styles.completedGrid}>
                {checkDataList.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => handleStartAnalysis(item.id)}
                      className={cn(styles.taskCard, styles.taskCardIdle)}
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <div className={styles.taskSidebar} style={{ backgroundColor: item.priority === 'high' ? themeConfig.status.error : themeConfig.status.info }} />
                      <div className={styles.taskBody}>
                        <div className={styles.taskMeta}>
                          <div className={styles.taskBadges}>
                            <StatusBadge status={item.status} themeConfig={themeConfig} />
                            {item.priority === 'high' && <div className={styles.urgentBadge}>URGENTE</div>}
                          </div>
                          <span className={styles.taskDate}>{item.date}</span>
                        </div>
                        <div>
                          <h3 className={styles.taskTitle}>{item.title}</h3>
                          <p className={styles.taskExcerpt}>{item.content}</p>
                        </div>
                        <div className={styles.taskFooter}>
                          <div className={styles.taskFooterLeft}>
                            <div className={styles.sourceTag}>{item.source}</div>
                          </div>
                          <button className={styles.analyzeBtn} style={{ color: themeConfig.general.accent }}>
                             Analisar <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
            <div className={styles.tasksLayout}>
              {/* My Tasks */}
              <div className={styles.tasksMain}>
                <div className={styles.tasksHeader}>
                  <div className={styles.tasksHeaderLeft}>
                    <div className={styles.tasksIconWrap}><LayoutDashboard size={20} /></div>
                    <div>
                       <h2 className={styles.tasksTitle}>Minhas Tarefas</h2>
                       <p className={styles.tasksSubtitle}>Fluxo de análise ativa</p>
                    </div>
                  </div>
                  <div className={styles.tasksCount}>
                    <div className={styles.tasksDot} />
                    <span className={styles.tasksCountLabel}>{myTasks.length} ATIVAS</span>
                  </div>
                </div>

                <Droppable droppableId="myTasks">
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(styles.dropzone, snapshot.isDraggingOver ? styles.dropzoneActive : styles.dropzoneIdle)}
                    >
                      <div className={styles.taskGrid}>
                        <AnimatePresence mode="popLayout">
                          {myTasks.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="outline-none">
                                  <TaskCard item={item} onClickHandler={() => handleStartAnalysis(item.id)} isDragging={snapshot.isDragging} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {myTasks.length === 0 && (
                          <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}><LayoutDashboard size={32} /></div>
                            <div className="max-w-xs">
                               <p className={styles.emptyTitle}>Fila Vazia</p>
                               <p className={styles.emptyDesc}>Arraste boatos para começar.</p>
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
              <div className={styles.queueCol}>
                <div className={styles.queueColInner}>
                  <div className={styles.tasksHeader}>
                    <div className={styles.tasksHeaderLeft}>
                      <div className={styles.tasksIconWrapAmber}><Clock size={20} /></div>
                      <div>
                         <h2 className={styles.tasksTitle}>Triagem</h2>
                         <p className={styles.tasksSubtitle}>Entradas pendentes</p>
                      </div>
                    </div>
                  </div>

                  <Droppable droppableId="available">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(styles.dropzoneSmall, snapshot.isDraggingOver ? styles.dropzoneAmberActive : styles.dropzoneIdle)}
                      >
                        <div className="space-y-4">
                          {availableQueue.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="outline-none">
                                  <div
                                    className={cn(styles.queueCard, snapshot.isDragging ? styles.queueCardDragging : styles.queueCardIdle)}
                                    style={{ borderColor: themeConfig.general.border, opacity: snapshot.isDragging ? 0.9 : 1 }}
                                  >
                                    <div className={styles.queueHandle}><GripVertical size={16} /></div>
                                    <div className={styles.queueBody}>
                                      <div className={styles.queueMeta}>
                                        <div className={styles.queueBadges}>
                                          <div className={styles.queueSourceTag}>{item.source}</div>
                                          {item.priority === 'high' && <span className={styles.priorityBadge}>Prioritário</span>}
                                        </div>
                                      </div>
                                      <h3 className={styles.queueTitle}>{item.title}</h3>
                                      <div className={styles.queueFooter}>
                                        <div className={styles.riskWrap}>
                                           <div className={styles.riskBar}>
                                              <span className={styles.riskBarLabel}>Risco</span>
                                              <div className={styles.riskBarTrack}>
                                                 <div className={styles.riskBarFill} style={{ width: `${getDesinfoScore(item.aiScores, 'inveracidade') ?? 0}%` }} />
                                              </div>
                                           </div>
                                        </div>
                                        <button onClick={() => handleStartAnalysis(item.id)} className={styles.assumeBtn}>Assumir</button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {availableQueue.length === 0 && (
                            <div className={styles.emptySmall}>
                              <Sparkles size={32} />
                              <p className={styles.emptySmallText}>Tudo em ordem!</p>
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </div>
          
                </DragDropContext>
            )}
          </div>
        )}

        {activeTab === 'redacao' && (
          <div className={styles.tabSection}>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className={styles.tasksLayout}>
                {/* Minhas Redações */}
                <div className={styles.tasksMain}>
                   <div className={styles.tasksHeader}>
                    <div className={styles.tasksHeaderLeft}>
                      <div className={styles.tasksIconWrap}><FileText size={20} /></div>
                      <div>
                         <h2 className={styles.tasksTitle}>Minhas Redações</h2>
                         <p className={styles.tasksSubtitle}>Matérias atribuídas a você</p>
                      </div>
                    </div>
                    <div className={styles.tasksCount}>
                      <div className={styles.tasksDot} />
                      <span className={styles.tasksCountLabel}>{myRedacao.length} ATIVAS</span>
                    </div>
                  </div>

                  <Droppable droppableId="myRedacao">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(styles.dropzone, snapshot.isDraggingOver ? styles.dropzoneActive : styles.dropzoneIdle)}
                      >
                        <div className={styles.taskGrid}>
                          <AnimatePresence mode="popLayout">
                            {myRedacao.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="outline-none">
                                    <TaskCard item={item} onClickHandler={() => navigate(`/editor/${item.id}`)} isDragging={snapshot.isDragging} titleClass={styles.taskTitleBlue} />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* Fila de Redação */}
                <div className={styles.queueCol}>
                   <div className={styles.tasksHeader}>
                    <div className={styles.tasksHeaderLeft}>
                      <div className={styles.tasksIconWrapSlate}><FileText size={20} /></div>
                      <div>
                         <h2 className={styles.tasksTitleSlate}>Fila Pendente</h2>
                         <p className={styles.tasksSubtitle}>Aguardando Redator</p>
                      </div>
                    </div>
                  </div>

                  <Droppable droppableId="redacaoQueue">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={cn(styles.dropzone, snapshot.isDraggingOver ? styles.dropzoneSlateActive : styles.dropzoneIdle)}
                      >
                        <div className="grid grid-cols-1 gap-3">
                          <AnimatePresence mode="popLayout">
                            {redacaoQueue.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided, snapshot) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="outline-none">
                                    <motion.div
                                      layout
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.95 }}
                                      className={cn(styles.redacaoQueue, snapshot.isDragging ? styles.redacaoQueueDragging : styles.redacaoQueueIdle)}
                                      style={{ borderColor: themeConfig.general.border }}
                                    >
                                      <div className={styles.redacaoQueueMeta}>
                                        <div className={styles.taskBadges}>
                                          <StatusBadge status={item.status} themeConfig={themeConfig} />
                                          {item.reportStructure?.label && (
                                              <span className={styles.labelTag}>{item.reportStructure.label}</span>
                                          )}
                                        </div>
                                        <span className={styles.taskDate}>{item.date}</span>
                                      </div>
                                      <h3 className={styles.redacaoQueueTitle}>{item.title}</h3>
                                    </motion.div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                  
                  <button 
                    onClick={() => navigate('/editorial-archive')}
                    className={styles.archiveBtn}
                    style={{ color: themeConfig.general.accent, borderColor: `${themeConfig.general.accent}20` }}
                  >
                    <ArrowRight size={14} /> Ver Acervo Editorial Completo
                  </button>
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {activeTab === 'metricas' && (
          <div className={styles.metricsSection} style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
            <div className={styles.metricsHeader}>
              <div>
                <h2 className={styles.metricsTitle}>Métricas de Desempenho</h2>
                <p className={styles.metricsSubtitle}>Acompanhamento estratégico de demandas e equipe</p>
              </div>
              
              <div className={styles.filtersRow}>
                <div className={styles.filtersGroup}>
                  <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className={styles.filterSelect} style={{ backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}>
                    <option value="all">Todos os Usuários</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={styles.filterSelect} style={{ backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}>
                    <option value="all">Todos os Status</option>
                    <option value="pending">Na Fila</option>
                    <option value="in_progress">Em Progresso</option>
                    <option value="to_rectify">A Retificar</option>
                    <option value="completed">Concluída</option>
                  </select>
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={styles.filterSelect} style={{ backgroundColor: themeConfig.general.cardBackground, color: themeConfig.dashboard.text }}>
                    <option value="all">Todas Prioridades</option>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta (Urgente)</option>
                  </select>
                </div>

                <div className={styles.dateRangeGroup}>
                  {[{ id: '7d', label: '7 Dias' }, { id: '30d', label: '30 Dias' }, { id: '90d', label: '90 Dias' }, { id: 'all', label: 'Tudo' }].map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id as any)}
                      className={dateRange === range.id ? styles.dateRangeBtnActive : styles.dateRangeBtnInactive}
                      style={dateRange === range.id ? { color: themeConfig.general.accent } : undefined}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
              <div className={styles.lineChartCard}>
                <div className={styles.lineChartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>Volume de Produção vs. Entrada</h3>
                    <p className={styles.chartSubtitle}>Acompanhamento diário</p>
                  </div>
                </div>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsData.dailyVolume}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }} />
                      <Line type="monotone" dataKey="count" stroke={themeConfig.dashboard.chartColors[0] || "#3b82f6"} strokeWidth={3} dot={{ r: 4, fill: themeConfig.dashboard.chartColors[0] || '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} name="Demandas (Criadas)" />
                      <Line type="monotone" dataKey="completed" stroke={themeConfig.status.success || "#10b981"} strokeWidth={3} dot={{ r: 4, fill: themeConfig.status.success || '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} name="Demandas (Concluídas)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={styles.pieChartCard}>
                <div className={styles.pieChartHeader}>
                  <h3 className={styles.chartTitle}>Status das Demandas</h3>
                  <p className={styles.chartSubtitle}>Distribuição do estado atual na filtragem</p>
                </div>
                <div className={styles.pieContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metricsData.statusDist.filter((sd: any) => sd.value > 0)} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {metricsData.statusDist.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles.pieLegend}>
                  {metricsData.statusDist.map((stat: any, i: number) => (
                    <div key={i} className={styles.pieLegendItem}>
                      <div className={styles.pieDot} style={{ backgroundColor: stat.color }} />
                      <span className={styles.pieLegendLabel}>{stat.name}</span>
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
