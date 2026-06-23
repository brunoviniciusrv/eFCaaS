import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { NewsStatus } from '../types';
import { ThemeConfig } from '../types';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: NewsStatus;
  themeConfig?: ThemeConfig;
}

export const StatusBadge = ({ status, themeConfig }: StatusBadgeProps) => {
  const configs = {
    pending: { color: themeConfig?.status.info || '#3b82f6', icon: Clock, label: 'Pendente' },
    in_progress: { color: themeConfig?.status.warning || '#eab308', icon: AlertCircle, label: 'Em Análise' },
    completed: { color: themeConfig?.status.success || '#22c55e', icon: CheckCircle, label: 'Concluída' },
    to_rectify: { color: themeConfig?.status.error || '#ef4444', icon: AlertCircle, label: 'Retificar' },
    final_review: { color: '#8b5cf6', icon: CheckCircle, label: 'Revisão Final' },
  };
  
  const config = configs[status] || { color: '#94a3b8', icon: AlertCircle, label: status };
  const { color, icon: Icon, label } = config;
  return (
    <span 
      className={styles.badge}
      style={{ 
        backgroundColor: `${color}15`, 
        color: color,
        borderColor: `${color}30`
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  );
};
