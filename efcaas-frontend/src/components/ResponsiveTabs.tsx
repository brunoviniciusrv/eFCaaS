import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';
import styles from './ResponsiveTabs.module.css';

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  permission?: string | string[];
}

interface ResponsiveTabsProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  tabs: Tab[];
  themeConfig: any;
  className?: string;
  buttonClassName?: string;
  activeButtonClassName?: string;
  inactiveButtonClassName?: string;
}

export function ResponsiveTabs({ 
  activeTab, 
  setActiveTab, 
  tabs, 
  themeConfig,
  className,
  buttonClassName,
  activeButtonClassName,
  inactiveButtonClassName
}: ResponsiveTabsProps) {
  return (
    <div className={cn(styles.wrapper, className)}>
      {/* Mobile Dropdown */}
      <div className={styles.mobileWrapper}>
        <select 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
          className={styles.mobileSelect}
          style={{ 
            backgroundColor: themeConfig?.general?.cardBackground || 'white', 
            borderColor: themeConfig?.general?.border || '#e2e8f0',
            color: themeConfig?.sidebar?.text || '#1e293b',
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: `right 0.5rem center`,
            backgroundRepeat: `no-repeat`,
            backgroundSize: `1.5em 1.5em`,
            paddingRight: `2.5rem`
          }}
        >
          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>{tab.label}</option>
          ))}
        </select>
      </div>
      
      {/* Desktop Tabs */}
      <div 
        className={styles.desktopWrapper}
        style={{ 
          backgroundColor: themeConfig?.general?.cardBackground || 'white', 
          borderColor: themeConfig?.general?.border || '#e2e8f0' 
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              buttonClassName || styles.tabBtn,
              activeTab === tab.id 
                ? (activeButtonClassName || styles.tabBtnActive)
                : (inactiveButtonClassName || styles.tabBtnInactive)
            )}
            style={{ 
              backgroundColor: activeTab === tab.id ? (themeConfig?.sidebar?.activeBackground || '#f1f5f9') : 'transparent',
              color: activeTab === tab.id ? (themeConfig?.sidebar?.activeText || '#0f172a') : (themeConfig?.sidebar?.text || '#475569')
            }}
          >
            {tab.icon && <tab.icon size={16} />}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
