import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  ChevronRight, 
  ChevronLeft,
  Copy, 
  ExternalLink, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Save, 
  CheckCircle2,
  AlertCircle,
  FileEdit,
  History,
  Languages,
  Eye,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  Image as ImageIcon,
  Grid,
  MoreHorizontal,
  ChevronDown,
  Printer,
  Share2,
  Sparkles,
  User,
  Clock,
  Briefcase
} from 'lucide-react';
import { NewsItem, ThemeConfig, UserProfile, LabelConfig } from '../types';
import { cn } from '../lib/utils';

interface NewsroomViewProps {
  news: NewsItem[];
  themeConfig: ThemeConfig;
  user: UserProfile;
  labels: LabelConfig[];
}

export const NewsroomView = ({ news, themeConfig, user, labels }: NewsroomViewProps) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isAIEnhancing, setIsAIEnhancing] = useState(false);

  // Filter only completed reports that are ready for newsroom/editing
  const completedReports = news.filter(n => n.status === 'completed' || n.status === 'final_review');

  const selectedReport = completedReports.find(r => r.id === selectedReportId);

  useEffect(() => {
    if (selectedReport) {
      // Professional Editorial Template
      const label = labels.find(l => l.name === selectedReport.reportStructure?.label);
      const content = `
# PARECER EDITORIAL: ${selectedReport.title}
---
**EDITOR RESPONSÁVEL:** ${user.name}
**CLASSIFICAÇÃO FINAL:** ${selectedReport.reportStructure?.label || 'PENDENTE'}
**DATA DE PUBLICAÇÃO:** ${new Date().toLocaleDateString()}
**URGÊNCIA:** ${selectedReport.priority === 'high' ? 'ALTA - PUBLICAÇÃO IMEDIATA' : 'NORMAL'}

## 1. RESUMO EXECUTIVO DA INVESTIGAÇÃO
${selectedReport.reportStructure?.summary || selectedReport.content}
Esta investigação foi conduzida seguindo os protocolos de rigor jornalístico da agência, focando na veracidade das alegações circulantes em redes sociais e aplicativos de mensageria rádio-fônicos.

## 2. METODOLOGIA E PERGUNTAS DE CONTROLE
Para a validação desta informação, nossa equipe de checagem (CKA) buscou responder às seguintes questões centrais:
${selectedReport.reportStructure?.questions.map(q => `- **${q}**`).join('\n') || '- Nenhuma pergunta de controle registrada no sistema.'}

## 3. EVIDÊNCIAS E FONTES CONSULTADAS
As seguintes fontes oficiais e evidências digitais foram utilizadas para embasar o veredito final:
${selectedReport.reportStructure?.sources.map(s => `- [OFICIAL] ${s}`).join('\n') || '- Nenhuma fonte externa vinculada ao processo.'}
${selectedReport.evidence.map(e => `- [EVIDÊNCIA DIGITAL] ${e.title}: ${e.url}`).join('\n')}

## 4. ANÁLISE TÉCNICA E CONTEXTO
O conteúdo analisado apresenta características típicas de ${selectedReport.reportStructure?.label === 'Falso' ? 'desinformação deliberada' : 'conteúdo informativo de interesse público'}. 
Através de análise de metadados e cruzamento de dados governamentais, foi possível identificar que ${selectedReport.reportStructure?.summary.toLowerCase() || 'a informação carece de fundamentos fáticos sustentáveis.'}

## 5. CONCLUSÃO E NOTA DE REDAÇÃO
**VEREDITO: ${selectedReport.reportStructure?.label}**

Orientamos que os leitores não compartilhem o conteúdo original caso este tenha sido classificado como Falso ou Distorcido. No caso de conteúdo Verdadeiro ou com Falta de Contexto, recomendamos a leitura integral deste parecer técnico para compreensão total dos fatos.

---
*Este documento é uma versão final revisada para publicação via API/CMS.*
      `.trim();
      
      setEditorContent(content);
      setEditorTitle(selectedReport.title);
    }
  }, [selectedReportId, selectedReport, labels, user.name]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editorContent);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate API integration
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    alert('Conteúdo enviado para a API de publicação com sucesso!');
  };

  const handleAIEnhance = async () => {
    setIsAIEnhancing(true);
    // Simulation of AI text enhancement
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEditorContent(prev => prev + '\n\n*Nota da IA: O tom do texto foi refinado para maior neutralidade jornalística.*');
    setIsAIEnhancing(false);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar - Ready Reports */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 360 : 0,
          opacity: isSidebarOpen ? 1 : 0
        }}
        className="border-r bg-white flex flex-col relative shadow-xl z-30 overflow-hidden"
      >
        <div className="p-6 border-b bg-white flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-black text-lg flex items-center gap-2 text-slate-800">
              <Briefcase size={20} className="text-blue-600" />
              Pareceres Prontos
            </h2>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Aguardando Redação Final</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {completedReports.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                <AlertCircle size={32} className="text-slate-300" />
              </div>
              <h3 className="text-slate-600 font-bold mb-1">Nada para revisar</h3>
              <p className="text-xs text-slate-400">Finalize uma análise técnica para que ela apareça aqui como parecer pronto.</p>
            </div>
          ) : (
            completedReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReportId(report.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all border group relative",
                  selectedReportId === report.id
                    ? "bg-white border-blue-200 shadow-lg ring-4 ring-blue-50"
                    : "bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-md"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-1.5">
                    <span 
                      className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-sm"
                      style={{ 
                        backgroundColor: labels.find(l => l.name === report.reportStructure?.label)?.color + '20',
                        color: labels.find(l => l.name === report.reportStructure?.label)?.color
                      }}
                    >
                      {report.reportStructure?.label || 'REVISÃO'}
                    </span>
                    {report.priority === 'high' && (
                      <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider animate-pulse">URGENTE</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                    ID: {report.id}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight mb-3 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </p>
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium border-t pt-3 mt-auto">
                   <span className="flex items-center gap-1"><User size={12} className="opacity-50" /> Checador: {report.assignedTo || 'Sistema'}</span>
                   <span className="flex items-center gap-1"><Clock size={12} className="opacity-50" /> {report.completedAt ? new Date(report.completedAt).toLocaleDateString() : 'Pend.'}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </motion.aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {!selectedReportId ? (
          <div className="flex-1 flex items-center justify-center p-12 text-center bg-slate-50/50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md"
            >
              <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-6 mx-auto">
                <FileEdit size={48} className="text-blue-600 p-4 bg-blue-50 rounded-2xl" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Laboratório de Redação</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Transforme dados técnicos em narrativas claras e impactantes. Selecione um parecer técnico na lista lateral para iniciar o processo de editoração final.
              </p>
              <div className="flex items-center justify-center gap-12 text-slate-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-full shadow-sm"><FileText size={20} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Editar</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-full shadow-sm"><Sparkles size={20} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Otimizar</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-white rounded-full shadow-sm"><ExternalLink size={20} /></div>
                  <span className="text-xs font-bold uppercase tracking-widest">Publicar</span>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* Word-like Ribbon Menu */}
            <div className="bg-white border-b shadow-md z-40 relative">
              {/* File / Navigation Bar */}
              <div className="flex items-center justify-between px-6 py-2 border-b bg-slate-50/80">
                <div className="flex items-center gap-6">
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">eFCaaS Newsroom</span>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    <button className="hover:text-blue-600 transition-colors">Arquivo</button>
                    <button className="hover:text-blue-600 transition-colors">Página</button>
                    <button className="hover:text-blue-600 transition-colors">Inserir</button>
                    <button className="hover:text-blue-600 transition-colors">Layout</button>
                    <button className="hover:text-blue-600 transition-colors">Revisão</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 hover:bg-slate-200 rounded transition-colors" title="Salvar"><Save size={16} className="text-slate-600" /></button>
                  <button className="p-1.5 hover:bg-slate-200 rounded transition-colors" title="Imprimir"><Printer size={16} className="text-slate-600" /></button>
                  <button className="p-1.5 hover:bg-slate-200 rounded transition-colors" title="Compartilhar"><Share2 size={16} className="text-slate-600" /></button>
                </div>
              </div>

              {/* Main Formatting Toolbar */}
              <div className="px-6 py-4 flex flex-wrap items-center gap-4">
                {/* View Switcher */}
                <div className="flex items-center bg-slate-100 rounded-xl p-1 mr-4 border shadow-inner">
                   <button 
                    onClick={() => setActiveTab('editor')}
                    className={cn(
                      "px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2",
                      activeTab === 'editor' ? "bg-white shadow-md text-blue-600" : "text-slate-500"
                    )}
                   >
                     <FileEdit size={14} /> Redação
                   </button>
                   <button 
                    onClick={() => setActiveTab('preview')}
                    className={cn(
                      "px-5 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-2",
                      activeTab === 'preview' ? "bg-white shadow-md text-blue-600" : "text-slate-500"
                    )}
                   >
                     <Eye size={14} /> Pré-visualização
                   </button>
                </div>

                <div className="h-10 w-[1px] bg-slate-200"></div>

                {/* Text Formatting Group */}
                <div className="flex items-center gap-1 group relative">
                   <div className="flex flex-col items-center">
                     <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shadow-sm">
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Negrito"><Bold size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Itálico"><Italic size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700 border-r pr-2 mr-1" title="Link"><LinkIcon size={18} /></button>
                        
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Lista"><List size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Lista Numerada"><ListOrdered size={18} /></button>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Formatação</span>
                   </div>

                   <div className="h-10 w-[1px] bg-slate-200 mx-1"></div>

                   <div className="flex flex-col items-center">
                     <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shadow-sm">
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-lg" title="Esquerda"><AlignLeft size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Centro"><AlignCenter size={18} /></button>
                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-700" title="Direita"><AlignRight size={18} /></button>
                     </div>
                     <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Parágrafo</span>
                   </div>
                </div>

                <div className="h-10 w-[1px] bg-slate-200"></div>

                {/* Insert Menu Style */}
                <div className="flex flex-col items-center">
                   <div className="flex items-center gap-2">
                      <button className="px-3 py-2 bg-white border rounded-xl shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2 hover:border-blue-300 transition-all">
                         <ImageIcon size={14} className="text-purple-500" /> Imagem
                         <ChevronDown size={14} className="opacity-50" />
                      </button>
                      <button className="px-3 py-2 bg-white border rounded-xl shadow-sm text-xs font-bold text-slate-700 flex items-center gap-2 hover:border-blue-300 transition-all">
                         <Grid size={14} className="text-orange-500" /> Tabela
                      </button>
                   </div>
                   <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Inserir</span>
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <button 
                    onClick={handleAIEnhance}
                    disabled={isAIEnhancing}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {isAIEnhancing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={14} /></motion.div>
                    ) : <Sparkles size={14} />}
                    Melhorar com IA
                  </button>

                  <div className="h-10 w-[1px] bg-slate-200"></div>

                  <button 
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-black shadow-xl shadow-blue-200 border-b-4 border-blue-800 transition-all active:border-b-0 active:translate-y-1 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPublishing ? 'Publicando...' : 'INTEGRAR API'}
                    {!isPublishing && <ExternalLink size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Editor Surface Area */}
            <div className="flex-1 overflow-y-auto p-12 md:p-16 flex justify-center bg-slate-200 shadow-inner">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-[816px] bg-white shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] min-h-[1056px] flex flex-col relative"
              >
                {/* Rulers / Page Markers Simulation */}
                <div className="absolute -left-8 top-12 bottom-12 w-0.5 bg-slate-300 opacity-20"></div>
                <div className="absolute -top-8 left-12 right-12 h-0.5 bg-slate-300 opacity-20"></div>

                <div className="flex-1 flex flex-col p-[3cm] pt-[2cm]">
                  {/* Document Header */}
                  <div className="flex flex-col gap-8 mb-12">
                    <input 
                      value={editorTitle}
                      onChange={(e) => setEditorTitle(e.target.value)}
                      className="w-full text-4xl font-serif font-black text-slate-900 border-none outline-none placeholder:text-slate-200"
                      placeholder="Sem Título"
                    />
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400 border-y py-3 border-slate-100">
                      <span className="flex items-center gap-2">Documento: <span className="text-slate-900">OFICIAL.00{selectedReportId?.slice(-3)}</span></span>
                      <span className="flex items-center gap-2">Status: <span className={cn("text-white px-2 py-0.5 rounded", labels.find(l => l.name === selectedReport?.reportStructure?.label)?.color ? "" : "bg-slate-900")} style={{ backgroundColor: labels.find(l => l.name === selectedReport?.reportStructure?.label)?.color }}>{selectedReport?.reportStructure?.label || 'REVISÃO'}</span></span>
                      <span className="flex items-center gap-2">Versão: <span className="text-slate-900">1.0.4 - FINAL</span></span>
                    </div>
                  </div>

                  {activeTab === 'editor' ? (
                    <textarea 
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      className="flex-1 w-full font-serif text-[18px] leading-[1.8] text-slate-800 border-none outline-none resize-none placeholder:text-slate-200 selection:bg-blue-100"
                      placeholder="O conteúdo do seu parecer aparecerá aqui..."
                    />
                  ) : (
                    <div className="flex-1 w-full font-serif text-[18px] leading-[1.8] text-slate-800 prose prose-slate max-w-none prose-headings:font-black prose-img:rounded-2xl">
                      {editorContent.split('\n').map((line, i) => {
                        if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-black mb-8 border-b pb-4">{line.replace('# ', '')}</h1>;
                        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-black mb-4 mt-8 flex items-center gap-3"><span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>{line.replace('## ', '')}</h2>;
                        if (line.startsWith('---')) return <hr key={i} className="my-8 border-slate-100" />;
                        if (line.startsWith('**')) return <p key={i} className="mb-4"><strong>{line.replace(/\*\*/g, '')}</strong></p>;
                        if (line.startsWith('- ')) return <li key={i} className="ml-6 list-disc mb-2 text-slate-700">{line.replace('- ', '')}</li>;
                        if (line === '') return <br key={i} />;
                        return <p key={i} className="mb-4 text-justify">{line}</p>;
                      })}
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div className="mt-auto p-12 pt-0 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <span>© Agência Nacional de Checagem - 2026</span>
                  <span>Página 1 de 1</span>
                </div>
              </motion.div>
            </div>

            {/* Application Status Bar */}
            <div className="h-10 bg-white border-t flex items-center justify-between px-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-green-500"></div> Sincronizado
                </span>
                <span className="flex items-center gap-2"><Type size={12} className="text-blue-500" /> {editorContent.length} Caracteres</span>
                <span className="flex items-center gap-2"><AlignLeft size={12} className="text-blue-500" /> {editorContent.split(/\s+/).filter(x => x).length} Palavras</span>
                <span className="flex items-center gap-2"><ImageIcon size={12} className="text-blue-500" /> {selectedReport?.media?.length || 0} Objetos de Mídia</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 hover:text-blue-600 transition-colors"><Languages size={12} /> Português (Brasil)</button>
                <div className="flex items-center gap-2">
                  <Maximize2 size={12} /> 100%
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Sidebar Toggle (When closed) */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-6 bottom-16 w-14 h-14 bg-white rounded-full shadow-2xl border-4 border-slate-50 flex items-center justify-center text-blue-600 hover:scale-110 transition-all z-50 group hover:bg-blue-600 hover:text-white"
        >
          <Briefcase size={22} className="group-hover:rotate-12 transition-transform" />
          <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl">
             Ver Pareceres Prontos
          </div>
        </button>
      )}

      {/* Toasts */}
      <AnimatePresence>
        {showSavedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-12 right-12 bg-slate-900/95 backdrop-blur-md text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4 z-[60] border border-white/10"
          >
            <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center">
               <CheckCircle2 className="text-white" size={24} />
            </div>
            <div className="space-y-0.5">
               <p className="font-black text-sm tracking-tight text-white">Texto Copiado!</p>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pronto para colar em seu CMS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
