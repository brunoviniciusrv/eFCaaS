import React, { useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { motion } from 'motion/react';
import { X, UserPlus } from 'lucide-react';
import { NewsItem, ThemeConfig, UserProfile } from '../types';
import { CheckerNameAutocomplete } from './CheckerNameAutocomplete';
import { UserAvatar } from './UserAvatar';
import { resolveCheckerFromQuery } from '../lib/newsAssignment';
import styles from './CheckerAssign.module.css';

interface NewsAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  newsItem: NewsItem | null;
  bulkNewsIds?: string[];
  users: UserProfile[];
  checkers: UserProfile[];
  themeConfig: ThemeConfig;
  onAssign: (newsId: string, checkerId: string, briefing: string) => Promise<void>;
  onUnassign: (newsId: string, checkerId: string) => Promise<void>;
  canManage: boolean;
}

export const NewsAssignmentModal = ({
  open,
  onClose,
  newsItem,
  bulkNewsIds = [],
  users,
  checkers,
  themeConfig,
  onAssign,
  onUnassign,
  canManage,
}: NewsAssignmentModalProps) => {
  const [query, setQuery] = useState('');
  const [briefing, setBriefing] = useState('');
  const [pendingCheckerId, setPendingCheckerId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const lastPickAtRef = useRef(0);

  const isBulk = !newsItem && bulkNewsIds.length > 0;
  const targetIds = newsItem ? [newsItem.id] : bulkNewsIds;

  const assigneeIds = useMemo(() => {
    if (!newsItem) return [];
    return newsItem.assignedToIds?.length
      ? newsItem.assignedToIds
      : newsItem.assignedTo
        ? [newsItem.assignedTo]
        : [];
  }, [newsItem]);

  const assignedUsers = useMemo(
    () => assigneeIds
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is UserProfile => Boolean(u)),
    [assigneeIds, users],
  );

  const resolvedCheckerId = useMemo(
    () => pendingCheckerId ?? resolveCheckerFromQuery(query, checkers, newsItem ? assigneeIds : []),
    [pendingCheckerId, query, checkers, newsItem, assigneeIds],
  );

  const resetForm = () => {
    setQuery('');
    setBriefing('');
    setPendingCheckerId(null);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectChecker = (checker: UserProfile) => {
    lastPickAtRef.current = Date.now();
    flushSync(() => {
      setPendingCheckerId(String(checker.id));
      setQuery(checker.name);
    });
  };

  const handleConfirmAssign = async () => {
    const checkerId = resolvedCheckerId;
    if (!checkerId || loading || targetIds.length === 0) {
      if (!checkerId && query.trim()) {
        setError('Selecione um checador na lista ou digite o nome completo.');
      }
      return;
    }
    setLoading(true);
    setError('');
    try {
      await Promise.all(
        targetIds.map((id) => onAssign(id, checkerId, briefing.trim())),
      );
      resetForm();
      if (isBulk) handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atribuir.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (checkerId: string) => {
    if (!newsItem || loading) return;
    setRemovingId(checkerId);
    setError('');
    try {
      await onUnassign(newsItem.id, checkerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível remover a atribuição.');
    } finally {
      setRemovingId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0"
        style={{ backgroundColor: themeConfig.general.modalOverlay }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: themeConfig.general.modalBackground, color: themeConfig.general.modalText }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: themeConfig.general.border }}>
          <h2 className="text-lg font-bold">Atribuição de Checadores</h2>
          <p className="text-sm opacity-70 mt-1">
            {newsItem
              ? newsItem.title
              : `Adicionar checador em ${bulkNewsIds.length} publicações selecionadas`}
          </p>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {newsItem && (
            <div>
              <p className={styles.sectionTitle}>Atribuídos atualmente</p>
              {assignedUsers.length === 0 ? (
                <div
                  className={styles.emptyAssignees}
                  style={{ borderColor: themeConfig.general.border, color: themeConfig.general.mutedText }}
                >
                  Nenhum checador atribuído
                </div>
              ) : (
                <div className={styles.assigneeList}>
                  {assignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className={styles.assigneeItem}
                      style={{ borderColor: themeConfig.general.border, backgroundColor: `${themeConfig.dashboard.background}20` }}
                    >
                      <div className={styles.assigneeLeft}>
                        <UserAvatar src={user.avatarUrl} name={user.name} className={styles.assigneeAvatar} />
                        <span className={styles.assigneeName} style={{ color: themeConfig.dashboard.text }}>
                          {user.name}
                        </span>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => handleRemove(user.id)}
                          disabled={removingId === user.id || loading}
                          title="Remover atribuição"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {canManage && (
            <div>
              <p className={styles.sectionTitle}>
                {newsItem ? 'Nova atribuição' : 'Selecionar checador'}
              </p>
              <CheckerNameAutocomplete
                checkers={checkers}
                excludeIds={newsItem ? assigneeIds : []}
                value={query}
                onChange={(v) => {
                  if (!v.trim()) {
                    if (Date.now() - lastPickAtRef.current < 150) return;
                    setQuery('');
                    setPendingCheckerId(null);
                    return;
                  }
                  setQuery(v);
                  const exact = checkers.find(
                    (c) =>
                      c.name.toLowerCase() === v.trim().toLowerCase() ||
                      c.email?.toLowerCase() === v.trim().toLowerCase(),
                  );
                  if (exact && !(newsItem ? assigneeIds : []).includes(exact.id)) {
                    setPendingCheckerId(String(exact.id));
                    return;
                  }
                  setPendingCheckerId((prev) => {
                    if (!prev) return null;
                    const selected = checkers.find((c) => c.id === prev);
                    return selected && selected.name.toLowerCase() === v.trim().toLowerCase()
                      ? prev
                      : null;
                  });
                }}
                onSelect={handleSelectChecker}
                themeConfig={themeConfig}
                disabled={loading}
              />

              <div className="mt-3">
                <label className="block text-xs font-semibold uppercase tracking-wide opacity-55 mb-1">
                  Briefing / Orientações (opcional)
                </label>
                <textarea
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  rows={3}
                  placeholder="Instruções para o checador..."
                  className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
                  style={{
                    backgroundColor: themeConfig.general.inputBackground,
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText,
                  }}
                />
              </div>
            </div>
          )}

          {error && <p className={styles.assignError}>{error}</p>}
        </div>

        <div
          className="px-6 py-4 flex justify-end gap-3 border-t"
          style={{ borderColor: themeConfig.general.border, backgroundColor: `${themeConfig.dashboard.background}30` }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium opacity-80 hover:opacity-100"
          >
            {canManage ? 'Fechar' : 'Cancelar'}
          </button>
          {canManage && (
            <button
              type="button"
              onClick={handleConfirmAssign}
              disabled={!resolvedCheckerId || loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
            >
              <UserPlus size={16} />
              {loading ? 'Atribuindo...' : 'Atribuir'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
