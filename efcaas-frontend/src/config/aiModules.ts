import {
  AlertTriangle,
  Globe,
  LucideIcon,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AgencyConfig } from '../types';

export const SOCIAL_EXTRACTION_PLATFORMS = ['youtube', 'reddit', 'facebook', 'telegram'] as const;
export type SocialExtractionPlatform = (typeof SOCIAL_EXTRACTION_PLATFORMS)[number];

export type AiModuleKey =
  | 'enableAI'
  | 'enableSocialSearch'
  | 'enableTrendAnalyzer'
  | 'enableMisinfoRisk'
  | 'enableSpecializedNetwork';

export interface AiEngineModule {
  id: AiModuleKey;
  label: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

export const AI_ENGINE_MODULES: AiEngineModule[] = [
  {
    id: 'enableAI',
    label: 'Copiloto de IA Generativa',
    desc: 'Sugerir resumos automáticos e triar de forma proativa as investigações de fake news.',
    icon: Sparkles,
    color: 'bg-blue-500',
  },
  {
    id: 'enableSocialSearch',
    label: 'Monitor de Redes Sociais',
    desc: 'Varrer tendências virais e palavras chaves suspeitas em contas do X, Facebook e WhatsApp.',
    icon: Search,
    color: 'bg-sky-500',
  },
  {
    id: 'enableTrendAnalyzer',
    label: 'Analisador de Desinformações',
    desc: 'Cruzamentos estatísticos automáticos com bancos de falsidade conhecidos.',
    icon: Zap,
    color: 'bg-amber-500',
  },
  {
    id: 'enableMisinfoRisk',
    label: 'Classificação de Risco de Engajamento',
    desc: 'Cálculo de propagação tóxica de posts em canais abertos.',
    icon: AlertTriangle,
    color: 'bg-rose-500',
  },
  {
    id: 'enableSpecializedNetwork',
    label: 'Conexão de Rede Global de Checadores',
    desc: 'Ativar alertas urgentes para moderadores de terceiras agências parceiras.',
    icon: Globe,
    color: 'bg-indigo-500',
  },
];

/** Módulo ativo por padrão quando a chave não existe no config salvo. */
export function isAiModuleEnabled(
  config: AgencyConfig,
  key: AiModuleKey
): boolean {
  return config[key] !== false;
}

export function isSocialExtractionPlatform(platformId: string): platformId is SocialExtractionPlatform {
  return (SOCIAL_EXTRACTION_PLATFORMS as readonly string[]).includes(platformId);
}
