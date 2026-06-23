import type { CSSProperties } from 'react';
import { INITIAL_THEME_CONFIG } from '../constants';
import { ThemeConfig } from '../types';

export function normalizeThemeConfig(theme: ThemeConfig): ThemeConfig {
  return {
    ...INITIAL_THEME_CONFIG,
    ...theme,
    dashboard: { ...INITIAL_THEME_CONFIG.dashboard, ...theme.dashboard },
    flow: { ...INITIAL_THEME_CONFIG.flow, ...theme.flow },
    sidebar: { ...INITIAL_THEME_CONFIG.sidebar, ...theme.sidebar },
    header: { ...INITIAL_THEME_CONFIG.header, ...theme.header },
    buttons: { ...INITIAL_THEME_CONFIG.buttons, ...theme.buttons },
    status: { ...INITIAL_THEME_CONFIG.status, ...theme.status },
    general: { ...INITIAL_THEME_CONFIG.general, ...theme.general },
  };
}

export function themeCssVariables(theme: ThemeConfig): CSSProperties {
  return {
    '--efc-muted-bg': theme.general.mutedBackground,
    '--efc-muted-text': theme.general.mutedText,
    '--efc-hover-bg': theme.general.hoverBackground,
    '--efc-card-bg': theme.general.cardBackground,
    '--efc-border': theme.general.border,
    '--efc-accent': theme.general.accent,
    '--efc-text': theme.dashboard.text,
  } as React.CSSProperties;
}
