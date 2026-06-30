/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { 
  PLACEHOLDER_USER,
  INITIAL_AUDIT_LOGS,
  INITIAL_REPORT_CONFIG,
  INITIAL_THEME_CONFIG,
  INITIAL_AGENCY_CONFIG,
  INITIAL_PERMISSION_PROFILES
} from './constants';
import { 
  UserProfile, 
  NewsItem, 
  Evidence, 
  ReportStructure, 
  AuditLog,
  LabelConfig,
  ReportStructureConfig,
  ThemeConfig,
  AgencyConfig,
  ReceivedNewsItem,
  Notification,
  PermissionProfile,
  EditorialArticle,
  ArticleStatus,
  SpecializedNetworkCheck
} from './types';
import { apiService, normalizeReportStructure, buildEstruturaRelatorioBody } from './services/apiService';
import { mergeChecagemIntoNews } from './lib/newsAssignment';
import { mergeConteudoDetail, mergeAiAnalysisUpdate, isSameAiAnalysisState } from './lib/aiAnalysis';
import { normalizeResourceUrl } from './lib/apiBaseUrl';
import { clearToken, clearTenantSlug, getToken, tenantStorageKey } from './services/apiClient';
import { addPendingIaConteudo, getPendingIaConteudoIds, isIaFinished, removePendingIaConteudo } from './lib/iaPolling';

import { normalizeReportForEditor } from './lib/parecerHtml';

const CACHED_USER_KEY = 'efcaas_cached_user';
import { normalizeThemeConfig, themeCssVariables } from './lib/themeUtils';
import { applyThemePreset, findThemePresetById, resolveThemeTemplateId } from './config/themePresets';

function getParecerTexto(newsItem: NewsItem): string {
  return normalizeReportForEditor(newsItem.report);
}

function parecerToEditorHtml(text: string): string {
  if (!text.trim()) return '';
  if (text.trim().startsWith('<')) return text;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function buildDraftArticleFromNews(newsItem: NewsItem, authorId: string): EditorialArticle {
  const parecerTexto = getParecerTexto(newsItem);
  const plainExcerpt = parecerTexto.replace(/<[^>]*>/g, '').trim();
  const content = parecerTexto ? parecerToEditorHtml(parecerTexto) : '';

  return {
    id: `pending-${newsItem.id}`,
    newsId: newsItem.id,
    title: newsItem.title,
    content,
    excerpt: plainExcerpt
      ? `${plainExcerpt.substring(0, 150)}${plainExcerpt.length > 150 ? '...' : ''}`
      : newsItem.title,
    status: 'draft',
    template: 'complete',
    authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comments: [],
    versions: [],
  };
}

function buildSalvarRelatorioBody(newsItem: NewsItem) {
  const parecerTexto = getParecerTexto(newsItem);
  const plainExcerpt = parecerTexto.replace(/<[^>]*>/g, '').trim();
  return {
    titulo: newsItem.title,
    corpoTexto: parecerTexto,
    resumo: plainExcerpt
      ? `${plainExcerpt.substring(0, 150)}${plainExcerpt.length > 150 ? '...' : ''}`
      : newsItem.title,
    statusPublicacao: 'draft' as ArticleStatus,
    template: 'complete' as const,
    comentarios: [] as EditorialArticle['comments'],
  };
}

// Components
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AnalysisView } from './components/AnalysisView';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/AdminDashboard';
import { CuratorDashboard } from './components/CuratorDashboard';
import { OnboardingFlow } from './components/OnboardingFlow';
import { LoginView } from './components/LoginView';
import { LandingPage } from './components/LandingPage';
import { AgencyRegistrationPage } from './components/AgencyRegistrationPage';
import { ActivationPage } from './components/ActivationPage';
import { PlatformAdminDashboard } from './components/PlatformAdminDashboard';
import { EditorView } from './components/EditorView';
import { EditorialArchive } from './components/EditorialArchive';
import { PlatformShell } from './platform/PlatformShell';

function TenantRootRedirect({ checkPermission }: { checkPermission: (permId: string) => boolean }) {
  if (checkPermission('view_dashboard')) return <Navigate to="/dashboard" replace />;
  if (checkPermission('view_curator')) return <Navigate to="/curator" replace />;
  if (checkPermission('view_archive')) return <Navigate to="/editorial-archive" replace />;
  if (checkPermission('view_admin')) return <Navigate to="/admin" replace />;
  return <Navigate to="/profile" replace />;
}

