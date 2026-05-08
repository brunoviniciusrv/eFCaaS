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
  INITIAL_RECEIVED_NEWS
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
  ReceivedNewsItem
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

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [receivedNews, setReceivedNews] = useState<ReceivedNewsItem[]>(INITIAL_RECEIVED_NEWS);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
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

  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);

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
    addAuditLog('assign_task', `News #${newsId}`, `Assigned to ${users.find(u => u.id === checkerId)?.name}. Briefing: ${briefing}`);
  };

  const handleApprove = (newsId: string, comments: string) => {
    setNews(prev => prev.map(n => n.id === newsId ? {
      ...n,
      status: 'completed',
      completedAt: new Date().toISOString(),
      approvedBy: user.id,
      reviewComments: comments
    } : n));
    addAuditLog('approve_news', `News #${newsId}`, `Comments: ${comments}`);
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
    addAuditLog('reject_news', `News #${newsId}`, `Reason: ${comments}`);
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
    addAuditLog('reopen_news', `News #${newsId}`, `Reason: ${reason}`);
  };

  const handleRegisterNews = (newsData: any) => {
    const newItem: NewsItem = {
      ...newsData,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      status: newsData.assignedTo ? 'in_progress' : 'pending',
      evidence: [],
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
    addAuditLog('register_news', `News #${newItem.id}`, `Title: ${newItem.title}`);
  };

  const handleForwardToTriage = (receivedItem: ReceivedNewsItem) => {
    const newNewsItem: NewsItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: receivedItem.title,
      content: receivedItem.content,
      source: receivedItem.sourceType,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      media: receivedItem.media?.map(m => ({
        type: m.type as 'image' | 'video' | 'audio',
        url: m.url
      })),
      evidence: [],
      reportStructure: {
        summary: '',
        questions: [''],
        sources: [''],
        isInverifiable: false,
        contactWithAuthor: { hadContact: null }
      }
    };

    setNews(prev => [newNewsItem, ...prev]);
    setReceivedNews(prev => prev.map(rn => 
      rn.id === receivedItem.id ? { ...rn, status: 'in_triage' as const } : rn
    ));
    addAuditLog('forward_to_triage', `Received News #${receivedItem.id}`, `Forwarded to news triage`);
  };

  const handleDeleteReceivedNews = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia recebida?')) {
      setReceivedNews(prev => prev.map(rn => 
        rn.id === id ? { ...rn, status: 'deleted' as const } : rn
      ));
      addAuditLog('delete_received_news', `Received News #${id}`, `Deleted`);
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
    addAuditLog('move_task', `News #${newsId}`, `Moved to ${targetStatus}`);
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
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setAgencyConfig(prev => ({ ...prev, isOnboardingCompleted: false }));
    // Optional: Reset other states or clear localStorage if needed
    // localStorage.removeItem('platform_agency_config');
    // localStorage.removeItem('platform_theme_config');
  };

  if (!agencyConfig.isOnboardingCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
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
            />
          } />
          <Route path="/admin" element={
            user.role === 'admin' ? (
              <AdminDashboard 
                news={news}
                setNews={setNews}
                users={users}
                setUsers={setUsers}
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
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/curator" element={
            (user.role === 'curator' || user.role === 'admin' || user.role === 'editor') ? (
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
            />
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
