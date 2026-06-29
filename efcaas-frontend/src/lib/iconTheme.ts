import type { CSSProperties } from 'react';
import type { ThemeConfig } from '../types';

export type IconVariant = 'default' | 'active' | 'muted' | 'accent';

export function iconColor(themeConfig: ThemeConfig, variant: IconVariant = 'default'): string {
  const icons = themeConfig.icons;
  if (!icons) return themeConfig.general.accent;
  switch (variant) {
    case 'active':
      return icons.active;
    case 'muted':
      return icons.muted;
    case 'accent':
      return icons.accent;
    default:
      return icons.default;
  }
}

export function iconStyle(themeConfig: ThemeConfig, variant: IconVariant = 'default'): CSSProperties {
  return { color: iconColor(themeConfig, variant) };
}