function AppContent() {
  const navigate = useNavigate();
  const hasStoredToken = Boolean(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(hasStoredToken);
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(hasStoredToken);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    if (!hasStoredToken) return PLACEHOLDER_USER;
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : PLACEHOLDER_USER;
    } catch {
      return PLACEHOLDER_USER;
    }
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [receivedNews, setReceivedNews] = useState<ReceivedNewsItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>(() => {
    const saved = localStorage.getItem('platform_permission_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PERMISSION_PROFILES;
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
  const [specializedNetworkChecks, setSpecializedNetworkChecks] = useState<SpecializedNetworkCheck[]>([]);

  const [articles, setArticles] = useState<EditorialArticle[]>([]);

  const [editorAssignments, setEditorAssignments] = useState<Record<string, string>>({});

  const handleSaveArticle = async (article: EditorialArticle): Promise<EditorialArticle> => {
    const saved = await apiService.salvarRelatorioPublicacao(article.newsId, {
      titulo: article.title,
      corpoTexto: article.content,
      resumo: article.excerpt,
      statusPublicacao: article.status,
      template: article.template,
      comentarios: article.comments,
    });
    setArticles((prev) => {
      const exists = prev.some((a) => a.id === saved.id || a.newsId === saved.newsId);
      if (exists) {
        return prev.map((a) =>
          a.id === saved.id || a.newsId === saved.newsId ? saved : a
        );
      }
      return [saved, ...prev];
    });
    addAuditLog('save_article', `Matéria #${saved.id}`, `Matéria salva com status: ${saved.status}`);
    return saved;
  };

  const handleDeleteArticle = async (id: string) => {
    if (id.startsWith('pending-')) {
      const newsId = id.slice('pending-'.length);
      handleMoveRedacao(newsId, false);
      return;
    }
    await apiService.removerRelatorioPublicacao(id);
    setArticles((prev) => prev.filter((a) => a.id !== id));
    addAuditLog('delete_article', `Matéria #${id}`, `Matéria removida do acervo`);
  };

  const handleUpdateArticleStatus = async (id: string, status: ArticleStatus) => {
    if (id.startsWith('pending-')) {
      const newsId = id.slice('pending-'.length);
      const newsItem = news.find((n) => n.id === newsId);
      if (!newsItem) return;
      const saved = await apiService.salvarRelatorioPublicacao(newsId, {
        ...buildSalvarRelatorioBody(newsItem),
        statusPublicacao: status,
      });
      setArticles((prev) => [saved, ...prev.filter((a) => a.newsId !== newsId)]);
      addAuditLog('publish_article', `Matéria #${saved.id}`, `Status atualizado para: ${status}`);
      return;
    }
    const updated = await apiService.atualizarStatusRelatorioPublicacao(id, status);
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
    addAuditLog('publish_article', `Matéria #${id}`, `Status atualizado para: ${status}`);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [labels, setLabels] = useState<LabelConfig[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [newsFromApi, labelsFromApi, usersFromApi, relatoriosFromApi] = await Promise.all([
          apiService.listarConteudos(),
          apiService.listarEtiquetas(),
          apiService.listarUsuarios(),
          apiService.listarRelatoriosPublicacao().catch(() => [] as EditorialArticle[]),
        ]);
        setNews(newsFromApi.map((n) => ({
          ...n,
          assignedToEditor: editorAssignments[n.id],
        })));
        setLabels(labelsFromApi);
        setUsers(usersFromApi);
        setArticles(relatoriosFromApi);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
        addNotification({
          title: 'Aviso de Conectividade',
          message: 'Não foi possível carregar dados do servidor. Verifique a conexão com o backend.',
          type: 'warning',
          category: 'system',
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [isAuthenticated, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Atualiza conteúdos recebidos da API externa (polling). */
  const RECEIVED_NEWS_POLL_INTERVAL_MS = 30_000;

  useEffect(() => {
    if (!isAuthenticated) return;

    const profile = permissionProfiles.find((p) => p.id === user.profileId);
    const canManageReceived = profile?.permissions.includes('manage_received') ?? false;
    if (!canManageReceived) return;

    let cancelled = false;

    const pollReceivedNews = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const items = await apiService.listarConteudosRecebidos();
        if (!cancelled) {
          setReceivedNews(items);
        }
      } catch (err) {
        console.error('Erro no polling de conteúdos recebidos:', err);
      }
    };

    pollReceivedNews();
    const timer = window.setInterval(pollReceivedNews, RECEIVED_NEWS_POLL_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === 'visible') pollReceivedNews();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAuthenticated, user.profileId, permissionProfiles]);

  const [reportConfig, setReportConfig] = useState<ReportStructureConfig>(INITIAL_REPORT_CONFIG);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(INITIAL_THEME_CONFIG);
  const [agencyConfig, setAgencyConfig] = useState<AgencyConfig>(INITIAL_AGENCY_CONFIG);
  const configSyncReady = useRef(false);

  const isPlatformUser = isAuthenticated && user.profileId === 'p-platform';

  const loadTenantBranding = async (): Promise<AgencyConfig> => {
    const { agency, theme } = await apiService.obterConfiguracaoAgencia();
    const templateId = resolveThemeTemplateId(agency.templateId);
    const resolvedAgency = templateId !== agency.templateId ? { ...agency, templateId } : agency;
    setAgencyConfig(resolvedAgency);
    let resolvedTheme = INITIAL_THEME_CONFIG;
    if (theme) {
      let normalized = normalizeThemeConfig(theme);
      const preset = findThemePresetById(templateId);
      if (preset) normalized = applyThemePreset(normalized, preset);
      resolvedTheme = normalized;
      setThemeConfig(normalized);
    }
    localStorage.setItem(tenantStorageKey('agency_config') ?? 'tenant_agency_config', JSON.stringify(resolvedAgency));
    localStorage.setItem(tenantStorageKey('theme_config') ?? 'tenant_theme_config', JSON.stringify(resolvedTheme));
    configSyncReady.current = true;

    return resolvedAgency;
  };

  const applyAuthenticatedUser = (loggedUser: UserProfile) => {
    setUser(loggedUser);
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify(loggedUser));
    const platformUser = loggedUser.profileId === 'p-platform';
    setPermissionProfiles(
      platformUser
        ? INITIAL_PERMISSION_PROFILES.filter((p) => p.id === 'p-platform')
        : INITIAL_PERMISSION_PROFILES.filter((p) => p.id !== 'p-platform'),
    );
    setIsAuthenticated(true);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsAuthBootstrapping(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const loggedUser = await apiService.obterUsuarioAtual();
        if (cancelled) return;

        applyAuthenticatedUser(loggedUser);

        if (loggedUser.profileId !== 'p-platform') {
          try {
            const agency = await loadTenantBranding();
            if (!agency.isOnboardingCompleted) {
              setShowOnboarding(true);
            }
          } catch (err) {
            console.warn('Não foi possível restaurar configuração da agência:', err);
          }
        }
      } catch {
        if (!cancelled) {
          clearToken();
          clearTenantSlug();
          localStorage.removeItem(CACHED_USER_KEY);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsAuthBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated || isAuthBootstrapping) return;

    let cancelled = false;
    const poll = async () => {
      const pendingIds = getPendingIaConteudoIds();
      if (pendingIds.length === 0) return;
      for (const id of pendingIds) {
        if (cancelled) return;
        try {
          const fresh = await apiService.obterConteudo(id);
          if (cancelled) return;
          setNews((prev) => {
            let changed = false;
            const next = prev.map((n) => {
              if (n.id !== id) return n;
              const merged = mergeAiAnalysisUpdate(n, fresh);
              if (isSameAiAnalysisState(n, merged)) return n;
              changed = true;
              return merged;
            });
            return changed ? next : prev;
          });
          if (isIaFinished(fresh.iaStatus)) {
            removePendingIaConteudo(id);
            if (fresh.iaStatus === 'concluida') {
              addNotification({
                title: 'Análise de IA concluída',
                message: `A análise de "${fresh.title}" foi finalizada.`,
                type: 'success',
                category: 'system',
                targetUserId: user.id,
              });
            }
          }
        } catch {
          // continua polling
        }
      }
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, isAuthBootstrapping, user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated || isAuthBootstrapping) return;
    apiService.listarNotificacoes()
      .then((items) => {
        items.filter((n) => !n.lida).forEach((n) => {
          addNotification({
            title: n.titulo,
            message: n.mensagem ?? '',
            type: 'info',
            category: 'system',
            targetUserId: user.id,
          });
        });
      })
      .catch(() => {});
  }, [isAuthenticated, isAuthBootstrapping]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthenticated || isPlatformUser) return;
    const key = tenantStorageKey('theme_config');
    if (key) localStorage.setItem(key, JSON.stringify(themeConfig));
  }, [themeConfig, isAuthenticated, isPlatformUser]);

  useEffect(() => {
    if (!isAuthenticated || isPlatformUser) return;
    const key = tenantStorageKey('agency_config');
    if (key) localStorage.setItem(key, JSON.stringify(agencyConfig));
  }, [agencyConfig, isAuthenticated, isPlatformUser]);

  useEffect(() => {
    if (!isAuthenticated || isPlatformUser) return;
    const checksKey = tenantStorageKey('specialized_checks');
    const assignmentsKey = tenantStorageKey('editor_assignments');
    if (checksKey) {
      const saved = localStorage.getItem(checksKey);
      setSpecializedNetworkChecks(saved ? JSON.parse(saved) : []);
    } else {
      setSpecializedNetworkChecks([]);
    }
    if (assignmentsKey) {
      const saved = localStorage.getItem(assignmentsKey);
      setEditorAssignments(saved ? JSON.parse(saved) : {});
    } else {
      setEditorAssignments({});
    }
  }, [isAuthenticated, isPlatformUser, user.id]);

  useEffect(() => {
    if (!isAuthenticated || isPlatformUser) return;
    const key = tenantStorageKey('specialized_checks');
    if (key) localStorage.setItem(key, JSON.stringify(specializedNetworkChecks));
  }, [specializedNetworkChecks, isAuthenticated, isPlatformUser]);

  useEffect(() => {
    if (!isAuthenticated || isPlatformUser) return;
    const key = tenantStorageKey('editor_assignments');
    if (key) localStorage.setItem(key, JSON.stringify(editorAssignments));
  }, [editorAssignments, isAuthenticated, isPlatformUser]);

  useEffect(() => {
    if (!configSyncReady.current || isPlatformUser) return;

    const podePersistir =
      !agencyConfig.isOnboardingCompleted ||
      (isAuthenticated && checkPermission('admin_settings'));
    if (!podePersistir) return;

    const timer = window.setTimeout(() => {
      apiService.salvarConfiguracaoAgencia(agencyConfig, themeConfig).catch((err) => {
        console.error('Erro ao persistir configuração da agência:', err);
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [agencyConfig, themeConfig, isAuthenticated, agencyConfig.isOnboardingCompleted, isPlatformUser]);

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
  const [isSaving, setIsSaving] = useState(false);

  const selectedNews = news.find(n => n.id === selectedNewsId);

  const handleStartAnalysis = async (id: string) => {
    const item = news.find(n => n.id === id);
    if (!item) return;

    try {
      const checagem = await apiService.assumirConteudo(id);
      setNews(prev => prev.map(n => {
        if (n.id !== id) return n;
        const merged = mergeChecagemIntoNews(n, checagem);
        if (!merged.reportStructure) {
          return {
            ...merged,
            status: 'in_progress' as const,
            startTime: new Date().toISOString(),
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
        return { ...merged, status: 'in_progress' as const };
      }));

      const checagemId = checagem.id ?? item.checagemId;
      if (checagemId) {
        try {
          await apiService.iniciarChecagem(checagemId);
        } catch {
          // Pode já ter sido iniciada; continua normalmente
        }
      }
    } catch (err) {
      console.error('Erro ao assumir conteúdo:', err);
      alert(err instanceof Error ? err.message : 'Não foi possível assumir o conteúdo.');
      return;
    }

    setSelectedNewsId(id);
    navigate(`/analysis/${id}`);
  };

  const handleViewCompletedCheck = (id: string) => {
    setSelectedNewsId(id);
    navigate(`/analysis/${id}`);
  };

  const handleSaveParecer = async (): Promise<boolean> => {
    if (!selectedNews?.checagemId) return false;
    setIsSaving(true);
    try {
      const rs = selectedNews.reportStructure;
      if (rs) {
        await apiService.salvarEstruturaRelatorio(selectedNews.checagemId, buildEstruturaRelatorioBody(rs));
      }
      if (selectedNews.report) {
        await apiService.salvarParecer(selectedNews.checagemId, {
          textoParecer: selectedNews.report,
        });
      }
      return true;
    } catch (err) {
      console.error('Erro ao salvar parecer:', err);
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : err}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssign = async (newsId: string, checkerId: string, briefing: string) => {
    await apiService.atribuirConteudo(newsId, {
      checadorId: Number(checkerId),
      briefing: briefing.trim() || undefined,
    });

    const updated = await apiService.obterConteudo(newsId);
    setNews(prev => prev.map(n => n.id === newsId ? {
      ...updated,
      status: 'in_progress' as const,
    } : n));

    const targetUser = users.find(u => u.id === checkerId);
    const newsTitle = news.find(n => n.id === newsId)?.title ?? `Notícia #${newsId}`;
    addNotification({
      title: 'Nova Tarefa Atribuída',
      message: `Você recebeu uma nova tarefa: ${newsTitle}`,
      type: 'info',
      category: 'assignment',
      targetUserId: checkerId,
      relatedNewsId: newsId,
      link: `/analysis/${newsId}`,
    });
    addAuditLog(
      'assign_task',
      `Notícia #${newsId}`,
      `Atribuiu para ${targetUser?.name ?? checkerId}. Briefing: ${briefing}`,
    );
  };

  const handleUnassign = async (newsId: string, checkerId: string) => {
    await apiService.desatribuirConteudo(newsId, checkerId);
    const updated = await apiService.obterConteudo(newsId);
    setNews(prev => prev.map(n => n.id === newsId ? updated : n));

    const targetUser = users.find(u => u.id === checkerId);
    addAuditLog(
      'unassign_task',
      `Notícia #${newsId}`,
      `Removeu atribuição de ${targetUser?.name ?? checkerId}.`,
    );
  };

  const handleApprove = async (newsId: string, comments: string) => {
    try {
      await apiService.aprovarConteudo(newsId, comments);
      const relatorios = await apiService.listarRelatoriosPublicacao().catch(() => [] as EditorialArticle[]);
      setArticles(relatorios);
      setNews(prev => prev.map(n => n.id === newsId ? {
        ...n,
        status: 'completed',
        completedAt: new Date().toISOString(),
        approvedBy: user.id,
        reviewComments: comments
      } : n));
      const targetNews = news.find(n => n.id === newsId);
      addAuditLog('approve_news', `Notícia #${newsId}`, `Aprovou "${targetNews?.title}". Comentários: ${comments}`);
    } catch (err) {
      console.error('Erro ao aprovar:', err);
      addNotification({ title: 'Erro ao Aprovar', message: err instanceof Error ? err.message : 'Não foi possível aprovar.', type: 'error', category: 'system' });
    }
  };

  const handleReject = async (newsId: string, comments: string) => {
    try {
      await apiService.rejeitarConteudo(newsId, comments);
      setNews(prev => prev.map(n => n.id === newsId ? {
        ...n,
        status: 'to_rectify',
        rejectedBy: user.id,
        reviewComments: comments,
        assignmentHistory: [
          ...(n.assignmentHistory || []),
          {
            id: Math.random().toString(36).substr(2, 9),
            assignedTo: n.assignedTo || '',
            assignedBy: user.id,
            timestamp: new Date().toISOString(),
            action: 'rejected' as const,
            reason: comments
          }
        ]
      } : n));
      const targetNews = news.find(n => n.id === newsId);
      addAuditLog('reject_news', `Notícia #${newsId}`, `Rejeitou "${targetNews?.title}". Motivo: ${comments}`);
    } catch (err) {
      console.error('Erro ao rejeitar:', err);
      addNotification({ title: 'Erro ao Rejeitar', message: err instanceof Error ? err.message : 'Não foi possível rejeitar.', type: 'error', category: 'system' });
    }
  };

  const handleUpdateReportStructure = (updates: Partial<ReportStructure>) => {
    if (!selectedNewsId) return;
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      reportStructure: normalizeReportStructure({ ...n.reportStructure, ...updates }),
    } : n));
  };

  const handleUpdateReport = (text: string) => {
    if (!selectedNewsId) return;
    setNews(prev => prev.map(n => n.id === selectedNewsId ? { ...n, report: text } : n));
  };

  const handleAddEvidence = async (evidence: Omit<Evidence, 'id' | 'timestamp'>) => {
    if (!selectedNewsId) return;
    const currentNews = news.find(n => n.id === selectedNewsId);

    if (currentNews?.checagemId) {
      try {
        const apiEv = await apiService.adicionarEvidencia(currentNews.checagemId, {
          tipo: evidence.type,
          linkArquivo: evidence.url,
          descricao: evidence.description ?? evidence.title,
        });
        const newEvidence: Evidence = {
          id: apiEv.id,
          type: (apiEv.tipo as Evidence['type']) ?? 'link',
          url: apiEv.linkArquivo,
          title: evidence.title,
          description: apiEv.descricao ?? undefined,
          timestamp: new Date().toLocaleString(),
        };
        setNews(prev => prev.map(n => n.id === selectedNewsId ? {
          ...n,
          evidence: [...n.evidence, newEvidence]
        } : n));
        return;
      } catch (err) {
        console.error('Erro ao adicionar evidência via API:', err);
      }
    }

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

  const handleUploadEvidenceFile = async (file: File) => {
    if (!selectedNewsId) return;
    const currentNews = news.find(n => n.id === selectedNewsId);

    if (!currentNews?.checagemId) {
      throw new Error('Checagem não iniciada. Atribua a tarefa antes de anexar arquivos.');
    }

    const apiEv = await apiService.uploadEvidenciaArquivo(currentNews.checagemId, file, file.name);
    const newEvidence: Evidence = {
      id: apiEv.id,
      type: (apiEv.tipo as Evidence['type']) ?? 'document',
      url: apiEv.linkArquivo,
      title: apiEv.nomeArquivo ?? file.name,
      description: apiEv.descricao ?? undefined,
      timestamp: new Date().toLocaleString(),
    };
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      evidence: [...n.evidence, newEvidence]
    } : n));
  };

  const handleRemoveEvidence = async (id: string) => {
    if (!selectedNewsId) return;
    const currentNews = news.find(n => n.id === selectedNewsId);

    if (currentNews?.checagemId) {
      try {
        await apiService.removerEvidencia(currentNews.checagemId, id);
      } catch (err) {
        console.error('Erro ao remover evidência via API:', err);
      }
    }

    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      evidence: n.evidence.filter(e => e.id !== id)
    } : n));
  };

  const handleUploadMediaFile = async (file: File) => {
    if (!selectedNewsId) return;
    const currentNews = news.find(n => n.id === selectedNewsId);
    if (!currentNews) return;

    const apiAnexo = await apiService.uploadAnexoConteudo(currentNews.id, file);
    const tipo = apiAnexo.tipo as 'image' | 'video' | 'audio' | 'document';
    const type =
      tipo === 'image' || tipo === 'video' || tipo === 'audio' || tipo === 'document'
        ? tipo
        : 'document';
    const newMedia = {
      id: apiAnexo.id,
      type,
      url: normalizeResourceUrl(apiAnexo.urlAcesso),
      title: apiAnexo.nomeArquivo ?? file.name,
    };
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      media: [...(n.media ?? []), newMedia],
    } : n));
  };

  const handleRemoveMedia = async (anexoId: string) => {
    if (!selectedNewsId) return;
    const currentNews = news.find(n => n.id === selectedNewsId);
    if (!currentNews) return;

    await apiService.removerAnexoConteudo(currentNews.id, anexoId);
    setNews(prev => prev.map(n => n.id === selectedNewsId ? {
      ...n,
      media: (n.media ?? []).filter(m => m.id !== anexoId),
    } : n));
  };

  const handleSaveInvestigation = async (): Promise<boolean> => {
    if (!selectedNews) return false;
    setIsSaving(true);
    try {
      if (selectedNews.checagemId) {
        const rs = selectedNews.reportStructure;
        await apiService.salvarEstruturaRelatorio(
          selectedNews.checagemId,
          buildEstruturaRelatorioBody(normalizeReportStructure(rs))
        );
      }
      return true;
    } catch (err) {
      console.error('Erro ao salvar investigação:', err);
      alert(`Erro ao salvar: ${err instanceof Error ? err.message : err}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFinal = async () => {
    if (!selectedNews) return;

    if (!selectedNews.reportStructure?.label) {
      alert("Por favor, selecione uma classificação final antes de finalizar.");
      return;
    }

    setIsSaving(true);
    try {
      if (selectedNews.checagemId) {
        const rs = selectedNews.reportStructure;

        await apiService.salvarEstruturaRelatorio(selectedNews.checagemId, buildEstruturaRelatorioBody(rs));

        if (selectedNews.report) {
          await apiService.salvarParecer(selectedNews.checagemId, {
            textoParecer: selectedNews.report,
          });
        }

        const labelId = labels.find(l => l.name === rs.label)?.id;
        if (!labelId) throw new Error(`Etiqueta "${rs.label}" não encontrada.`);

        await apiService.finalizarParecer(selectedNews.checagemId, {
          textoParecer: selectedNews.report ?? rs.summary ?? '',
          etiquetaId: Number(labelId),
        });
      }

      setNews(prev => prev.map(n => n.id === selectedNewsId ? {
        ...n,
        status: 'final_review' as const,
        completedAt: new Date().toISOString()
      } : n));
      setSelectedNewsId(null);
      navigate('/dashboard');
    } catch (err) {
      console.error('Erro ao finalizar parecer:', err);
      alert(`Erro ao finalizar: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopen = async (newsId: string, reason: string) => {
    try {
      const item = news.find(n => n.id === newsId);
      if (item?.checagemId) {
        await apiService.reabrirConteudo(newsId, reason);
      }

      setNews(prev => prev.map(n => {
        if (n.id === newsId) {
          const history = {
            id: Math.random().toString(36).substr(2, 9),
            assignedTo: n.assignedTo || '',
            assignedBy: user.id,
            timestamp: new Date().toISOString(),
            action: 'reopened' as const,
            reason
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
      addAuditLog('reopen_news', `Notícia #${newsId}`, `Reabriu "${targetNews?.title}". Motivo: ${reason}`);
    } catch (err) {
      console.error('Erro ao reabrir:', err);
      addNotification({ title: 'Erro ao Reabrir', message: err instanceof Error ? err.message : 'Não foi possível reabrir.', type: 'error', category: 'system' });
    }
  };

  const handleRegisterNews = async (newsData: any) => {
    try {
      const etiquetaId = newsData.labelId
        ? Number(newsData.labelId)
        : labels[0]?.id
        ? Number(labels[0].id)
        : undefined;

      let created = await apiService.criarConteudo({
        titulo:    newsData.title,
        alegacao:  newsData.alegacao  ?? newsData.content  ?? undefined,
        descricao: newsData.descricao ?? undefined,
        link:      newsData.url       ?? newsData.link     ?? undefined,
        fonte:     newsData.source    ?? newsData.fonte    ?? undefined,
        prioridade: newsData.priority ?? undefined,
      });

      const attachments: File[] = newsData.attachments ?? [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          await apiService.uploadAnexoConteudo(created.id, file);
        }
        created = await apiService.obterConteudo(created.id);
      }

      if (newsData.assignedTo) {
        const checagem = await apiService.atribuirConteudo(created.id, {
          checadorId: Number(newsData.assignedTo),
          briefing: newsData.briefing ?? '',
        });
        created = mergeChecagemIntoNews(
          { ...created, status: 'in_progress' },
          checagem,
        );
      }

      setNews(prev => [created, ...prev]);

      if (created.assignedTo) {
        addNotification({
          title: 'Nova Tarefa Atribuída',
          message: `Você recebeu uma nova tarefa: ${created.title}`,
          type: 'info',
          category: 'assignment',
          targetUserId: created.assignedTo,
          relatedNewsId: created.id,
          link: `/analysis/${created.id}`
        });
      } else {
        addNotification({
          title: 'Nova Notícia na Fila',
          message: `Nova notícia adicionada à fila disponível: ${created.title}`,
          type: 'info',
          category: 'queue',
          targetRole: ['admin', 'curator'],
          relatedNewsId: created.id,
          link: '/curator'
        });
      }

      addAuditLog('register_news', `Notícia #${created.id}`, `Registrou: "${created.title}"`);
    } catch (err) {
      console.error('Erro ao registrar notícia:', err);
      addNotification({
        title: 'Erro ao Registrar',
        message: err instanceof Error ? err.message : 'Não foi possível registrar a notícia.',
        type: 'error',
        category: 'system',
      });
    }
  };

  const handleEditNews = async (newsId: string, newsData: any) => {
    try {
      const updated = await apiService.editarConteudo(newsId, {
        titulo:     newsData.title,
        alegacao:   newsData.alegacao  ?? newsData.content  ?? undefined,
        descricao:  newsData.descricao ?? undefined,
        link:       newsData.url       ?? newsData.link     ?? undefined,
        fonte:      newsData.source    ?? newsData.fonte    ?? undefined,
        prioridade: newsData.priority  ?? undefined,
      });
      setNews(prev => prev.map(n => n.id === newsId ? { ...n, ...updated } : n));
      addAuditLog('edit_news', `Notícia #${newsId}`, `Editou: "${updated.title}"`);
    } catch (err) {
      console.error('Erro ao editar notícia:', err);
      addNotification({
        title: 'Erro ao Editar',
        message: err instanceof Error ? err.message : 'Não foi possível salvar as alterações.',
        type: 'error',
        category: 'system',
      });
    }
  };

  const handleForwardToTriage = async (receivedItem: ReceivedNewsItem) => {
    try {
      const created = await apiService.encaminharConteudoRecebido(receivedItem.id);

      setNews(prev => [created, ...prev]);
      setReceivedNews(prev => prev.filter(rn => rn.id !== receivedItem.id));

      addNotification({
        title: 'Notícia em Triagem',
        message: `Uma nova notícia foi encaminhada para triagem: ${created.title}`,
        type: 'info',
        category: 'queue',
        targetRole: ['admin', 'curator'],
        relatedNewsId: created.id,
        link: '/curator'
      });

      addAuditLog('forward_to_triage', `Notícia Recebida #${receivedItem.id}`, `Encaminhou notícia recebida "${receivedItem.title}" para triagem`);
    } catch (err) {
      console.error('Erro ao encaminhar para triagem:', err);
      addNotification({
        title: 'Erro ao Encaminhar',
        message: err instanceof Error ? err.message : 'Não foi possível encaminhar o conteúdo para triagem.',
        type: 'error',
        category: 'system',
      });
    }
  };

  const handleDeleteReceivedNews = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta notícia recebida?')) {
      return;
    }
    try {
      const targetReceived = receivedNews.find(rn => rn.id === id);
      await apiService.excluirConteudoRecebido(id);
      setReceivedNews(prev => prev.filter(rn => rn.id !== id));
      addAuditLog('delete_received_news', `Notícia Recebida #${id}`, `Excluiu notícia recebida "${targetReceived?.title}"`);
    } catch (err) {
      console.error('Erro ao excluir conteúdo recebido:', err);
      addNotification({
        title: 'Erro ao Excluir',
        message: err instanceof Error ? err.message : 'Não foi possível excluir o conteúdo recebido.',
        type: 'error',
        category: 'system',
      });
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    const target = news.find(n => n.id === newsId);
    if (!window.confirm(`Tem certeza que deseja excluir "${target?.title ?? 'este conteúdo'}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await apiService.excluirConteudo(newsId);
      setNews(prev => prev.filter(n => n.id !== newsId));
      if (selectedNewsId === newsId) {
        setSelectedNewsId(null);
        navigate('/curator');
      }
      addAuditLog('delete_news', `Conteúdo #${newsId}`, `Excluiu conteúdo "${target?.title ?? newsId}"`);
      addNotification({
        title: 'Conteúdo excluído',
        message: `O conteúdo "${target?.title ?? ''}" foi removido com sucesso.`,
        type: 'info',
        category: 'system',
      });
    } catch (err) {
      console.error('Erro ao excluir conteúdo:', err);
      alert(err instanceof Error ? err.message : 'Não foi possível excluir o conteúdo.');
    }
  };

  const handleSendToSpecializedNetwork = (_newsId: string) => {
    addNotification({
      title: 'Recurso indisponível',
      message: 'A integração com a rede de checadores especializados ainda não está implementada.',
      type: 'warning',
      category: 'system',
    });
  };

  const handleMoveTask = async (newsId: string, targetStatus: 'pending' | 'in_progress') => {
    if (targetStatus === 'in_progress') {
      try {
        const checagem = await apiService.assumirConteudo(newsId);
        setNews(prev => prev.map(n => {
          if (n.id !== newsId) return n;
          const merged = mergeChecagemIntoNews(n, checagem);
          if (!merged.reportStructure) {
            return {
              ...merged,
              status: 'in_progress' as const,
              startTime: new Date().toISOString(),
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
          return { ...merged, status: 'in_progress' as const };
        }));

        const item = news.find(n => n.id === newsId);
        if (checagem.id ?? item?.checagemId) {
          try {
            await apiService.iniciarChecagem(checagem.id ?? item!.checagemId!);
          } catch {
            // Já iniciada
          }
        }
      } catch (err) {
        console.error('Erro ao mover tarefa:', err);
        return;
      }
    } else {
      setNews(prev => prev.map(n => {
        if (n.id !== newsId) return n;
        return { ...n, status: 'pending' as const };
      }));
    }

    const targetNews = news.find(n => n.id === newsId);
    const statusLabel = targetStatus === 'in_progress' ? 'Em Análise' : 'Pendente';
    addAuditLog('move_task', `Notícia #${newsId}`, `Moveu "${targetNews?.title}" para ${statusLabel}`);
  };

  const displayArticles = useMemo(() => {
    const merged = new Map<string, EditorialArticle>();
    for (const article of articles) {
      merged.set(article.newsId, article);
    }
    for (const item of news) {
      if (item.status === 'completed' && item.assignedToEditor && !merged.has(item.id)) {
        merged.set(item.id, buildDraftArticleFromNews(item, item.assignedToEditor));
      }
    }
    return Array.from(merged.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [articles, news]);

  const handleMoveRedacao = (newsId: string, assigned: boolean) => {
    const newsItem = news.find((n) => n.id === newsId);
    if (!newsItem) return;

    setEditorAssignments((prev) => {
      const next = { ...prev };
      if (assigned) next[newsId] = user.id;
      else delete next[newsId];
      return next;
    });

    setNews((prev) =>
      prev.map((n) =>
        n.id === newsId
          ? { ...n, assignedToEditor: assigned ? user.id : undefined }
          : n
      )
    );

    if (assigned) {
      void (async () => {
        try {
          const existing = articles.find((a) => a.newsId === newsId);
          if (existing) {
            const saved = await apiService.salvarRelatorioPublicacao(newsId, {
              titulo: existing.title,
              corpoTexto: existing.content,
              resumo: existing.excerpt,
              statusPublicacao: existing.status,
              template: existing.template,
              comentarios: existing.comments,
            });
            setArticles((prev) => prev.map((a) => (a.newsId === newsId ? saved : a)));
            return;
          }
          const fresh = await apiService.obterConteudo(newsId);
          const itemWithParecer = {
            ...newsItem,
            report: fresh.report ?? newsItem.report,
            reportStructure: fresh.reportStructure ?? newsItem.reportStructure,
          };
          setNews((prev) =>
            prev.map((n) =>
              n.id === newsId
                ? {
                    ...n,
                    report: itemWithParecer.report,
                    reportStructure: itemWithParecer.reportStructure,
                  }
                : n
            )
          );
          const saved = await apiService.salvarRelatorioPublicacao(
            newsId,
            buildSalvarRelatorioBody(itemWithParecer)
          );
          setArticles((prev) => {
            if (prev.some((a) => a.newsId === newsId)) {
              return prev.map((a) => (a.newsId === newsId ? saved : a));
            }
            return [saved, ...prev];
          });
        } catch (err) {
          console.error('Erro ao registrar matéria no acervo:', err);
          addNotification({
            title: 'Acervo editorial',
            message:
              err instanceof Error
                ? err.message
                : 'A matéria aparecerá como rascunho local até ser salva no banco.',
            type: 'warning',
            category: 'system',
          });
        }
      })();

      addAuditLog(
        'assign_editor',
        `Notícia #${newsId}`,
        `Atribuiu "${newsItem.title}" para redação editorial`
      );
    } else {
      const article = articles.find((a) => a.newsId === newsId);
      if (article && (article.status === 'draft' || article.status === 'in_editing')) {
        void (async () => {
          try {
            await apiService.removerRelatorioPublicacao(article.id);
            setArticles((prev) => prev.filter((a) => a.newsId !== newsId));
          } catch (err) {
            console.error('Erro ao remover rascunho do acervo:', err);
          }
        })();
      }

      addAuditLog(
        'unassign_editor',
        `Notícia #${newsId}`,
        `Devolveu "${newsItem.title}" à fila de redação`
      );
    }
  };

  const handleCuratorMoveTask = async (newsId: string, newStatus: string): Promise<void> => {
    await apiService.atualizarStatusConteudo(newsId, newStatus);
    setNews(prev => prev.map(n => n.id === newsId ? { ...n, status: newStatus as NewsItem['status'] } : n));
    const targetNews = news.find(n => n.id === newsId);
    addAuditLog('move_task', `Notícia #${newsId}`, `Moveu "${targetNews?.title}" para ${newStatus}`);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<UserProfile>(user);
  
  useEffect(() => {
    setProfileForm(user);
  }, [user]);

  const [emailForm, setEmailForm] = useState({ newEmail: '', password: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveProfile = async () => {
    try {
      const updated = await apiService.atualizarPerfil({
        nome: profileForm.name,
        bio: profileForm.bio ?? '',
        foto: profileForm.avatarUrl,
      });
      setUser(updated);
      setProfileForm(updated);
      setProfileMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar perfil.',
      });
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailForm.newEmail || !emailForm.password) {
      setProfileMessage({ type: 'error', text: 'Preencha todos os campos de e-mail.' });
      return;
    }
    try {
      const updated = await apiService.alterarEmail(emailForm.newEmail, emailForm.password);
      setUser(updated);
      setProfileForm(updated);
      setProfileMessage({ type: 'success', text: 'E-mail atualizado com sucesso!' });
      setEmailForm({ newEmail: '', password: '' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao alterar e-mail.',
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      setProfileMessage({ type: 'error', text: 'Preencha todos os campos de senha.' });
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setProfileMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    try {
      await apiService.alterarSenha(passwordForm.current, passwordForm.new);
      setProfileMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setPasswordForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao alterar senha.',
      });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'A imagem deve ter no máximo 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleOnboardingComplete = async (agency: AgencyConfig, theme: ThemeConfig) => {
    const completedAgency = { ...agency, isOnboardingCompleted: true };
    setAgencyConfig(completedAgency);
    setThemeConfig(theme);
    try {
      await apiService.salvarConfiguracaoAgencia(completedAgency, theme);
    } catch (err) {
      console.error('Erro ao salvar configuração do Ajustar:', err);
    }
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    clearToken();
    clearTenantSlug();
    setIsAuthenticated(false);
    setUser(PLACEHOLDER_USER);
    setNews([]);
    setUsers([]);
    setShowOnboarding(false);
    navigate('/');
  };

  const handleLogin = async (email: string, password: string) => {
    const { user: loggedUser } = await apiService.login(email, password);
    setNews([]);
    setUsers([]);
    setArticles([]);
    applyAuthenticatedUser(loggedUser);

    if (loggedUser.profileId === 'p-platform') {
      navigate('/platform');
      return;
    }

    try {
      const agency = await loadTenantBranding();
      if (!agency.isOnboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.warn('Não foi possível carregar configuração da agência após login:', err);
      setShowOnboarding(true);
    }

    navigate('/');
  };

  const handleActivated = async (loggedUser: UserProfile) => {
    applyAuthenticatedUser(loggedUser);

    try {
      const agency = await loadTenantBranding();
      if (!agency.isOnboardingCompleted) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.warn('Configuração da agência indisponível após ativação:', err);
      setShowOnboarding(true);
    }

    navigate('/');
  };

  const showLoginRoutes = !isAuthenticated && !hasStoredToken;

  if (isAuthenticated && isPlatformUser) {
    return (
      <PlatformShell user={user} onLogout={handleLogout}>
        <Routes>
          <Route
            path="/platform"
            element={
              <PlatformAdminDashboard checkPermission={checkPermission} />
            }
          />
          <Route path="*" element={<Navigate to="/platform" replace />} />
        </Routes>
      </PlatformShell>
    );
  }

  if (isAuthenticated && showOnboarding && !agencyConfig.isOnboardingCompleted) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        initialAgency={agencyConfig}
        initialTheme={themeConfig}
      />
    );
  }

  if (showLoginRoutes) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/cadastro-agencia" element={<AgencyRegistrationPage />} />
        <Route
          path="/ativar"
          element={<ActivationPage onActivated={handleActivated} />}
        />
        <Route
          path="/login"
          element={<LoginView onLogin={handleLogin} />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden"
      style={{ 
        backgroundColor: themeConfig.dashboard.background, 
        color: themeConfig.dashboard.text,
        fontFamily: themeConfig.fontFamily,
        ...themeCssVariables(themeConfig),
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
        onLogout={handleLogout}
      />

      <main className="flex-1 relative overflow-y-auto">
        <Routes>
          <Route path="/" element={<TenantRootRedirect checkPermission={checkPermission} />} />
          <Route path="/dashboard" element={
            checkPermission('view_dashboard') ? (
              <Dashboard 
                news={news}
                articles={displayArticles}
                user={user}
                setSelectedNewsId={setSelectedNewsId}
                handleStartAnalysis={handleStartAnalysis}
                handleViewCompletedCheck={handleViewCompletedCheck}
                handleMoveTask={handleMoveTask}
                handleMoveRedacao={handleMoveRedacao}
                onApprove={handleApprove}
                onReject={handleReject}
                themeConfig={themeConfig}
                notifications={notifications}
                onMarkNotifAsRead={markNotificationAsRead}
                onClearNotifs={clearNotifications}
                checkPermission={checkPermission}
                users={users}
                permissionProfiles={permissionProfiles}
                auditLogs={auditLogs}
                labels={labels}
              />
            ) : <Navigate to="/" replace />
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
                onUnassign={handleUnassign}
                onApprove={handleApprove}
                onReject={handleReject}
                onReopen={handleReopen}
                setSelectedNewsId={setSelectedNewsId}
                onAddNews={handleRegisterNews}
                onEditNews={handleEditNews}
                receivedNews={receivedNews}
                onForwardToTriage={handleForwardToTriage}
                onDeleteReceivedNews={handleDeleteReceivedNews}
                onDeleteNews={handleDeleteNews}
                notifications={notifications}
                onMarkNotifAsRead={markNotificationAsRead}
                onClearNotifs={clearNotifications}
                checkPermission={checkPermission}
                onSendToSpecializedNetwork={handleSendToSpecializedNetwork}
                specializedNetworkChecks={specializedNetworkChecks}
                onMoveTask={handleCuratorMoveTask}
                agencyConfig={agencyConfig}
                permissionProfiles={permissionProfiles}
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/analysis/:id" element={
            <AnalysisRouteWrapper 
              news={news}
              setNews={setNews}
              setSelectedNewsId={setSelectedNewsId}
              isToolboxOpen={isToolboxOpen}
              setIsToolboxOpen={setIsToolboxOpen}
              handleSaveFinal={handleSaveFinal}
              handleSaveParecer={handleSaveParecer}
              handleSaveInvestigation={handleSaveInvestigation}
              handleUpdateReportStructure={handleUpdateReportStructure}
              handleUpdateReport={handleUpdateReport}
              handleAddEvidence={handleAddEvidence}
              handleUploadEvidenceFile={handleUploadEvidenceFile}
              handleRemoveEvidence={handleRemoveEvidence}
              handleUploadMediaFile={handleUploadMediaFile}
              handleRemoveMedia={handleRemoveMedia}
              isSaving={isSaving}
              labels={labels}
              reportConfig={reportConfig}
              themeConfig={themeConfig}
              currentUser={user}
              agencyConfig={agencyConfig}
              onDeleteNews={checkPermission('manage_triage') ? handleDeleteNews : undefined}
            />
          } />
          <Route path="/editor/:id" element={
            checkPermission('view_editor') ? (
              <EditorView 
                user={user}
                news={news}
                labels={labels}
                agencyConfig={agencyConfig}
                articles={displayArticles}
                onSaveArticle={handleSaveArticle}
                checkPermission={checkPermission}
                themeConfig={themeConfig}
              />
            ) : <Navigate to="/dashboard" replace />
          } />
          <Route path="/editorial-archive" element={
            checkPermission('view_archive') ? (
              <EditorialArchive 
                user={user}
                news={news}
                articles={displayArticles}
                onDeleteArticle={handleDeleteArticle}
                onUpdateStatus={handleUpdateArticleStatus}
                checkPermission={checkPermission}
                themeConfig={themeConfig}
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
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const detailRequestIdRef = React.useRef(0);

  useEffect(() => {
    if (id) {
      props.setSelectedNewsId(id);
    }
  }, [id, props.setSelectedNewsId]);

  const refreshConteudoDetail = React.useCallback(async (): Promise<NewsItem | null> => {
    if (!id) return null;
    const requestId = ++detailRequestIdRef.current;
    const fresh = await apiService.obterConteudo(id);
    if (requestId !== detailRequestIdRef.current) return null;
    props.setNews((prev: NewsItem[]) =>
      prev.map((n) => (n.id === id ? mergeConteudoDetail(n, fresh) : n))
    );
    return fresh;
  }, [id, props.setNews]);

  useEffect(() => {
    if (!id) return;

    const requestId = ++detailRequestIdRef.current;
    let cancelled = false;
    setIsLoadingDetail(true);

    apiService.obterConteudo(id)
      .then((fresh) => {
        if (cancelled || requestId !== detailRequestIdRef.current) return;
        props.setNews((prev: NewsItem[]) =>
          prev.map((n) => (n.id === id ? mergeConteudoDetail(n, fresh, { replaceInvestigation: true }) : n))
        );
      })
      .catch((err) => {
        console.error('Erro ao carregar detalhes da investigação:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selectedNews) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoadingDetail && selectedNews.evidence.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] opacity-60">
        <p className="text-sm font-medium">Carregando investigação...</p>
      </div>
    );
  }

  return (
    <AnalysisView 
      {...props}
      selectedNews={props.news.find((n: any) => n.id === id) ?? selectedNews}
      setCurrentView={(view: string) => navigate(`/${view}`)}
      onNewsUpdated={(updated) => {
        props.setNews((prev: NewsItem[]) =>
          prev.map((n: NewsItem) => (n.id === updated.id ? { ...n, ...updated } : n))
        );
      }}
      refreshConteudoDetail={refreshConteudoDetail}
    />
  );
};

export default function App() {
  return <AppContent />;
}
