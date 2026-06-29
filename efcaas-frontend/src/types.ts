export type View = 'dashboard' | 'analysis' | 'profile' | 'admin' | 'curator';

export interface LabelConfig {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface ReportStructureConfig {
  mandatoryFields: string[];
  maxQuestions: number;
  maxSources: number;
}

export interface AgencyConfig {
  name: string;
  logoUrl: string;
  isOnboardingCompleted: boolean;
  language?: string;
  country?: string;
  timezone?: string;
  enableAI?: boolean;
  enableSpecializedNetwork?: boolean;
  enableSocialSearch?: boolean;
  enableTrendAnalyzer?: boolean;
  enableMisinfoRisk?: boolean;
  enableIllicitRisk?: boolean;
  useDefaultProfiles?: boolean;
  templateId?: string;
}

export interface ThemeConfig {
  fontFamily: string;
  dashboard: {
    background: string;
    text: string;
    chartColors: string[]; // Array of colors for pie charts, etc.
  };
  flow: {
    background: string;
    text: string;
    blockPending: string;
    blockInProgress: string;
    blockCompleted: string;
    blockRectify: string;
    blockFinalReview: string;
  };
  sidebar: {
    background: string;
    text: string;
    activeBackground: string;
    activeText: string;
    border: string;
  };
  header: {
    background: string;
    text: string;
    border: string;
  };
  buttons: {
    primary: string;
    primaryText: string;
    secondary: string;
    secondaryText: string;
    danger: string;
    dangerText: string;
  };
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  general: {
    border: string;
    cardBackground: string;
    accent: string;
    inputBackground: string;
    inputText: string;
    inputBorder: string;
    inputPlaceholder: string;
    modalOverlay: string;
    modalBackground: string;
    modalText: string;
    tableHeaderBackground: string;
    tableHeaderText: string;
    tableRowHover: string;
    mutedBackground: string;
    mutedText: string;
    hoverBackground: string;
  };
  icons?: {
    default: string;
    active: string;
    muted: string;
    accent: string;
  };
}

export interface SystemPermission {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'actions' | 'settings';
}

export interface PermissionProfile {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // IDs of SystemPermission
  isDefault?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'checker' | 'curator';
  profileId: string; // Reference to PermissionProfile
  avatarUrl: string;
  bio?: string;
  status: 'active' | 'suspended';
  lastLogin?: string;
  activeTasksCount?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target?: string;
  timestamp: string;
  details?: string;
}

export type NewsStatus = 'pending' | 'in_progress' | 'completed' | 'to_rectify' | 'final_review';

export type ReceivedNewsStatus = 'received' | 'in_triage' | 'deleted';

export interface ReceivedNewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  sourceType: 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telegram' | 'E-mail' | 'YouTube' | 'Reddit' | 'TikTok' | 'Other';
  senderName?: string;
  senderAddress?: string; // Phone number, email, handle
  receivedAt: string;
  status: ReceivedNewsStatus;
  media?: {
    id?: string;
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    title?: string;
  }[];
  originalLink?: string;
  messageId?: string;
  internalNotes?: string;
}

export type FactLabel = 'Falso' | 'Verdadeiro' | 'Distorcido' | 'Falta Contexto' | 'Exagerado' | 'Subestimado';

export type ArticleStatus = 'draft' | 'in_editing' | 'review' | 'approved' | 'published';

export type ArticleTemplateType = 'short' | 'breaking' | 'complete' | 'quick_check';

export interface EditorialComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface ArticleVersion {
  id: string;
  content: string;
  title: string;
  timestamp: string;
  authorId: string;
  authorName: string;
}

export interface EditorialArticle {
  id: string;
  newsId: string; // Ref to news item
  title: string;
  excerpt: string;
  content: string; // HTML/Rich text
  status: ArticleStatus;
  template: ArticleTemplateType;
  coverImageUrl?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  comments: EditorialComment[];
  versions: ArticleVersion[];
}

export interface AssignmentHistory {
  id: string;
  assignedTo: string;
  assignedToName?: string;
  assignedBy: string;
  assignedByName?: string;
  timestamp: string;
  action: 'assigned' | 'assumed' | 'reassigned' | 'reopened' | 'rejected' | 'removed';
  reason?: string;
}

