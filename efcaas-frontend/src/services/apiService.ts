import { api, setToken, setTenantSlug, clearTenantSlug } from './apiClient';
import {
  UserProfile,
  NewsItem,
  LabelConfig,
  Evidence,
  ReportStructure,
  AgencyConfig,
  ThemeConfig,
  EditorialArticle,
  ArticleStatus,
  EditorialComment,
  ReceivedNewsItem,
  ReceivedNewsStatus,
  AssignmentHistory,
} from '../types';
import { parseAttributeList, parseMisinformationFeatures, toConfidenceScore } from '../lib/aiAnalysis';

export const DEFAULT_REPORT_STRUCTURE: ReportStructure = {
  summary: '',
  questions: [''],
  sources: [''],
  isInverifiable: false,
  contactWithAuthor: { hadContact: null },
};

export function normalizeReportStructure(
  rs?: Partial<ReportStructure> | null
): ReportStructure {
  return {
    ...DEFAULT_REPORT_STRUCTURE,
    ...rs,
    questions: rs?.questions?.length ? rs.questions : [''],
    sources: rs?.sources?.length ? rs.sources : [''],
    contactWithAuthor: {
      ...DEFAULT_REPORT_STRUCTURE.contactWithAuthor,
      ...rs?.contactWithAuthor,
    },
  };
}

// ─────────────────────────────────────────────
// Tipos espelho dos DTOs do backend
// ─────────────────────────────────────────────

export interface ApiLoginResponse {
  token: string;
  usuario: ApiUsuarioDto;
  tenantId?: number | null;
  tenantSlug?: string | null;
  platformAdmin?: boolean;
}

export interface ApiUsuarioDto {
  id: string;
  nome: string;
  email: string;
  status: string;
  avatarUrl: string | null;
  bio: string | null;
  tipoUsuario: { id: string; nome: string };
  permissoes: string[];
}

export interface ApiAnaliseIaDto {
  avaliacaoRisco: string | null;
  textoAnalise: string | null;
  simulado: boolean;
  scoreInveracidade: number | null;
  scoreFalsidade: number | null;
  scoreDistorcaoMidia: number | null;
  classificacaoOdio: string | null;
  classificacaoAntidemo: string | null;
  confiancaClassificacao: number | null;
  categoriaFinal: string | null;
  scoreRiscoIlicitude: number | null;
  atributoWhat: string | null;
  atributoWho: string | null;
  atributoWhere: string | null;
  atributoWhen: string | null;
  keywords: string | null;
  pseudoLabel: string | null;
  misinformationFeatures: string | null;
  certezaAlegacao: number | null;
  faixaCertezaAlegacao: string | null;
  topicMatch: string[] | null;
  /** @deprecated legado — falsidade */
  scoreDistorcao?: number | null;
  /** @deprecated legado — distorção de mídia */
  scoreForaContexto?: number | null;
}

export interface ApiConteudoDto {
  id: string;
  titulo: string;
  alegacao: string;
  link: string;
  fonte: string;
  descricao: string;
  dataEntrada: string;
  status: string;
  prioridade: string;
  checagem: ApiChecagemDto | null;
  analiseIa: ApiAnaliseIaDto | null;
  anexos?: ApiAnexoConteudoDto[];
}

export interface ApiAnexoConteudoDto {
  id: string;
  tipo: string;
  urlAcesso: string;
  nomeArquivo?: string | null;
  contentType?: string | null;
  tamanhoBytes?: number | null;
  objectKey?: string | null;
}

export interface ApiRelatorioPublicacaoDto {
  id: string;
  newsId: string;
  title: string;
  excerpt?: string | null;
  content?: string | null;
  status: string;
  template?: string | null;
  authorId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  comments?: ApiEditorialCommentDto[];
}

