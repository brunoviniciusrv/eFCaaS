import { ThemeConfig } from '../types';

export type ThemePresetMode = 'light' | 'dark';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  mode: ThemePresetMode;
  colors: {
    accent: string;
    background: string;
    sidebar: string;
  };
}

/** Paleta escura neutra — fundo próximo ao preto, sem viés azul */
const DARK_PALETTE = {
  background: '#0a0a0a',
  sidebar: '#111111',
  card: '#171717',
  border: '#404040',
  text: '#fafafa',
  textMuted: '#a3a3a3',
  mutedBg: '#262626',
  mutedText: '#fafafa',
  hoverBg: '#333333',
  accent: '#e5e5e5',
  primary: '#fafafa',
  primaryText: '#0a0a0a',
};

const LEGACY_DARK_IDS = ['modern-blue-dark', 'emerald-clean-dark', 'royal-purple-dark'];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Profissional e confiável.',
    mode: 'light',
    colors: { accent: '#2563eb', background: '#f8fafc', sidebar: '#ffffff' },
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Clean',
    description: 'Suave e contemporâneo.',
    mode: 'light',
    colors: { accent: '#059669', background: '#f0fdf4', sidebar: '#ffffff' },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Inovador e arrojado.',
    mode: 'light',
    colors: { accent: '#7c3aed', background: '#f5f3ff', sidebar: '#ffffff' },
  },
  {
    id: 'dark',
    name: 'Modo Escuro',
    description: 'Fundo escuro neutro com alto contraste.',
    mode: 'dark',
    colors: {
      accent: DARK_PALETTE.accent,
      background: DARK_PALETTE.background,
      sidebar: DARK_PALETTE.sidebar,
    },
  },
];

function applyLightPreset(prev: ThemeConfig, preset: ThemePreset): ThemeConfig {
  const { accent, background, sidebar } = preset.colors;

  return {
    ...prev,
    dashboard: {
      ...prev.dashboard,
      background,
      text: '#0f172a',
      chartColors: [accent, '#10b981', '#f97316', '#94a3b8'],
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
      background: sidebar,
      text: '#64748b',
      activeBackground: '#eff6ff',
      activeText: accent,
      border: '#e2e8f0',
    },
    header: {
      background: '#ffffff',
      text: '#0f172a',
      border: '#e2e8f0',
    },
    buttons: {
      primary: accent,
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
      accent,
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
      mutedBackground: '#f1f5f9',
      mutedText: '#334155',
      hoverBackground: '#e2e8f0',
    },
  };
}

function applyDarkPreset(prev: ThemeConfig): ThemeConfig {
  const {
    background,
    sidebar,
    card,
    border,
    text,
    textMuted,
    mutedBg,
    mutedText,
    hoverBg,
    accent,
    primary,
    primaryText,
  } = DARK_PALETTE;

  return {
    ...prev,
    dashboard: {
      ...prev.dashboard,
      background,
      text,
      chartColors: ['#fafafa', '#4ade80', '#fb923c', '#737373'],
    },
    flow: {
      background: card,
      text,
      blockPending: '#262626',
      blockInProgress: '#333333',
      blockCompleted: '#1f2e1f',
      blockRectify: '#2e1f1f',
      blockFinalReview: '#1f1f2e',
    },
    sidebar: {
      background: sidebar,
      text: textMuted,
      activeBackground: '#262626',
      activeText: text,
      border,
    },
    header: {
      background: card,
      text,
      border,
    },
    buttons: {
      primary,
      primaryText,
      secondary: '#404040',
      secondaryText: '#fafafa',
      danger: '#dc2626',
      dangerText: '#ffffff',
    },
    status: {
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#d4d4d4',
    },
    general: {
      border,
      cardBackground: card,
      accent,
      inputBackground: background,
      inputText: text,
      inputBorder: border,
      inputPlaceholder: textMuted,
      modalOverlay: 'rgba(0, 0, 0, 0.8)',
      modalBackground: card,
      modalText: text,
      tableHeaderBackground: background,
      tableHeaderText: textMuted,
      tableRowHover: hoverBg,
      mutedBackground: mutedBg,
      mutedText,
      hoverBackground: hoverBg,
    },
  };
}

export function applyThemePreset(prev: ThemeConfig, preset: ThemePreset): ThemeConfig {
  return preset.mode === 'dark'
    ? applyDarkPreset(prev)
    : applyLightPreset(prev, preset);
}

export function findThemePresetById(id: string | undefined): ThemePreset | undefined {
  if (!id) return undefined;
  const resolvedId = LEGACY_DARK_IDS.includes(id) ? 'dark' : id;
  return THEME_PRESETS.find((p) => p.id === resolvedId);
}

export function resolveThemeTemplateId(id: string | undefined): string | undefined {
  if (!id) return id;
  return LEGACY_DARK_IDS.includes(id) ? 'dark' : id;
}
