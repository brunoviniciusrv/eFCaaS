import React, { useState } from 'react';
import { 
  Globe, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  Link as LinkIcon, 
  ArrowLeft,
  Bot,
  Zap,
  Users,
  Download,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  NewsItem, 
  SpecializedNetworkCheck, 
  ThemeConfig
} from '../types';
import styles from './SpecializedNetworkView.module.css';

interface SpecializedNetworkViewProps {
  checks: SpecializedNetworkCheck[];
  news: NewsItem[];
  themeConfig: ThemeConfig;
}

export function SpecializedNetworkView({ checks, news, themeConfig }: SpecializedNetworkViewProps) {
  const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
  const selectedCheck = checks.find(c => c.id === selectedCheckId);
  const selectedNews = selectedCheck ? news.find(n => n.id === selectedCheck.newsId) : null;

  const [activeSubTab, setActiveSubTab] = useState<'summary' | 'checkers'>('summary');

  if (selectedCheck && selectedNews) {
    return (
      <div className={styles.page}>
        <button onClick={() => setSelectedCheckId(null)} className={styles.backBtn}>
          <ArrowLeft size={16} />
          Voltar para lista de checagens
        </button>

        {/* Detail Header */}
        <div className={styles.detailLayout}>
          <div className={styles.detailMain}>
            <div className={styles.detailTitleWrap}>
              <div className={styles.detailMeta}>
                <div className={selectedCheck.status === 'completed' ? styles.statusCompleted : styles.statusPending}>
                  {selectedCheck.status === 'completed' ? 'Finalizado' : 'Em Processamento'}
                </div>
                <span className={styles.protocolLabel}>Protocolo: {selectedCheck.id}</span>
              </div>
              <h2 className={styles.detailTitle}>{selectedNews.title}</h2>
              <div className={styles.detailDates}>
                <span className="flex items-center gap-1"><Clock size={12}/> Enviado em {new Date(selectedCheck.sentAt).toLocaleString()}</span>
                {selectedCheck.completedAt && (
                   <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Concluído em {new Date(selectedCheck.completedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Navigation inside detail */}
            <div className={styles.tabBar} style={{ borderColor: themeConfig.general.border }}>
              <button 
                onClick={() => setActiveSubTab('summary')}
                className={activeSubTab === 'summary' ? styles.tabBtnActive : styles.tabBtnInactive}
              >
                Resumo e Consenso
              </button>
              <button 
                onClick={() => setActiveSubTab('checkers')}
                disabled={selectedCheck.status !== 'completed'}
                className={activeSubTab === 'checkers' ? styles.tabBtnActive : styles.tabBtnDisabled}
              >
                Pareceres dos Checadores
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeSubTab === 'summary' ? (
                <motion.div 
                  key="summary"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className={styles.summaryGrid}>
                     <div className={styles.aiCard}>
                       <Bot className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-10 rotate-12" />
                       <h3 className={styles.aiCardTitle}>
                         <Zap size={20} />
                         Algoritmo de Consenso IA
                       </h3>
                       <p className={styles.aiCardText}>{selectedCheck.aiAnalysisSummary}</p>
                     </div>
                     <div className={styles.networkCard} style={{ borderColor: themeConfig.general.border }}>
                       <Users className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-5 rotate-12 text-slate-900" />
                       <h3 className={styles.networkCardTitle}>
                         <MessageSquare size={20} />
                         Resumo da Rede
                       </h3>
                       <p className={styles.networkCardText}>{selectedCheck.consensusSummary}</p>
                     </div>
                  </div>

                  <div className={styles.compositionCard} style={{ borderColor: themeConfig.general.border }}>
                    <div className={styles.compositionHeader}>
                      <div className={styles.compositionIconWrap}>
                        <Users size={16} />
                      </div>
                      <h3 className={styles.compositionTitle}>Composição da Rede de Especialistas</h3>
                    </div>
                    <div className={styles.compositionGrid}>
                      {selectedCheck.status === 'completed' ? (
                        selectedCheck.checkerResponses.map(resp => (
                          <div key={resp.checkerId} className={styles.checkerItem}>
                            <div className={styles.checkerAvatar}>
                              {resp.checkerAvatar ? (
                                <img src={resp.checkerAvatar} alt={resp.checkerName} className="w-full h-full object-cover" />
                              ) : (
                                <div className={styles.checkerAvatarFallback}>
                                  {resp.checkerName.substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <span className={styles.checkerName}>{resp.checkerName}</span>
                            <div className={styles.checkerDone}>Concluído</div>
                          </div>
                        ))
                      ) : (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className={styles.skeletonItem}>
                             <div className={styles.skeletonAvatar}>
                               <Clock size={20} className="animate-spin" />
                             </div>
                             <span className={styles.skeletonName}>Checador {i+1}</span>
                             <span className={styles.skeletonStatus}>Pendente</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="checkers"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.checkersList}
                >
                  {selectedCheck.checkerResponses.map((resp) => (
                    <div 
                      key={resp.checkerId} 
                      className={styles.checkerCard}
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <div className={styles.checkerCardLayout}>
                        <div className={styles.checkerCardLeft}>
                           <div className={styles.checkerProfile}>
                             <div className={styles.checkerAvatarLarge}>
                               <div className={styles.checkerAvatarInitial}>
                                 {resp.checkerName.charAt(0)}
                               </div>
                             </div>
                             <div>
                               <h4 className={styles.checkerHeadTitle}>{resp.checkerName}</h4>
                               <p className={styles.checkerHeadSub}>Checador Especialista</p>
                             </div>
                           </div>

                           <div className={styles.checkerInfoList}>
                             <div className={styles.infoGroup}>
                               <label className={styles.infoLabel}>
                                 <HelpCircle size={12} />
                                 Perguntas Orientadoras
                               </label>
                               <div className="space-y-2">
                                 {resp.guidingQuestions.map((q, i) => (
                                   <div key={i} className={styles.questionItem}>"{q}"</div>
                                 ))}
                               </div>
                             </div>

                             <div className={styles.infoGroup}>
                               <label className={styles.infoLabel}>
                                 <LinkIcon size={12} />
                                 Fontes Utilizadas
                               </label>
                               <div className="space-y-1">
                                 {resp.sources.map((s, i) => (
                                   <a key={i} href={s} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                                     <ExternalLink size={12} />
                                     {s}
                                   </a>
                                 ))}
                               </div>
                             </div>
                           </div>
                        </div>

                        <div className={styles.checkerCardRight} style={{ borderColor: themeConfig.general.border }}>
                          <div className={styles.infoGroup}>
                            <label className={styles.infoLabel}>
                              <FileText size={12} />
                              Processo de Checagem
                            </label>
                            <p className={styles.processText}>{resp.fullProcess}</p>
                          </div>

                          <div className={styles.conclusionCard}>
                            <label className={styles.infoLabel}>
                              <CheckCircle2 size={12} />
                              Parecer Conclusivo
                            </label>
                            <p className={styles.conclusionText}>{resp.conclusiveOpinion}</p>
                          </div>

                          {resp.attachments.length > 0 && (
                            <div className={styles.infoGroup}>
                              <label className={styles.infoLabel}>Anexos e Provas</label>
                              <div className={styles.attachmentsWrap}>
                                {resp.attachments.map((att, i) => (
                                  <button key={i} className={styles.attachmentBtn}>
                                    <Download size={14} />
                                    {att.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Detail Sidebar */}
          <div className={styles.detailSidebar}>
            <div className={styles.origCard} style={{ borderColor: themeConfig.general.border }}>
               <h3 className={styles.origCardTitle}>Publicação Original</h3>
               <div className={styles.origContent}>
                 <h4 className={styles.origTitle}>{selectedNews.title}</h4>
                 <p className={styles.origText}>{selectedNews.content}</p>
                 <div className={styles.origMeta}>
                   {selectedNews.source} • {selectedNews.date}
                 </div>
               </div>
            </div>

            <div className={styles.actionsCard} style={{ borderColor: themeConfig.general.border }}>
               <h3 className={styles.actionsTitle}>Ações</h3>
               <div className={styles.actionsList}>
                 <button className={styles.actionBtnPrimary}>Promover para Matéria</button>
                 <button className={styles.actionBtnSecondary}>Baixar Relatório Completo</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.listHeader}>
        <div className="space-y-1">
          <h2 className={styles.listTitle}>Rede de Checadores Especializados</h2>
          <p className={styles.listSubtitle}>Monitoramento de consenso externo</p>
        </div>
      </div>

      {/* Grid of Checks */}
      <div className={styles.grid}>
        {checks.map(check => {
          const checkNews = news.find(n => n.id === check.newsId);
          if (!checkNews) return null;

          return (
            <div 
              key={check.id}
              onClick={() => setSelectedCheckId(check.id)}
              className={styles.card}
              style={{ borderColor: themeConfig.general.border }}
            >
              <div className={styles.cardTop}>
                <div className={styles.cardHeader}>
                   <div className={check.status === 'completed' ? styles.cardStatusCompleted : styles.cardStatusPending}>
                     {check.status === 'completed' ? 'Finalizado' : 'Pendente'}
                   </div>
                   <span className={styles.cardId}>ID: {check.id}</span>
                </div>

                <div className={styles.cardTitleWrap}>
                  <h3 className={styles.cardTitle}>{checkNews.title}</h3>
                  <p className={styles.cardDesc}>{checkNews.content}</p>
                </div>

                <div className={styles.cardCheckers}>
                   <div className={styles.avatarStack}>
                      {check.status === 'completed' ? (
                        Array(5).fill(0).map((_, i) => (
                           <div key={i} className={styles.avatarItem}>
                             {String.fromCharCode(65 + i)}
                           </div>
                        ))
                      ) : (
                        Array(3).fill(0).map((_, i) => (
                          <div key={i} className={styles.avatarSkeleton}>
                            <Clock size={14} />
                          </div>
                       ))
                      )}
                   </div>
                   <span className={styles.checkersLabel}>
                     {check.status === 'completed' ? '5/5 Especialistas' : 'Aguardando Pareceres'}
                   </span>
                </div>
              </div>

              <div className={styles.cardFooter} style={{ borderColor: themeConfig.general.border }}>
                <div className={styles.cardDate}>
                  <span className={styles.cardDateLabel}>Enviado em</span>
                  <span className={styles.cardDateValue}>{new Date(check.sentAt).toLocaleDateString()}</span>
                </div>
                <div className={styles.cardArrow}>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          );
        })}

        {checks.length === 0 && (
          <div className={styles.emptyState}>
             <div className={styles.emptyIcon}>
               <Globe size={40} />
             </div>
             <div className="space-y-1">
               <h3 className={styles.emptyTitle}>Nenhuma checagem encaminhada</h3>
               <p className={styles.emptyDesc}>Use o botão "Rede Especializada" na triagem para encaminhar notícias.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
