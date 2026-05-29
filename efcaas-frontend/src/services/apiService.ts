import { api, setToken } from './apiClient';
import {
  UserProfile,
  NewsItem,
  LabelConfig,
  Evidence,
  ReportStructure,
} from '../types';

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
  parecer: ApiParecerDto | null;
  evidencias: ApiEvidenciaDto[];
}

export interface ApiParecerDto {
  id: string;
  resumo: string;
  perguntas: string[];
  fontes: string[];
  inverificavel: boolean;
  contatoAutor: {
    hadContact: boolean | null;
    justificacao: string | null;
    response: string | null;
  } | null;
  respostaAutor: string;
  textoParecer: string;
  etiqueta: ApiEtiquetaDto | null;
}

export interface ApiEtiquetaDto {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
}

export interface ApiEvidenciaDto {
  id: string;
  tipo: string;
  linkArquivo: string;
  descricao: string;
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
  aguardando_checagem: 'pending',
  em_checagem: 'in_progress',
  aguardando_revisao: 'final_review',
  aprovado: 'completed',
  retificando: 'to_rectify',
};

const STATUS_FRONT_TO_API: Record<string, string> = {
  pending: 'aguardando_checagem',
  in_progress: 'em_checagem',
  final_review: 'aguardando_revisao',
  completed: 'aprovado',
  to_rectify: 'retificando',
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

function mapParecer(parecer: ApiParecerDto | null): ReportStructure | undefined {
  if (!parecer) return undefined;
  return {
    summary: parecer.resumo ?? '',
    questions: parecer.perguntas?.length ? parecer.perguntas : [''],
    sources: parecer.fontes?.length ? parecer.fontes : [''],
    isInverifiable: parecer.inverificavel ?? false,
    contactWithAuthor: {
      hadContact: parecer.contatoAutor?.hadContact ?? null,
      justification: parecer.contatoAutor?.justificacao ?? undefined,
      response: parecer.contatoAutor?.response ?? undefined,
    },
    label: parecer.etiqueta?.nome ?? undefined,
  };
}

function mapEvidencias(evidencias: ApiEvidenciaDto[]): Evidence[] {
  return (evidencias ?? []).map((ev) => ({
    id: ev.id,
    type: (ev.tipo as Evidence['type']) ?? 'link',
    url: ev.linkArquivo ?? '',
    title: ev.descricao ?? ev.linkArquivo ?? '',
    description: ev.descricao ?? undefined,
    timestamp: new Date().toLocaleString(),
  }));
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
    reportStructure: mapParecer(ch?.parecer ?? null),
    report: ch?.parecer?.textoParecer ?? undefined,
    assignmentHistory: [],
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
  ): Promise<ApiParecerDto> {
    return api.patch<ApiParecerDto>(`/checagens/${checagemId}/estrutura-relatorio`, body);
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

  async removerEvidencia(checagemId: string, evidenciaId: string): Promise<void> {
    return api.delete<void>(`/checagens/${checagemId}/evidencias/${evidenciaId}`);
  },
};
