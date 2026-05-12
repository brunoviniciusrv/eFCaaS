import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Mail, Info, AlertTriangle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, ThemeConfig, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  themeConfig: ThemeConfig;
  currentUser: UserProfile;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  themeConfig,
  currentUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Filter notifications based on user profiles and categories
  const userNotifications = notifications.filter(n => {
    // If targeted to a specific user, only they see it
    if (n.targetUserId) return n.targetUserId === currentUser.id;

    // Checker restriction: only receives specific assignments (handled by targetUserId above)
    // Here we handle the case where they shouldn't see general news/queue notifications
    const isChecker = currentUser.role === 'checker' || currentUser.profileId === 'p-checker';
    if (isChecker) {
      // Checkers only see notifications meant for them personally or clearly assigned to them
      return n.targetUserId === currentUser.id;
    }

    // Admin/Curator/Editor logic
    if (n.targetRole) {
      const roles = Array.isArray(n.targetRole) ? n.targetRole : [n.targetRole];
      // Check both role (legacy) and profileId for transitions
      const userIdMatch = roles.some(r => 
        currentUser.role === r || 
        currentUser.profileId === `p-${r}` ||
        currentUser.profileId === r
      );
      if (userIdMatch) return true;
    }

    // Default to false for non-targeted notifications if we want strict behavior
    // but keep true for general ones if needed. User requirements imply strictness.
    return false;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: Notification) => {
    onMarkAsRead(n.id);
    if (n.link) {
      navigate(n.link);
    }
    setIsOpen(false);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'assignment': return <Mail size={16} className="text-blue-500" />;
      case 'queue': return <Info size={16} className="text-amber-500" />;
      case 'received_news': return <Bell size={16} className="text-purple-500" />;
      default: return <AlertTriangle size={16} className="text-slate-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl border flex items-center justify-center relative hover:bg-slate-50 transition-colors"
        style={{ borderColor: themeConfig.general.border }}
      >
        <Bell size={20} className={unreadCount > 0 ? "text-blue-600" : "opacity-40"} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white animate-in zoom-in">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden"
            style={{ 
              backgroundColor: themeConfig.general.cardBackground, 
              borderColor: themeConfig.general.border 
            }}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
              <h3 className="font-bold text-sm">Notificações</h3>
              <div className="flex gap-2">
                <button 
                  onClick={onClearAll}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-900"
                >
                  Limpar tudo
                </button>
                <button onClick={() => setIsOpen(false)} className="opacity-40 hover:opacity-100">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {userNotifications.length === 0 ? (
                <div className="p-8 text-center opacity-40">
                  <Bell size={32} className="mx-auto mb-2" />
                  <p className="text-sm font-medium">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                  {userNotifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(
                        "p-4 flex gap-3 cursor-pointer transition-colors relative group",
                        !n.isRead ? "bg-slate-50/50" : "hover:bg-slate-50/30"
                      )}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                      )}
                      <div className="mt-1 shrink-0">
                        {getIcon(n.category)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={cn("text-xs font-bold leading-tight", !n.isRead ? "text-slate-900" : "text-slate-600")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] opacity-40 font-medium whitespace-nowrap">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-60 leading-normal line-clamp-2">
                          {n.message}
                        </p>
                        {n.link && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver detalhes <ArrowRight size={10} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {userNotifications.length > 0 && (
              <div className="p-3 border-t text-center" style={{ borderColor: themeConfig.general.border }}>
                <button 
                  className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100"
                  onClick={() => setIsOpen(false)}
                >
                  Fechar Painel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
