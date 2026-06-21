import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';
import { NotificationBell } from './NotificationBell';
import { NewsItem, UserProfile, NewsStatus, AssignmentHistory, AuditLog } from '../types';
import { PermissionsManager } from './PermissionsManager';
import { apiService } from '../services/apiService';
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
  Palette,
  Lock,
  Sparkles
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
import { ResponsiveTabs } from './ResponsiveTabs';
import { LabelConfig, ReportStructureConfig, ThemeConfig, AgencyConfig, PermissionProfile } from '../types';
import { AiEngineModulesPanel } from './AiEngineModulesPanel';
import { AiModuleKey } from '../config/aiModules';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  news: NewsItem[];
  setNews: React.Dispatch<React.SetStateAction<NewsItem[]>>;
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  permissionProfiles: PermissionProfile[];
  onUpdateProfile: (profile: PermissionProfile) => void;
  onCreateProfile: (profile: Omit<PermissionProfile, 'id'>) => void;
  onDeleteProfile: (id: string) => void;
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
  notifications: any[];
  onMarkNotifAsRead: (id: string) => void;
  onClearNotifs: () => void;
  checkPermission: (permId: string) => boolean;
}

type AdminTab = 'users' | 'audit' | 'settings' | 'permissions';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  news, 
  setNews, 
  users,
  setUsers,
  permissionProfiles,
  onUpdateProfile,
  onCreateProfile,
  onDeleteProfile,
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
  setSelectedNewsId,
  notifications,
  onMarkNotifAsRead,
  onClearNotifs,
  checkPermission
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');
  
  // Modal states
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', profileId: permissionProfiles[0]?.id || '' });
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

    // General admin metrics
    const activeUsers = users.filter(u => u.status === 'active').length;
    const totalProfiles = permissionProfiles.length;
    
    // Filter audit logs based on the date range
    const filteredLogsForMetrics = auditLogs.filter(l => {
      const logDate = new Date(l.timestamp).getTime();
      return logDate >= startTime;
    });
    
    const totalLogs = filteredLogsForMetrics.length;
    const totalLabels = labels.length;

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
      activeUsers,
      totalProfiles,
      totalLogs,
      totalLabels,
      dailyVolume,
      statusDist,
      totalInPeriod: filteredNewsForMetrics.length
    };
  }, [news, dateRange, themeConfig, users, permissionProfiles, auditLogs, labels]);

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
    const selectedProfile = permissionProfiles.find(p => p.id === newUser.profileId);
    const user: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      role: (selectedProfile?.id as any) || 'checker',
      profileId: newUser.profileId,
      status: 'active',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.name}`
    };
    setUsers(prev => [...prev, user]);
    setIsAddingUser(false);
    setNewUser({ name: '', email: '', profileId: permissionProfiles[0]?.id || '' });
  };

  const handleSaveLabel = useCallback(async () => {
    if (!newLabel.name || !newLabel.description) return;

    if (!editingLabelId && labels.some(l => l.name === newLabel.name)) {
      alert('Já existe uma etiqueta com este nome.');
      return;
    }

    if (editingLabelId) {
      // Edição: apenas local por enquanto (PUT não implementado no backend)
      setLabels(prev => prev.map(l => l.id === editingLabelId ? { ...l, ...newLabel } : l));
      setEditingLabelId(null);
    } else {
      try {
        const created = await apiService.criarEtiqueta({
          nome: newLabel.name,
          descricao: newLabel.description,
          cor: newLabel.color,
        });
        setLabels(prev => [...prev, created]);
      } catch (err) {
        alert(`Erro ao criar etiqueta: ${err instanceof Error ? err.message : err}`);
        return;
      }
    }

    setIsAddingLabel(false);
    setNewLabel({ name: 'Verdadeiro', description: '', color: 'bg-slate-500' });
  }, [newLabel, editingLabelId, labels, setLabels]);

  const handleDeleteLabel = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etiqueta?')) return;
    try {
      await apiService.deletarEtiqueta(id);
      setLabels(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      alert(`Erro ao excluir etiqueta: ${err instanceof Error ? err.message : err}`);
    }
  }, [setLabels]);

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

  return (
    <div className={styles.container} style={{ color: themeConfig.dashboard.text }}>
      <style>
        {`
          .custom-table-row:hover {
            background-color: ${themeConfig.general.tableRowHover} !important;
          }
        `}
      </style>
      
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
             <Shield size={24} />
          </div>
          <div>
            <h1 className={styles.headerTitle} style={{ color: themeConfig.header.text }}>Gestão Administrativa</h1>
            <p className={styles.headerSubtitle}>Painel de Controle Operacional</p>
          </div>
        </div>
        
        <div className={styles.headerRight}>
          {(activeTab === 'users' || activeTab === 'audit') && (
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={16} />
              <input 
                type="text"
                placeholder={activeTab === 'users' ? "Filtrar integrantes..." : "Filtrar rastros..."}
                className={styles.searchInput}
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
              className={styles.addButton}
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
          
          <NotificationBell 
            notifications={notifications}
            onMarkAsRead={onMarkNotifAsRead}
            onClearAll={onClearNotifs}
            themeConfig={themeConfig}
            currentUser={currentUser}
          />
        </div>
      </header>

      {/* Tabs - Pill style */}
      <div className={styles.tabsWrapper}>
        <ResponsiveTabs
          activeTab={activeTab}
          setActiveTab={(id) => {
            setActiveTab(id as AdminTab);
            setSearchTerm('');
          }}
          themeConfig={themeConfig}
          tabs={[
            { id: 'users', label: 'Equipe', icon: UsersIcon, permission: 'admin_users' },
            { id: 'audit', label: 'Logs', icon: FileText, permission: 'view_audit_logs' },
            { id: 'permissions', label: 'Permissões', icon: Lock, permission: 'admin_permissions' },
            { id: 'settings', label: 'Ajustes', icon: SettingsIcon, permission: 'admin_settings' },
          ].filter(tab => !tab.permission || checkPermission(tab.permission))}
        />
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>


        {activeTab === 'users' && (
          <div className={styles.tableCard} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow} style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Usuário</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>E-mail</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Função</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className={styles.thRight} style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className={styles.tbody} style={{ borderColor: themeConfig.general.border }}>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={cn("custom-table-row", styles.tableRow)} style={{ color: themeConfig.dashboard.text }}>
                    <td className={styles.td}>
                      <div className={styles.avatarCell}>
                        <img src={user.avatarUrl} alt="" className={styles.avatar} />
                        <span className={styles.userName} style={{ color: themeConfig.dashboard.text }}>{user.name}</span>
                      </div>
                    </td>
                    <td className={styles.emailCell}>{user.email}</td>
                    <td className={styles.td}>
                      <span className={styles.roleBadge}>
                        {permissionProfiles.find(p => p.id === user.profileId)?.name || user.role}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={cn(
                        styles.statusBadge,
                        user.status === 'active' ? styles.statusBadgeActive : styles.statusBadgeSuspended
                      )}>
                        {user.status === 'active' ? <UserCheck size={12} /> : <UserX size={12} />}
                        {user.status === 'active' ? 'Ativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className={styles.actionsCell}>
                      <div className={styles.actionsDiv}>
                        <button className={styles.actionBtnShield}>
                          <Shield size={18} />
                        </button>
                        <button 
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={cn(
                            styles.toggleBtnBase,
                            user.status === 'active' ? styles.toggleBtnActive : styles.toggleBtnSuspended
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
          <div className={styles.tableCard} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableHeadRow} style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Data</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Hora</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Usuário</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Atividade</th>
                </tr>
              </thead>
              <tbody className={styles.tbody} style={{ borderColor: themeConfig.general.border }}>
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const date = dateObj.toLocaleDateString();
                  const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  // Construct intuitive message if not already descriptive
                  let activity = log.details || log.action.replace('_', ' ');
                  if (log.target && activity.indexOf(log.target) === -1) {
                    activity = `${activity} (${log.target})`;
                  }

                  return (
                    <tr key={log.id} className={cn("custom-table-row", styles.tableRow)} style={{ color: themeConfig.dashboard.text }}>
                      <td className={styles.auditDateCell}>
                        {date}
                      </td>
                      <td className={styles.auditTimeCell}>
                        {time}
                      </td>
                      <td className={styles.auditNameCell} style={{ color: themeConfig.dashboard.text }}>{log.userName}</td>
                      <td className={styles.auditActivityCell}>
                        <span className={styles.activityText}>{activity}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className={styles.settingsContainer}>
            {/* Agency Settings */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconBlue}>
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>Configurações da Agência</h2>
                  <p className={styles.sectionSubtitle} style={{ color: themeConfig.dashboard.text }}>Identidade e marca da sua agência de checagem</p>
                </div>
              </div>

              <div className={styles.card} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                <div className={styles.twoColGrid}>
                  <div className={styles.logoSection}>
                    <label className={styles.sectionFieldLabel}>Logo da Agência</label>
                    <div className={styles.logoWrapper}>
                      <div className={styles.logoPreviewContainer}>
                        <div className={styles.logoPreviewBox} style={{ borderColor: themeConfig.general.border }}>
                          {agencyConfig.logoUrl ? (
                            <img src={agencyConfig.logoUrl} alt="Logo" className={styles.logoImg} />
                          ) : (
                            <ImageIcon size={32} className={styles.logoPlaceholderIcon} />
                          )}
                        </div>
                        <label className={styles.logoOverlay}>
                          <input 
                            type="file" 
                            className={styles.hiddenInput}
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
                          <Plus className={styles.whiteIcon} size={24} />
                        </label>
                      </div>
                      <div className={styles.logoInfo}>
                        <p className={styles.logoInfoTitle} style={{ color: themeConfig.dashboard.text }}>Alterar Logotipo</p>
                        <p className={styles.logoInfoText}>Recomendado: PNG ou SVG com fundo transparente. Máx 1MB.</p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.nameSection}>
                    <label className={styles.sectionFieldLabel}>Nome de Exibição</label>
                    <input 
                      type="text"
                      value={agencyConfig.name}
                      onChange={(e) => setAgencyConfig(prev => ({ ...prev, name: e.target.value }))}
                      className={styles.nameInput}
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

            {/* AI Engine Modules */}
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconEmerald}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <span className={styles.aiModuleBadge}>
                    Módulos Inteligentes
                  </span>
                  <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>
                    Engine de Inteligência Artificial
                  </h2>
                  <p className={styles.sectionSubtitle} style={{ color: themeConfig.dashboard.text }}>
                    Funcionalidades desativadas ficam ocultas na curadoria e na investigação.
                  </p>
                </div>
              </div>

              <div
                className={styles.aiCard}
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <AiEngineModulesPanel
                  config={agencyConfig}
                  onChange={(key: AiModuleKey, enabled) =>
                    setAgencyConfig((prev) => ({ ...prev, [key]: enabled }))
                  }
                />
              </div>
            </section>

            <div className={styles.labelsGrid}>
            {/* Labels Management */}
            <div className={styles.labelsSection}>
              <div className={styles.labelsHeader}>
                <div className={styles.labelsHeaderLeft}>
                  <Tag style={{ color: themeConfig.general.accent }} size={20} />
                  <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>''Gestão de Etiquet''as</h2>
                </div>
                <button 
                  onClick={() => {
                    setNewLabel({ name: 'Verdadeiro', description: '', color: 'bg-slate-500' });
                    setEditingLabelId(null);
                    setIsAddingLabel(true);
                  }}
                  className={styles.newLabelBtn}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                >
                  <Plus size={14} />
                  Nova Etiqueta
                </button>
              </div>

              <div className={styles.labelsCard} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                <div className={styles.labelsCardInner} style={{ borderColor: themeConfig.general.border }}>
                  {labels.map((label) => (
                    <div key={label.id} className={styles.labelItem}>
                      <div className={styles.labelItemLeft}>
                        <div className={styles.labelDot} style={{ backgroundColor: label.color }} />
                        <div>
                          <h4 className={styles.labelName} style={{ color: themeConfig.dashboard.text }}>{label.name}</h4>
                          <p className={styles.labelDesc} style={{ color: themeConfig.dashboard.text }}>{label.description}</p>
                        </div>
                      </div>
                      <div className={styles.labelActionsDiv}>
                        <button 
                          onClick={() => {
                            setNewLabel({ name: label.name, description: label.description, color: label.color });
                            setEditingLabelId(label.id);
                            setIsAddingLabel(true);
                          }}
                          className={styles.editBtn}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteLabel(label.id)}
                          className={styles.deleteBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.reportSection}>
              <div className={styles.reportSectionHeader}>
                <Layout style={{ color: themeConfig.general.accent }} size={20} />
                <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>Estrutura de Relatórios</h2>
              </div>

              <div className={styles.reportCard} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
                {/* Mandatory Fields */}
                <div className={styles.mandatoryFieldsSubsection}>
                  <h3 className={styles.subsectionTitle} style={{ color: themeConfig.dashboard.text }}>Campos Obrigatórios</h3>
                  <div className={styles.twoColFields}>
                    {[
                      { id: 'summary', label: 'Resumo da Análise' },
                      { id: 'questions', label: 'Perguntas de Investigação' },
                      { id: 'sources', label: 'Fontes Consultadas' },
                      { id: 'label', label: 'Etiqueta de Veracidade' },
                      { id: 'contact', label: 'Contato com Autor' },
                    ].map((field) => (
                      <label key={field.id} className={styles.fieldCheckLabel} style={{ borderColor: themeConfig.general.border, backgroundColor: themeConfig.general.inputBackground }}>
                        <input 
                          type="checkbox"
                          checked={reportConfig.mandatoryFields.includes(field.id)}
                          onChange={() => handleToggleMandatoryField(field.id)}
                          className={styles.fieldCheckbox}
                          style={{ color: themeConfig.general.accent, '--tw-ring-color': themeConfig.general.accent } as any}
                        />
                        <span className={styles.fieldCheckText} style={{ color: themeConfig.general.inputText }}>{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Limits */}
                <div className={styles.limitSection} style={{ borderColor: themeConfig.general.border }}>
                  <h3 className={styles.subsectionTitle} style={{ color: themeConfig.dashboard.text }}>Limites e Restrições</h3>
                  <div className={styles.limitsContainer}>
                    <div className={styles.limitRow}>
                      <div>
                        <p className={styles.limitLabelTitle} style={{ color: themeConfig.dashboard.text }}>Máximo de Perguntas</p>
                        <p className={styles.limitLabelSubtitle} style={{ color: themeConfig.dashboard.text }}>Limite de questões por relatório</p>
                      </div>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={reportConfig.maxQuestions}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, maxQuestions: parseInt(e.target.value) || 1 }))}
                        className={styles.limitInput}
                        style={{ 
                          backgroundColor: themeConfig.general.inputBackground, 
                          color: themeConfig.general.inputText,
                          borderColor: themeConfig.general.inputBorder,
                          '--tw-ring-color': themeConfig.general.accent
                        } as any}
                      />
                    </div>
                    <div className={styles.limitRow}>
                      <div>
                        <p className={styles.limitLabelTitle} style={{ color: themeConfig.dashboard.text }}>Máximo de Fontes</p>
                        <p className={styles.limitLabelSubtitle} style={{ color: themeConfig.dashboard.text }}>Limite de fontes citadas</p>
                      </div>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={reportConfig.maxSources}
                        onChange={(e) => setReportConfig(prev => ({ ...prev, maxSources: parseInt(e.target.value) || 1 }))}
                        className={styles.limitInput}
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
                <div className={styles.fontSection} style={{ borderColor: themeConfig.general.border }}>
                  <h3 className={styles.subsectionTitle} style={{ color: themeConfig.dashboard.text }}>Tipografia da Plataforma</h3>
                  <div className={styles.fontGrid}>
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
                          styles.fontBtnBase,
                          themeConfig.fontFamily === f.id ? styles.fontBtnSelected : styles.fontBtnUnselected
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

                <div className={styles.warningBannerWrapper} style={{ borderColor: themeConfig.general.border }}>
                  <div className={styles.warningBannerInner} style={{ backgroundColor: `${themeConfig.status.warning}15`, color: themeConfig.status.warning }}>
                    <AlertCircle size={16} />
                    <p className={styles.fieldCheckText}>Estas configurações serão aplicadas automaticamente a todos os novos relatórios.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Customization */}
            <div className={styles.themeSection}>
              <div className={styles.themeSectionHeader}>
                <Activity className={styles.themeIcon} size={20} />
                <h2 className={styles.themeTitle}>Personalização Visual da Plataforma</h2>
              </div>

              <div className={styles.themeGrid}>
                {/* Dashboard Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Dashboard Administrativo</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.dashboard.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor do Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.dashboard.text}</span>
                      </div>
                    </div>
                    <div className={styles.themeCardFullCol}>
                      <label className={styles.colorFieldLabel}>Cores dos Gráficos</label>
                      <div className={styles.chartColorsGrid}>
                        {themeConfig.dashboard.chartColors.map((color, idx) => (
                          <div key={idx} className={styles.chartColorItem}>
                            <div className={styles.chartColorInputRow}>
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
                                className={styles.colorInput}
                              />
                              <span className={styles.chartColorValueSmall}>{color}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Fluxo de Checagem</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor do Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Pendente</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockPending}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockPending: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockPending}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Em Análise</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockInProgress}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockInProgress: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockInProgress}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Concluído</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockCompleted}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockCompleted: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockCompleted}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Retificação</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockRectify}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockRectify: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockRectify}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Barra Lateral e Navegação</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor do Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo Ativo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.activeBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto Ativo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.activeText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Cabeçalho</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor do Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor da Borda</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, border: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dashboard Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Dashboard</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.dashboard.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor do Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.dashboard.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            dashboard: { ...prev.dashboard, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.dashboard.text}</span>
                      </div>
                    </div>
                    <div className={styles.colSpanFull}>
                      <label className={styles.colorFieldLabel}>Cores dos Gráficos</label>
                      <div className={styles.chartColorsFlexRow}>
                        {themeConfig.dashboard.chartColors.map((color, index) => (
                          <div key={index} className={styles.chartColorFlexItem}>
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
                              className={styles.chartColorSmall}
                            />
                            <span className={styles.chartColorValueSmall}>{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Barra Lateral (Sidebar)</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo Item Ativo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.activeBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto Item Ativo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.activeText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, activeText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.activeText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Borda</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.sidebar.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            sidebar: { ...prev.sidebar, border: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.sidebar.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Header Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Cabeçalho (Header)</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Borda</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.header.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            header: { ...prev.header, border: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.header.border}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flow Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Fluxo de Notícias</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo do Fluxo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.background}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, background: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.background}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto do Fluxo</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.text}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, text: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.text}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Pendente</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockPending}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockPending: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockPending}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco em Progresso</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockInProgress}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockInProgress: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockInProgress}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Concluído</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockCompleted}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockCompleted: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockCompleted}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Bloco Retificação</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.flow.blockRectify}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            flow: { ...prev.flow, blockRectify: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.flow.blockRectify}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Buttons Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Botões e Ações</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Primário (Fundo)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.primary}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, primary: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.primary}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Primário (Texto)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.primaryText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, primaryText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.primaryText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Secundário (Fundo)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.secondary}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondary: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.secondary}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Secundário (Texto)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.secondaryText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, secondaryText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.secondaryText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Perigo (Fundo)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.danger}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, danger: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.danger}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Perigo (Texto)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.buttons.dangerText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            buttons: { ...prev.buttons, dangerText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.buttons.dangerText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Status e Alertas</h3>
                  <div className={styles.themeCardGrid}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Sucesso</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.status.success}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, success: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.status.success}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Erro</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.status.error}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, error: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.status.error}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Aviso</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.status.warning}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, warning: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.status.warning}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Informação</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.status.info}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            status: { ...prev.status, info: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.status.info}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* General Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Geral e Superfícies</h3>
                  <div className={styles.themeCardGrid3}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo de Cards</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.cardBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, cardBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.cardBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Borda</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.border}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, border: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.border}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Cor de Destaque (Accent)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.accent}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, accent: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.accent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inputs Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Campos de Entrada (Inputs)</h3>
                  <div className={styles.themeCardGrid4}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo do Input</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.inputBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.inputBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto do Input</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.inputText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.inputText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Borda do Input</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.inputBorder}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputBorder: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.inputBorder}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Placeholder</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.inputPlaceholder}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, inputPlaceholder: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.inputPlaceholder}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modals Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Modais</h3>
                  <div className={styles.themeCardGrid3}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo do Modal</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.modalBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.modalBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto do Modal</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.modalText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.modalText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Sobreposição (Overlay)</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="text" 
                          value={themeConfig.general.modalOverlay}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, modalOverlay: e.target.value }
                          }))}
                          placeholder="rgba(0,0,0,0.5)"
                          className={styles.limitInput}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tables Theme */}
                <div className={styles.themeCard}>
                  <h3 className={styles.themeCardTitle}>Tabelas</h3>
                  <div className={styles.themeCardGrid3}>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Fundo do Cabeçalho</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.tableHeaderBackground}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableHeaderBackground: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.tableHeaderBackground}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Texto do Cabeçalho</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.tableHeaderText}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableHeaderText: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.tableHeaderText}</span>
                      </div>
                    </div>
                    <div className={styles.colorField}>
                      <label className={styles.colorFieldLabel}>Hover da Linha</label>
                      <div className={styles.colorInputRow}>
                        <input 
                          type="color" 
                          value={themeConfig.general.tableRowHover}
                          onChange={(e) => setThemeConfig(prev => ({
                            ...prev,
                            general: { ...prev.general, tableRowHover: e.target.value }
                          }))}
                          className={styles.colorInput}
                        />
                        <span className={styles.colorValue}>{themeConfig.general.tableRowHover}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className={styles.permissionsTab}>
            <PermissionsManager 
              profiles={permissionProfiles}
              onUpdateProfile={onUpdateProfile}
              onCreateProfile={onCreateProfile}
              onDeleteProfile={onDeleteProfile}
              themeConfig={themeConfig}
            />
          </div>
        )}
      </div>

      {/* Add/Edit Label Modal */}
      <AnimatePresence>
        {isAddingLabel && (
          <div className={styles.modalWrapper}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingLabel(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modalContainer}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h2 className={styles.modalTitle}>
                  {editingLabelId ? 'Editar Etiqueta' : 'Nova Etiqueta'}
                </h2>
                <p className={styles.modalSubtitle}>Defina como as notícias serão classificadas</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nome da Etiqueta</label>
                  <input 
                    type="text"
                    className={styles.modalInput}
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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Descrição</label>
                  <textarea 
                    className={styles.modalTextarea}
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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} style={{ color: themeConfig.general.modalText }}>Cor de Identificação</label>
                  <div className={styles.colorPickerRow}>
                    <input 
                      type="color" 
                      value={newLabel.color.startsWith('bg-') ? '#94a3b8' : newLabel.color}
                      onChange={(e) => setNewLabel(prev => ({ ...prev, color: e.target.value }))}
                      className={styles.labelColorPicker}
                    />
                    <div className={styles.colorPickerInfo}>
                      <p className={styles.colorPickerValue}>
                        {newLabel.color.startsWith('bg-') ? '#94a3b8' : newLabel.color}
                      </p>
                      <p className={styles.colorPickerHint}>Escolha uma cor para esta etiqueta</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAddingLabel(false)}
                  className={styles.cancelBtn}
                  style={{ color: themeConfig.general.modalText }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveLabel}
                  disabled={!newLabel.name || !newLabel.description}
                  className={styles.saveBtn}
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
          <div className={styles.modalWrapper}>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingUser(false)}
              className={styles.modalBackdrop}
              style={{ backgroundColor: themeConfig.general.modalOverlay }}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={styles.modalContainer}
              style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
            >
              <div className={styles.modalHeader} style={{ borderColor: themeConfig.general.border }}>
                <h2 className={styles.modalTitle}>Cadastrar Novo Usuário</h2>
                <p className={styles.modalSubtitle}>Um convite será enviado para o e-mail informado</p>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Nome Completo</label>
                  <input 
                    type="text"
                    className={styles.modalInput}
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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>E-mail</label>
                  <input 
                    type="email"
                    className={styles.modalInput}
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
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Perfil de Acesso</label>
                  <select 
                    className={styles.modalInput}
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText,
                      '--tw-ring-color': themeConfig.general.accent
                    } as any}
                    value={newUser.profileId}
                    onChange={(e) => setNewUser(prev => ({ ...prev, profileId: e.target.value }))}
                  >
                    {permissionProfiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.modalFooter} style={{ backgroundColor: `${themeConfig.dashboard.background}30` }}>
                <button 
                  onClick={() => setIsAddingUser(false)}
                  className={styles.cancelBtn}
                  style={{ color: themeConfig.general.modalText }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddUser}
                  disabled={!newUser.name || !newUser.email}
                  className={styles.saveBtn}
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
