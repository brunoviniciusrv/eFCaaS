import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  FileText,
  Menu,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, View, ThemeConfig, AgencyConfig } from '../types';

interface SidebarProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  // REMOVED currentView and setCurrentView
  setSelectedNewsId: (id: string | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  themeConfig: ThemeConfig;
  agencyConfig: AgencyConfig;
}

export const Sidebar = ({ 
  user, 
  setUser,
  setSelectedNewsId, 
  isSidebarOpen, 
  setIsSidebarOpen,
  themeConfig,
  agencyConfig
}: SidebarProps) => {
  const sidebarWidth = isSidebarOpen ? 260 : 80;

  return (
    <motion.aside 
      animate={{ width: sidebarWidth }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="h-screen border-r flex flex-col z-50 overflow-hidden"
      style={{ 
        backgroundColor: themeConfig.sidebar.background, 
        color: themeConfig.sidebar.text,
        borderColor: themeConfig.sidebar.border
      }}
    >
      <div className="p-4 flex items-center justify-between border-b min-h-[73px]" style={{ borderColor: themeConfig.sidebar.border }}>
        <AnimatePresence mode="wait">
          {isSidebarOpen ? (
            <motion.div 
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
            >
              <Link
                to="/dashboard"
                className="w-10 h-10 min-w-[40px] rounded-xl flex items-center justify-center shadow-lg overflow-hidden"
                style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
              >
                {agencyConfig.logoUrl ? (
                  <img src={agencyConfig.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ShieldCheck size={24} />
                )}
              </Link>
              <span className="font-bold text-lg tracking-tight truncate" style={{ color: themeConfig.sidebar.text }}>
                {agencyConfig.name}
              </span>
            </motion.div>
          ) : (
            <motion.div 
              key="logo-mini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <Link 
                to="/dashboard"
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md overflow-hidden"
                style={{ backgroundColor: themeConfig.general.accent, color: '#fff' }}
              >
                {agencyConfig.logoUrl ? (
                  <img src={agencyConfig.logoUrl} alt="" className="w-full h-full object-cover" />
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
            className="p-1 hover:bg-black/5 rounded-md transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
      </div>

      {!isSidebarOpen && (
        <div className="flex justify-center py-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-black/5 rounded-xl transition-all border border-transparent active:scale-95"
            style={{ color: themeConfig.sidebar.text }}
          >
             <Menu size={24} />
          </button>
        </div>
      )}
      
      <nav className={cn("flex-1 p-3 space-y-2", !isSidebarOpen && "flex flex-col items-center")}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
          { id: 'curator', label: 'Curadoria', icon: Eye, curatorOnly: true, path: '/curator' },
          { id: 'newsroom', label: 'Redação', icon: FileText, editorOnly: true, path: '/newsroom' },
          { id: 'admin', label: 'Administração', icon: ShieldAlert, adminOnly: true, path: '/admin' },
          { id: 'profile', label: 'Meu Perfil', icon: User, path: '/profile' },
        ].map((item) => {
          if (item.adminOnly && user.role !== 'admin') return null;
          if (item.curatorOnly && user.role !== 'curator' && user.role !== 'admin' && user.role !== 'editor') return null;
          if (item.editorOnly && user.role !== 'editor' && user.role !== 'admin') return null;
          
          return (
            <NavLink 
              key={item.id}
              to={item.path}
              onClick={() => { setSelectedNewsId(null); }}
              className={({ isActive }) => cn(
                "w-full flex items-center rounded-xl text-sm font-medium transition-all group relative",
                isSidebarOpen ? "px-4 py-3 gap-3" : "justify-center p-3",
                isActive ? "shadow-sm" : ""
              )}
              style={({ isActive }) => ({ 
                backgroundColor: isActive ? themeConfig.sidebar.activeBackground : 'transparent',
                color: isActive ? themeConfig.sidebar.activeText : themeConfig.sidebar.text
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={cn("shrink-0", !isSidebarOpen && isActive && "scale-110")} />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className={cn("p-3 border-t space-y-2", !isSidebarOpen && "flex flex-col items-center")} style={{ borderColor: themeConfig.sidebar.border }}>
        <NavLink 
          to="/profile"
          className={({ isActive }) => cn(
            "w-full flex items-center rounded-2xl transition-all group relative overflow-hidden",
            isSidebarOpen ? "p-3 gap-3" : "justify-center p-2",
            isActive ? "shadow-sm" : ""
          )}
          style={({ isActive }) => ({ 
            backgroundColor: isActive ? themeConfig.sidebar.activeBackground : 'transparent',
            color: isActive ? themeConfig.sidebar.activeText : themeConfig.sidebar.text
          })}
        >
          <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 min-w-[40px] rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 text-left min-w-0"
              >
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-xs truncate uppercase tracking-wider font-semibold opacity-70">{user.role}</p>
              </motion.div>
            )}
          </AnimatePresence>
          {isSidebarOpen && <Settings size={16} className="opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />}
          {!isSidebarOpen && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50">
              {user.name} ({user.role})
            </div>
          )}
        </NavLink>

        <button
          onClick={() => (window as any).handleAppLogout()}
          className={cn(
            "w-full flex items-center rounded-2xl transition-all group relative overflow-hidden text-red-500 hover:bg-red-50",
            isSidebarOpen ? "p-3 gap-3" : "justify-center p-2"
          )}
        >
          <LogOut size={22} className="shrink-0" />
          {isSidebarOpen && <span className="text-sm font-bold">Encerrar Sessão</span>}
          {!isSidebarOpen && (
            <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-[10px] rounded opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap z-50">
              Sair
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
