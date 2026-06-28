/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import { EditorialArticle, ArticleStatus, UserProfile, NewsItem, ThemeConfig } from '../types';
import styles from './EditorialArchive.module.css';

interface EditorialArchiveProps {
  articles: EditorialArticle[];
  news: NewsItem[];
  user: UserProfile;
  onDeleteArticle: (id: string) => Promise<void>;
  onUpdateStatus: (id: string, status: ArticleStatus) => Promise<void>;
  themeConfig: ThemeConfig;
}

export function EditorialArchive({ articles, news, user, onDeleteArticle, themeConfig }: EditorialArchiveProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [openExportMenuId, setOpenExportMenuId] = useState<string | null>(null);

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase());
    const normalizedStatus = art.status === 'published' ? 'approved' : art.status;
    const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const countByStatus = (status: ArticleStatus) =>
    articles.filter(a => a.status === status || (status === 'approved' && a.status === 'published')).length;

  const getNewsTitle = (newsId: string) => {
    return news.find(n => n.id === newsId)?.title || "Notícia não encontrada";
  };

  const getStatusIcon = (status: ArticleStatus) => {
    const normalized = status === 'published' ? 'approved' : status;
    switch (normalized) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: ArticleStatus) => {
    const normalized = status === 'published' ? 'approved' : status;
    switch (normalized) {
      case 'approved': return 'Aprovado';
      case 'review': return 'Em Revisão';
      case 'in_editing': return 'Em Edição';
      case 'draft': return 'Rascunho';
    }
  };

  const getStatusBadgeClass = (status: ArticleStatus) => {
    const normalized = status === 'published' ? 'approved' : status;
    switch (normalized) {
      case 'approved': return styles.statusBadgeApproved;
      case 'review': return styles.statusBadgeReview;
      default: return styles.statusBadgeDefault;
    }
  };

  const handleExport = (article: EditorialArticle, format: 'json' | 'html' | 'txt') => {
    let content = "";
    let mimeType = "";
    let extension = "";

    if (format === 'json') {
      content = JSON.stringify(article, null, 2);
      mimeType = "application/json";
      extension = "json";
    } else if (format === 'html') {
      content = `<!DOCTYPE html><html><head><title>${article.title}</title><meta charset="UTF-8"></head><body><h1>${article.title}</h1><div>${article.content}</div></body></html>`;
      mimeType = "text/html";
      extension = "html";
    } else {
      content = `${article.title}\n\n${article.content.replace(/<[^>]*>/g, '')}`;
      mimeType = "text/plain";
      extension = "txt";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${article.title.substring(0, 30).replace(/\s+/g, '_')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const catDotClass = (color: string) => {
    switch (color) {
      case 'slate': return styles.dotSlate;
      case 'orange': return styles.dotOrange;
      case 'blue': return styles.dotBlue;
      default: return styles.dotGreen;
    }
  };

  return (
    <div className={styles.page} style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
      <div className={styles.inner}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle} style={{ color: themeConfig.dashboard.text }}>
              <FileText className="w-8 h-8" style={{ color: themeConfig.general.accent }} />
              Acervo Editorial
            </h1>
            <p className={styles.pageSubtitle}>Gerencie e exporte as matérias editoriais das checagens finalizadas.</p>
          </div>
          
          <div className={styles.controls}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon}>
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Buscar matérias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={styles.statusSelect}
              style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunhos</option>
              <option value="review">Revisão</option>
              <option value="approved">Aprovados</option>
            </select>
          </div>
        </header>

        {/* Categories / Tabs */}
        <div className={styles.categoryGrid}>
          {[
            { id: 'draft', label: 'Rascunhos', color: 'slate', count: countByStatus('draft') },
            { id: 'review', label: 'Em Revisão', color: 'orange', count: countByStatus('review') },
            { id: 'approved', label: 'Aprovados', color: 'blue', count: countByStatus('approved') },
          ].map(cat => (
            <button 
              key={cat.id}
              onClick={() => setStatusFilter(cat.id as ArticleStatus)}
              className={styles.categoryCard}
              style={{
                backgroundColor: themeConfig.general.cardBackground,
                borderColor: statusFilter === cat.id ? themeConfig.general.accent : themeConfig.general.border,
                color: themeConfig.dashboard.text
              }}
            >
              <span className={styles.categoryLabel}>{cat.label}</span>
              <div className={styles.categoryBottom}>
                <span className={styles.categoryCount}>{cat.count}</span>
                <div className={catDotClass(cat.color)} />
              </div>
            </button>
          ))}
        </div>

        {/* Articles List */}
        <div className={styles.tableWrap} style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.thead} style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Matéria</th>
                  <th className={styles.th} style={{ color: themeConfig.general.tableHeaderText }}>Origem</th>
                  <th className={styles.thCenter} style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className={styles.thRight} style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className={styles.tbody} style={{ borderColor: themeConfig.general.border }}>
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      <div className={styles.emptyState}>
                        <FileText className="w-16 h-16 mb-4" />
                        <p className={styles.emptyStateTitle}>Vazio</p>
                        <p className={styles.emptyStateDesc}>Nenhuma matéria encontrada nesta categoria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map(article => (
                    <tr key={article.id} className={styles.tableRow} style={{ borderBottomColor: themeConfig.general.border }}>
                      <td className={styles.tdTitle}>
                        <div className={styles.titleContent}>
                          <span className={styles.articleTitle} style={{ color: themeConfig.dashboard.text }}>
                            {article.title}
                          </span>
                          <span className={styles.articleMeta}>
                             <Calendar className="w-3 h-3" /> {new Date(article.updatedAt).toLocaleDateString('pt-BR')}
                             <span className="opacity-40">|</span>
                             <UserIcon className="w-3 h-3" /> Redator ID: {article.authorId}
                          </span>
                        </div>
                      </td>
                      <td className={styles.tdOrigin}>
                        <div className={styles.originContent}>
                          <span className={styles.originTitle}>{getNewsTitle(article.newsId)}</span>
                          <span className={styles.originRef} style={{ color: themeConfig.general.accent }}>Ref: #{article.newsId.split('-')[1]}</span>
                        </div>
                      </td>
                      <td className={styles.tdStatus}>
                        <div className={styles.statusCenter}>
                          <div className={getStatusBadgeClass(article.status)}>
                            {getStatusIcon(article.status)}
                            {getStatusLabel(article.status)}
                          </div>
                        </div>
                      </td>
                      <td className={styles.tdActions}>
                        <div className={styles.actions}>
                          <button 
                            onClick={() => navigate(`/editor/${article.newsId}`)}
                            className={styles.editBtn}
                            title="Editar"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          
                          <div className={styles.exportWrap}>
                            <button 
                              onClick={() => setOpenExportMenuId(openExportMenuId === article.id ? null : article.id)}
                              className={openExportMenuId === article.id ? styles.exportBtnOpen : styles.exportBtnClosed}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                              {openExportMenuId === article.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className={styles.exportDropdown}
                                >
                                  <div className={styles.exportDropdownHeader}>
                                    <span className={styles.exportDropdownTitle}>Exportar como</span>
                                  </div>
                                  <button onClick={() => { handleExport(article, 'html'); setOpenExportMenuId(null); }} className={styles.exportItem}>
                                    HTML <span>.html</span>
                                  </button>
                                  <button onClick={() => { handleExport(article, 'json'); setOpenExportMenuId(null); }} className={styles.exportItem}>
                                    JSON <span>.json</span>
                                  </button>
                                  <button onClick={() => { handleExport(article, 'txt'); setOpenExportMenuId(null); }} className={styles.exportItem}>
                                    Texto <span>.txt</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <button 
                            onClick={async () => {
                              if (confirm('Deseja excluir este artigo permanentemente?')) {
                                try {
                                  await onDeleteArticle(article.id);
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Erro ao excluir.');
                                }
                              }
                            }}
                            className={styles.deleteBtn}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footer}>
           <button 
            onClick={() => navigate('/dashboard')}
            className={styles.backBtn}
            style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
           >
             Voltar ao Início
           </button>
        </div>
      </div>
    </div>
  );
}
