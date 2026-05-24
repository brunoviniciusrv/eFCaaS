import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Calendar, 
  Filter, 
  AlertCircle, 
  Share2, 
  CheckCircle2, 
  ArrowRight,
  Zap,
  Globe,
  PieChart as PieChartIcon,
  BarChart3,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeTrends } from '../services/geminiService';
import { ThemeConfig, NewsItem } from '../types';
import { cn } from '../lib/utils';

interface Trend {
  id: string;
  title: string;
  description: string;
  platform: string;
  misinformationRisk: number;
  reason: string;
  topic: string;
}

interface TrendAnalyzerProps {
  themeConfig: ThemeConfig;
  onPromoteToFactCheck: (trend: Trend) => void;
}

export function TrendAnalyzer({ themeConfig, onPromoteToFactCheck }: TrendAnalyzerProps) {
  const [topic, setTopic] = useState('Geral');
  const [dateRange, setDateRange] = useState('Últimas 24 horas');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [error, setError] = useState<string | null>(null);

  const topics = [
    'Geral',
    'Política',
    'Religião',
    'Meio Ambiente',
    'Economia',
    'Tecnologia',
    'Saúde',
    'Entretenimento'
  ];

  const dateRanges = [
    'Últimas 24 horas',
    'Últimos 7 dias',
    'Último mês',
    'Personalizado'
  ];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeTrends(topic, dateRange);
      setTrends(results);
    } catch (err) {
      setError('Ocorreu um erro ao analisar as tendências. Tente novamente.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Header & Configuration */}
      <div 
        className="p-8 rounded-[2rem] border bg-white/50 backdrop-blur-sm shadow-sm space-y-6"
        style={{ borderColor: themeConfig.general.border }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg rotate-3">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Analisador de Tendências I.A</h2>
            <p className="text-xs opacity-50 font-bold uppercase tracking-wider">Detecção precoce de possíveis desinformações</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Filter size={12} />
              Assunto Principal
            </label>
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
              style={{ borderColor: themeConfig.general.border }}
            >
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
              <Calendar size={12} />
              Período de Análise
            </label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm"
              style={{ borderColor: themeConfig.general.border }}
            >
              {dateRanges.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="flex items-end">
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
            >
              {isAnalyzing ? (
                <>
                  <Bot className="animate-bounce" size={18} />
                  Analisando...
                </>
              ) : (
                <>
                  <Zap className="group-hover:scale-110 transition-transform" size={18} />
                  Executar Análise
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {trends.length > 0 ? (
              trends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 rounded-[2rem] border bg-white hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden"
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-slate-100 border text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {trend.platform}
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-widest text-blue-600">
                          {trend.topic}
                        </div>
                      </div>

                      <h3 className="text-xl font-black tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                        {trend.title}
                      </h3>

                      <p className="text-sm opacity-60 leading-relaxed font-medium">
                        {trend.description}
                      </p>

                      <div className="p-4 rounded-2xl bg-slate-50 text-[11px] font-medium opacity-70 border border-slate-100 italic">
                        <strong>Motivo da Tendência:</strong> {trend.reason}
                      </div>
                    </div>

                    <div className="w-32 flex flex-col items-center gap-2 shrink-0">
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={cn(
                              trend.misinformationRisk > 70 ? "text-red-500" : trend.misinformationRisk > 40 ? "text-amber-500" : "text-green-500",
                              "transition-all duration-1000"
                            )}
                            strokeDasharray={`${trend.misinformationRisk}, 100`}
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                          <span className="text-lg font-black">{trend.misinformationRisk}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Risco IA</span>
                      
                      <button 
                        onClick={() => onPromoteToFactCheck(trend)}
                        className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        Checar Agora
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : !isAnalyzing && (
              <div className="p-20 text-center space-y-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300">
                  <Search size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-slate-400">Nenhuma tendência carregada</h3>
                  <p className="text-sm text-slate-400 font-medium">Selecione os filtros e execute a análise da I.A</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
          <div 
            className="p-6 rounded-[2rem] border bg-blue-600 text-white shadow-xl space-y-4 relative overflow-hidden"
          >
            <Zap className="absolute top-[-10px] right-[-10px] opacity-10 w-32 h-32 rotate-12" />
            <h3 className="text-lg font-black tracking-tight leading-none">Radar de Desinformação</h3>
            <p className="text-sm opacity-80 leading-relaxed font-medium">
              Nossa inteligência artificial varre padrões semânticos e de viralização para identificar rumores antes que eles decolem.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-black">94%</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Precisão da IA</span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="flex flex-col">
                <span className="text-2xl font-black">1.2M</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Posts/min</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[2rem] border bg-white shadow-sm space-y-4" style={{ borderColor: themeConfig.general.border }}>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Insights do Assunto</h3>
            <div className="space-y-4">
              {['Bots Ativos', 'Espalhamento Rápido', 'Câmeras de Eco'].map((insight) => (
                <div key={insight} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">{insight}</span>
                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
