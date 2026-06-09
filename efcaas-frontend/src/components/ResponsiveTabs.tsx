import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

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
    <div className={cn("flex flex-col gap-2 mb-6 sm:mb-0 w-full sm:w-fit", className)}>
      {/* Mobile Dropdown */}
      <div className="sm:hidden w-full">
        <select 
          value={activeTab} 
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full p-3 rounded-2xl border outline-none font-bold text-sm appearance-none"
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
        className="hidden sm:flex p-1 rounded-2xl border w-fit overflow-x-auto hide-scrollbar" 
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
              buttonClassName || "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? (activeButtonClassName || "shadow-sm") 
                : (inactiveButtonClassName || "opacity-40 hover:opacity-100")
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
