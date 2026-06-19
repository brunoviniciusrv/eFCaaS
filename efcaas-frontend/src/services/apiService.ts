import { api, setToken } from './apiClient';
import {
  UserProfile,
  NewsItem,
  LabelConfig,
  Evidence,
  ReportStructure,
} from '../types';

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
  analiseIa: unknown | null;
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

export interface ApiChecagemDto {
  id: string;
  conteudoId: string;
  curadorId: string;
  checadorId: string;
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

export interface YoutubeResultadoDto {
  titulo: string;
  url: string;
  conteudo: string | null;
  descricao: string | null;
  channelTitle: string | null;
  channelId: string | null;
  publishedAt: string | null;
  viewCount: number | null;
  commentCount: number | null;
  duration: string | null;
  thumbnailDefault: string | null;
  thumbnailHigh: string | null;
  tags: string[];
}

export interface BuscarYoutubeParams {
  query: string;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface ApiAuditoriaDto {
  id: number;
  usuarioNome: string;
  acao: string;
  alvo: string | null;
  detalhes: string | null;
  timestamp: string;
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

// ─────────────────────────────────────────────
// Mapeadores: Backend DTO → Tipo do frontend
// ─────────────────────────────────────────────

const ROLE_MAP: Record<string, UserProfile['role']> = {
  Administrador: 'admin',
  Curador: 'curator',
  Checador: 'checker',
  Editor: 'editor',
};

const PROFILE_ID_MAP: Record<string, string> = {
  Administrador: 'p-admin',
  Curador: 'p-curator',
  Checador: 'p-checker',
  Editor: 'p-editor',
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

function mapUsuario(dto: ApiUsuarioDto): UserProfile {
  const tipoNome = dto.tipoUsuario?.nome ?? '';
  return {
    id: dto.id,
    name: dto.nome,
    email: dto.email,
    role: ROLE_MAP[tipoNome] ?? 'checker',
    profileId: PROFILE_ID_MAP[tipoNome] ?? 'p-checker',
    avatarUrl:
      dto.avatarUrl ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dto.nome)}`,
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
      type,
      url: anexo.urlAcesso ?? '',
    };
  });
}

function mapConteudo(dto: ApiConteudoDto): NewsItem {
  const ch = dto.checagem;
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
    assignedTo: ch?.checadorId ?? undefined,
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
    assignmentHistory: [],
    media: mapAnexos(dto.anexos),
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

// ─────────────────────────────────────────────
// Funções de API
// ─────────────────────────────────────────────

export const apiService = {
  // Auth
  async login(email: string, senha: string): Promise<{ token: string; user: UserProfile }> {
    const data = await api.post<ApiLoginResponse>('/auth/login', { email, senha });
    setToken(data.token);
    return { token: data.token, user: mapUsuario(data.usuario) };
  },

  async getMe(): Promise<UserProfile> {
    const dto = await api.get<ApiUsuarioDto>('/me');
    return mapUsuario(dto);
  },

  // Usuários
  async listarUsuarios(): Promise<UserProfile[]> {
    const dtos = await api.get<ApiUsuarioDto[]>('/usuarios');
    return dtos.map(mapUsuario);
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

  async uploadAnexoConteudo(conteudoId: string, file: File): Promise<ApiAnexoConteudoDto> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<ApiAnexoConteudoDto>(`/conteudos/${conteudoId}/anexos/upload`, formData);
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

  async atribuirChecagem(conteudoId: string, body: AtribuirChecagemBody): Promise<ApiChecagemDto> {
    return api.post<ApiChecagemDto>(`/conteudos/${conteudoId}/atribuir`, body);
  },

  /** Atribui checador e retorna o conteúdo atualizado do banco. */
  async atribuirConteudo(conteudoId: string, body: AtribuirChecagemBody): Promise<NewsItem> {
    await api.post<ApiChecagemDto>(`/conteudos/${conteudoId}/atribuir`, body);
    return this.obterConteudo(conteudoId);
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

  // Auditoria
  async listarAuditoria(checagemId: string): Promise<ApiAuditoriaDto[]> {
    return api.get<ApiAuditoriaDto[]>(`/checagens/${checagemId}/auditoria`);
  },

  // YouTube / Denodare
  async buscarYoutube(params: BuscarYoutubeParams): Promise<YoutubeResultadoDto[]> {
    const qs = new URLSearchParams({ query: params.query });
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.startDate) qs.set('startDate', params.startDate);
    if (params.endDate) qs.set('endDate', params.endDate);
    return api.get<YoutubeResultadoDto[]>(`/youtube/buscar?${qs.toString()}`);
  },
};
