/**
 * Navegação exclusiva do Control Plane eFCaaS — sem itens de instância de agência.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Globe2, LogOut, Shield } from 'lucide-react';
import { UserProfile } from '../types';
import { PLATFORM_BRAND, PLATFORM_THEME } from './platformBranding';
import styles from './PlatformSidebar.module.css';

interface PlatformSidebarProps {
  user: UserProfile;
  onLogout: () => void;
}

export function PlatformSidebar({ user, onLogout }: PlatformSidebarProps) {
  const theme = PLATFORM_THEME;

  return (
    <aside
      className={styles.sidebar}
      style={{
        backgroundColor: theme.sidebar.background,
        color: theme.sidebar.text,
        borderColor: theme.sidebar.border,
      }}
    >
      <div className={styles.header} style={{ borderColor: theme.sidebar.border }}>
        <img src={PLATFORM_BRAND.logoUrl} alt={PLATFORM_BRAND.name} className={styles.logo} />
        <div>
          <p className={styles.brandName}>{PLATFORM_BRAND.name}</p>
          <p className={styles.brandSub}>Painel de Controle</p>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavLink
          to="/platform"
          className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          style={({ isActive }) => ({
            backgroundColor: isActive ? theme.sidebar.activeBackground : 'transparent',
            color: isActive ? theme.sidebar.activeText : theme.sidebar.text,
          })}
        >
          <Globe2 size={20} />
          <span>Gestão de Agências</span>
        </NavLink>
      </nav>

      <div className={styles.footer} style={{ borderColor: theme.sidebar.border }}>
        <div className={styles.userRow}>
          <Shield size={16} style={{ color: theme.general.accent }} />
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user.name || 'Gestor da Plataforma'}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>
        </div>
        <button type="button" onClick={onLogout} className={styles.logoutBtn}>
          <LogOut size={16} />
          Sair
        </button>
      </div>
    </aside>
  );
}