export interface ApiEditorialCommentDto {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface SalvarRelatorioPublicacaoBody {
  titulo: string;
  corpoTexto?: string;
  resumo?: string;
  statusPublicacao: ArticleStatus;
  template?: string;
  comentarios?: EditorialComment[];
}

export interface ApiHistoricoAtribuicaoDto {
  id: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  atribuidoPorId: string | null;
  atribuidoPorNome: string | null;
  acao: string;
  motivo: string | null;
  timestamp: string | null;
}

export interface ApiChecagemDto {
  id: string;
  conteudoId: string;
  curadorId: string;
  checadorId: string;
  checadorIds?: string[];
  historicoAtribuicao?: ApiHistoricoAtribuicaoDto[];
  briefing: string;
  status: string;
  dataInicio: string;
  dataConclusao: string;
  investigacao: ApiInvestigacaoDto | null;
  parecer: ApiParecerDto | null;
  evidencias: ApiEvidenciaDto[];
}

export interface ApiInvestigacaoDto {
  id: string;
  resumoMetodologia: string;
  perguntas: string[];
  fontes: string[];
  inverificavel: boolean;
  contatoRealizado: boolean | null;
  respostaAutor: string | null;
  justificativaSemContato: string | null;
}

export interface ApiParecerDto {
  id: string;
  textoParecer: string;
  etiqueta: ApiEtiquetaDto | null;
}

export interface ApiEtiquetaDto {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
}

export interface ApiAuditoriaDto {
  id: number;
  usuarioNome: string;
  acao: string;
  alvo: string | null;
  detalhes: string | null;
  timestamp: string;
}

export interface ApiConteudoRecebidoMidiaDto {
  id: number;
  tipo: string;
  url: string;
  titulo: string | null;
}

export interface ApiConteudoRecebidoDto {
  id: number;
  titulo: string;
  conteudo: string;
  resumo: string | null;
  tipoFonte: string;
  nomeRemetente: string | null;
  enderecoRemetente: string | null;
  linkOriginal: string | null;
  idMensagemExterna: string | null;
  notasInternas: string | null;
  status: ReceivedNewsStatus;
  recebidoEm: string;
  conteudoTriagemId: number | null;
  midias: ApiConteudoRecebidoMidiaDto[];
}

export interface ApiAgencyConfigDto {
  name: string;
  logoUrl: string;
  isOnboardingCompleted: boolean;
  language: string;
  country: string;
  timezone: string;
  enableAI?: boolean;
  enableSpecializedNetwork?: boolean;
  enableSocialSearch?: boolean;
  enableTrendAnalyzer?: boolean;
  enableMisinfoRisk?: boolean;
  enableIllicitRisk?: boolean;
  useDefaultProfiles?: boolean;
  templateId?: string;
}

export interface ApiConfiguracaoAgenciaDto {
  agency: ApiAgencyConfigDto;
  theme: ThemeConfig;
}

export interface ApiEvidenciaDto {
  id: string;
  tipo: string;
  linkArquivo: string;
  descricao: string;
  nomeArquivo?: string | null;
  tamanhoBytes?: number | null;
  contentType?: string | null;
  objectKey?: string | null;
}

// ─────────────────────────────────────────────
// Request bodies
// ─────────────────────────────────────────────

export interface CriarEtiquetaBody {
  nome: string;
  descricao?: string;
  cor?: string;
}

export interface CriarConteudoBody {
  titulo: string;
  alegacao?: string;
  link?: string;
  fonte?: string;
  descricao?: string;
  prioridade?: string;
}

export interface EditarConteudoBody {
  titulo: string;
  alegacao?: string;
  link?: string;
  fonte?: string;
  descricao?: string;
  prioridade?: string;
}

export interface AtribuirChecagemBody {
  checadorId: number;
  briefing?: string;
}

export interface EstruturaRelatorioBody {
  resumo: string;
  perguntas: string[];
  fontes: string[];
  inverificavel: boolean;
  contatoAutor: {
    hadContact: boolean | null;
    justificacao: string | null;
    response: string | null;
  };
}
export interface SalvarParecerBody {
  textoParecer: string;
}

export interface FinalizarParecerBody {
  textoParecer: string;
  etiquetaId: number;
}

export interface RevisaoBody {
  justificativa?: string;
}

export interface AdicionarEvidenciaBody {
  tipo: string;
  linkArquivo: string;
  descricao?: string;
}

export type AgencyPlan = 'FREE' | 'PAID';

export type SolicitacaoStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DocumentoSolicitacaoDto {
  id: string;
  nomeArquivo: string;
  tipoMime?: string | null;
  tamanhoBytes?: number | null;
  urlAcesso?: string | null;
}

export interface SolicitacaoCadastroDto {
  id: string;
  nomeAgencia: string;
  cnpj?: string | null;
  nomeResponsavel: string;
  emailContato: string;
  telefone?: string | null;
  pais: string;
  estado?: string | null;
  cidade?: string | null;
  planoSolicitado: AgencyPlan;
  informacoesExtras?: string | null;
  status: SolicitacaoStatus;
  motivoReprovacao?: string | null;
  tenantSlug?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
  documentos?: DocumentoSolicitacaoDto[];
}

export interface TenantSummaryDto {
  id: string;
  slug: string;
  nome: string;
  plano: AgencyPlan;
  status: string;
  compartilhaDadosEcossistema: boolean;
  criadoEm: string;
}

export interface PlatformTenantUsuarioDto {
  id: string;
  nome: string;
  email: string;
  status: string;
  perfil: string;
}

export interface AtivacaoResponse {
  token: string;
  usuario: ApiUsuarioDto;
}

// ─────────────────────────────────────────────
// Mapeadores: Backend DTO → Tipo do frontend
// ─────────────────────────────────────────────

const ROLE_MAP: Record<string, UserProfile['role']> = {
  Administrador: 'admin',
  Curador: 'curator',
  Checador: 'checker',
  Editor: 'editor',
  'Platform Admin': 'admin',
};

const PROFILE_ID_MAP: Record<string, string> = {
  Administrador: 'p-admin',
  Curador: 'p-curator',
  Checador: 'p-checker',
  Editor: 'p-editor',
  'Platform Admin': 'p-platform',
};

const PROFILE_ID_TO_TIPO_NOME: Record<string, string> = {
  'p-admin': 'Administrador',
  'p-curator': 'Curador',
  'p-checker': 'Checador',
  'p-editor': 'Editor',
};

const STATUS_API_TO_FRONT: Record<string, NewsItem['status']> = {
  // valores persistidos pelo backend
  pending: 'pending',
  in_progress: 'in_progress',
  final_review: 'final_review',
  completed: 'completed',
  to_rectify: 'to_rectify',
  // aliases em português (legado)
  aguardando_checagem: 'pending',
  em_checagem: 'in_progress',
  aguardando_revisao: 'final_review',
  aprovado: 'completed',
  retificando: 'to_rectify',
};

const STATUS_FRONT_TO_API: Record<string, string> = {
  pending: 'pending',
  in_progress: 'in_progress',
  final_review: 'final_review',
  completed: 'completed',
  to_rectify: 'to_rectify',
};

const PRIORITY_API_TO_FRONT: Record<string, NewsItem['priority']> = {
  alta: 'high',
  media: 'medium',
  baixa: 'low',
};

const PRIORITY_FRONT_TO_API: Record<string, string> = {
  high: 'alta',
  medium: 'media',
  low: 'baixa',
};

const SOURCE_API_TO_FRONT: Record<string, ReceivedNewsItem['sourceType']> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  telegram: 'Telegram',
  email: 'E-mail',
  youtube: 'YouTube',
  reddit: 'Reddit',
  tiktok: 'TikTok',
  other: 'Other',
};

