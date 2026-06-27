import {
  FactCheckTool,
  UserProfile,
  AuditLog,
  ReportStructureConfig,
  ThemeConfig,
  AgencyConfig,
  SystemPermission,
  PermissionProfile
} from './types';

export const SYSTEM_PERMISSIONS: SystemPermission[] = [
  { id: 'view_dashboard', name: 'Visualizar Dashboard', description: 'Acesso às estatísticas gerais na página inicial', category: 'navigation' },
  { id: 'view_analysis', name: 'Fluxo de Checagem', description: 'Acesso à tela de análise e verificação de fatos', category: 'navigation' },
  { id: 'view_curator', name: 'Painel de Curadoria', description: 'Acesso à triagem e conteúdos recebidos', category: 'navigation' },
  { id: 'view_admin', name: 'Painel Administrativo', description: 'Acesso às configurações globais do sistema', category: 'navigation' },
  { id: 'create_news', name: 'Cadastrar Notícias', description: 'Capacidade de adicionar manualmente novas notícias para triagem', category: 'actions' },
  { id: 'manage_received', name: 'Gerenciar Recebidos', description: 'Encaminhar ou excluir sugestões externas', category: 'actions' },
  { id: 'manage_triage', name: 'Gerenciar Triagem', description: 'Organizar e Priorizar fila de triagem', category: 'actions' },
  { id: 'assign_tasks', name: 'Atribuir Tarefas', description: 'Designar notícias para checadores específicos', category: 'actions' },
  { id: 'perform_analysis', name: 'Realizar Análise', description: 'Preencher relatórios e buscar evidências', category: 'actions' },
  { id: 'review_and_approve', name: 'Revisar e Aprovar', description: 'Aprovar, rejeitar ou solicitar retificação de checagens', category: 'actions' },
  { id: 'admin_users', name: 'Gerenciar Usuários', description: 'Criar, suspender e editar perfis de usuários', category: 'settings' },
  { id: 'admin_permissions', name: 'Gerenciar Permissões', description: 'Criar e editar perfis de acesso e permissões', category: 'settings' },
  { id: 'admin_settings', name: 'Configurações da Agência', description: 'Alterar branding, temas e regras do sistema', category: 'settings' },
  { id: 'view_audit_logs', name: 'Logs de Auditoria', description: 'Visualizar histórico de atividades de todos os usuários', category: 'settings' },
  { id: 'view_editor', name: 'Painel de Redação', description: 'Acesso à redação e edição de matérias e checagens', category: 'navigation' },
  { id: 'view_archive', name: 'Acervo Editorial', description: 'Acesso ao arquivo de matérias publicadas e exportação', category: 'navigation' },
  { id: 'publish_article', name: 'Publicar Matérias', description: 'Capacidade de oficializar a publicação de uma checagem no CMS', category: 'actions' },
  { id: 'export_article', name: 'Exportar Conteúdo', description: 'Exportar matérias em formatos HTML, JSON ou TXT', category: 'actions' },
];

export const INITIAL_PERMISSION_PROFILES: PermissionProfile[] = [
  {
    id: 'p-admin',
    name: 'Administrador',
    description: 'Acesso total a todas as funcionalidades e configurações do sistema.',
    isDefault: true,
    permissions: SYSTEM_PERMISSIONS.map(p => p.id)
  },
  {
    id: 'p-curator',
    name: 'Curador',
    description: 'Responsável pela triagem inicial, recebimento de denúncias e distribuição de tarefas.',
    isDefault: true,
    permissions: ['view_dashboard', 'view_curator', 'create_news', 'manage_received', 'manage_triage', 'assign_tasks', 'review_and_approve']
  },
  {
    id: 'p-checker',
    name: 'Checador (CKA)',
    description: 'Focado na análise técnica, busca de evidências e preenchimento de relatórios.',
    isDefault: true,
    permissions: ['view_dashboard', 'view_analysis', 'perform_analysis']
  },
  {
    id: 'p-editor',
    name: 'Editor',
    description: 'Revisa o conteúdo final, aprova publicações e pode cadastrar notícias urgentes.',
    isDefault: true,
    permissions: ['view_dashboard', 'create_news', 'review_and_approve', 'view_editor', 'view_archive', 'publish_article', 'export_article']
  }
];

// Usuário vazio usado como estado inicial antes do login.
// Os dados reais são carregados da API após autenticação.
export const PLACEHOLDER_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  role: 'checker',
  profileId: 'p-checker',
  status: 'active',
  avatarUrl: '',
};

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

export const TOOLS: FactCheckTool[] = [
  { id: 't1', name: 'Busca Reversa', icon: 'Search', description: 'Verifique a origem de imagens no Google/Yandex.' },
  { id: 't2', name: 'Metadados', icon: 'Info', description: 'Analise metadados EXIF de fotos e vídeos.' },
  { id: 't3', name: 'Wayback Machine', icon: 'History', description: 'Veja versões arquivadas de páginas web.' },
  { id: 't4', name: 'Verificador de Deepfake', icon: 'Cpu', description: 'Ferramenta experimental para detectar manipulação em vídeos.' }
];

export const INITIAL_REPORT_CONFIG: ReportStructureConfig = {
  mandatoryFields: ['summary', 'questions', 'sources', 'label'],
  maxQuestions: 10,
  maxSources: 15
};

export const INITIAL_AGENCY_CONFIG: AgencyConfig = {
  name: 'Agência eFCaaS',
  logoUrl: '',
  isOnboardingCompleted: false,
  language: 'pt-BR',
  country: 'Brasil',
  timezone: 'America/Sao_Paulo',
  enableAI: true,
  enableSpecializedNetwork: true,
  enableSocialSearch: true,
  enableTrendAnalyzer: true,
  enableMisinfoRisk: true,
  enableIllicitRisk: true,
  useDefaultProfiles: true,
  templateId: 'default'
};

export const INITIAL_THEME_CONFIG: ThemeConfig = {
  fontFamily: 'Inter',
  dashboard: {
    background: '#f8fafc',
    text: '#0f172a',
    chartColors: ['#3b82f6', '#22c55e', '#f97316', '#94a3b8'],
  },
  flow: {
    background: '#ffffff',
    text: '#0f172a',
    blockPending: '#f1f5f9',
    blockInProgress: '#eff6ff',
    blockCompleted: '#f0fdf4',
    blockRectify: '#fff7ed',
    blockFinalReview: '#f5f3ff',
  },
  sidebar: {
    background: '#ffffff',
    text: '#64748b',
    activeBackground: '#eff6ff',
    activeText: '#2563eb',
    border: '#e2e8f0',
  },
  header: {
    background: '#ffffff',
    text: '#0f172a',
    border: '#e2e8f0',
  },
  buttons: {
    primary: '#2563eb',
    primaryText: '#ffffff',
    secondary: '#64748b',
    secondaryText: '#ffffff',
    danger: '#dc2626',
    dangerText: '#ffffff',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  general: {
    border: '#e2e8f0',
    cardBackground: '#ffffff',
    accent: '#2563eb',
    inputBackground: '#ffffff',
    inputText: '#0f172a',
    inputBorder: '#e2e8f0',
    inputPlaceholder: '#94a3b8',
    modalOverlay: 'rgba(15, 23, 42, 0.5)',
    modalBackground: '#ffffff',
    modalText: '#0f172a',
    tableHeaderBackground: '#f8fafc',
    tableHeaderText: '#64748b',
    tableRowHover: '#f1f5f9',
    mutedBackground: '#f1f5f9',
    mutedText: '#334155',
    hoverBackground: '#e2e8f0',
  }
};
