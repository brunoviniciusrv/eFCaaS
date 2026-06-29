import React from 'react';
import { AgencyConfig } from '../types';
import { AI_ENGINE_MODULES, AiModuleKey } from '../config/aiModules';
import { cn } from '../lib/utils';
import styles from './AiEngineModulesPanel.module.css';

interface AiEngineModulesPanelProps {
  config: AgencyConfig;
  onChange: (key: AiModuleKey, enabled: boolean) => void;
}

export const AiEngineModulesPanel: React.FC<AiEngineModulesPanelProps> = ({
  config,
  onChange,
}) => (
  <div className={styles.listDefault}>
    {AI_ENGINE_MODULES.map((feat) => {
      const isEnabled = config[feat.id] !== false;
      const Icon = feat.icon;
      return (
        <button
          key={feat.id}
          type="button"
          onClick={() => onChange(feat.id, !isEnabled)}
          className={cn(styles.moduleBtn, isEnabled ? styles.moduleBtnEnabled : styles.moduleBtnDisabled)}
        >
          <div className={styles.labelWrap}>
            <div className={cn(styles.iconWrap, isEnabled ? `${feat.color} ${styles.iconEnabled}` : styles.iconDisabled)}>
              <Icon size={16} />
            </div>
            <div className={styles.textWrap}>
              <span className={styles.moduleLabel}>{feat.label}</span>
            </div>
          </div>
          <div className={cn(styles.toggle, isEnabled ? styles.toggleEnabled : styles.toggleDisabled)}>
            <div className={cn(styles.toggleKnob, isEnabled ? styles.toggleKnobEnabled : styles.toggleKnobDisabled)} />
          </div>
        </button>
      );
    })}
  </div>
);
