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
  Filter, 
  ExternalLink, 
  Download, 
  Globe, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Eye,
  Trash2,
  Share2,
  Calendar,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { EditorialArticle, ArticleStatus, UserProfile, NewsItem, ThemeConfig } from '../types';
import { cn } from '../lib/utils';

interface EditorialArchiveProps {
  articles: EditorialArticle[];
  news: NewsItem[];
  user: UserProfile;
  onDeleteArticle: (id: string) => void;
  onUpdateStatus: (id: string, status: ArticleStatus) => void;
  themeConfig: ThemeConfig;
}

export function EditorialArchive({ articles, news, user, onDeleteArticle, onUpdateStatus, themeConfig }: EditorialArchiveProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | 'all'>('all');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [openExportMenuId, setOpenExportMenuId] = useState<string | null>(null);

  const filteredArticles = articles.filter(art => {
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getNewsTitle = (newsId: string) => {
    return news.find(n => n.id === newsId)?.title || "Notícia não encontrada";
  };

  const getStatusIcon = (status: ArticleStatus) => {
    switch (status) {
      case 'published': return <Globe className="w-4 h-4 text-green-500" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'review': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: ArticleStatus) => {
    switch (status) {
      case 'published': return 'Publicado';
      case 'approved': return 'Aprovado';
      case 'review': return 'Em Revisão';
      case 'in_editing': return 'Em Edição';
      case 'draft': return 'Rascunho';
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
      content = `
        <!DOCTYPE html>
        <html>
        <head><title>${article.title}</title><meta charset="UTF-8"></head>
        <body>
          <h1>${article.title}</h1>
          <div>${article.content}</div>
        </body>
        </html>
      `;
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

  return (
    <div className="min-h-screen font-sans p-6 lg:p-10 transition-colors duration-300" style={{ backgroundColor: themeConfig.dashboard.background, color: themeConfig.dashboard.text }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: themeConfig.dashboard.text }}>
              <FileText className="w-8 h-8" style={{ color: themeConfig.general.accent }} />
              Acervo Editorial
            </h1>
            <p className="text-sm font-medium mt-1 opacity-75">Gerencie, exporte e publique suas checagens finalizadas.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder="Buscar matérias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-xl outline-none transition-all w-64 text-sm"
                style={{ 
                  backgroundColor: themeConfig.general.inputBackground, 
                  borderColor: themeConfig.general.inputBorder,
                  color: themeConfig.general.inputText
                }}
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border rounded-xl outline-none text-sm font-semibold"
              style={{ 
                backgroundColor: themeConfig.general.inputBackground, 
                borderColor: themeConfig.general.inputBorder,
                color: themeConfig.general.inputText
              }}
            >
              <option value="all">Todos os Status</option>
              <option value="draft">Rascunhos</option>
              <option value="review">Revisão</option>
              <option value="approved">Aprovados</option>
              <option value="published">Publicados</option>
            </select>
          </div>
        </header>

        {/* Categories / Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'draft', label: 'Rascunhos', color: 'slate', count: articles.filter(a => a.status === 'draft').length },
            { id: 'review', label: 'Em Revisão', color: 'orange', count: articles.filter(a => a.status === 'review').length },
            { id: 'approved', label: 'Aprovados', color: 'blue', count: articles.filter(a => a.status === 'approved').length },
            { id: 'published', label: 'Publicados', color: 'green', count: articles.filter(a => a.status === 'published').length }
          ].map(cat => (
            <button 
              key={cat.id}
              onClick={() => setStatusFilter(cat.id as ArticleStatus)}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all hover:shadow-lg group"
              )}
              style={{
                backgroundColor: themeConfig.general.cardBackground,
                borderColor: statusFilter === cat.id ? themeConfig.general.accent : themeConfig.general.border,
                color: themeConfig.dashboard.text
              }}
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                {cat.label}
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-2xl font-black">{cat.count}</span>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  cat.color === 'slate' ? 'bg-slate-300' :
                  cat.color === 'orange' ? 'bg-orange-400' :
                  cat.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'
                )} />
              </div>
            </button>
          ))}
        </div>

        {/* Articles List */}
        <div className="rounded-[2.5rem] border shadow-sm overflow-hidden" style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ backgroundColor: themeConfig.general.tableHeaderBackground, borderColor: themeConfig.general.border }}>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: themeConfig.general.tableHeaderText }}>Matéria</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest" style={{ color: themeConfig.general.tableHeaderText }}>Origem</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center" style={{ color: themeConfig.general.tableHeaderText }}>Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right" style={{ color: themeConfig.general.tableHeaderText }}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: themeConfig.general.border }}>
                {filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <FileText className="w-16 h-16 mb-4" />
                        <p className="text-xl font-bold uppercase tracking-widest">Vazio</p>
                        <p className="text-sm font-medium">Nenhuma matéria encontrada nesta categoria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map(article => (
                    <tr key={article.id} className="group transition-colors" style={{ borderBottomColor: themeConfig.general.border }}>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1 max-w-sm">
                          <span className="text-sm font-bold transition-colors line-clamp-1" style={{ color: themeConfig.dashboard.text }}>
                            {article.title}
                          </span>
                          <span className="text-[10px] opacity-65 flex items-center gap-2">
                             <Calendar className="w-3 h-3" /> {new Date(article.updatedAt).toLocaleDateString('pt-BR')}
                             <span className="opacity-40">|</span>
                             <UserIcon className="w-3 h-3" /> Redator ID: {article.authorId}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold opacity-75 line-clamp-1">{getNewsTitle(article.newsId)}</span>
                          <span className="text-[9px] font-black uppercase tracking-tight" style={{ color: themeConfig.general.accent }}>Ref: #{article.newsId.split('-')[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex justify-center">
                          <div className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                            article.status === 'published' ? "bg-green-50 border-green-100 text-green-700" :
                            article.status === 'approved' ? "bg-blue-50 border-blue-100 text-blue-700" :
                            article.status === 'review' ? "bg-orange-50 border-orange-100 text-orange-700" :
                            "bg-slate-50 border-slate-100 text-slate-600"
                          )}>
                            {getStatusIcon(article.status)}
                            {getStatusLabel(article.status)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => navigate(`/editor/${article.newsId}`)}
                            className="p-2 hover:bg-white hover:text-blue-600 rounded-lg border border-transparent hover:border-slate-200 transition-all"
                            title="Editar"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          
                          <div className="relative">
                            <button 
                              onClick={() => setOpenExportMenuId(openExportMenuId === article.id ? null : article.id)}
                              className={cn(
                                "p-2 rounded-lg border transition-all",
                                openExportMenuId === article.id ? "bg-slate-900 text-white border-slate-900" : "hover:bg-white hover:text-slate-900 border-transparent hover:border-slate-200"
                              )}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                              {openExportMenuId === article.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-30"
                                >
                                  <div className="px-4 pb-2 mb-2 border-b border-slate-50">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Exportar como</span>
                                  </div>
                                  <button onClick={() => { handleExport(article, 'html'); setOpenExportMenuId(null); }} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors flex items-center justify-between">
                                    HTML <span>.html</span>
                                  </button>
                                  <button onClick={() => { handleExport(article, 'json'); setOpenExportMenuId(null); }} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors flex items-center justify-between">
                                    JSON <span>.json</span>
                                  </button>
                                  <button onClick={() => { handleExport(article, 'txt'); setOpenExportMenuId(null); }} className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors flex items-center justify-between">
                                    Texto <span>.txt</span>
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {article.status !== 'published' && (
                            <button 
                              onClick={() => {
                                if (confirm('Publicar esta checagem oficialmente?')) {
                                  onUpdateStatus(article.id, 'published');
                                }
                              }}
                              className="p-2 hover:bg-green-50 text-green-600 rounded-lg border border-transparent hover:border-green-100 transition-all font-black text-[10px] uppercase flex items-center gap-2"
                            >
                              <Globe className="w-4 h-4" /> Publicar
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              if (confirm('Deseja excluir este artigo permanentemente?')) {
                                onDeleteArticle(article.id);
                              }
                            }}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-100 transition-all"
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
        <div className="mt-8 flex justify-center">
           <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold hover:opacity-95 transition-all active:scale-95 shadow-md"
            style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
           >
             Voltar ao Início
           </button>
        </div>
      </div>
    </div>
  );
}
