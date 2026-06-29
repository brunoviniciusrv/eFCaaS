import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserProfile, ThemeConfig } from '../types';
import styles from './CheckerAssign.module.css';
import { cn } from '../lib/utils';
import { UserAvatar } from './UserAvatar';

interface CheckerNameAutocompleteProps {
  checkers: UserProfile[];
  excludeIds?: string[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (checker: UserProfile) => void;
  placeholder?: string;
  themeConfig: ThemeConfig;
  disabled?: boolean;
}

export const CheckerNameAutocomplete = ({
  checkers,
  excludeIds = [],
  value,
  onChange,
  onSelect,
  placeholder = 'Digite o nome do checador...',
  themeConfig,
  disabled,
}: CheckerNameAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ignoreNextEmptyRef = useRef(false);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return checkers
      .filter((c) => !excludeIds.includes(c.id))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [checkers, excludeIds, value]);

  const hasQuery = value.trim().length > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [value, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pick = (checker: UserProfile) => {
    ignoreNextEmptyRef.current = true;
    onSelect(checker);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasQuery) return;
    if (!open && e.key === 'ArrowDown') {
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className={styles.autocompleteWrap} ref={wrapRef}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          if (!next.trim() && ignoreNextEmptyRef.current) {
            ignoreNextEmptyRef.current = false;
            return;
          }
          ignoreNextEmptyRef.current = false;
          onChange(next);
          setOpen(next.trim().length > 0);
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={styles.input}
        style={{
          backgroundColor: themeConfig.general.inputBackground,
          borderColor: themeConfig.general.inputBorder,
          color: themeConfig.general.inputText,
          '--tw-ring-color': themeConfig.general.accent,
        } as React.CSSProperties}
        autoComplete="off"
      />
      {open && hasQuery && !disabled && (
        <div
          className={styles.suggestions}
          style={{
            backgroundColor: themeConfig.general.cardBackground,
            borderColor: themeConfig.general.border,
          }}
        >
          {suggestions.length === 0 ? (
            <div className={styles.emptySuggestions} style={{ color: themeConfig.general.mutedText }}>
              Nenhum checador encontrado
            </div>
          ) : (
            suggestions.map((checker, index) => (
              <button
                key={checker.id}
                type="button"
                className={cn(
                  styles.suggestionItem,
                  index === activeIndex && styles.suggestionItemActive,
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(checker);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <UserAvatar src={checker.avatarUrl} name={checker.name} className={styles.suggestionAvatar} />
                <div>
                  <div className={styles.suggestionName} style={{ color: themeConfig.dashboard.text }}>
                    {checker.name}
                  </div>
                  <div className={styles.suggestionMeta} style={{ color: themeConfig.general.mutedText }}>
                    {checker.email}
                    {checker.activeTasksCount != null ? ` · ${checker.activeTasksCount} tarefas` : ''}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