function mapConteudoRecebido(dto: ApiConteudoRecebidoDto): ReceivedNewsItem {
  return {
    id: String(dto.id),
    title: dto.titulo,
    content: dto.conteudo,
    excerpt: dto.resumo ?? dto.conteudo.slice(0, 120),
    sourceType: SOURCE_API_TO_FRONT[dto.tipoFonte] ?? 'Other',
    senderName: dto.nomeRemetente ?? undefined,
    senderAddress: dto.enderecoRemetente ?? undefined,
    receivedAt: dto.recebidoEm,
    status: dto.status,
    media: (dto.midias ?? []).map((m) => ({
      id: String(m.id),
      type: m.tipo as 'image' | 'video' | 'audio' | 'document',
      url: m.url,
      title: m.titulo ?? undefined,
    })),
    originalLink: dto.linkOriginal ?? undefined,
    messageId: dto.idMensagemExterna ?? undefined,
    internalNotes: dto.notasInternas ?? undefined,
  };
}

function mapUsuario(dto: ApiUsuarioDto): UserProfile {
  const tipoNome = dto.tipoUsuario?.nome ?? '';
  return {
    id: String(dto.id),
    name: dto.nome,
    email: dto.email,
    role: ROLE_MAP[tipoNome] ?? 'checker',
    profileId: PROFILE_ID_MAP[tipoNome] ?? 'p-checker',
    avatarUrl: dto.avatarUrl ?? '',
    bio: dto.bio ?? undefined,
    status: dto.status === 'active' ? 'active' : 'suspended',
  };
}

function mapInvestigacao(inv: ApiInvestigacaoDto | null, etiquetaNome?: string): ReportStructure | undefined {
  if (!inv && !etiquetaNome) return undefined;
  return normalizeReportStructure({
    summary: inv?.resumoMetodologia ?? '',
    questions: inv?.perguntas?.length ? inv.perguntas : [''],
    sources: inv?.fontes?.length ? inv.fontes : [''],
    isInverifiable: inv?.inverificavel ?? false,
    contactWithAuthor: {
      hadContact: inv?.contatoRealizado ?? null,
      response: inv?.respostaAutor ?? undefined,
      justification: inv?.justificativaSemContato ?? undefined,
    },
    label: etiquetaNome,
  });
}

function mapEvidencias(evidencias: ApiEvidenciaDto[]): Evidence[] {
  return (evidencias ?? []).map((ev) => ({
    id: ev.id,
    type: (ev.tipo as Evidence['type']) ?? 'link',
    url: ev.linkArquivo ?? '',
    title: ev.nomeArquivo ?? ev.descricao ?? ev.linkArquivo ?? '',
    description: ev.descricao ?? undefined,
    timestamp: new Date().toLocaleString(),
  }));
}

function mapAnexos(anexos: ApiAnexoConteudoDto[] | undefined): NewsItem['media'] {
  return (anexos ?? []).map((anexo) => {
    const tipo = anexo.tipo as 'image' | 'video' | 'audio' | 'document';
    const type =
      tipo === 'image' || tipo === 'video' || tipo === 'audio' || tipo === 'document'
        ? tipo
        : 'document';
    return {
      id: anexo.id,
      type,
      url: anexo.urlAcesso ?? '',
      title: anexo.nomeArquivo ?? undefined,
    };
  });
}

