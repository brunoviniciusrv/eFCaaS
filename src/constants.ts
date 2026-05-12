import { 
  NewsItem, 
  FactCheckTool, 
  UserProfile, 
  FactLabel, 
  AuditLog, 
  LabelConfig, 
  ReportStructureConfig, 
  ThemeConfig, 
  AgencyConfig,
  ReceivedNewsItem 
} from './types';

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Ricardo Alencar',
  email: 'ricardo.alencar@ais-news.com',
  role: 'admin',
  status: 'active',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo',
  bio: 'Arquiteto de sistemas sênior com 15 anos de experiência em segurança da informação e combate a fake news.'
};

export const MOCK_USERS: UserProfile[] = [
  MOCK_USER,
  {
    id: 'u2',
    name: 'Beatriz Santos',
    email: 'beatriz.santos@factcheck.org',
    role: 'checker',
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz',
    bio: 'Jornalista investigativa apaixonada por transparência pública e análise de dados governamentais.'
  },
  {
    id: 'u3',
    name: 'Carlos Eduardo',
    email: 'cadu.editor@ais-news.com',
    role: 'editor',
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    bio: 'Editor-chefe especializado em semiótica e discurso político, garantindo neutralidade e precisão editorial.'
  },
  {
    id: 'u4',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@curadoria.com',
    role: 'curator',
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana',
    bio: 'Especialista em fluxos de informação e monitoramento de redes sociais em tempo real.'
  }
];

