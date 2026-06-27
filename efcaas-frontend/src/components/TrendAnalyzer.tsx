import React, { useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Calendar, 
  Filter, 
  AlertCircle, 
  ArrowRight,
  Zap,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeTrends } from '../services/geminiService';
import { ThemeConfig } from '../types';
import { cn } from '../lib/utils';
import styles from './TrendAnalyzer.module.css';

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

  const topics = ['Geral','Política','Religião','Meio Ambiente','Economia','Tecnologia','Saúde','Entretenimento'];
  const dateRanges = ['Últimas 24 horas','Últimos 7 dias','Último mês','Personalizado'];

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const results = await analyzeTrends(topic, dateRange);
      setTrends(results);
    } catch (err) {
      setError('Ocorreu um erro ao analisar as tendências. Tente novamente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header & Configuration */}
      <div className={styles.configCard} style={{ borderColor: themeConfig.general.border }}>
        <div className={styles.configHeader}>
          <div className={styles.configIconWrap}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className={styles.configTitle}>Analisador de Tendências I.A</h2>
            <p className={styles.configSubtitle}>Detecção precoce de possíveis desinformações</p>
          </div>
        </div>

        <div className={styles.configGrid}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <Filter size={12} />
              Assunto Principal
            </label>
            <select 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={styles.select}
              style={{ borderColor: themeConfig.general.border }}
            >
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
              <Calendar size={12} />
              Período de Análise
            </label>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={styles.select}
              style={{ borderColor: themeConfig.general.border }}
            >
              {dateRanges.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className={styles.analyzeWrap}>
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={styles.analyzeBtn}
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
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <p className={styles.errorText}>{error}</p>
        </div>
      )}

      {/* Results Section */}
      <div className={styles.resultsGrid}>
        <div className={styles.trendList}>
          <AnimatePresence mode="popLayout">
            {trends.length > 0 ? (
              trends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={styles.trendCard}
                  style={{ borderColor: themeConfig.general.border }}
                >
                  <div className={styles.trendMeta}>
                    <div className={styles.trendContent}>
                      <div className={styles.trendTags}>
                        <div className={styles.tagPlatform}>{trend.platform}</div>
                        <div className={styles.tagTopic}>{trend.topic}</div>
                      </div>
                      <h3 className={styles.trendTitle}>{trend.title}</h3>
                      <p className={styles.trendDesc}>{trend.description}</p>
                      <div className={styles.trendReason}>
                        <strong>Motivo da Tendência:</strong> {trend.reason}
                      </div>
                    </div>

                    <div className={styles.riskWrap}>
                      <div className={styles.riskCircle}>
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className={styles.riskTrack}
                            stroke="currentColor"
                            strokeWidth="3.5"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={cn(
                              trend.misinformationRisk > 70 ? styles.riskHigh : trend.misinformationRisk > 40 ? styles.riskMedium : styles.riskLow
                            )}
                            strokeDasharray={`${trend.misinformationRisk}, 100`}
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className={styles.riskCenter}>
                          <span className={styles.riskValue}>{trend.misinformationRisk}%</span>
                        </div>
                      </div>
                      <span className={styles.riskLabel}>Risco IA</span>
                      
                      <button 
                        onClick={() => onPromoteToFactCheck(trend)}
                        className={styles.checkBtn}
                      >
                        Checar Agora
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : !isAnalyzing && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <Search size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className={styles.emptyTitle}>Nenhuma tendência carregada</h3>
                  <p className={styles.emptyDesc}>Selecione os filtros e execute a análise da I.A</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