function deriveWarningLevel(score: number | null): string {
  if (score === null) return 'baixo';
  if (score >= 80) return 'crítico';
  if (score >= 60) return 'alto';
  if (score >= 30) return 'moderado';
  return 'baixo';
}

function mapAnaliseIa(ia: ApiAnaliseIaDto | null): Pick<NewsItem, 'aiScores' | 'aiEvaluation'> {
  if (!ia || ia.simulado) return {};

  const inveracidade = toScore(ia.scoreInveracidade);
  const falsidade = toScore(ia.scoreFalsidade ?? ia.scoreDistorcao);
  const distorcaoMidia = toScore(ia.scoreDistorcaoMidia ?? ia.scoreForaContexto);
  const riscoIlicitude = toScore(ia.scoreRiscoIlicitude);
  const confiancaClassificacao = toConfidenceScore(ia.confiancaClassificacao);
  const certezaAlegacao = toScore(ia.certezaAlegacao);

  const aiScores: NonNullable<NewsItem['aiScores']> = {};
  if (inveracidade !== undefined) aiScores.inveracidade = inveracidade;
  if (falsidade !== undefined) aiScores.falsidade = falsidade;
  if (distorcaoMidia !== undefined) aiScores.distorcaoMidia = distorcaoMidia;
  if (riscoIlicitude !== undefined) aiScores.riscoIlicitude = riscoIlicitude;

  const characteristics = parseMisinformationFeatures(ia.misinformationFeatures);
  const topics = ia.topicMatch?.length
    ? ia.topicMatch
    : (ia.keywords ? ia.keywords.split(',').map((k) => k.trim()).filter(Boolean) : []);

  const hasScores = Object.keys(aiScores).length > 0;
  const hasSemantics = Boolean(
    ia.atributoWhat || ia.atributoWho || ia.atributoWhere || ia.atributoWhen
    || ia.keywords || ia.pseudoLabel
  );
  const hasIllicit = Boolean(
    ia.classificacaoOdio?.trim()
    || ia.classificacaoAntidemo?.trim()
    || ia.categoriaFinal?.trim()
    || confiancaClassificacao != null
    || riscoIlicitude != null
  );
  const hasTexto = Boolean(ia.textoAnalise?.trim());

  const aiEvaluation: NewsItem['aiEvaluation'] = hasTexto || hasSemantics || characteristics.length > 0 || hasIllicit ? {
    score: inveracidade ?? 0,
    explanation: ia.textoAnalise ?? '',
    warningLevel: ia.avaliacaoRisco ?? deriveWarningLevel(inveracidade ?? null),
    avaliacaoRisco: ia.avaliacaoRisco ?? undefined,
    characteristics,
    topics,
    entities: parseAttributeList(ia.atributoWho).map((name) => ({
      name,
      description: ia.atributoWhat ?? '',
    })),
    location: ia.atributoWhere ?? '',
    dates: parseAttributeList(ia.atributoWhen),
    pseudoLabel: ia.pseudoLabel?.trim() || undefined,
    categoriaFinal: ia.categoriaFinal?.trim() || undefined,
    classificacaoOdio: ia.classificacaoOdio?.trim() || undefined,
    classificacaoAntidemo: ia.classificacaoAntidemo?.trim() || undefined,
    confiancaClassificacao,
    certezaAlegacao,
    faixaCertezaAlegacao: ia.faixaCertezaAlegacao?.trim() || undefined,
  } : undefined;

  return {
    ...(hasScores ? { aiScores } : {}),
    ...(aiEvaluation ? { aiEvaluation } : {}),
  };
}

