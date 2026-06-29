/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import {
  apiService,
  PlatformTenantUsuarioDto,
  SolicitacaoCadastroDto,
  SolicitacaoStatus,
  TenantSummaryDto,
} from '../services/apiService';
import { PLATFORM_THEME } from '../platform/platformBranding';
import styles from './PlatformAdminDashboard.module.css';

interface PlatformAdminDashboardProps {
  checkPermission: (permId: string) => boolean;
}

const STATUS_LABEL: Record<SolicitacaoStatus, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Reprovada',
};

const STATUS_CLASS: Record<SolicitacaoStatus, string> = {
  PENDING: styles.status_PENDING,
  APPROVED: styles.status_APPROVED,
  REJECTED: styles.status_REJECTED,
};

export function PlatformAdminDashboard({
  checkPermission,
}: PlatformAdminDashboardProps) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCadastroDto[]>([]);
  const [tenants, setTenants] = useState<TenantSummaryDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<SolicitacaoStatus | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [tenantUsers, setTenantUsers] = useState<PlatformTenantUsuarioDto[]>([]);
  const [isTenantUsersLoading, setIsTenantUsersLoading] = useState(false);
  const [detail, setDetail] = useState<SolicitacaoCadastroDto | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'requests' | 'tenants'>('requests');

  const accent = PLATFORM_THEME.general.accent;

  const loadSolicitacoes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.listarSolicitacoesCadastro(
        statusFilter === 'ALL' ? undefined : statusFilter,
      );
      setSolicitacoes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar solicitações.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  const loadTenants = useCallback(async () => {
    if (!checkPermission('platform_list_tenants')) return;
    try {
      const data = await apiService.listarTenantsPlatform();
      setTenants(data);
    } catch (err) {
      console.error(err);
    }
  }, [checkPermission]);

  useEffect(() => {
    if (activeTab === 'requests') {
      void loadSolicitacoes();
    } else {
      void loadTenants();
    }
  }, [activeTab, loadSolicitacoes, loadTenants]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setIsDetailLoading(true);
    apiService
      .obterSolicitacaoCadastro(selectedId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar detalhe.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedTenantId) {
      setTenantUsers([]);
      return;
    }

    let cancelled = false;
    setIsTenantUsersLoading(true);
    apiService
      .listarUsuariosTenantPlatform(selectedTenantId)
      .then((data) => {
        if (!cancelled) setTenantUsers(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar usuários do tenant.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsTenantUsersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedTenantId]);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return solicitacoes;
    return solicitacoes.filter(
      (s) =>
        s.nomeAgencia.toLowerCase().includes(term) ||
        s.emailContato.toLowerCase().includes(term) ||
        s.nomeResponsavel.toLowerCase().includes(term),
    );
  }, [solicitacoes, search]);

  const handleApprove = async () => {
    if (!selectedId || !checkPermission('platform_approve_agency')) return;
    setIsActing(true);
    setError('');
    try {
      await apiService.aprovarSolicitacaoCadastro(selectedId);
      setSelectedId(null);
      await loadSolicitacoes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar solicitação.');
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId || !checkPermission('platform_reject_agency')) return;
    setIsActing(true);
    setError('');
    try {
      await apiService.reprovarSolicitacaoCadastro(selectedId, motivoReprovacao.trim() || undefined);
      setSelectedId(null);
      setMotivoReprovacao('');
      await loadSolicitacoes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reprovar solicitação.');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestor da Plataforma</h1>
        </div>
        <button
          type="button"
          className={styles.refreshBtn}
          onClick={() => (activeTab === 'requests' ? loadSolicitacoes() : loadTenants())}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'requests' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Solicitações
        </button>
        {checkPermission('platform_list_tenants') && (
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'tenants' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('tenants')}
          >
            Agências
          </button>
        )}
      </div>

      {error && <p className={styles.errorBanner}>{error}</p>}

      {activeTab === 'requests' ? (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Buscar agência, responsável ou e-mail"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SolicitacaoStatus | 'ALL')}
            >
              <option value="ALL">Todos os status</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovadas</option>
              <option value="REJECTED">Reprovadas</option>
            </select>
          </div>

          <div className={styles.tableWrap}>
            {isLoading ? (
              <p className={styles.loading}>Carregando solicitações...</p>
            ) : filtered.length === 0 ? (
              <p className={styles.empty}>Nenhuma solicitação encontrada.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Agência</th>
                    <th>Responsável</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className={styles.rowClickable}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>
                        <div className={styles.agencyCell}>
                          <Building2 size={14} />
                          {item.nomeAgencia}
                        </div>
                      </td>
                      <td>{item.nomeResponsavel}</td>
                      <td>
                        <span className={item.planoSolicitado === 'PAID' ? styles.badgePaid : styles.badgeFree}>
                          {item.planoSolicitado}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${STATUS_CLASS[item.status]}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td>{new Date(item.criadoEm).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div className={styles.tableWrap}>
          {tenants.length === 0 ? (
            <p className={styles.empty}>Nenhum tenant listado.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Dados ecossistema</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className={styles.rowClickable}
                    onClick={() => setSelectedTenantId(tenant.id)}
                  >
                    <td>{tenant.nome}</td>
                    <td>{tenant.slug}</td>
                    <td>{tenant.plano}</td>
                    <td>{tenant.status}</td>
                    <td>{tenant.compartilhaDadosEcossistema ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <div className={styles.overlay} onClick={() => setSelectedId(null)}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={styles.drawer}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>Detalhe da solicitação</h2>
                <button type="button" className={styles.closeBtn} onClick={() => setSelectedId(null)}>
                  <X size={18} />
                </button>
              </div>

              {isDetailLoading || !detail ? (
                <p className={styles.loading}>Carregando detalhe...</p>
              ) : (
                <div className={styles.drawerBody}>
                  <div className={styles.detailGrid}>
                    <div><span className={styles.detailLabel}>Agência</span><p>{detail.nomeAgencia}</p></div>
                    <div><span className={styles.detailLabel}>CNPJ</span><p>{detail.cnpj || '—'}</p></div>
                    <div><span className={styles.detailLabel}>Responsável</span><p>{detail.nomeResponsavel}</p></div>
                    <div><span className={styles.detailLabel}>E-mail</span><p>{detail.emailContato}</p></div>
                    <div><span className={styles.detailLabel}>Telefone</span><p>{detail.telefone || '—'}</p></div>
                    <div><span className={styles.detailLabel}>Local</span><p>{[detail.cidade, detail.estado, detail.pais].filter(Boolean).join(' / ') || '—'}</p></div>
                    <div><span className={styles.detailLabel}>Plano</span><p>{detail.planoSolicitado}</p></div>
                    <div><span className={styles.detailLabel}>Status</span><p>{STATUS_LABEL[detail.status]}</p></div>
                  </div>

                  {detail.informacoesExtras && (
                    <div className={styles.extraBox}>
                      <span className={styles.detailLabel}>Informações adicionais</span>
                      <p>{detail.informacoesExtras}</p>
                    </div>
                  )}

                  {detail.motivoReprovacao && (
                    <div className={styles.rejectBox}>
                      <span className={styles.detailLabel}>Motivo da reprovação</span>
                      <p>{detail.motivoReprovacao}</p>
                    </div>
                  )}

                  <div className={styles.docsSection}>
                    <span className={styles.detailLabel}>Documentos</span>
                    {(detail.documentos ?? []).length === 0 ? (
                      <p className={styles.emptyDocs}>Nenhum documento anexado.</p>
                    ) : (
                      <ul className={styles.docList}>
                        {(detail.documentos ?? []).map((doc) => (
                          <li key={doc.id} className={styles.docItem}>
                            <FileText size={14} />
                            <span className={styles.docName}>{doc.nomeArquivo}</span>
                            {doc.urlAcesso && (
                              <a
                                href={doc.urlAcesso}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.docLink}
                              >
                                Abrir <ExternalLink size={12} />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {detail.status === 'PENDING' && (
                    <div className={styles.actions}>
                      {checkPermission('platform_reject_agency') && (
                        <div className={styles.rejectArea}>
                          <textarea
                            className={styles.motivoInput}
                            rows={3}
                            placeholder="Motivo da reprovação (opcional)"
                            value={motivoReprovacao}
                            onChange={(e) => setMotivoReprovacao(e.target.value)}
                          />
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            onClick={handleReject}
                            disabled={isActing}
                          >
                            <XCircle size={16} />
                            Reprovar
                          </button>
                        </div>
                      )}
                      {checkPermission('platform_approve_agency') && (
                        <button
                          type="button"
                          className={styles.approveBtn}
                          style={{ backgroundColor: accent }}
                          onClick={handleApprove}
                          disabled={isActing}
                        >
                          <CheckCircle2 size={16} />
                          Aprovar e provisionar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedTenantId && selectedTenant && (
          <div className={styles.overlay} onClick={() => setSelectedTenantId(null)}>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={styles.drawer}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <h2 className={styles.drawerTitle}>{selectedTenant.nome}</h2>
                <button type="button" className={styles.closeBtn} onClick={() => setSelectedTenantId(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className={styles.drawerBody}>
                <div className={styles.detailGrid}>
                  <div><span className={styles.detailLabel}>Slug</span><p>{selectedTenant.slug}</p></div>
                  <div><span className={styles.detailLabel}>Plano</span><p>{selectedTenant.plano}</p></div>
                  <div><span className={styles.detailLabel}>Status</span><p>{selectedTenant.status}</p></div>
                  <div>
                    <span className={styles.detailLabel}>Dados no ecossistema</span>
                    <p>{selectedTenant.compartilhaDadosEcossistema ? 'Sim' : 'Não'}</p>
                  </div>
                </div>

                <div className={styles.docsSection}>
                  <span className={styles.detailLabel}>Usuários da agência</span>
                  {isTenantUsersLoading ? (
                    <p className={styles.loading}>Carregando usuários...</p>
                  ) : tenantUsers.length === 0 ? (
                    <p className={styles.emptyDocs}>Nenhum usuário cadastrado nesta agência.</p>
                  ) : (
                    <table className={styles.usersTable}>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>E-mail</th>
                          <th>Perfil</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenantUsers.map((u) => (
                          <tr key={u.id}>
                            <td>{u.nome}</td>
                            <td>{u.email}</td>
                            <td>{u.perfil}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
