import { NewsItem, FactCheckTool, UserProfile, FactLabel, AuditLog, LabelConfig, ReportStructureConfig, ThemeConfig, AgencyConfig } from './types';

export const MOCK_USER: UserProfile = {
  id: 'u1',
  name: 'Ricardo Alencar',
  email: 'ricardo.alencar@ais-news.com',
  role: 'admin',
  status: 'active',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo',
  bio: 'Arquiteto de sistemas sênior com 15 anos de experiência em segurança da informação e combate a fake news.',
  permissions: {
    canEditUsers: true,
    canViewLogs: true,
    canApproveNews: true,
    canDeleteNews: true
  }
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
    bio: 'Jornalista investigativa apaixonada por transparência pública e análise de dados governamentais.',
    permissions: {
      canEditUsers: false,
      canViewLogs: false,
      canApproveNews: false,
      canDeleteNews: false
    }
  },
  {
    id: 'u3',
    name: 'Carlos Eduardo',
    email: 'cadu.editor@ais-news.com',
    role: 'editor',
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    bio: 'Editor-chefe especializado em semiótica e discurso político, garantindo neutralidade e precisão editorial.',
    permissions: {
      canEditUsers: false,
      canViewLogs: true,
      canApproveNews: true,
      canDeleteNews: false
    }
  },
  {
    id: 'u5',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@curadoria.com',
    role: 'curator',
    status: 'active',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana',
    bio: 'Especialista em fluxos de informação e monitoramento de redes sociais em tempo real.',
    permissions: {
      canEditUsers: false,
      canViewLogs: false,
      canApproveNews: false,
      canDeleteNews: false
    }
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

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'l1', userId: 'u1', userName: 'Ricardo Alencar', action: 'login', timestamp: formatISO(5, 2) },
  { id: 'l2', userId: 'u1', userName: 'Ricardo Alencar', action: 'assign_task', target: 'News #1', timestamp: formatISO(5, 1), details: 'Assigned to Beatriz Santos' },
  { id: 'l3', userId: 'u2', userName: 'Beatriz Santos', action: 'start_analysis', target: 'News #1', timestamp: formatISO(5, 0.5) },
  { id: 'l4', userId: 'u1', userName: 'Ricardo Alencar', action: 'suspend_user', target: 'Mariana Costa', timestamp: formatISO(4, 10), details: 'Reason: Security violation' },
  { id: 'l5', userId: 'u1', userName: 'Ricardo Alencar', action: 'approve_news', target: 'News #6', timestamp: formatISO(3, 5), details: 'Final review approved' },
  { id: 'l6', userId: 'u5', userName: 'Juliana Mendes', action: 'register_news', target: 'News #8', timestamp: formatISO(2, 8) },
  { id: 'l7', userId: 'u3', userName: 'Carlos Eduardo', action: 'edit_settings', timestamp: formatISO(2, 4), details: 'Updated labeling threshold' },
  { id: 'l8', userId: 'u2', userName: 'Beatriz Santos', action: 'complete_analysis', target: 'News #1', timestamp: formatISO(1, 10) },
  { id: 'l9', userId: 'u1', userName: 'Ricardo Alencar', action: 'login', timestamp: formatISO(1, 1) },
  { id: 'l10', userId: 'u1', userName: 'Ricardo Alencar', action: 'assign_task', target: 'News #10', timestamp: formatISO(0, 2) },
];

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: '1',
    title: 'Áudio vazado sugere manipulação de votos em eleição municipal',
    content: 'Um áudio de aproximadamente 3 minutos, amplamente compartilhado em grupos de WhatsApp na região Sul (especificamente em Joinville e arredores), alega registrar um candidato à prefeitura negociando benefícios em troca de apoio eleitoral para a próxima semana. A gravação apresenta uma qualidade sonora propositalmente precária, padrão comum em vazamentos fabricados para esconder artefatos de IA. \n\nNo áudio, a voz atribuída ao candidato menciona: "Precisamos garantir aqueles setores da zona norte, custe o que custar. Conversem com as lideranças, ofereçam as secretarias prometidas e, se precisar, liberem os recursos de contingência agora". \n\nInvestigadores iniciais sugerem que a voz pode ter sido sintetizada via inteligência artificial (Deepfake áudio), dadas certas pausas rítmicas não naturais, a ausência de ruídos de fundo característicos de uma gravação ambiental espontânea e padrões de entonação que se repetem de forma mecânica em frequências específicas.',
    source: 'WhatsApp Viral',
    date: formatDate(10),
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'u2',
    startTime: formatISO(5, 2),
    report: '### Análise Técnica Preliminar - Caso #001\n\nA investigação concentrou-se na análise espectrográfica do arquivo de áudio "Vazamento_Confidencial_Sul.mp3". \n\n**Ouvimos Especialistas:**\n> "Ao analisar as frequências de transição entre as consoantes oclusivas, percebemos um padrão de interpolação linear que não existe na anatomia humana. Isso é a assinatura digital de uma IA de síntese de voz de baixo custo", afirma o perito forense Dr. Marcos Vinícius, da consultoria digital CyberTruth.\n\n**Posicionamento do Candidato:**\nEm nota enviada à nossa equipe, a assessoria jurídica do candidato afirmou: "O material é uma fraude grosseira. O candidato jamais esteve na região norte no dia 24, o que pode ser comprovado pelas agendas oficiais e registros de torre de celular que já entregamos à polícia".\n\n**Pontos Chave da Investigação:**\n1. **Ausência de Ruído de Fundo (Noise Floor):** Diferente de uma gravação real em ambiente de escritório ou restaurante, o áudio apresenta um silêncio digital absoluto entre as palavras.\n2. **Padrões de Prosódia:** A entonação da voz não varia de acordo com a carga emocional das palavras "recursos" e "contingência", agindo como um modelo de texto-para-fala (TTS).\n3. **Verificação de Metadados:** O arquivo original foi exportado de uma ferramenta web de geração de voz em 24/03.',
    reportStructure: {
      summary: 'Áudio sintético criado por IA para simular negociação de votos. Metadados confirmam origem em software de síntese de voz.',
      questions: ['O candidato estava no local no horário indicado?', 'Existem outros vazamentos da mesma fonte?', 'O software de clonagem de voz foi identificado?'],
      sources: ['Relatório de Perícia Digital da Polícia Civil', 'Nota oficial da assessoria do candidato', 'Análise de metadados do arquivo original'],
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
    content: 'Um vídeo que viralizou rapidamente no TikTok (alcance de 1.2M de visualizações em 12h) mostra um homem vestindo jaleco branco bordado e se identificando como "Dr. Silva, Ph.D em Virologia por Cambridge". Ele afirma que uma "fórmula secreta à base de nanopartículas de prata e extratos amazônicos" cura qualquer variante da gripe, incluindo a H3N2 e novas linhagens aviárias, em apenas 24 horas.\n\nNo vídeo, o suposto médico afirma: "A indústria farmacêutica não quer que você saiba disso porque eles ganham bilhões com tratamentos lentos. Minha fórmula custa apenas uma fração do preço e elimina o vírus do seu organismo em um ciclo solar. Tenho centenas de pacientes curados que a rede social está tentando censurar". O link na bio direciona para uma página de checkout de um suplemento não registrado na ANVISA.',
    source: 'TikTok',
    date: formatDate(9),
    status: 'pending',
    priority: 'medium',
    report: '### Relatório de Investigação Editorial - Fraude Médica\n\n**O Vídeo Viral:** O conteúdo foi analisado por nossa equipe de monitoramento, identificando uma rede de 15 contas "bot" que impulsionaram o vídeo nas primeiras 3 horas.\n\n**Ouvimos a Autoridade:**\n> "Não existe qualquer registro de pedido de autorização para testes clínicos dessa suposta fórmula de nanopartículas no Brasil. O consumo de prata coloidal pode causar argiria, uma coloração azulada irreversível na pele, além de danos renais graves", alerta Dra. Helena Rocha, coordenadora de vigilância sanitária da ANVISA.\n\n**O Sujeito:** O indivíduo identificado como "Dr. Silva" usa um registro (CRM) pertencente a um médico já falecido em 2012 na cidade de Curitiba. A Universidade de Cambridge confirmou: "Não há registro de Ph.D. sob este nome em nosso departamento de virologia".\n\n**Destaque da Reportagem:**\nAo tentarmos contato com o vendedor através do link na bio, recebemos uma resposta automática: "O Dr. Silva está em congresso secreto na Suíça, aproveite o lote promocional". Claramente uma técnica de gatilho mental de urgência para venda rápida.',
    reportStructure: {
      summary: 'Falso especialista utiliza credenciais fictícias para vender suplemento não registrado com promessas de cura impossíveis.',
      questions: ['O Dr. Silva tem CRM ativo?', 'A ANVISA autorizou o suplemento?', 'Cambridge reconhece o título do profissional?'],
      sources: ['Página oficial do CFM (Busca por nome)', 'Site de Cambridge (Alumni Directory)', 'Base de dados da ANVISA'],
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
    content: 'Uma imagem aérea mostrando uma clareira gigantesca na Floresta Amazônica está circulando no X (Twitter) com a legenda: "Cenas de hoje". A imagem mostra padrões de corte raso em formato de "espinha de peixe", típicos de ocupações irregulares em larga escala.\n\nO post acumulou 250k visualizações em poucas horas, gerando uma onda de indignação e críticas ao monitoramento ambiental atual. No entanto, observadores atentos notaram que o padrão de nuvens e a cor da vegetação parecem incompatíveis com a estação seca atual na região do Pará, onde a foto supostamente foi tirada.',
    source: 'Twitter/X',
    date: formatDate(8),
    status: 'pending',
    priority: 'low',
    report: '### Verificação de Imagem por Satélite e Contexto\n\n**A Análise Digital:** Realizamos uma busca reversa e cruzamento de metadados com bancos de imagens de agências internacionais.\n\n**Ouvimos o Especialista:**\n> "O padrão de dispersão de fumaça na imagem é vertical, o que indica ausência de ventos alísios típicos da região nesta época do ano. Além disso, a mancha de desmate coincide exatamente com o polígono verificado pelo DETER em 2021", explica Dr. Paulo Souza, pesquisador sênior de sensoriamento remoto do INPE.\n\n**Resultado da Investigação:** A imagem foi originalmente publicada pela Agência Reuters em 15 de junho de 2021. Ela retrata o desmatamento na região de Novo Progresso (PA) ocorrido durante o pico de queimadas daquele ano.\n\n**Conclusão Temporária:** A foto é real, mas o contexto temporal é falso. Trata-se de uma tática de "requentamento" de notícias negativas para impactar a percepção pública atual.',
    reportStructure: {
      summary: 'Foto real de 2021 sendo compartilhada como se fosse atual para gerar desinformação política sobre preservação ambiental.',
      questions: ['Qual a data original da foto?', 'Quem é o autor do registro?', 'Existem alertas de desmatamento recentes nessa coordenada?'],
      sources: ['Arquivo Reuters 2021', 'Google Reverse Image Search', 'Dashboard do INPE (DETER/PRODES)'],
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
    content: 'Um arquivo PDF com aparência oficial intitulado "Relatório Técnico de Riscos Pediátricos Ocultos" está sendo distribuído em canais de Telegram com viés conspiracionista. O documento usa logotipos oficiais da OMS e da UNICEF, tabelas estatísticas complexas e bibliografia extensa.\n\nO texto principal alega que estudos internos realizados em 2024 teriam detectado "neurotoxicidade latente" em 15% das crianças vacinadas, mas que essa informação teria sido suprimida por pressão de governos nacionais. O arquivo está sendo baixado milhares de vezes e compartilhado como a "prova definitiva da verdade".',
    source: 'Telegram',
    date: formatDate(7),
    status: 'to_rectify',
    priority: 'medium',
    assignedTo: 'u2',
    report: '### Análise Forense de Documento e Validação Institucional\n\n**O Exame Técnico:** O arquivo "Relatorio_OMS_2024_Pediátrico.pdf" foi submetido a uma análise de camadas no Adobe Illustrator, revelando que os logotipos foram colados sobre um template de documento genérico.\n\n**Ouvimos a Instituição:**\n> "Este documento é uma peça de ficção completa. A OMS não utiliza a terminologia \'neurotoxicidade latente\' em seus protocolos de vacinação pediátrica. É uma tentativa clara de usar nossa credibilidade para espalhar medo infundado", declarou Sarah Jenkins, porta-voz de comunicação global da OMS em Genebra.\n\n**Inconsistências Identificadas:**\n1. **Dados Fabricados:** As tabelas citam o "Journal of Pediatric Oncology, vol. 88", que não existe no mundo real.\n2. **Assinaturas:** O nome do diretor-geral citado no rodapé está grafado incorretamente, um erro primário para um documento oficial.\n\n**Rastreamento de Origem:** Identificamos que a estrutura deste PDF é idêntica a um hoax que circulou na Alemanha em 2023, tendo sido apenas traduzido e adaptado para o contexto brasileiro.',
    isRectified: true,
    reportStructure: {
      summary: 'Documento forjado (Greyscale) que mescla elementos visuais reais com dados e conclusões completamente fabricadas.',
      questions: ['As fontes citadas no PDF existem?', 'A OMS reconhece o documento?', 'Qual a origem do arquivo original?'],
      sources: ['Assessoria de Comunicação OMS/Genebra', 'Biblioteca Nacional de Medicina (PubMed)', 'Análise de metadados de PDF (Adobe Forensic Tool)'],
      isInverifiable: false,
      contactWithAuthor: { hadContact: true, justification: 'Contato via e-mail oficial com o escritório da OMS no Brasil.' },
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
    content: 'Áudios desesperados e cards coloridos circulando massivamente no WhatsApp afirmam que todas as rodovias federais serão bloqueadas a partir das 06h de amanhã. O motivo seria o aumento do diesel e novas diretrizes de pedágio.\n\n"É hora de parar o Brasil! Não deixem passar nada, nem carga viva, nem oxigênio. Vamos mostrar nossa força!", diz um dos áudios mais compartilhados. Não há assinatura de sindicatos ou associações conhecidas nos materiais de divulgação.',
    source: 'WhatsApp',
    date: formatDate(6),
    status: 'pending',
    priority: 'high',
    report: '### Verificação de Inteligência Logística e Segurança Viária\n\n**A Monitoração:** Nas últimas 12 horas, nossa equipe acompanhou os maiores grupos setoriais no Telegram e WhatsApp.\n\n**Ouvimos a Autoridade:**\n> "Não há qualquer bloqueio registrado em rodovias federais até este momento. Nossas equipes de inteligência detectaram que os áudios viralizados são antigos, de uma manifestação pontual ocorrida em 2018, e estão sendo recirculados com datas alteradas via edição de áudio", informou o Inspetor PRF Wagner Silva.\n\n**Checagem de Entidades:**\nEntramos em contato com a CNTA e a ABCAM. Ambas as federações emitiram notas oficiais repudiando o movimento e afirmando que "interesses políticos externos estão tentando usar a categoria para criar um clima de instabilidade econômica".\n\n**Objetivo Identificado:** O card original foi gerado por uma rede de perfis falsos que lucram com picos de tráfego gerados por pânico social, visando inflar o preço de fretes e combustíveis em algumas regiões.',
    reportStructure: {
      summary: 'Convocação anônima sem base em entidades representativas, visando criar pânico e desabastecimento especulativo.',
      questions: ['Quais sindicatos confirmaram a paralisão?', 'A PRF tem informações de bloqueio?', 'Quem é o autor do áudio original?'],
      sources: ['Nota Oficial CNTA (Caminhoneiros)', 'Monitoramento de Rodovias da PRF', 'Associações Regionais de Transportadores'],
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
    content: 'Um post patrocinado no Facebook, vindo de uma página chamada "Saúde Quântica Brasil", afirma que a luz ultravioleta pulsada pode eliminar 100% das células cancerígenas em qualquer estágio da doença sem necessidade de quimioterapia. \n\nO anúncio promete um "kit doméstico de biofotônica" que permitiria ao paciente realizar o tratamento no conforto de casa. O texto cita um suposto estudo de uma "Universidade de Munique" que teria sido ocultado pelos grandes laboratórios. O post já conta com mais de 50 mil compartilhamentos e milhares de comentários de pessoas interessadas em adquirir o aparelho.',
    source: 'Facebook',
    date: formatDate(5),
    status: 'completed',
    completedAt: formatISO(3, 5),
    startTime: formatISO(5, 5),
    priority: 'high',
    assignedTo: 'u2',
    report: '# PARECER FINAL DE CHECAGEM - UNIDADE DE SAÚDE eFCaaS\n\n## 1. RESUMO DA INVESTIGAÇÃO\nA alegação de que luz ultravioleta pulsada cura o câncer é **FALSA**. Esta é uma tática perigosa de desinformação que mimetiza conceitos reais da física quântica para enganar leigos.\n\n## 2. DEPOIMENTOS E ENTREVISTAS\n**O Lado das Vítimas:**\n> "Minha mãe quase parou a quimioterapia para comprar esse aparelho de 8 mil reais. Eles falam com tanta convicção que você acredita que a medicina tradicional é o inimigo", desabafa Maria Helena, que denunciou a página Saúde Quântica Brasil.\n\n**O Lado da Ciência:**\n> "Embora o UV seja usado para esterilização de superfícies, aplicá-lo em tecidos internos com a promessa de curar câncer é o mesmo que prometer que uma lanterna vai curar uma fratura óssea. É um absurdo biológico", explica o oncologista sênior Dr. Artur Neves.\n\n## 3. ANÁLISE DOS FATOS\n*   **Fraude Acadêmica:** A suposta "Universidade de Munique" citada é, na verdade, uma tradução errônea de um fórum alternativo sem qualquer afiliação acadêmica.\n*   **O Risco:** O equipamento é montado com lâmpadas UV-C de baixa qualidade vendidas em sites de importação barata, sem qualquer blindagem de radiação.\n\n---\n**Selado por:** Beatriz Santos (Checadora Sênior)\n**Aprovado por:** Carlos Eduardo (Editor-Chefe)',
    reportStructure: {
      summary: 'Fraude médica vendendo aparelhos UV sem eficácia comprovada. Risco alto de abandono de tratamento oncológico real.',
      questions: ['O laboratório existe?', 'A técnica é reconhecida?', 'A universidade citada confirma o estudo?'],
      sources: ['Nota Oficial INCA 2026', 'Resposta por e-mail da Universidade de Munique (LMU)', 'Catálogo de aparelhos autorizados da ANVISA'],
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
    content: 'Uma antiga corrente sobre mudanças na política de privacidade do WhatsApp voltou a circular em grupos de família. A mensagem afirma que, a partir da próxima meia-noite, todas as conversas passarão a ser monitoradas por um novo algoritmo de inteligência artificial da Meta para fins de "pontuação social" e moderação automática de conteúdo político.\n\nO boato usa termos jurídicos vagos e faz alusão ao "Tribunal Internacional de Haia", tentando conferir uma autoridade inexistente à mensagem. É um exemplo clássico de "copypasta" que ressurge a cada 6 meses com variações mínimas no texto.',
    source: 'WhatsApp',
    date: formatDate(4),
    status: 'final_review',
    priority: 'medium',
    assignedTo: 'u2',
    report: '### Verificação de Segurança Digital\n\n**Análise:** O WhatsApp utiliza criptografia de ponta a ponta (E2EE), o que impossibilita tecnicamente que a empresa ou qualquer algoritmo leia o conteúdo das mensagens privadas. A Meta já desmentiu oficialmente esta corrente diversas vezes.\n\n**Origem:** O texto é uma tradução de um hoax (boato) que circula em inglês desde 2012, adaptado para citar termos atuais como "IA" e "algoritmos". Não houve qualquer alteração nos termos de serviço na data mencionada.',
    reportStructure: {
      summary: 'Reaquecimento de boato antigo sobre quebra de privacidade. A criptografia de ponta a ponta permanece ativa e inviolada.',
      questions: ['O WhatsApp alterou seus Termos de Uso hoje?', 'A criptografia foi desativada?', 'O que diz o blog oficial da Meta?'],
      sources: ['FAQ Oficial WhatsApp', 'Relatório de Transparência Meta 2026', 'Checagem de Fatos (Lupa/Aos Fatos)'],
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
    content: 'Uma publicação com o selo "UTILIDADE PÚBLICA" no Instagram afirma que o Conselho Nacional de Trânsito (CONTRAN) atualizou o CTB para punir severamente quem dirigir usando chinelos de dedo, rasteirinhas ou tamancos. O post diz: "Cuidado! Nova multa de R$ 293,47 entra em vigor hoje. Agentes de trânsito agora têm ordem para olhar os pés dos motoristas em blitz". A postagem já conta com milhares de curtidas e comentários de indignação contra a "indústria da multa".',
    source: 'Instagram',
    date: formatDate(3),
    status: 'completed',
    completedAt: formatISO(2, 2),
    startTime: formatISO(3, 1),
    priority: 'low',
    assignedTo: 'u2',
    report: '### Análise Jurídica e Legislativa de Trânsito\n\n**A Checagem do Diário Oficial:** Não houve qualquer atualização recente no CTB (Código de Trânsito Brasileiro) sobre este tema na última semana.\n\n**Ouvimos o Especialista:**\n> "Essa é uma confusão jurídica recorrente. O Artigo 252 do CTB já proíbe, desde 1997, o uso de calçado que não se firme nos pés ou que comprometa o uso dos pedais. Não existe \'nova lei\', mas sim uma interpretação sensacionalista de uma regra que sempre existiu", esclarece Dr. Jorge Amado, consultor jurídico de trânsito.\n\n**Conclusão Pedagógica:** A notícia é classificada como FALSA no que tange à "novidade" da lei. O objetivo do post parece ser puramente o ganho de engajamento através do compartilhamento por medo.',
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
    content: 'Um vídeo impressionante de 15 segundos mostrando uma imensa bola de fogo azulada rasgando o céu noturno em Belo Horizonte viralizou no X (Twitter). A legenda diz: "GENTE O QUE FOI ISSO? Acabou de cair um meteoro no bairro Belvedere em BH! Fim do mundo?". No vídeo, é possível ver o reflexo da luz nos prédios e ouvir um barulho de explosão sônica. Moradores de cidades vizinhas também relataram ter visto o fenômeno, inflamando a crença de que o evento foi real.',
    source: 'X/Twitter',
    date: formatDate(2),
    status: 'completed',
    completedAt: formatISO(1, 1),
    startTime: formatISO(2, 10),
    priority: 'low',
    assignedTo: 'u2',
    report: '### Verificação de Fenômeno Astronômico e Vídeo\n\n**Análise de Imagem:** Submetemos o vídeo ao plugin InVID de análise forense. \n\n**Resultados:**\n1. **Busca Reversa:** Os frames do vídeo coincidem 100% com o trailer internacional do filme de ficção científica "Deep Impact: The Return", lançado na semana passada em um festival de cinema independente.\n2. **Ouvimos a Ciência:**\n> "Nenhum dos nossos sensores de monitoramento de bólidos detectou entrada de massa na atmosfera mineira ontem. O vídeo é claramente CGI, pois a velocidade angular da suposta rocha não condiz com a cinemática de entrada atmosférica", afirma o Prof. Ricardo Neves, do Observatório Astronômico de Minas.\n\n**Conclusão:** O vídeo é ficcional e foi retirado de um contexto cinematográfico para simular um evento real.',
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
    content: 'Uma mensagem "encaminhada com frequência" no Telegram afirma que a Marinha do Brasil detectou um abalo sísmico de 8.2 na escala Richter no Atlântico Sul, próximo à costa paulista. O texto diz: "EVACUEM O LITORAL AGORA! Previsão de ondas de 5 metros atingindo Santos, Guarujá e São Sebastião em menos de 2 horas. Compartilhem para salvar vidas!!". A mensagem acompanha um gráfico de ondas de calor que está sendo confundido com um mapa de propagação de tsunami.',
    source: 'Telegram',
    date: formatDate(1),
    status: 'in_progress',
    startTime: formatISO(0, 5),
    priority: 'high',
    assignedTo: 'u2',
    report: '### Relatório de Emergência - Monitoramento Marítimo\n\n**A Situação:** Às 14h30, começaram a circular cards no Telegram com o título "ALERTA VERMELHO: TSUNAMI NO SUDESTE".\n\n**Verificação Imediata:**\nEntramos em contato com o Centro de Hidrografia da Marinha (CHM). \n> "Não há qualquer registro de evento sismo-tectônico no Atlântico Sul capaz de gerar ondas de translação. O Brasil está em uma região plate-intra, o que torna tsunamis originados por abalos locais tecnicamente nulos nesta escala", afirmou o Comandante Rogério Lima via rádio de patrulha.\n\n**Análise de Pânico:**\nO boato cita uma "falha tectônica na Ilha de Trindade", que na verdade é um vulcão extinto. O objetivo parece ser gerar caos em cidades turísticas durante o feriado, visando prejudicar o comércio local ou apenas realizar um "stress test" de disseminação pela rede viral.',
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