function toScore(value: number | null | undefined): number | undefined {
  if (value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function mapConteudo(dto: ApiConteudoDto): NewsItem {
  const ch = dto.checagem;
  const aiFields = mapAnaliseIa(dto.analiseIa);
  const checadorIds = ch?.checadorIds?.length
    ? ch.checadorIds.map(String)
    : ch?.checadorId
      ? [String(ch.checadorId)]
      : undefined;
  const assignmentHistory = ch?.historicoAtribuicao?.map((h) => ({
    id: h.id,
    assignedTo: h.usuarioId ?? '',
    assignedToName: h.usuarioNome ?? undefined,
    assignedBy: h.atribuidoPorId ?? '',
    assignedByName: h.atribuidoPorNome ?? undefined,
    timestamp: h.timestamp ?? new Date().toISOString(),
    action: (h.acao === 'assumed' ? 'assumed' : h.acao === 'removed' ? 'removed' : h.acao === 'reopened' ? 'reopened' : 'assigned') as AssignmentHistory['action'],
    reason: h.motivo ?? undefined,
  }));
  return {
    id: dto.id,
    title: dto.titulo ?? '',
    alegacao: dto.alegacao ?? undefined,
    descricao: dto.descricao ?? undefined,
    link: dto.link ?? undefined,
    fonte: dto.fonte ?? undefined,
    // campos legados mantidos para compatibilidade com componentes existentes
    content: dto.alegacao ?? dto.descricao ?? '',
    source: dto.fonte ?? dto.descricao ?? '',
    date: dto.dataEntrada
      ? dto.dataEntrada.split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: STATUS_API_TO_FRONT[dto.status] ?? 'pending',
    priority: PRIORITY_API_TO_FRONT[dto.prioridade] ?? 'medium',
    assignedTo: checadorIds?.[0] ?? ch?.checadorId ?? undefined,
    assignedToIds: checadorIds,
    briefing: ch?.briefing ?? undefined,
    startTime: ch?.dataInicio ?? undefined,
    completedAt: ch?.dataConclusao ?? undefined,
    checagemId: ch?.id ?? undefined,
    evidence: mapEvidencias(ch?.evidencias ?? []),
    reportStructure: mapInvestigacao(
      ch?.investigacao ?? null,
      ch?.parecer?.etiqueta?.nome ?? undefined,
    ),
    report: ch?.parecer?.textoParecer ?? undefined,
    assignmentHistory: assignmentHistory ?? [],
    media: mapAnexos(dto.anexos),
    ...aiFields,
  };
}

function mapEtiqueta(dto: ApiEtiquetaDto): LabelConfig {
  return {
    id: dto.id,
    name: dto.nome,
    description: dto.descricao ?? '',
    color: dto.cor ?? '#6b7280',
  };
}

function mapRelatorioPublicacao(dto: ApiRelatorioPublicacaoDto): EditorialArticle {
  return {
    id: dto.id,
    newsId: dto.newsId,
    title: dto.title ?? '',
    excerpt: dto.excerpt ?? '',
    content: dto.content ?? '',
    status: (dto.status as ArticleStatus) ?? 'draft',
    template: (dto.template as EditorialArticle['template']) ?? 'complete',
    authorId: dto.authorId,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? new Date().toISOString(),
    comments: (dto.comments ?? []).map((c) => ({
      id: c.id,
      userId: c.userId,
      userName: c.userName,
      text: c.text,
      timestamp: c.timestamp,
      resolved: c.resolved,
    })),
    versions: [],
  };
}

function mapAgencyConfigFromApi(dto: ApiAgencyConfigDto): AgencyConfig {
  return {
    name: dto.name ?? '',
    logoUrl: dto.logoUrl ?? '',
    isOnboardingCompleted: dto.isOnboardingCompleted ?? false,
    language: dto.language ?? 'pt-BR',
    country: dto.country ?? 'Brasil',
    timezone: dto.timezone ?? 'America/Sao_Paulo',
    enableAI: dto.enableAI,
    enableSpecializedNetwork: dto.enableSpecializedNetwork,
    enableSocialSearch: dto.enableSocialSearch,
    enableTrendAnalyzer: dto.enableTrendAnalyzer,
    enableMisinfoRisk: dto.enableMisinfoRisk,
    enableIllicitRisk: dto.enableIllicitRisk,
    useDefaultProfiles: dto.useDefaultProfiles,
    templateId: dto.templateId,
  };
}

function mapAgencyConfigToApi(agency: AgencyConfig): ApiAgencyConfigDto {
  return {
    name: agency.name,
    logoUrl: agency.logoUrl,
    isOnboardingCompleted: agency.isOnboardingCompleted ?? false,
    language: agency.language ?? 'pt-BR',
    country: agency.country ?? 'Brasil',
    timezone: agency.timezone ?? 'America/Sao_Paulo',
    enableAI: agency.enableAI,
    enableSpecializedNetwork: agency.enableSpecializedNetwork,
    enableSocialSearch: agency.enableSocialSearch,
    enableTrendAnalyzer: agency.enableTrendAnalyzer,
    enableMisinfoRisk: agency.enableMisinfoRisk,
    enableIllicitRisk: agency.enableIllicitRisk,
    useDefaultProfiles: agency.useDefaultProfiles,
    templateId: agency.templateId,
  };
}

// ─────────────────────────────────────────────
// Funções de API
// ─────────────────────────────────────────────

export const apiService = {
  // Auth
  async login(
    email: string,
    senha: string,
    tenantSlug?: string,
  ): Promise<{ token: string; user: UserProfile }> {
    const data = await api.post<ApiLoginResponse>(
      '/auth/login',
      { email, senha, tenantSlug: tenantSlug || undefined },
      { skipAuth: true, tenantSlug: tenantSlug || undefined },
    );
    setToken(data.token);
    clearTenantSlug();
    if (data.tenantSlug) {
      setTenantSlug(data.tenantSlug);
    }
    return { token: data.token, user: mapUsuario(data.usuario) };
  },

  async ativarConta(
    tenantSlug: string,
    token: string,
    senha: string,
  ): Promise<{ token: string; user: UserProfile }> {
    const data = await api.post<ApiLoginResponse>(
      '/public/ativacao',
      { tenant: tenantSlug, token, senha },
      { skipAuth: true },
    );
    setToken(data.token);
    setTenantSlug(tenantSlug);
    return { token: data.token, user: mapUsuario(data.usuario) };
  },

  async enviarSolicitacaoCadastro(
    payload: {
      nomeAgencia: string;
      cnpj?: string;
      nomeResponsavel: string;
      emailContato: string;
      senha: string;
      telefone?: string;
      pais?: string;
      estado?: string;
      cidade?: string;
      planoSolicitado: AgencyPlan;
      informacoesExtras?: string;
    },
    documentos: File[],
  ): Promise<SolicitacaoCadastroDto> {
    const formData = new FormData();
    formData.append('nomeAgencia', payload.nomeAgencia);
    if (payload.cnpj) formData.append('cnpj', payload.cnpj);
    formData.append('nomeResponsavel', payload.nomeResponsavel);
    formData.append('emailContato', payload.emailContato);
    formData.append('senha', payload.senha);
    if (payload.telefone) formData.append('telefone', payload.telefone);
    formData.append('pais', payload.pais ?? 'Brasil');
    if (payload.estado) formData.append('estado', payload.estado);
    if (payload.cidade) formData.append('cidade', payload.cidade);
    formData.append('planoSolicitado', payload.planoSolicitado);
    if (payload.informacoesExtras) {
      formData.append('informacoesExtras', payload.informacoesExtras);
    }
    documentos.forEach((file) => formData.append('documentos', file));
    return api.upload<SolicitacaoCadastroDto>(
      '/public/solicitacoes-cadastro',
      formData,
      { skipAuth: true },
    );
  },

  async verificarTenantDisponivel(slug: string): Promise<{ disponivel: boolean }> {
    return api.get<{ disponivel: boolean }>(
      `/public/tenants/${encodeURIComponent(slug)}/exists`,
      { skipAuth: true },
    );
  },

  async listarSolicitacoesCadastro(status?: SolicitacaoStatus): Promise<SolicitacaoCadastroDto[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<SolicitacaoCadastroDto[]>(`/platform/solicitacoes${qs}`);
  },

  async obterSolicitacaoCadastro(id: string): Promise<SolicitacaoCadastroDto> {
    return api.get<SolicitacaoCadastroDto>(`/platform/solicitacoes/${id}`);
  },

  async aprovarSolicitacaoCadastro(id: string): Promise<SolicitacaoCadastroDto> {
    return api.post<SolicitacaoCadastroDto>(`/platform/solicitacoes/${id}/aprovar`, {});
  },

  async reprovarSolicitacaoCadastro(id: string, motivo?: string): Promise<SolicitacaoCadastroDto> {
    return api.post<SolicitacaoCadastroDto>(`/platform/solicitacoes/${id}/reprovar`, { motivo });
  },

  async listarTenantsPlatform(): Promise<TenantSummaryDto[]> {
    return api.get<TenantSummaryDto[]>('/platform/tenants');
  },

  async listarUsuariosTenantPlatform(tenantId: string): Promise<PlatformTenantUsuarioDto[]> {
    return api.get<PlatformTenantUsuarioDto[]>(`/platform/tenants/${tenantId}/usuarios`);
  },

  async atualizarPerfil(data: {
    nome?: string;
    bio?: string;
    foto?: string;
  }): Promise<UserProfile> {
    const dto = await api.patch<ApiUsuarioDto>('/me', {
      nome: data.nome,
      bio: data.bio ?? '',
      foto: data.foto,
    });
    return mapUsuario(dto);
  },

  async alterarEmail(novoEmail: string, senhaAtual: string): Promise<UserProfile> {
    const dto = await api.patch<ApiUsuarioDto>('/me/email', {
      novoEmail,
      senhaAtual,
    });
    return mapUsuario(dto);
  },

  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    await api.patch<void>('/me/senha', { senhaAtual, novaSenha });
  },

  async obterConfiguracaoAgencia(tenantSlug?: string): Promise<{ agency: AgencyConfig; theme: ThemeConfig }> {
    const qs = tenantSlug ? `?tenant=${encodeURIComponent(tenantSlug)}` : '';
    const dto = await api.get<ApiConfiguracaoAgenciaDto>(`/configuracao/agencia${qs}`, {
      skipAuth: Boolean(tenantSlug),
      tenantSlug,
    });
    const theme = dto.theme && Object.keys(dto.theme).length > 0 ? dto.theme : undefined;
    return {
      agency: mapAgencyConfigFromApi(dto.agency),
      theme: theme as ThemeConfig,
    };
  },

  async salvarConfiguracaoAgencia(
    agency: AgencyConfig,
    theme: ThemeConfig
  ): Promise<{ agency: AgencyConfig; theme: ThemeConfig }> {
    const dto = await api.put<ApiConfiguracaoAgenciaDto>('/configuracao/agencia', {
      agency: mapAgencyConfigToApi(agency),
      theme,
    });
    return {
      agency: mapAgencyConfigFromApi(dto.agency),
      theme: dto.theme as ThemeConfig,
    };
  },

  // Usuários
  async listarUsuarios(): Promise<UserProfile[]> {
    const dtos = await api.get<ApiUsuarioDto[]>('/usuarios');
    return dtos.map(mapUsuario);
  },

  async criarUsuario(data: {
    nome: string;
    email: string;
    profileId: string;
    senha?: string;
  }): Promise<UserProfile> {
    const perfil = PROFILE_ID_TO_TIPO_NOME[data.profileId];
    if (!perfil) {
      throw new Error('Perfil de acesso inválido');
    }
    const dto = await api.post<ApiUsuarioDto>('/usuarios', {
      nome: data.nome,
      email: data.email,
      perfil,
      senha: data.senha,
    });
    return mapUsuario(dto);
  },

  // Etiquetas
  async listarEtiquetas(): Promise<LabelConfig[]> {
    const dtos = await api.get<ApiEtiquetaDto[]>('/etiquetas');
    return dtos.map(mapEtiqueta);
  },

  async criarEtiqueta(body: CriarEtiquetaBody): Promise<LabelConfig> {
    const dto = await api.post<ApiEtiquetaDto>('/etiquetas', body);
    return mapEtiqueta(dto);
  },

  async deletarEtiqueta(id: string): Promise<void> {
    return api.delete<void>(`/etiquetas/${id}`);
  },

  // Conteúdos
  async listarConteudos(params?: {
    status?: string;
    prioridade?: string;
    checadorId?: number;
  }): Promise<NewsItem[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.prioridade) qs.set('prioridade', params.prioridade);
    if (params?.checadorId) qs.set('checadorId', String(params.checadorId));
    const path = `/conteudos${qs.toString() ? `?${qs}` : ''}`;
    const dtos = await api.get<ApiConteudoDto[]>(path);
    return dtos.map(mapConteudo);
  },

  async editarConteudo(id: string, body: EditarConteudoBody): Promise<NewsItem> {
    const dto = await api.put<ApiConteudoDto>(`/conteudos/${id}`, body);
    return mapConteudo(dto);
  },

  async criarConteudo(body: CriarConteudoBody): Promise<NewsItem> {
    const apiBody = {
      ...body,
      prioridade: body.prioridade
        ? (PRIORITY_FRONT_TO_API[body.prioridade] ?? body.prioridade)
        : undefined,
    };
    const dto = await api.post<ApiConteudoDto>('/conteudos', apiBody);
    return mapConteudo(dto);
  },

  async excluirConteudo(id: string): Promise<void> {
    return api.delete<void>(`/conteudos/${id}`);
  },

  // Conteúdos recebidos (fontes externas)
  async listarConteudosRecebidos(status = 'received'): Promise<ReceivedNewsItem[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    const dtos = await api.get<ApiConteudoRecebidoDto[]>(`/conteudos-recebidos${qs}`);
    return dtos.map(mapConteudoRecebido);
  },

  async encaminharConteudoRecebido(id: string): Promise<NewsItem> {
    const dto = await api.post<ApiConteudoDto>(`/conteudos-recebidos/${id}/encaminhar`, {});
    return mapConteudo(dto);
  },

  async excluirConteudoRecebido(id: string): Promise<void> {
    return api.delete<void>(`/conteudos-recebidos/${id}`);
  },

  async uploadAnexoConteudo(conteudoId: string, file: File): Promise<ApiAnexoConteudoDto> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<ApiAnexoConteudoDto>(`/conteudos/${conteudoId}/anexos/upload`, formData);
  },

  async removerAnexoConteudo(conteudoId: string, anexoId: string): Promise<void> {
    return api.delete<void>(`/conteudos/${conteudoId}/anexos/${anexoId}`);
  },

  async obterConteudo(id: string): Promise<NewsItem> {
    const dto = await api.get<ApiConteudoDto>(`/conteudos/${id}`);
    return mapConteudo(dto);
  },

  async atualizarStatusConteudo(id: string, status: string): Promise<NewsItem> {
    const apiStatus = STATUS_FRONT_TO_API[status] ?? status;
    const dto = await api.patch<ApiConteudoDto>(`/conteudos/${id}/status`, {
      status: apiStatus,
    });
    return mapConteudo(dto);
  },

  /** Atribui checador e retorna a checagem criada/atualizada. */
  async atribuirConteudo(conteudoId: string, body: AtribuirChecagemBody): Promise<ApiChecagemDto> {
    return api.post<ApiChecagemDto>(`/conteudos/${conteudoId}/atribuir`, body);
  },

  /** Auto-atribuição: checador assume o conteúdo para análise. */
  async assumirConteudo(conteudoId: string): Promise<ApiChecagemDto> {
    return api.post<ApiChecagemDto>(`/conteudos/${conteudoId}/assumir`);
  },

  /** Remove checador da lista de participantes ativos. */
  async desatribuirConteudo(conteudoId: string, checadorId: string): Promise<ApiChecagemDto> {
    return api.delete<ApiChecagemDto>(`/conteudos/${conteudoId}/participantes/${checadorId}`);
  },

  async aprovarConteudo(conteudoId: string, justificativa?: string): Promise<void> {
    return api.post<void>(`/conteudos/${conteudoId}/revisao/aprovar`, { justificativa });
  },

  async rejeitarConteudo(conteudoId: string, justificativa?: string): Promise<void> {
    return api.post<void>(`/conteudos/${conteudoId}/revisao/rejeitar`, { justificativa });
  },

  async reabrirConteudo(conteudoId: string, justificativa?: string): Promise<void> {
    return api.post<void>(`/conteudos/${conteudoId}/reabrir`, { justificativa });
  },

  // Checagens
  async iniciarChecagem(checagemId: string): Promise<ApiChecagemDto> {
    return api.post<ApiChecagemDto>(`/checagens/${checagemId}/iniciar`);
  },

  async salvarEstruturaRelatorio(
    checagemId: string,
    body: EstruturaRelatorioBody
  ): Promise<ApiInvestigacaoDto> {
    return api.put<ApiInvestigacaoDto>(`/checagens/${checagemId}/investigacao`, body);
  },

  async salvarParecer(checagemId: string, body: SalvarParecerBody): Promise<ApiParecerDto> {
    return api.patch<ApiParecerDto>(`/checagens/${checagemId}/parecer`, body);
  },

  async finalizarParecer(checagemId: string, body: FinalizarParecerBody): Promise<ApiChecagemDto> {
    return api.post<ApiChecagemDto>(`/checagens/${checagemId}/parecer/finalizar`, body);
  },

  async adicionarEvidencia(
    checagemId: string,
    body: AdicionarEvidenciaBody
  ): Promise<ApiEvidenciaDto> {
    return api.post<ApiEvidenciaDto>(`/checagens/${checagemId}/evidencias`, body);
  },

  async uploadEvidenciaArquivo(
    checagemId: string,
    file: File,
    descricao?: string
  ): Promise<ApiEvidenciaDto> {
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) formData.append('descricao', descricao);
    return api.upload<ApiEvidenciaDto>(`/checagens/${checagemId}/evidencias/upload`, formData);
  },

  async removerEvidencia(checagemId: string, evidenciaId: string): Promise<void> {
    return api.delete<void>(`/checagens/${checagemId}/evidencias/${evidenciaId}`);
  },

  // Acervo editorial (relatorio_publicacao)
  async listarRelatoriosPublicacao(): Promise<EditorialArticle[]> {
    const dtos = await api.get<ApiRelatorioPublicacaoDto[]>('/relatorios-publicacao');
    return dtos.map(mapRelatorioPublicacao);
  },

  async obterRelatorioPublicacao(conteudoId: string): Promise<EditorialArticle | null> {
    try {
      const dto = await api.get<ApiRelatorioPublicacaoDto>(
        `/conteudos/${conteudoId}/relatorio-publicacao`
      );
      return mapRelatorioPublicacao(dto);
    } catch {
      return null;
    }
  },

  async salvarRelatorioPublicacao(
    conteudoId: string,
    body: SalvarRelatorioPublicacaoBody
  ): Promise<EditorialArticle> {
    const dto = await api.put<ApiRelatorioPublicacaoDto>(
      `/conteudos/${conteudoId}/relatorio-publicacao`,
      body
    );
    return mapRelatorioPublicacao(dto);
  },

  async atualizarStatusRelatorioPublicacao(
    relatorioId: string,
    statusPublicacao: ArticleStatus
  ): Promise<EditorialArticle> {
    const dto = await api.patch<ApiRelatorioPublicacaoDto>(
      `/relatorios-publicacao/${relatorioId}/status`,
      { statusPublicacao }
    );
    return mapRelatorioPublicacao(dto);
  },

  async removerRelatorioPublicacao(relatorioId: string): Promise<void> {
    return api.delete<void>(`/relatorios-publicacao/${relatorioId}`);
  },

  // Auditoria
  async listarAuditoria(checagemId: string): Promise<ApiAuditoriaDto[]> {
    return api.get<ApiAuditoriaDto[]>(`/checagens/${checagemId}/auditoria`);
  },

  /** Dispara análise de IA (Guaia IA Hub) para o conteúdo e retorna o item atualizado. */
  async analisarConteudo(id: string): Promise<NewsItem> {
    const dto = await api.post<ApiConteudoDto>(`/conteudos/${id}/ia/analisar`, {});
    return mapConteudo(dto);
  },
};
