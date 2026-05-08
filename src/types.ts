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
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'checker' | 'curator';
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
  sourceType: 'WhatsApp' | 'Facebook' | 'Instagram' | 'Telegram' | 'E-mail' | 'Other';
  senderName?: string;
  senderAddress?: string; // Phone number, email, handle
  receivedAt: string;
  status: ReceivedNewsStatus;
  media?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
  }[];
  originalLink?: string;
  messageId?: string;
  internalNotes?: string;
}

export type FactLabel = 'Falso' | 'Verdadeiro' | 'Distorcido' | 'Falta Contexto' | 'Exagerado' | 'Subestimado';

export interface AssignmentHistory {
  id: string;
  assignedTo: string;
  assignedBy: string;
  timestamp: string;
  action: 'assigned' | 'reassigned' | 'reopened' | 'rejected';
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
  characteristics: string[];
  topics: string[];
  entities: {
    name: string;
    description: string;
  }[];
  location: string;
  dates: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  date: string;
  receivedAt?: string;
  senderName?: string;
  senderAddress?: string;
  status: NewsStatus;
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string; // User ID
  startTime?: string; // ISO string
  completedAt?: string; // ISO string
  isRectified?: boolean;
  isAIProcessing?: boolean;
  media?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
  }[];
  evidence: Evidence[];
  report?: string;
  reportStructure?: ReportStructure;
  assignmentHistory?: AssignmentHistory[];
  aiScores?: {
    gravity: number;
    urgency: number;
    trend: number;
  };
  aiEvaluation?: AIEvaluation;
  briefing?: string;
  reviewComments?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

export interface FactCheckTool {
  id: string;
  name: string;
  icon: string;
  url?: string;
  description: string;
}