const now = new Date();
const formatDate = (daysAgo: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const formatISO = (daysAgo: number, hoursAgo: number = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
};

export const INITIAL_RECEIVED_NEWS: ReceivedNewsItem[] = [
  {
    id: 'rn1',
    title: 'Suposto vídeo de meteoro vindo de WhatsApp',
    content: 'O vídeo mostra uma luz forte no céu de Curitiba. As pessoas estão dizendo que é um meteoro, mas parece ser um reflexo.',
    excerpt: 'O vídeo mostra uma luz forte no céu de Curitiba...',
    sourceType: 'WhatsApp',
    senderName: 'João Silva',
    senderAddress: '+55 41 99999-9999',
    receivedAt: formatISO(1, 2),
    status: 'received',
    media: [
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ]
  },
  {
    id: 'rn2',
    title: 'Post sobre nova lei de trânsito 2026',
    content: 'A postagem diz que agora é proibido dirigir em dias de chuva sem luzes de neblina.',
    excerpt: 'A postagem diz que agora é proibido dirigir em dias de chuva...',
    sourceType: 'Facebook',
    senderName: 'Maria Oliveira',
    receivedAt: formatISO(2, 5),
    status: 'received',
    originalLink: 'https://facebook.com/posts/12345',
    internalNotes: 'Parece ser recorrente.'
  },
  {
    id: 'rn3',
    title: 'E-mail com denúncia de fraude em licitação',
    content: 'Prezados, venho denunciar que a licitação X da prefeitura de Y foi fraudada pelo consórcio Z.',
    excerpt: 'Prezados, venho denunciar que a licitação X da prefeitura...',
    sourceType: 'E-mail',
    senderName: 'Denunciante Anônimo',
    senderAddress: 'anonimo@protonmail.com',
    receivedAt: formatISO(0, 10),
    status: 'received',
    media: [
      { type: 'document', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ]
  },
  {
    id: 'rn4',
    title: 'Mensagem no Telegram sobre falta de energia',
    content: 'Canais locais reportando falta de energia em 5 bairros simultaneamente.',
    excerpt: 'Canais locais reportando falta de energia em 5 bairros...',
    sourceType: 'Telegram',
    receivedAt: formatISO(0, 1),
    status: 'received'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', userId: 'u1', userName: 'Ricardo Alencar', action: 'login', timestamp: formatISO(5, 2), details: 'Realizou login no sistema' },
  { id: 'l2', userId: 'u1', userName: 'Ricardo Alencar', action: 'assign_task', target: 'Notícia #1', timestamp: formatISO(5, 1), details: 'Atribuiu notícia "Áudio vazado sugere manipulação de votos..." para Beatriz Santos' },
  { id: 'l3', userId: 'u2', userName: 'Beatriz Santos', action: 'start_analysis', target: 'Notícia #1', timestamp: formatISO(5, 0.5), details: 'Iniciou análise da notícia' },
  { id: 'l4', userId: 'u1', userName: 'Ricardo Alencar', action: 'suspend_user', target: 'Mariana Costa', timestamp: formatISO(4, 10), details: 'Suspendeu usuário por violação de segurança' },
  { id: 'l5', userId: 'u1', userName: 'Ricardo Alencar', action: 'approve_news', target: 'Notícia #6', timestamp: formatISO(3, 5), details: 'Aprovou a revisão final da notícia "Anúncio de luz ultravioleta..." ' },
  { id: 'l6', userId: 'u4', userName: 'Juliana Mendes', action: 'register_news', target: 'Notícia #8', timestamp: formatISO(2, 8), details: 'Registrou nova notícia: "Nova lei de trânsito prevê multa..."' },
  { id: 'l7', userId: 'u3', userName: 'Carlos Eduardo', action: 'edit_settings', timestamp: formatISO(2, 4), details: 'Atualizou limites de etiquetas globais' },
  { id: 'l8', userId: 'u2', userName: 'Beatriz Santos', action: 'complete_analysis', target: 'Notícia #1', timestamp: formatISO(1, 10), details: 'Concluiu análise e enviou para revisão' },
  { id: 'l9', userId: 'u1', userName: 'Ricardo Alencar', action: 'login', timestamp: formatISO(1, 1), details: 'Realizou login no sistema' },
  { id: 'l10', userId: 'u1', userName: 'Ricardo Alencar', action: 'assign_task', target: 'Notícia #10', timestamp: formatISO(0, 2), details: 'Atribuiu notícia "Alerta de tsunami para o litoral..." para Beatriz Santos' },
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Áudio vazado sugere manipulação de votos em eleição municipal',
    content: 'Um áudio de aproximadamente 3 minutos, amplamente compartilhado em grupos de WhatsApp na região Sul, alega registrar um candidato à prefeitura negociando benefícios em troca de apoio eleitoral para a próxima semana. A gravação apresenta uma qualidade sonora precária, comum em vazamentos fabricados ou editados fora de contexto. Investigadores iniciais sugerem que a voz pode ter sido sintetizada via inteligência artificial (Deepfake áudio), dadas certas pausas rítmicas não naturais e a ausência de ruídos de fundo característicos de uma gravação ambiental espontânea.',
    source: 'WhatsApp Viral',
    date: formatDate(10),
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'u2',
    startTime: formatISO(5, 2),
    report: '',
    reportStructure: {
      summary: '',
      questions: [''],
      sources: [''],
      isInverifiable: false,
      contactWithAuthor: { hadContact: null }
    },
    media: [
      { type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }
    ],
    evidence: [
      { id: 'ev1', type: 'link', url: 'https://exemplo.com/noticia-relacionada', title: 'Matéria do Jornal Local', timestamp: '2026-03-25 10:00' }
    ],
    assignmentHistory: [
      { id: 'h1', assignedTo: 'u2', assignedBy: 'u1', timestamp: formatISO(5, 2), action: 'assigned' }
    ],
    aiScores: { gravity: 85, urgency: 92, trend: 70 },
    aiEvaluation: {
      score: 0.88,
      explanation: "Alta probabilidade de manipulação digital (Deepfake). O áudio apresenta artefatos sintéticos consistentes com geração por IA.",
      warningLevel: "alerta de integridade eleitoral / deepfake detectado",
      characteristics: [
        "**Padrões de voz não naturais:** Ausência de micro-hesitações humanas.",
        "**Ruído de fundo inconsistente:** Som ambiente estéril demais para uma gravação vazada.",
        "**Risco social alto:** Potencial para desestabilizar o processo democrático local."
      ],
      topics: ["Política", "Eleições", "Inteligência Artificial"],
      entities: [
        { name: "Candidato à Prefeitura", description: "Voz alvo do deepfake" },
        { name: "WhatsApp", description: "Vetor principal de disseminação" }
      ],
      location: "Brasil (Regional Sul)",
      dates: ["2026-03-25"]
    }
  },
  {
    id: '2',
    title: 'Vídeo no TikTok anuncia "cura definitiva" para variantes de gripe em 24h',
    content: 'Um vídeo que viralizou rapidamente no TikTok mostra um homem vestindo jaleco branco e se identificando como Dr. Silva afirmando que uma "fórmula secreta" cura qualquer variante da gripe em apenas um dia.',
    source: 'TikTok',
    date: formatDate(9),
    status: 'pending',
    priority: 'medium',
    report: '',
    reportStructure: {
      summary: '',
      questions: [''],
      sources: [''],
      isInverifiable: false,
      contactWithAuthor: { hadContact: null }
    },
    media: [
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' }
    ],
    evidence: [],
    aiScores: { gravity: 78, urgency: 65, trend: 80 },
    aiEvaluation: {
      score: 0.92,
      explanation: "Desinformação médica grave com fins comerciais. Promessas de cura em 24h são cientificamente impossíveis para vírus respiratórios.",
      warningLevel: "perigo à saúde pública / fraude médica",
      characteristics: [
        "**Falsa autoridade:** Uso de jaleco para simular credibilidade técnica.",
        "**Teoria da conspiração:** Alegação de supressão de segredos pela OMS.",
        "**Urgência fabricada:** Incentivo à compra imediata de produto clandestino."
      ],
      topics: ["Saúde", "Medicina", "Fraudulent Marketing"],
      entities: [
        { name: "Dr. Silva", description: "Identidade fictícia no TikTok" },
        { name: "OMS", description: "Organização Mundial da Saúde (citada como conspiradora)" }
      ],
      location: "Global / Brasil",
      dates: ["2026-03-26"]
    }
  },
  {
    id: '3',
    title: 'Foto aérea de desmatamento na Amazônia é compartilhada como registro atual',
    content: 'Uma imagem aérea mostrando uma clareira gigantesca na Floresta Amazônica está circulando no X (Twitter) com a legenda: "Cenas de hoje".',
    source: 'Twitter/X',
    date: formatDate(8),
    status: 'pending',
    priority: 'low',
    report: '',
    reportStructure: {
      summary: '',
      questions: [''],
      sources: [''],
      isInverifiable: false,
      contactWithAuthor: { hadContact: null }
    },
    media: [
      { type: 'image', url: 'https://picsum.photos/seed/amazon/800/600' }
    ],
    evidence: [],
    aiScores: { gravity: 45, urgency: 30, trend: 20 },
    aiEvaluation: {
      score: 0.15,
      explanation: "Conteúdo desatualizado sendo reapresentado como novo. Embora a imagem seja real, o contexto temporal é falso.",
      warningLevel: "descontextualização de mídia / imagem antiga",
      characteristics: [
        "**Anacronismo deliberado:** Uso de dados de 2021 em narrativa de 2026.",
        "**Apelo emocional:** Utilização do termo 'pulmão do mundo' para gerar engajamento.",
        "**Verificação visual:** Metadados da imagem original confirmam data anterior."
      ],
      topics: ["Meio Ambiente", "Amazônia", "Política Ambiental"],
      entities: [
        { name: "X (Twitter)", description: "Origem da postagem viral" },
        { name: "Amazônia", description: "Local alvo da notícia" }
      ],
      location: "Brasil (Amazônia)",
      dates: ["2026-03-24", "2021-06-15"]
    }
  },
  {
    id: '4',
    title: 'PDF com suposto vazamento da OMS sobre vacinas infantis circula no Telegram',
    content: 'Um arquivo PDF com aparência oficial intitulado "Relatório Técnico de Riscos Pediátricos Ocultos" está sendo distribuído em canais de Telegram.',
    source: 'Telegram',
    date: formatDate(7),
    status: 'to_rectify',
    priority: 'medium',
    assignedTo: 'u2',
    report: 'Relatório preliminar indica que...',
    isRectified: true,
    reportStructure: {
      summary: 'Dados de 2024 estão obsoletos.',
      questions: ['Quais os novos dados de 2025?'],
      sources: ['OMS 2025'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: true, justification: 'Contato via e-mail oficial.' },
      label: 'Distorcido'
    },
    evidence: [],
    aiScores: { gravity: 60, urgency: 40, trend: 50 },
    aiEvaluation: {
      score: 0.75,
      explanation: "Documento forjado mesclando informações reais e falsas (Greyscale Desinformation). Alta complexidade técnica de montagem.",
      warningLevel: "documento falsificado / fake news técnica",
      characteristics: [
        "**Mimetismo oficial:** Uso de logotipos e linguagem técnica da OMS.",
        "**Dados híbridos:** Combinação de estatísticas reais com conclusões fabricadas.",
        "**Vetor restrito:** Circulação em grupos fechados para evitar checagem rápida."
      ],
      topics: ["Saúde Infantil", "Vacinação", "Relatórios Oficiais"],
      entities: [
        { name: "OMS", description: "Alvo da personificação do documento" },
        { name: "Telegram", description: "Plataforma de distribuição" }
      ],
      location: "Internacional",
      dates: ["2026-03-20"]
    }
  },
  {
    id: '5',
    title: 'Urgente: Convocação de greve geral de caminhoneiros para amanhã viraliza',
    content: 'Áudios e cards coloridos circulando massivamente no WhatsApp afirmam que todas as rodovias federais serão bloqueadas.',
    source: 'WhatsApp',
    date: formatDate(6),
    status: 'pending',
    priority: 'high',
    report: '',
    reportStructure: {
      summary: '',
      questions: [''],
      sources: [''],
      isInverifiable: false,
      contactWithAuthor: { hadContact: null }
    },
    evidence: [],
    aiScores: { gravity: 95, urgency: 88, trend: 90 },
    aiEvaluation: {
      score: 0.96,
      explanation: "Conteúdo alarmista sem liderança identificável. Padrão de ataque coordenado para gerar instabilidade logística.",
      warningLevel: "ameaça à infraestrutura / pânico social",
      characteristics: [
        "**Anonimato total:** Falta de porta-vozes ou sindicatos reconhecidos.",
        "**Escrita alarmista:** Uso de CAIXA ALTA e emojis de alerta.",
        "**Objetivo desestabilizador:** Foco em causar desabastecimento preventivo."
      ],
      topics: ["Economia", "Logística", "Segurança Nacional"],
      entities: [
        { name: "Caminhoneiros", description: "Classe alvo da convocação" },
        { name: "WhatsApp", description: "Vetor de viralização" }
      ],
      location: "Brasil (Rodovias Federais)",
      dates: ["2026-03-26", "2026-03-27"]
    }
  },
  {
    id: '6',
    title: 'Anúncio de "luz ultravioleta" como cura para o câncer engana milhares no Facebook',
    content: 'Um post patrocinado no Facebook afirma que a luz ultravioleta pulsada pode eliminar 100% das células cancerígenas.',
    source: 'Facebook',
    date: formatDate(5),
    status: 'completed',
    completedAt: formatISO(3, 5),
    startTime: formatISO(5, 5),
    priority: 'high',
    assignedTo: 'u2',
    report: 'A checagem concluiu que a afirmação é falsa e perigosa.',
    reportStructure: {
      summary: 'Não há evidências científicas.',
      questions: ['O laboratório existe?', 'A técnica é reconhecida?'],
      sources: ['INCA', 'Sociedade Brasileira de Oncologia'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: false },
      label: 'Falso'
    },
    evidence: [],
    aiScores: { gravity: 90, urgency: 75, trend: 60 },
    aiEvaluation: {
      score: 0.98,
      explanation: "Conteúdo extremamente perigoso que pode causar danos físicos se os pacientes abandonarem tratamentos convencionais.",
      warningLevel: "alerta crítico / desinformação médica grave",
      characteristics: [
        "**Promessa de cura total:** Nenhuma terapia reconhecida promete cura definitiva para todos os tipos de câncer simultaneamente.",
        "**Ausência de base científica:** Uso de luz UV não é um tratamento sistêmico contra o câncer.",
        "**Fonte não confiável:** Laboratório clandestino sem registro em órgãos competentes."
      ],
      topics: ["Saúde", "Oncologia", "Fake News Médica"],
      entities: [
        { name: "ANVISA", description: "Agência de Vigilância Sanitária" },
        { name: "Facebook", description: "Local de disseminação" }
      ],
      location: "Brasil",
      dates: ["2026-03-28"]
    }
  },
  {
    id: '7',
    title: 'Boato recorrente sobre leitura de mensagens privadas pelo WhatsApp ressurge',
    content: 'Uma antiga corrente sobre mudanças na política de privacidade do WhatsApp voltou a circular.',
    source: 'WhatsApp',
    date: formatDate(4),
    status: 'final_review',
    priority: 'medium',
    assignedTo: 'u2',
    report: 'O WhatsApp esclareceu que as mensagens continuam criptografadas de ponta a ponta.',
    reportStructure: {
      summary: 'As mensagens permanecem privadas.',
      questions: ['O WhatsApp lê mensagens?'],
      sources: ['WhatsApp Blog'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: true },
      label: 'Falso'
    },
    evidence: [],
    aiScores: { gravity: 70, urgency: 85, trend: 80 },
    aiEvaluation: {
      score: 0.22,
      explanation: "Reaquecimento de boatos antigos sobre privacidade. Embora a trend seja alta, a gravidade técnica é baixa pois a criptografia de ponta a ponta é mantida.",
      warningLevel: "desinformação recorrente / termos de uso",
      characteristics: [
        "**Ciclo de vida:** Boato que ressurge periodicamente com alterações mínimas.",
        "**Medo da vigilância:** Explora o receio genuíno dos usuários sobre privacidade de dados.",
        "**Distorção de termos:** Confunde o compartilhamento de metadados com empresas do grupo Meta com leitura de conteúdo."
      ],
      topics: ["Tecnologia", "Privacidade", "Redes Sociais"],
      entities: [
        { name: "WhatsApp", description: "Serviço de mensageria" },
        { name: "Meta", description: "Empresa controladora" }
      ],
      location: "Global",
      dates: ["2026-03-29"]
    }
  },
  {
    id: '8',
    title: 'Nova lei de trânsito prevê multa para quem dirigir de chinelo, afirma post',
    content: 'Publicação no Instagram afirma que o CTB foi atualizado.',
    source: 'Instagram',
    date: formatDate(3),
    status: 'completed',
    completedAt: formatISO(2, 2),
    startTime: formatISO(3, 1),
    priority: 'low',
    assignedTo: 'u2',
    report: 'A lei não mudou recentemente, mas já prevê multa.',
    reportStructure: {
      summary: 'Lei antiga ainda em vigor.',
      questions: ['Houve mudança no CTB?'],
      sources: ['CTB Oficial'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: false },
      label: 'Falso'
    },
    evidence: [],
    aiScores: { gravity: 20, urgency: 15, trend: 40 },
    aiEvaluation: {
      score: 0.30,
      explanation: "Informação parcialmente correta mas com interpretação jurídica equivocada sobre 'nova' lei.",
      warningLevel: "baixa gravidade / interpretação errônea",
      characteristics: [
        "**Venda de novidade:** Apresenta regras antigas como se fossem decretos recentes.",
        "**Sensacionalismo leve:** Foco em hábitos cotidianos para gerar cliques.",
        "**Base legal existente:** O CTB já proíbe calçados que não ficam firmes nos pés (Art. 252)."
      ],
      topics: ["Leis", "Trânsito", "Comportamento"],
      entities: [
        { name: "CONTRAN", description: "Conselho Nacional de Trânsito" },
        { name: "Instagram", description: "Vetor de disseminação" }
      ],
      location: "Brasil",
      dates: ["2026-04-01"]
    }
  },
  {
    id: '9',
    title: 'Suposto vídeo de meteoro caindo em Minas Gerais é montagem de cinema',
    content: 'Vídeo impressionante de uma bola de fogo rasgando o céu noturno em Belo Horizonte viraliza no X.',
    source: 'X/Twitter',
    date: formatDate(2),
    status: 'completed',
    completedAt: formatISO(1, 1),
    startTime: formatISO(2, 10),
    priority: 'low',
    assignedTo: 'u2',
    report: 'Vídeo antigo usado fora de contexto.',
    reportStructure: {
      summary: 'Imagem de filme.',
      questions: ['Origem do vídeo?'],
      sources: ['IMDB trailers'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: false },
      label: 'Falso'
    },
    evidence: [],
    aiScores: { gravity: 10, urgency: 10, trend: 95 },
    aiEvaluation: {
      score: 0.05,
      explanation: "Conteúdo de entretenimento confundido ou deliberadamente associado a evento real por engano.",
      warningLevel: "mídia ficcional / contexto falso",
      characteristics: [
        "**CGI de alta qualidade:** Efeitos visuais incompatíveis com gravações amadoras de celular.",
        "**Origem cinematográfica:** Cenas identificadas como pertencentes a trailer de ficção.",
        "**Risco físico nulo:** Não gera perigo direto, apenas curiosidade viral."
      ],
      topics: ["Astronomia", "Curiosidades", "Entretenimento"],
      entities: [
        { name: "Belo Horizonte", description: "Local supostamente atingido" },
        { name: "X (Twitter)", description: "Local de viralização" }
      ],
      location: "Brasil (MG)",
      dates: ["2026-04-02"]
    }
  },
  {
    id: '10',
    title: 'Alerta de tsunami para o litoral de São Paulo assusta banhistas',
    content: 'Mensagem via Telegram afirma que a Marinha detectou abalo sísmico no Atlântico.',
    source: 'Telegram',
    date: formatDate(1),
    status: 'in_progress',
    startTime: formatISO(0, 5),
    priority: 'high',
    assignedTo: 'u2',
    report: '',
    reportStructure: {
      summary: '',
      questions: ['Houve abalo sísmico?'],
      sources: ['Marinha do Brasil', 'USGS'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: null }
    },
    evidence: [],
    aiScores: { gravity: 98, urgency: 100, trend: 90 },
    aiEvaluation: {
      score: 0.99,
      explanation: "Ameaça de desastre natural iminente sem qualquer base geológica. Extremamente perigoso pelo potencial de pânico em massa.",
      warningLevel: "risco de pânico / desastre natural falso",
      characteristics: [
        "**Urgência máxima:** Prazo curto (2 horas) para forçar reações impensadas.",
        "**Abuso de autoridade:** Citação de alerta da Marinha sem confirmação oficial.",
        "**Inviabilidade física:** Ausência de registro sísmico global correlacionado."
      ],
      topics: ["Segurança Pública", "Defesa Civil", "Geologia"],
      entities: [
        { name: "Marinha do Brasil", description: "Alvo da falsa atribuição" },
        { name: "Telegram", description: "Origem do surto de desinformação" }
      ],
      location: "Brasil (Litoral SP)",
      dates: ["2026-04-03"]
    }
  }
];


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

export const OFFICIAL_LABELS: LabelConfig[] = [
  { id: 'l1', name: 'Verdadeiro', color: '#22c55e', description: 'A informação é totalmente correta e comprovada.' },
  { id: 'l2', name: 'Falso', color: '#ef4444', description: 'A informação é totalmente incorreta ou inventada.' },
  { id: 'l3', name: 'Distorcido', color: '#f97316', description: 'A informação tem base real mas foi alterada para enganar.' },
  { id: 'l4', name: 'Falta Contexto', color: '#3b82f6', description: 'A informação é verdadeira mas precisa de contexto para não enganar.' },
  { id: 'l5', name: 'Exagerado', color: '#eab308', description: 'A informação aumenta a realidade de forma desproporcional.' },
  { id: 'l6', name: 'Subestimado', color: '#a855f7', description: 'A informação diminui a realidade de forma desproporcional.' },
];

export const INITIAL_AGENCY_CONFIG: AgencyConfig = {
  name: 'Agência eFCaaS',
  logoUrl: '',
  isOnboardingCompleted: false
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
  }
};
