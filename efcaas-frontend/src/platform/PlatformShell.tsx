/**
 * Shell do Control Plane — layout isolado das instâncias de agência.
 */
import React from 'react';
import { UserProfile } from '../types';
import { PLATFORM_THEME } from './platformBranding';
import { themeCssVariables } from '../lib/themeUtils';
import { PlatformSidebar } from './PlatformSidebar';

interface PlatformShellProps {
  user: UserProfile;
  onLogout: () => void;
  children: React.ReactNode;
}

export function PlatformShell({ user, onLogout, children }: PlatformShellProps) {
  const theme = PLATFORM_THEME;

  return (
    <div
      className="flex h-screen font-sans overflow-hidden"
      style={{
        backgroundColor: theme.dashboard.background,
        color: theme.dashboard.text,
        fontFamily: theme.fontFamily,
        ...themeCssVariables(theme),
      }}
    >
      <PlatformSidebar user={user} onLogout={onLogout} />
      <main className="flex-1 relative overflow-y-auto">{children}</main>
    </div>
  );
}
