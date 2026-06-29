/**
 * Identidade visual fixa do Control Plane eFCaaS.
 * Não deve ser alterada por configurações de tenants.
 */
import { LANDING_BRAND, LANDING_LOGO_URL } from '../content/landingContent';
import { INITIAL_THEME_CONFIG } from '../constants';
import { ThemeConfig } from '../types';

/** Cor de destaque oficial da plataforma eFCaaS */
export const PLATFORM_ACCENT = '#2563eb';

export const PLATFORM_BRAND = {
  name: LANDING_BRAND.name,
  tagline: LANDING_BRAND.tagline,
  logoUrl: LANDING_LOGO_URL,
};

/** Tema visual exclusivo da plataforma (login, landing, cadastro, painel platform). */
export const PLATFORM_THEME: ThemeConfig = {
  ...INITIAL_THEME_CONFIG,
  sidebar: {
    background: '#0f172a',
    text: '#94a3b8',
    activeBackground: '#1e293b',
    activeText: '#ffffff',
    border: '#1e293b',
  },
  general: {
    ...INITIAL_THEME_CONFIG.general,
    accent: PLATFORM_ACCENT,
  },
  buttons: {
    ...INITIAL_THEME_CONFIG.buttons,
    primary: PLATFORM_ACCENT,
  },
};
