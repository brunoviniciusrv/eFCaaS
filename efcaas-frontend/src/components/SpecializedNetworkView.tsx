import React, { useState } from 'react';
import { 
  Globe, 
  Clock, 
  CheckCircle2, 
  Search, 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  Link as LinkIcon, 
  ArrowLeft,
  Bot,
  Zap,
  Users,
  AlertCircle,
  Download,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  NewsItem, 
  SpecializedNetworkCheck, 
  ThemeConfig,
  SpecializedCheckerResponse 
} from '../types';

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <button 
          onClick={() => setSelectedCheckId(null)}
          className="flex items-center gap-2 text-sm font-bold opacity-60 hover:opacity-100 transition-all"
        >
          <ArrowLeft size={16} />
          Voltar para lista de checagens
        </button>

        {/* Detail Header */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  selectedCheck.status === 'completed' ? "bg-green-100 text-green-700 border border-green-200" : "bg-amber-100 text-amber-700 border border-amber-200 shadow-sm animate-pulse"
                )}>
                  {selectedCheck.status === 'completed' ? 'Finalizado' : 'Em Processamento'}
                </div>
                <span className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Protocolo: {selectedCheck.id}</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">{selectedNews.title}</h2>
              <div className="flex items-center gap-4 text-xs opacity-50 font-medium">
                <span className="flex items-center gap-1"><Clock size={12}/> Enviado em {new Date(selectedCheck.sentAt).toLocaleString()}</span>
                {selectedCheck.completedAt && (
                   <span className="flex items-center gap-1"><CheckCircle2 size={12}/> Concluído em {new Date(selectedCheck.completedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Navigation inside detail */}
            <div className="flex p-1 rounded-2xl border w-fit bg-slate-50" style={{ borderColor: themeConfig.general.border }}>
              <button 
                onClick={() => setActiveSubTab('summary')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  activeSubTab === 'summary' ? "bg-white shadow-sm" : "opacity-40"
                )}
              >
                Resumo e Consenso
              </button>
              <button 
                onClick={() => setActiveSubTab('checkers')}
                disabled={selectedCheck.status !== 'completed'}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  activeSubTab === 'checkers' ? "bg-white shadow-sm" : "opacity-40 disabled:opacity-20"
                )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="p-8 rounded-[2rem] border bg-blue-600 text-white shadow-xl relative overflow-hidden">
                       <Bot className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-10 rotate-12" />
                       <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2">
                         <Zap size={20} />
                         Algoritmo de Consenso IA
                       </h3>
                       <p className="text-sm opacity-90 leading-relaxed font-medium">
                         {selectedCheck.aiAnalysisSummary}
                       </p>
                     </div>
                     <div className="p-8 rounded-[2rem] border bg-white shadow-sm relative overflow-hidden" style={{ borderColor: themeConfig.general.border }}>
                       <Users className="absolute top-[-20px] right-[-20px] w-40 h-40 opacity-5 rotate-12 text-slate-900" />
                       <h3 className="text-xl font-black tracking-tight mb-4 flex items-center gap-2">
                         <MessageSquare size={20} />
                         Resumo da Rede
                       </h3>
                       <p className="text-sm text-slate-600 leading-relaxed font-medium">
                         {selectedCheck.consensusSummary}
                       </p>
                     </div>
                  </div>

                  <div className="p-8 rounded-[2rem] border bg-slate-50 border-dashed" style={{ borderColor: themeConfig.general.border }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-slate-900 text-white">
                        <Users size={16} />
                      </div>
                      <h3 className="text-lg font-black tracking-tight">Composição da Rede de Especialistas</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {selectedCheck.status === 'completed' ? (
                        selectedCheck.checkerResponses.map(resp => (
                          <div key={resp.checkerId} className="flex flex-col items-center gap-2 text-center">
                            <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                              {resp.checkerAvatar ? (
                                <img src={resp.checkerAvatar} alt={resp.checkerName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                  {resp.checkerName.substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-bold leading-tight">{resp.checkerName}</span>
                            <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest mb-1">
                              Concluído
                            </div>
                          </div>
                        ))
                      ) : (
                        Array(5).fill(0).map((_, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 text-center opacity-40">
                             <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                               <Clock size={20} className="animate-spin" />
                             </div>
                             <span className="text-[10px] font-bold">Checador {i+1}</span>
                             <span className="text-[8px] font-black uppercase tracking-widest">Pendente</span>
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
                  className="space-y-8"
                >
                  {selectedCheck.checkerResponses.map((resp, index) => (
                    <div 
                      key={resp.checkerId} 
                      className="p-8 rounded-[2.5rem] border bg-white shadow-sm hover:shadow-xl transition-all duration-500 group"
                      style={{ borderColor: themeConfig.general.border }}
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="lg:w-1/3 space-y-6">
                           <div className="flex items-center gap-4">
                             <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 rotate-3 group-hover:rotate-0 transition-transform overflow-hidden shadow-md">
                               <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-400">
                                 {resp.checkerName.charAt(0)}
                               </div>
                             </div>
                             <div>
                               <h4 className="font-black text-lg">{resp.checkerName}</h4>
                               <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Checador Especialista</p>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                 <HelpCircle size={12} />
                                 Perguntas Orientadoras
                               </label>
                               <div className="space-y-2">
                                 {resp.guidingQuestions.map((q, i) => (
                                   <div key={i} className="p-3 rounded-xl bg-slate-50 text-xs font-medium border border-slate-100 italic">
                                     "{q}"
                                   </div>
                                 ))}
                               </div>
                             </div>

                             <div className="space-y-2">
                               <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                                 <LinkIcon size={12} />
                                 Fontes Utilizadas
                               </label>
                               <div className="space-y-1">
                                 {resp.sources.map((s, i) => (
                                   <a 
                                      key={i} 
                                      href={s} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline overflow-hidden text-ellipsis whitespace-nowrap"
                                   >
                                     <ExternalLink size={12} />
                                     {s}
                                   </a>
                                 ))}
                               </div>
                             </div>
                           </div>
                        </div>

                        <div className="flex-1 space-y-6 lg:border-l lg:pl-8" style={{ borderColor: themeConfig.general.border }}>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                              <FileText size={12} />
                              Processo de Checagem
                            </label>
                            <p className="text-sm font-medium leading-relaxed text-slate-600">
                              {resp.fullProcess}
                            </p>
                          </div>

                          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-lg space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                              <CheckCircle2 size={12} />
                              Parecer Conclusivo
                            </label>
                            <p className="text-sm font-bold leading-relaxed">
                              {resp.conclusiveOpinion}
                            </p>
                          </div>

                          {resp.attachments.length > 0 && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest opacity-40">Anexos e Provas</label>
                              <div className="flex flex-wrap gap-2">
                                {resp.attachments.map((att, i) => (
                                  <button key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border text-[10px] font-bold hover:bg-slate-200 transition-all">
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

          {/* Sidebar Sidebar */}
          <div className="lg:w-80 space-y-6">
            <div className="p-6 rounded-[2rem] border bg-white shadow-sm space-y-4" style={{ borderColor: themeConfig.general.border }}>
               <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Publicação Original</h3>
               <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                 <h4 className="font-bold text-sm leading-tight">{selectedNews.title}</h4>
                 <p className="text-[10px] opacity-60 line-clamp-4 leading-relaxed">{selectedNews.content}</p>
                 <div className="flex items-center gap-2 pt-2 text-[10px] font-black uppercase tracking-widest opacity-40">
                   {selectedNews.source} • {selectedNews.date}
                 </div>
               </div>
            </div>

            <div className="p-6 rounded-[2rem] border bg-slate-50 shadow-sm space-y-4 border-dashed" style={{ borderColor: themeConfig.general.border }}>
               <h3 className="text-sm font-black uppercase tracking-widest opacity-40">Ações</h3>
               <div className="space-y-3">
                 <button className="w-full py-3 rounded-2xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all">
                   Promover para Matéria
                 </button>
                 <button className="w-full py-3 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">
                   Baixar Relatório Completo
                 </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">Rede de Checadores Especializados</h2>
          <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Monitoramento de consenso externo</p>
        </div>
        <div className="flex items-center gap-4">
           {/* Stats can go here */}
        </div>
      </div>

      {/* Grid of Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checks.map(check => {
          const checkNews = news.find(n => n.id === check.newsId);
          if (!checkNews) return null;

          return (
            <div 
              key={check.id}
              onClick={() => setSelectedCheckId(check.id)}
              className="group p-6 rounded-[2.5rem] border bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer flex flex-col justify-between gap-6"
              style={{ borderColor: themeConfig.general.border }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <div className={cn(
                     "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                     check.status === 'completed' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                   )}>
                     {check.status === 'completed' ? 'Finalizado' : 'Pendente'}
                   </div>
                   <span className="text-[9px] opacity-40 font-bold uppercase tracking-widest">ID: {check.id}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
                    {checkNews.title}
                  </h3>
                  <p className="text-xs opacity-50 line-clamp-2 font-medium">{checkNews.content}</p>
                </div>

                <div className="flex items-center gap-3">
                   <div className="flex -space-x-2">
                      {check.status === 'completed' ? (
                        Array(5).fill(0).map((_, i) => (
                           <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                             {String.fromCharCode(65 + i)}
                           </div>
                        ))
                      ) : (
                        Array(3).fill(0).map((_, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white border-dashed flex items-center justify-center text-slate-300">
                            <Clock size={14} />
                          </div>
                       ))
                      )}
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                     {check.status === 'completed' ? '5/5 Especialistas' : 'Aguardando Pareceres'}
                   </span>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">Enviado em</span>
                  <span className="text-[10px] font-bold">{new Date(check.sentAt).toLocaleDateString()}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          );
        })}

        {checks.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-6 opacity-40">
             <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto">
               <Globe size={40} />
             </div>
             <div className="space-y-1">
               <h3 className="text-lg font-black tracking-tight">Nenhuma checagem encaminhada</h3>
               <p className="text-sm font-medium">Use o botão "Rede Especializada" na triagem para encaminhar notícias.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
