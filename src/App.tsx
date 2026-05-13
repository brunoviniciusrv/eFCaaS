/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  MOCK_USER, 
  INITIAL_NEWS, 
  OFFICIAL_LABELS,
  MOCK_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_REPORT_CONFIG,
  INITIAL_THEME_CONFIG,
  INITIAL_AGENCY_CONFIG,
  INITIAL_RECEIVED_NEWS,
  INITIAL_PERMISSION_PROFILES
} from './constants';
import { 
  UserProfile, 
  NewsItem, 
  Evidence, 
  ReportStructure, 
  FactLabel, 
  View,
  AuditLog,
  LabelConfig,
  ReportStructureConfig,
  ThemeConfig,
  AgencyConfig,
  ReceivedNewsItem,
  Notification,
  PermissionProfile
} from './types';
import { generateDraftReport, reviewReport } from './services/geminiService';

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AnalysisView } from './components/AnalysisView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { CuratorDashboard } from './components/CuratorDashboard';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LoginView } from './components/LoginView';
import { NewsroomView } from './components/NewsroomView';

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [receivedNews, setReceivedNews] = useState<ReceivedNewsItem[]>(INITIAL_RECEIVED_NEWS);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>(() => {
    const saved = localStorage.getItem('platform_permission_profiles');
    const profiles = saved ? JSON.parse(saved) : INITIAL_PERMISSION_PROFILES;
    
    // Safety check: Ensure view_newsroom is present in admin and editor profiles
    return profiles.map((p: PermissionProfile) => {
      if ((p.id === 'p-admin' || p.id === 'p-editor') && !p.permissions.includes('view_newsroom')) {
        return { ...p, permissions: [...p.permissions, 'view_newsroom'] };
      }
      return p;
    });
  });

  useEffect(() => {
    localStorage.setItem('platform_permission_profiles', JSON.stringify(permissionProfiles));
  }, [permissionProfiles]);

  const checkPermission = (permId: string) => {
    const profile = permissionProfiles.find(p => p.id === user.profileId);
    if (!profile) return false;
    return profile.permissions.includes(permId);
  };

  const handleUpdateProfile = (profile: PermissionProfile) => {
    setPermissionProfiles(prev => prev.map(p => p.id === profile.id ? profile : p));
    addAuditLog('update_profile', `Perfil: ${profile.name}`, `Permissões atualizadas: ${profile.permissions.length}`);
  };

  const handleCreateProfile = (profileData: Omit<PermissionProfile, 'id'>) => {
    const newProfile: PermissionProfile = {
      ...profileData,
      id: 'p-' + Math.random().toString(36).substr(2, 5)
    };
    setPermissionProfiles(prev => [...prev, newProfile]);
    addAuditLog('create_profile', `Perfil: ${newProfile.name}`, `Novo perfil de acesso criado`);
  };

  const handleDeleteProfile = (id: string) => {
    setPermissionProfiles(prev => prev.filter(p => p.id !== id));
    addAuditLog('delete_profile', `Perfil ID: ${id}`, `Perfil de acesso removido`);
  };
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [labels, setLabels] = useState<LabelConfig[]>(OFFICIAL_LABELS);
  const [reportConfig, setReportConfig] = useState<ReportStructureConfig>(INITIAL_REPORT_CONFIG);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem('platform_theme_config');
    return saved ? JSON.parse(saved) : INITIAL_THEME_CONFIG;
  });
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig>(() => {
    const saved = localStorage.getItem('platform_agency_config');
    return saved ? JSON.parse(saved) : INITIAL_AGENCY_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('platform_theme_config', JSON.stringify(themeConfig));
  }, [themeConfig]);

  useEffect(() => {
    localStorage.setItem('platform_agency_config', JSON.stringify(agencyConfig));
  }, [agencyConfig]);

  // Monitor received news for new items and notify
  useEffect(() => {
    const unreadReceived = receivedNews.filter(n => n.status === 'received');
    // For each unread received news, if not already notified (using IDs)
    // We can use a ref to track notified IDs to avoid spamming on every change
  }, [receivedNews]);

  const [notifiedReceivedIds, setNotifiedReceivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    receivedNews.forEach(item => {
      if (item.status === 'received' && !notifiedReceivedIds.has(item.id)) {
        addNotification({
          title: 'Nova Notícia Recebida',
          message: `Uma nova sugestão de notícia chegou via ${item.sourceType}: ${item.title}`,
          type: 'info',
          category: 'received_news',
          targetRole: ['admin', 'curator'],
          link: '/curator'
        });
        setNotifiedReceivedIds(prev => new Set(prev).add(item.id));
      }
    });
  }, [receivedNews, notifiedReceivedIds]);

  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notif: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };
  
  const clearNotifications = () => {
    setNotifications([]);
  };

  const addAuditLog = (action: string, target?: string, details?: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      action,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };
  
  // AI States
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedNews = news.find(n => n.id === selectedNewsId);

  const handleStartAnalysis = (id: string) => {
    const item = news.find(n => n.id === id);
    if (item) {
      // Initialize report structure if it doesn't exist
      if (!item.reportStructure) {
        const updatedNews = news.map(n => n.id === id ? {
          ...n,
          status: 'in_progress' as const,
          startTime: new Date().toISOString(),
          assignedTo: user.id,
          reportStructure: {
            summary: '',
            questions: Array(Math.min(1, reportConfig.maxQuestions)).fill(''),
            sources: Array(Math.min(1, reportConfig.maxSources)).fill(''),
            isInverifiable: false,
            contactWithAuthor: { hadContact: null },
            label: undefined
          }
        } : n);
        setNews(updatedNews);
      }
      setSelectedNewsId(id);
      navigate(`/analysis/${id}`);
    }
  };

  const handleAssign = (newsId: string, checkerId: string, briefing: string) => {
    setNews(prev => prev.map(n => n.id === newsId ? {
      ...n,
      status: 'in_progress',
      assignedTo: checkerId,
      briefing,
      assignmentHistory: [
        ...(n.assignmentHistory || []),
        {
          id: Math.random().toString(36).substr(2, 9),
          assignedTo: checkerId,
          assignedBy: user.id,
          timestamp: new Date().toISOString(),
          action: 'assigned',
          reason: briefing
        }
      ]
    } : n));
    
    const newsItem = news.find(n => n.id === newsId);
    if (newsItem) {
      addNotification({
        title: 'Nova Tarefa Atribuída',
        message: `Você recebeu uma nova tarefa: ${newsItem.title}`,
        type: 'info',
        category: 'assignment',
        targetUserId: checkerId,
        relatedNewsId: newsId,
        link: `/analysis/${newsId}`
      });
    }

    const targetNews = news.find(n => n.id === newsId);
    const targetUser = users.find(u => u.id === checkerId);
    addAuditLog('assign_task', `Notícia #${newsId}`, `Atribuiu notícia "${targetNews?.title}" para usuário ${targetUser?.name}. Briefing: ${briefing}`);
  };

  const handleApprove = (newsId: string, comments: string) => {
    setNews(prev => prev.map(n => n.id === newsId ? {
      ...n,
      status: 'completed',
      completedAt: new Date().toISOString(),
      approvedBy: user.id,
      reviewComments: comments
    } : n));
    const targetNews = news.find(n => n.id === newsId);
    addAuditLog('approve_news', `Notícia #${newsId}`, `Aprovou notícia "${targetNews?.title}". Comentários: ${comments}`);
  };

  const handleReject = (newsId: string, comments: string) => {
    setNews(prev => prev.map(n => n.id === newsId ? {
      ...n,
      status: 'in_progress',
      rejectedBy: user.id,
      reviewComments: comments,
      assignmentHistory: [
        ...(n.assignmentHistory || []),
        {
          id: Math.random().toString(36).substr(2, 9),
          assignedTo: n.assignedTo || '',
          assignedBy: user.id,
          timestamp: new Date().toISOString(),
          action: 'rejected',
          reason: comments
        }
      ]
    } : n));
    const targetNews = news.find(n => n.id === newsId);
    addAuditLog('reject_news', `Notícia #${newsId}`, `Rejeitou notícia "${targetNews?.title}". Motivo: ${comments}`);
  };

  const handleUpdateReportStructure = (updates: Partial<ReportStructure>) => {
    if (!selectedNewsId) return;
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      reportStructure: { ...n.reportStructure!, ...updates }
    } : n));
  };

  const handleUpdateReport = (text: string) => {
    if (!selectedNewsId) return;
    setNews(prev => prev.map(n => n.id === selectedNewsId ? { ...n, report: text } : n));
  };

  const handleAddEvidence = (evidence: Omit<Evidence, 'id' | 'timestamp'>) => {
    if (!selectedNewsId) return;
    const newEvidence: Evidence = {
      ...evidence,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleString()
    };
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      evidence: [...n.evidence, newEvidence]
    } : n));
  };

  const handleRemoveEvidence = (id: string) => {
    if (!selectedNewsId) return;
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      evidence: n.evidence.filter(e => e.id !== id)
    } : n));
  };

  const handleGenerateDraft = async () => {
    if (!selectedNews || !selectedNews.reportStructure) return;
    setIsGeneratingDraft(true);
    try {
      const draft = await generateDraftReport(selectedNews, selectedNews.reportStructure);
      handleUpdateReport(draft);
    } catch (error) {
      console.error("Error generating draft:", error);
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleReviewReport = async () => {
    if (!selectedNews?.report) return;
    setIsReviewing(true);
    try {
      const review = await reviewReport(selectedNews.report);
      handleUpdateReport(`${selectedNews.report}\n\n---\n### Sugestões da IA:\n${review}`);
    } catch (error) {
      console.error("Error reviewing report:", error);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleSaveFinal = () => {
    if (!selectedNews) return;
    
    // Validation
    if (!selectedNews.reportStructure?.label) {
      alert("Por favor, selecione uma classificação final antes de finalizar.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setNews(prev => prev.map(n => n.id === selectedNewsId ? { 
        ...n, 
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      } : n));
      setIsSaving(false);
      setSelectedNewsId(null);
      navigate('/dashboard');
    }, 1500);
  };

  const handleReopen = (newsId: string, reason: string) => {
    setNews(prev => prev.map(n => {
      if (n.id === newsId) {
        const history = {
          id: Math.random().toString(36).substr(2, 9),
          assignedTo: n.assignedTo || '',
          assignedBy: user.id,
          timestamp: new Date().toISOString(),
          action: 'reopened' as const,
          reason: reason
        };
        return {
          ...n,
          status: 'to_rectify' as const,
          isRectified: true,
          assignmentHistory: [...(n.assignmentHistory || []), history]
        };
      }
      return n;
    }));
    const targetNews = news.find(n => n.id === newsId);
    addAuditLog('reopen_news', `Notícia #${newsId}`, `Reabriu notícia "${targetNews?.title}" para retificação. Motivo: ${reason}`);
  };

  const handleRegisterNews = (newsData: any) => {
    const newItem: NewsItem = {
      ...newsData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      status: newsData.assignedTo ? 'in_progress' : 'pending',
      evidence: [],
      aiScores: {
        gravity: Math.floor(Math.random() * 50) + 10,
        urgency: Math.floor(Math.random() * 50) + 10,
        trend: Math.floor(Math.random() * 50) + 10
      },
      aiEvaluation: {
        score: 0.5,
        explanation: "Análise contextual padronizada gerada automaticamente pela plataforma para fins de teste. Pendente de revisão aprofundada.",
        warningLevel: "nível de alerta moderado / revisão necessária",
        characteristics: [
          "**Texto Padrão:** Esta é uma avaliação gerada automaticamente.",
          "**Dados Simulados:** Os dados apresentados são apenas um exemplo.",
          "**Necessidade de Checagem:** Requer validação humana para confirmar os fatos."
        ],
        topics: ["Geral", "Não Categorizado", "Simulação"],
        entities: [
          { name: "Entidade Exemplo", description: "Descrição genérica da entidade mencionada." }
        ],
        location: "Indefinido",
        dates: [new Date().toISOString().split('T')[0]]
      },
      assignmentHistory: newsData.assignedTo ? [{
        id: Math.random().toString(36).substr(2, 9),
        assignedTo: newsData.assignedTo,
        assignedBy: user.id,
        timestamp: new Date().toISOString(),
        action: 'assigned',
        reason: newsData.briefing
      }] : []
    };
    setNews(prev => [newItem, ...prev]);

    // Notification logic
    if (newItem.assignedTo) {
      // If assigned directly, notify ONLY the checker
      addNotification({
        title: 'Nova Tarefa Atribuída',
        message: `Você recebeu uma nova tarefa: ${newItem.title}`,
        type: 'info',
        category: 'assignment',
        targetUserId: newItem.assignedTo,
        relatedNewsId: newItem.id,
        link: `/analysis/${newItem.id}`
      });
    } else {
      // Otherwise notify curators/admins about new item in triage queue (Fila Disponível)
      addNotification({
        title: 'Nova Notícia na Fila',
        message: `Uma nova notícia foi adicionada à fila disponível: ${newItem.title}`,
        type: 'info',
        category: 'queue',
        targetRole: ['admin', 'curator'],
        relatedNewsId: newItem.id,
        link: '/curator'
      });
    }

    addAuditLog('register_news', `Notícia #${newItem.id}`, `Registrou nova notícia: "${newItem.title}"`);
  };

  const handleForwardToTriage = (receivedItem: ReceivedNewsItem) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newNewsItem: NewsItem = {
      id: newId,
      title: receivedItem.title,
      content: receivedItem.content,
      source: receivedItem.sourceType,
      senderName: receivedItem.senderName,
      senderAddress: receivedItem.senderAddress,
      receivedAt: receivedItem.receivedAt,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      isAIProcessing: true,
      aiScores: {
        gravity: 0,
        urgency: 0,
        trend: 0
      },
      media: receivedItem.media?.map(m => ({
        type: m.type as 'image' | 'video' | 'audio' | 'document',
        url: m.url
      })),
      evidence: [],
      reportStructure: {
        summary: '',
        questions: [''],
        sources: [''],
        isInverifiable: false,
        contactWithAuthor: { hadContact: null }
      },
      assignmentHistory: [{
        id: 'h-' + Math.random().toString(36).substr(2, 5),
        assignedTo: '',
        assignedBy: user.id,
        timestamp: new Date().toISOString(),
        action: 'assigned',
        reason: 'Recuperado de Curadoria Externa'
      }]
    };

    setNews(prev => [newNewsItem, ...prev]);
    setReceivedNews(prev => prev.filter(rn => rn.id !== receivedItem.id));

    // Notify checkers about new item in triage
    addNotification({
      title: 'Notícia em Triagem',
      message: `Uma nova notícia foi encaminhada para triagem: ${newNewsItem.title}`,
      type: 'info',
      category: 'queue',
      targetRole: ['admin', 'curator'],
      relatedNewsId: newNewsItem.id,
      link: '/curator'
    });

    addAuditLog('forward_to_triage', `Notícia Recebida #${receivedItem.id}`, `Encaminhou notícia recebida "${receivedItem.title}" para triagem`);

    // Simulate AI classification
    setTimeout(() => {
      setNews(prev => prev.map(n => {
        if (n.id === newId) {
          return {
            ...n,
            isAIProcessing: false,
            aiScores: {
              gravity: Math.floor(Math.random() * 60) + 20,
              urgency: Math.floor(Math.random() * 70) + 10,
              trend: Math.floor(Math.random() * 80) + 10
            },
            aiEvaluation: {
              score: 0.5,
              explanation: "Análise contextual padronizada gerada automaticamente pela plataforma para fins de teste. Pendente de revisão aprofundada.",
              warningLevel: "nível de alerta moderado / revisão necessária",
              characteristics: [
                "**Texto Padrão:** Esta é uma avaliação gerada automaticamente.",
                "**Dados Simulados:** Os dados apresentados são apenas um exemplo.",
                "**Necessidade de Checagem:** Requer validação humana para confirmar os fatos."
              ],
              topics: ["Geral", "Não Categorizado", "Simulação"],
              entities: [
                { name: "Entidade Exemplo", description: "Descrição genérica da entidade mencionada." }
              ],
              location: "Indefinido",
              dates: [new Date().toISOString().split('T')[0]]
            }
          };
        }
        return n;
      }));
    }, 4000);
  };

  const handleDeleteReceivedNews = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia recebida?')) {
      setReceivedNews(prev => prev.map(rn => 
        rn.id === id ? { ...rn, status: 'deleted' as const } : rn
      ));
      const targetReceived = receivedNews.find(rn => rn.id === id);
      addAuditLog('delete_received_news', `Notícia Recebida #${id}`, `Excluiu notícia recebida "${targetReceived?.title}"`);
    }
  };

  const handleMoveTask = (newsId: string, targetStatus: 'pending' | 'in_progress') => {
    setNews(prev => prev.map(n => {
      if (n.id === newsId) {
        if (targetStatus === 'in_progress') {
          // Initialize report structure if it doesn't exist (same logic as handleStartAnalysis)
          if (!n.reportStructure) {
            return {
              ...n,
              status: 'in_progress' as const,
              startTime: new Date().toISOString(),
              assignedTo: user.id,
              reportStructure: {
                summary: '',
                questions: Array(Math.min(1, reportConfig.maxQuestions)).fill(''),
                sources: Array(Math.min(1, reportConfig.maxSources)).fill(''),
                isInverifiable: false,
                contactWithAuthor: { hadContact: null },
                label: undefined
              }
            };
          }
          return { ...n, status: 'in_progress' as const, assignedTo: user.id };
        } else {
          // Move back to pending
          return { ...n, status: 'pending' as const, assignedTo: undefined };
        }
      }
      return n;
    }));
    const targetNews = news.find(n => n.id === newsId);
    const statusLabel = targetStatus === 'in_progress' ? 'Em Análise' : 'Pendente';
    addAuditLog('move_task', `Notícia #${newsId}`, `Moveu notícia "${targetNews?.title}" para status ${statusLabel}`);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile>(user);
  
  useEffect(() => {
    setProfileForm(user);
  }, [user]);
  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveProfile = () => {
    setUser(profileForm);
    setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handleUpdateEmail = () => {
    if (!emailForm.newEmail || !emailForm.password) {
      setProfileMessage({ type: 'error', text: 'Preencha todos os campos de e-mail.' });
      return;
    }
    setUser(prev => ({ ...prev, email: emailForm.newEmail }));
    setProfileMessage({ type: 'success', text: 'E-mail atualizado com sucesso!' });
    setEmailForm({ newEmail: '', password: '' });
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handleUpdatePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setProfileMessage({ type: 'error', text: 'Preencha todos os campos de senha.' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setProfileMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    setProfileMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
    setPasswordForm({ current: '', new: '', confirm: '' });
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOnboardingComplete = (agency: AgencyConfig, theme: ThemeConfig) => {
    setAgencyConfig({ ...agency, isOnboardingCompleted: true });
    setThemeConfig(theme);
    setShowOnboarding(false);
    // User requested that after onboarding it returns to login screen
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(MOCK_USER); // Reset to a safe default
    navigate('/');
  };
  (window as any).handleAppLogout = handleLogout;

  const handleLogin = (selectedUser: UserProfile) => {
    setUser(selectedUser);
    setIsAuthenticated(true);
  };

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLogin={handleLogin} 
        onOpenOnboarding={() => setShowOnboarding(true)}
        themeConfig={themeConfig}
        agencyConfig={agencyConfig}
      />
    );
  }

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden"
      style={{ 
        backgroundColor: themeConfig.dashboard.background, 
        color: themeConfig.dashboard.text,
        fontFamily: themeConfig.fontFamily 
      }}
    >
      <Sidebar 
        user={user}
        setUser={setUser}
        setSelectedNewsId={setSelectedNewsId}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        themeConfig={themeConfig}
        agencyConfig={agencyConfig}
        checkPermission={checkPermission}
      />

      <main className="flex-1 relative overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={
            <Dashboard 
              news={news}
              user={user}
              setSelectedNewsId={setSelectedNewsId}
              handleStartAnalysis={handleStartAnalysis}
              handleMoveTask={handleMoveTask}
              themeConfig={themeConfig}
              notifications={notifications}
              onMarkNotifAsRead={markNotificationAsRead}
              onClearNotifs={clearNotifications}
              checkPermission={checkPermission}
            />
          } />
          <Route path="/admin" element={
            checkPermission('view_admin') ? (
              <AdminDashboard 
                news={news}
                setNews={setNews}
                users={users}
                setUsers={setUsers}
                permissionProfiles={permissionProfiles}
                onUpdateProfile={handleUpdateProfile}
                onCreateProfile={handleCreateProfile}
                onDeleteProfile={handleDeleteProfile}
                auditLogs={auditLogs}
                labels={labels}
                setLabels={setLabels}
                reportConfig={reportConfig}
                setReportConfig={setReportConfig}
                themeConfig={themeConfig}
                setThemeConfig={setThemeConfig}
                agencyConfig={agencyConfig}
                setAgencyConfig={setAgencyConfig}
                currentUser={user}
                setSelectedNewsId={setSelectedNewsId}
                notifications={notifications}
                onMarkNotifAsRead={markNotificationAsRead}
                onClearNotifs={clearNotifications}
                checkPermission={checkPermission}
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/curator" element={
            checkPermission('view_curator') ? (
              <CuratorDashboard 
                news={news}
                setNews={setNews}
                users={users}
                currentUser={user}
                themeConfig={themeConfig}
                onAssign={handleAssign}
                onApprove={handleApprove}
                onReject={handleReject}
                onReopen={handleReopen}
                setSelectedNewsId={setSelectedNewsId}
                onAddNews={handleRegisterNews}
                receivedNews={receivedNews}
                onForwardToTriage={handleForwardToTriage}
                onDeleteReceivedNews={handleDeleteReceivedNews}
                notifications={notifications}
                onMarkNotifAsRead={markNotificationAsRead}
                onClearNotifs={clearNotifications}
                checkPermission={checkPermission}
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/analysis/:id" element={
            <AnalysisRouteWrapper 
              news={news}
              setSelectedNewsId={setSelectedNewsId}
              isToolboxOpen={isToolboxOpen}
              setIsToolboxOpen={setIsToolboxOpen}
              handleSaveFinal={handleSaveFinal}
              handleUpdateReportStructure={handleUpdateReportStructure}
              handleGenerateDraft={handleGenerateDraft}
              handleReviewReport={handleReviewReport}
              handleUpdateReport={handleUpdateReport}
              handleAddEvidence={handleAddEvidence}
              handleRemoveEvidence={handleRemoveEvidence}
              isSaving={isSaving}
              isGeneratingDraft={isGeneratingDraft}
              isReviewing={isReviewing}
              labels={labels}
              reportConfig={reportConfig}
              themeConfig={themeConfig}
              currentUser={user}
              checkPermission={checkPermission}
            />
          } />
          <Route path="/newsroom" element={
            checkPermission('view_newsroom') ? (
              <NewsroomView 
                news={news}
                themeConfig={themeConfig}
                user={user}
                labels={labels}
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/profile" element={
            <ProfileView 
              user={user}
              setUser={setUser}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              emailForm={emailForm}
              setEmailForm={setEmailForm}
              passwordForm={passwordForm}
              setPasswordForm={setPasswordForm}
              profileMessage={profileMessage}
              handleSaveProfile={handleSaveProfile}
              handleUpdateEmail={handleUpdateEmail}
              handleUpdatePassword={handleUpdatePassword}
              handleAvatarUpload={handleAvatarUpload}
              handleLogout={handleLogout}
              themeConfig={themeConfig}
            />
          } />
        </Routes>
      </main>
    </div>
  );
}

const AnalysisRouteWrapper = (props: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedNews = props.news.find((n: any) => n.id === id);

  useEffect(() => {
    if (id) {
      props.setSelectedNewsId(id);
    }
  }, [id, props]);

  if (!selectedNews) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AnalysisView 
      {...props}
      selectedNews={selectedNews}
      setCurrentView={(view: string) => navigate(`/${view}`)}
    />
  );
};

export default App;
