import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  ShieldCheck,
  ShieldAlert,
  Eye,
  FileText,
  Menu,
  LogOut,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { iconStyle } from '../lib/iconTheme';
import { UserProfile, ThemeConfig, AgencyConfig } from '../types';
import { UserAvatar } from './UserAvatar';
import styles from './Sidebar.module.css';

interface SidebarProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  setSelectedNewsId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  themeConfig: ThemeConfig;
  agencyConfig: AgencyConfig;
  checkPermission: (permId: string) => boolean;
  onLogout: () => void;
}

export const Sidebar = ({ 
  user, 
  setUser,
  setSelectedNewsId, 
  isSidebarOpen, 
  setIsSidebarOpen,
  themeConfig,
  agencyConfig,
  checkPermission,
  onLogout,
}: SidebarProps) => {
  const sidebarWidth = isSidebarOpen ? 260 : 80;

  return (
    <motion.aside 
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={styles.sidebar}
      style={{ 
        backgroundColor: themeConfig.sidebar.background, 
        color: themeConfig.sidebar.text,
        borderColor: themeConfig.sidebar.border
      }}
    >
      <div className={styles.topBar} style={{ borderColor: themeConfig.sidebar.border }}>
        <AnimatePresence mode="wait">
          {isSidebarOpen ? (
            <motion.div 
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={styles.logoFull}
            >
              <Link
                to="/dashboard"
                className={agencyConfig.logoUrl ? styles.logoLinkPlain : styles.logoLink}
                style={agencyConfig.logoUrl ? undefined : { backgroundColor: themeConfig.general.accent, color: '#fff' }}
              >
                {agencyConfig.logoUrl ? (
                  <img src={agencyConfig.logoUrl} alt="" className={styles.logoImgPlain} />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </Link>
              <span className={styles.agencyName} style={{ color: themeConfig.sidebar.text }}>
                {agencyConfig.name}
              </span>
            </motion.div>
          ) : (
            <motion.div 
              key="logo-mini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.logoMiniWrap}
            >
              <Link 
                to="/dashboard"
                className={agencyConfig.logoUrl ? styles.logoLinkPlain : styles.logoLinkMini}
                style={agencyConfig.logoUrl ? undefined : { backgroundColor: themeConfig.general.accent, color: '#fff' }}
              >
                {agencyConfig.logoUrl ? (
                  <img src={agencyConfig.logoUrl} alt="" className={styles.logoImgPlain} />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className={styles.collapseBtn}
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {!isSidebarOpen && (
        <div className={styles.expandWrap}>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className={styles.expandBtn}
            style={{ color: themeConfig.sidebar.text }}
          >
             <Menu size={24} />
          </button>
        </div>
      )}
      
      <nav className={isSidebarOpen ? styles.nav : styles.navCollapsed}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'view_dashboard' },
          { id: 'curator', label: 'Curadoria', icon: Eye, path: '/curator', permission: 'view_curator' },
          { id: 'archive', label: 'Acervo Editorial', icon: FileText, path: '/editorial-archive', permission: 'view_archive' },
          { id: 'admin', label: 'Administração', icon: ShieldAlert, path: '/admin', permission: 'view_admin' },
          { id: 'profile', label: 'Meu Perfil', icon: User, path: '/profile' },
        ].map((item) => {
          if (item.permission && !checkPermission(item.permission)) return null;
          
          return (
            <NavLink 
              key={item.id}
              to={item.path}
              onClick={() => { setSelectedNewsId(null); }}
              className={({ isActive }) => cn(
                styles.navLink,
                isSidebarOpen ? styles.navLinkOpen : styles.navLinkClosed,
                isActive ? styles.navLinkActive : ''
              )}
              style={({ isActive }) => ({ 
                backgroundColor: isActive ? themeConfig.sidebar.activeBackground : 'transparent',
                color: isActive ? themeConfig.sidebar.activeText : themeConfig.sidebar.text
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={22}
                    className={!isSidebarOpen && isActive ? styles.navIconActive : styles.navIcon}
                    style={isActive ? undefined : iconStyle(themeConfig, 'muted')}
                  />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className={styles.navLabel}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isSidebarOpen && (
                    <div className={styles.tooltip}>
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={isSidebarOpen ? styles.footer : styles.footerCollapsed} style={{ borderColor: themeConfig.sidebar.border }}>
        <NavLink 
          to="/profile"
          className={({ isActive }) => cn(
            styles.profileLink,
            isSidebarOpen ? styles.profileLinkOpen : styles.profileLinkClosed,
            isActive ? styles.profileLinkActive : ''
          )}
          style={({ isActive }) => ({ 
            backgroundColor: isActive ? themeConfig.sidebar.activeBackground : 'transparent',
            color: isActive ? themeConfig.sidebar.activeText : themeConfig.sidebar.text
          })}
        >
          <UserAvatar src={user.avatarUrl} name={user.name} className={styles.avatarImg} />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={styles.userInfo}
              >
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.userRole}>{user.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {isSidebarOpen && <Settings size={16} className={styles.settingsIcon} />}
          {!isSidebarOpen && (
            <div className={styles.tooltip}>
              {user.name} ({user.role})
            </div>
          )}
        </NavLink>

        <button
          onClick={onLogout}
          className={cn(
            styles.logoutBtn,
            isSidebarOpen ? styles.logoutBtnOpen : styles.logoutBtnClosed
          )}
        >
          <LogOut size={22} className="shrink-0" />
          {isSidebarOpen && <span className={styles.logoutLabel}>Encerrar Sessão</span>}
          {!isSidebarOpen && (
            <div className={styles.logoutTooltip}>
              Sair
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
