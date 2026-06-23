import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, ArrowRight, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, ThemeConfig, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationBell.module.css';

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

  const userNotifications = notifications.filter(n => {
    if (n.targetUserId) return n.targetUserId === currentUser.id;

    const isChecker = currentUser.role === 'checker' || currentUser.profileId === 'p-checker';
    if (isChecker) {
      return n.targetUserId === currentUser.id;
    }

    if (n.targetRole) {
      const roles = Array.isArray(n.targetRole) ? n.targetRole : [n.targetRole];
      const userIdMatch = roles.some(r => 
        currentUser.role === r || 
        currentUser.profileId === `p-${r}` ||
        currentUser.profileId === r
      );
      if (userIdMatch) return true;
    }

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
    <div className={styles.wrapper} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.bellBtn}
        style={{ borderColor: themeConfig.general.border }}
      >
        <Bell size={20} className={unreadCount > 0 ? styles.bellIconActive : styles.bellIconInactive} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
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
            className={styles.dropdown}
            style={{ 
              backgroundColor: themeConfig.general.cardBackground, 
              borderColor: themeConfig.general.border 
            }}
          >
            <div className={styles.dropdownHeader} style={{ borderColor: themeConfig.general.border }}>
              <h3 className={styles.dropdownTitle}>Notificações</h3>
              <div className={styles.dropdownActions}>
                <button 
                  onClick={onClearAll}
                  className={styles.clearBtn}
                >
                  Limpar tudo
                </button>
                <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={styles.list}>
              {userNotifications.length === 0 ? (
                <div className={styles.emptyState}>
                  <Bell size={32} className="mx-auto mb-2" />
                  <p className={styles.emptyStateText}>Nenhuma notificação</p>
                </div>
              ) : (
                <div className={styles.divider} style={{ borderColor: themeConfig.general.border }}>
                  {userNotifications.map(n => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={cn(styles.notifItem, !n.isRead ? styles.notifItemUnread : styles.notifItemRead)}
                    >
                      {!n.isRead && <div className={styles.unreadBar} />}
                      <div className={styles.iconWrap}>
                        {getIcon(n.category)}
                      </div>
                      <div className={styles.notifBody}>
                        <div className={styles.notifMeta}>
                          <p className={!n.isRead ? styles.notifTitleUnread : styles.notifTitleRead}>
                            {n.title}
                          </p>
                          <span className={styles.notifTime}>
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={styles.notifMessage}>
                          {n.message}
                        </p>
                        {n.link && (
                          <div className={styles.notifLink}>
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
              <div className={styles.footer} style={{ borderColor: themeConfig.general.border }}>
                <button 
                  className={styles.footerBtn}
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
