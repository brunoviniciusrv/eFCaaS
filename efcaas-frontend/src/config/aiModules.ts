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
  icon: LucideIcon;
  color: string;
}

export const AI_ENGINE_MODULES: AiEngineModule[] = [
  {
    id: 'enableAI',
    label: 'I.A Generativa para Textos',
    icon: Sparkles,
    color: 'bg-blue-500',
  },
  {
    id: 'enableSocialSearch',
    label: 'Extrator e Busca em Redes',
    icon: Search,
    color: 'bg-sky-500',
  },
  {
    id: 'enableTrendAnalyzer',
    label: 'Analisador de Desinformações',
    icon: Zap,
    color: 'bg-amber-500',
  },
  {
    id: 'enableMisinfoRisk',
    label: 'Risco de Ilicitude',
    icon: AlertTriangle,
    color: 'bg-rose-500',
  },
  {
    id: 'enableSpecializedNetwork',
    label: 'Conexão com Rede de Checadores',
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

/** Indicadores de desinformação (triagem, pré-visualização, métricas IA). */
export function isDesinfoMetricsEnabled(config: AgencyConfig): boolean {
  return isAiModuleEnabled(config, 'enableTrendAnalyzer');
}

export function isSocialExtractionPlatform(platformId: string): platformId is SocialExtractionPlatform {
  return (SOCIAL_EXTRACTION_PLATFORMS as readonly string[]).includes(platformId);
}