export interface ReportStructure {
  summary: string;
  questions: string[];
  sources: string[];
  isInverifiable: boolean;
  contactWithAuthor: {
    hadContact: boolean | null;
    justification?: string;
    response?: string;
  };
  label?: string;
}

export interface Evidence {
  id: string;
  type: 'link' | 'image' | 'video' | 'document';
  url: string;
  title: string;
  description?: string;
  timestamp: string;
}

export interface AIEvaluation {
  score: number;
  explanation: string;
  warningLevel: string;
  avaliacaoRisco?: string;
  characteristics: string[];
  topics: string[];
  entities: {
    name: string;
    description: string;
  }[];
  location: string;
  dates: string[];
  pseudoLabel?: string;
  categoriaFinal?: string;
  classificacaoOdio?: string;
  classificacaoAntidemo?: string;
  confiancaClassificacao?: number;
  certezaAlegacao?: number;
  faixaCertezaAlegacao?: string;
}

export interface SpecializedCheckerResponse {
  checkerId: string;
  checkerName: string;
  checkerAvatar?: string;
  sources: string[];
  attachments: { name: string; url: string; type: string }[];
  conclusiveOpinion: string;
  guidingQuestions: string[];
  fullProcess: string;
  timestamp: string;
}

export interface SpecializedNetworkCheck {
  id: string;
  newsId: string;
  status: 'pending' | 'completed';
  sentAt: string;
  completedAt?: string;
  consensusSummary: string;
  aiAnalysisSummary: string;
  checkerResponses: SpecializedCheckerResponse[];
}

export interface NewsItem {
  id: string;
  referenceNumber?: number;
  title: string;
  content: string;   // legado / display (mapeado de alegacao)
  alegacao?: string;  // alegação principal (campo do banco)
  descricao?: string; // descrição complementar (campo do banco)
  link?: string;      // URL da matéria original
  fonte?: string;     // fonte/veículo de origem
  source: string;     // legado / display (mantido para compatibilidade)
  date: string;
  receivedAt?: string;
  senderName?: string;
  senderAddress?: string;
  status: NewsStatus;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string; // User ID (responsável principal)
  assignedToIds?: string[]; // Todos os checadores atribuídos
  assignedToEditor?: string; // Editor user ID (aba Redação)
  startTime?: string; // ISO string
  completedAt?: string; // ISO string
  isRectified?: boolean;
  isAIProcessing?: boolean;
  iaStatus?: 'pendente' | 'processando' | 'concluida' | 'erro';
  sentToSpecializedNetwork?: boolean;
  specializedCheckId?: string;
  media?: {
    id?: string;
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    title?: string;
  }[];
  evidence: Evidence[];
  report?: string;
  reportStructure?: ReportStructure;
  assignmentHistory?: AssignmentHistory[];
  aiScores?: {
    inveracidade?: number;
    falsidade?: number;
    distorcaoMidia?: number;
    riscoIlicitude?: number;
    /** @deprecated use inveracidade */
    gravity?: number;
    /** @deprecated use falsidade */
    urgency?: number;
    /** @deprecated use distorcaoMidia */
    trend?: number;
    /** @deprecated legado */
    distorcao?: number;
    /** @deprecated legado */
    foraDeContexto?: number;
    /** @deprecated use classificacao em aiEvaluation */
    discursoDeOdio?: number;
    /** @deprecated use classificacao em aiEvaluation */
    discursoAntidemocratico?: number;
  };
  aiEvaluation?: AIEvaluation;
  briefing?: string;
  reviewComments?: string;
  approvedBy?: string;
  rejectedBy?: string;
  checagemId?: string;
}

export interface FactCheckTool {
  id: string;
  name: string;
  icon: string;
  url?: string;
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  link?: string;
  targetUserId?: string;
  targetRole?: UserProfile['role'] | UserProfile['role'][];
  relatedNewsId?: string;
  category: 'assignment' | 'queue' | 'received_news' | 'system';
}


