/**
 * Textos da landing page pública — editar aqui quando definirmos o copy final.
 */

/** Logo oficial da landing */
import landingLogo from '../assets/efcaas-logo.png';

export const LANDING_LOGO_URL = landingLogo;

export const LANDING_BRAND = {
  name: 'eFCaaS',
  tagline: 'Evidence-based Fact-Checking as a Service',
};

export const LANDING_NAV = [
  { id: 'planos', label: 'Planos' },
  { id: 'sobre', label: 'Sobre' },
  { id: 'recursos', label: 'Recursos' },
] as const;

export const LANDING_HERO = {
  eyebrow: 'eFCaaS',
  headline: 'Ferramentas de checagem de fatos com IA para todos',
  subheadline: 'Monitore o debate público. Identifique desinformação. Tome ação.',
  ctaPrimary: 'Acessar plataforma',
  ctaSecondary: 'Saiba mais',
};

export const LANDING_PRICING = {
  title: 'Escolha o plano da sua agência',
  subtitle:
    'Comece gratuitamente ou solicite um ambiente exclusivo. Em ambos os casos, a aprovação é feita pela equipe eFCaaS.',
  dataSharingTitle: 'O que significa compartilhar dados no plano gratuito?',
  dataSharingBullets: [
    'Métricas agregadas e anonimizadas podem alimentar pesquisa e melhorias do ecossistema eFCaaS.',
    'Insights estatísticos podem ser usados em relatórios do programa, sem expor conteúdos editoriais identificáveis.',
    'Sua agência mantém controle operacional; o compartilhamento refere-se a dados para integração e evolução da rede.',
  ],
  plans: {
    free: {
      id: 'FREE' as const,
      name: 'Plano Gratuito',
      badge: 'Ecossistema',
      price: 'R$ 0',
      priceNote: 'para agências de checagem aprovadas',
      description:
        'Ideal para começar com triagem, checagem e redação editorial em um ambiente multi-tenant seguro.',
      highlights: [
        'Uso gratuito após aprovação do cadastro',
        'Dados podem ser compartilhados com o ecossistema eFCaaS (integração, pesquisa e estatísticas)',
        'Onboarding guiado e perfis padrão de equipe',
        'Suporte pela fila de solicitações da plataforma',
      ],
      cta: 'Cadastrar agência',
      termsLabel:
        'Li e aceito que, no plano gratuito, dados agregados podem ser compartilhados com o ecossistema eFCaaS conforme os termos de uso.',
    },
    paid: {
      id: 'PAID' as const,
      name: 'Plano Exclusivo',
      badge: 'Dados privados',
      price: 'Sob consulta',
      description: 'Os dados da sua agência permanecem isolados e exclusivos.',
      highlights: [] as string[],
      cta: 'Solicitar plano exclusivo',
    },
  },
};

export const LANDING_FEATURES = {
  title: 'Amplie o impacto da sua equipe com o eFCaaS',
  items: [
    {
      id: 'triage',
      title: 'Triagem inteligente',
      description:
        'Receba conteúdos de múltiplos canais, priorize demandas e distribua tarefas com curadoria editorial.',
    },
    {
      id: 'verification',
      title: 'Checagem com evidências',
      description:
        'Analise afirmações com apoio de IA, registre fontes e construa pareceres fundamentados em evidências.',
    },
    {
      id: 'editorial',
      title: 'Redação editorial',
      description:
        'Transforme checagens em matérias prontas para revisão, com fluxo colaborativo e acervo editorial.',
    },
  ],
};

export const LANDING_MISSION = {
  title: 'Apoiando checagem, verificação e pesquisa em todo o ecossistema',
  paragraphs: [
    'O eFCaaS reúne triagem, análise e redação em uma plataforma única para agências de fact-checking, veículos de comunicação e equipes de verificação.',
    'Nossa missão é fortalecer o jornalismo baseado em evidências com ferramentas acessíveis, auditáveis e prontas para escalar.',
  ],
  ctaPrimary: 'Acessar plataforma',
  ctaSecondary: 'Como funciona',
};

export const LANDING_FOOTER = {
  copyright: `© ${new Date().getFullYear()} eFCaaS. Todos os direitos reservados.`,
  links: [
    { label: 'Privacidade', href: '#' },
    { label: 'Termos de uso', href: '#' },
  ],
};

/** Imagem de fundo — Unsplash (rede/dados globais), uso livre */
export const LANDING_MISSION_BG =
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80';
