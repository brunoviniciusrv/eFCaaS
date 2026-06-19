import React from 'react';
import { AgencyConfig } from '../types';
import { AI_ENGINE_MODULES, AiModuleKey } from '../config/aiModules';

interface AiEngineModulesPanelProps {
  config: AgencyConfig;
  onChange: (key: AiModuleKey, enabled: boolean) => void;
  compact?: boolean;
}

export const AiEngineModulesPanel: React.FC<AiEngineModulesPanelProps> = ({
  config,
  onChange,
  compact = false,
}) => (
  <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
    {AI_ENGINE_MODULES.map((feat) => {
      const isEnabled = config[feat.id] !== false;
      const Icon = feat.icon;
      return (
        <button
          key={feat.id}
          type="button"
          onClick={() => onChange(feat.id, !isEnabled)}
          className={`w-full p-3 border rounded-2xl flex items-center justify-between text-left transition-all ${
            isEnabled
              ? 'border-emerald-600 bg-emerald-50/20 shadow-xs'
              : 'border-slate-150 hover:border-slate-200 bg-slate-50/20'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isEnabled ? `${feat.color} text-white` : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Icon size={16} />
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-900 block truncate">{feat.label}</span>
              {!compact && (
                <span className="text-[10px] text-slate-500 block truncate max-w-lg md:max-w-md">
                  {feat.desc}
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
              isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 ${
                isEnabled ? 'left-5' : 'left-[3px]'
              }`}
            />
          </div>
        </button>
      );
    })}
  </div>
);
