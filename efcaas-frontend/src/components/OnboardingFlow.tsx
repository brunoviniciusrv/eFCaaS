import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Bot,
  Zap,
  Users,
  Check,
  Globe,
  Settings,
  Sparkles,
  Plus,
  Search,
  AlertTriangle,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { ThemeConfig, AgencyConfig } from '../types';
import { AiEngineModulesPanel } from './AiEngineModulesPanel';
import { AiModuleKey } from '../config/aiModules';
import { INITIAL_THEME_CONFIG } from '../constants';
import { THEME_PRESETS, applyThemePreset } from '../config/themePresets';

interface OnboardingFlowProps {
  onComplete: (agency: AgencyConfig, theme: ThemeConfig) => void;
  onClose?: () => void;
  initialAgency?: AgencyConfig;
  initialTheme?: ThemeConfig;
}

const FONTS = [
  { id: 'Inter', name: 'Inter (Padrão)', desc: 'Foco em legibilidade' },
  { id: 'Outfit', name: 'Outfit (Moderno)', desc: 'Visual contemporâneo' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech)', desc: 'Técnico e limpo' }
];

const DEFAULT_AGENCY: AgencyConfig = {
  name: 'Minha Agência de Checagem',
  logoUrl: '',
  isOnboardingCompleted: false,
  language: 'pt-BR',
  country: 'Brasil',
  enableAI: true,
  enableSpecializedNetwork: true,
  enableSocialSearch: true,
  enableTrendAnalyzer: true,
  enableMisinfoRisk: true,
  enableIllicitRisk: true,
  useDefaultProfiles: true,
  templateId: 'modern-blue',
};

export const OnboardingFlow = ({ onComplete, onClose, initialAgency, initialTheme }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [agency, setAgency] = useState<AgencyConfig>(() => ({
    ...DEFAULT_AGENCY,
    ...initialAgency,
    isOnboardingCompleted: false,
  }));

  const resolvedTemplateId = agency.templateId ?? 'modern-blue';
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? INITIAL_THEME_CONFIG);
  const [selectedThemeId, setSelectedThemeId] = useState(resolvedTemplateId);

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleApplyTheme = (preset: typeof THEME_PRESETS[0]) => {
    setSelectedThemeId(preset.id);
    setAgency((prev) => ({ ...prev, templateId: preset.id }));
    setTheme((prev) => applyThemePreset(prev, preset));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgency(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col justify-between p-4 md:p-8 overflow-y-auto font-sans selection:bg-slate-900 selection:text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[100px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-100/10 rounded-full blur-[100px] -ml-40 -mb-40" />
      </div>

      {/* Mini top brand bar */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-200/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <ShieldCheck size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest leading-none block">eFCaaS</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Setup & Identidade</span>
          </div>
        </div>

        {/* Minimal Stepper Tracking */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          {[
            { num: 1, label: 'Identidade' },
            { num: 2, label: 'Governança & IA' },
            { num: 3, label: 'Ativação' }
          ].map((s) => (
            <div 
              key={s.num} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                step === s.num 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : step > s.num 
                    ? 'text-slate-800' 
                    : 'text-slate-400'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                step === s.num ? 'bg-white text-slate-900 font-extrabold' : step > s.num ? 'bg-slate-300 text-slate-800' : 'bg-slate-200 text-slate-400'
              }`}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Center Card Container */}
      <div className="relative z-10 flex-1 max-w-5xl w-full mx-auto my-6 flex flex-col justify-center shrink-0">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-brand"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
            >
              {/* Left Column: Essential branding */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: theme.general.accent }}>Identidade Básica</span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Sobre sua Agência</h2>
                  <p className="text-xs text-slate-500 mt-1">Insira os dados identificadores de faturamento e governança que ficarão impressos nos relatórios públicos.</p>
                </div>

                <div className="space-y-4">
                  {/* Agency Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Nome da Corporação</label>
                    <input 
                      type="text"
                      value={agency.name}
                      onChange={(e) => setAgency(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 text-base"
                      placeholder="Ex: Agência Lupa, Aos Fatos..."
                    />
                  </div>

                  {/* Language and Country Selectors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Idioma Oficial</label>
                      <select 
                        value={agency.language}
                        onChange={(e) => setAgency(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-700 bg-white"
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">País de Origem</label>
                      <select 
                        value={agency.country}
                        onChange={(e) => setAgency(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold text-slate-700 bg-white"
                      >
                        <option value="Brasil">Brasil</option>
                        <option value="Portugal">Portugal</option>
                        <option value="EUA">Estados Unidos</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo Upload Dropzone (Compact, elegant) */}
                  <div className="pt-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Logotipo da Agência</label>
                    <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className="relative group w-16 h-16 shrink-0 bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center">
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 bg-black/60 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Alt
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-700">Adicionar Logomarca</p>
                        <p className="text-[10px] text-slate-400">Arraste ou selecione arquivos SVG, PNG ou JPG de até 1MB.</p>
                        <label className="inline-block mt-1.5 text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer">
                          Procurar arquivo...
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic aesthetic pairings & font */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Aparência da UI</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Paleta e Tipografia</h2>
                    <p className="text-xs text-slate-500 mt-1">Estabeleça a identidade visual utilizada em todo o painel operacional.</p>
                  </div>

                  {/* Theme presets - high density list */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Tema do Sistema</label>
                    <div className="grid grid-cols-1 gap-2">
                      {THEME_PRESETS.map((themePreset) => {
                        const isSelected = selectedThemeId === themePreset.id;
                        const isDark = themePreset.mode === 'dark';
                        return (
                          <button
                            key={themePreset.id}
                            onClick={() => handleApplyTheme(themePreset)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                              isSelected 
                                ? 'border-slate-900 bg-slate-50 shadow-sm' 
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex gap-1 shrink-0 p-1 rounded-lg border border-slate-200/80"
                                style={{ backgroundColor: isDark ? themePreset.colors.background : '#f1f5f9' }}
                              >
                                <div
                                  className="w-4 h-4 rounded-full border shadow-inner"
                                  style={{ backgroundColor: themePreset.colors.accent }}
                                />
                                <div
                                  className="w-4 h-4 rounded-full border shadow-inner"
                                  style={{
                                    backgroundColor: isDark
                                      ? themePreset.colors.sidebar
                                      : '#ffffff',
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block text-slate-900 truncate">
                                  {themePreset.name}
                                  {isDark && (
                                    <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                      · Escuro
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">{themePreset.description}</span>
                              </div>
                            </div>
                            {isSelected && <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-extrabold shrink-0 ml-2">✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Simple compact Font selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">Fonte Tipográfica</label>
                    <div className="grid grid-cols-3 gap-2">
                      {FONTS.map((f) => {
                        const isChosen = theme.fontFamily === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.id }))}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              isChosen 
                                ? 'border-slate-900 bg-slate-50 shadow-sm font-bold text-slate-900' 
                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 text-slate-600'
                            }`}
                            style={{ fontFamily: f.id }}
                          >
                            <span className="text-[11px] block text-ellipsis overflow-hidden whitespace-nowrap">{f.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    💡 <span className="text-slate-700">Dica de IHC:</span> Um bom contraste visual e fontes bem dimensionadas aumentam a eficiência de leitura de checadores em até 30%.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-control"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
            >
              {/* Left Column: AI Modules config */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Módulos Inteligentes</span>
                  <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Engine de Inteligência Artificial</h2>
                  <p className="text-xs text-slate-500 mt-1">Ative as funcionalidades avançadas de processamento natural (NLP) do eFCaaS.</p>
                </div>

                <AiEngineModulesPanel
                  config={agency}
                  onChange={(key: AiModuleKey, enabled) =>
                    setAgency((prev) => ({ ...prev, [key]: enabled }))
                  }
                />
              </div>

              {/* Right Column: Roles & Governance configuration (Merged for high efficiency) */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-100/50 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest block mb-1">Governança e Equipes</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Perfis & Redação</h2>
                    <p className="text-xs text-slate-500 mt-1">Defina o modelo de hierarquia para aprovação de checagem.</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: true }))}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                        agency.useDefaultProfiles 
                          ? 'border-slate-900 bg-slate-50' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${agency.useDefaultProfiles ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">Configuração Simplificada</span>
                          <span className="text-[8px] bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Recomendado</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Carrega os perfis recomendados pela IFCN: Redator-Chefe, Checador Pleno e Publicador Externo.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: false }))}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                        !agency.useDefaultProfiles 
                          ? 'border-slate-900 bg-slate-50' 
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <div className={`p-2 rounded-xl mt-0.5 ${!agency.useDefaultProfiles ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Plus size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Personalização Livre</span>
                        <p className="text-[10px] text-slate-500 mt-1">Permite criar regras e dar cargos personalizados após ativação de maneira manual.</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-slate-500 text-[10px] font-semibold leading-relaxed">
                  ℹ️ <span className="text-slate-800">Nota:</span> Você pode alternar todos os recursos de inteligência artificial de forma independente nas configurações da agência a qualquer momento.
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-launch"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="max-w-xl mx-auto w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
            >
              {/* Confetti element decoration */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-indigo-500" />

              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={28} strokeWidth={2.5} />
              </div>

              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Pronto para Combater Desinformação</span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1">Configuração Concluída</h2>
                <p className="text-xs text-slate-500 mt-2">Os fluxos editoriais foram adequados às ótimas práticas de experiência (HCI) e governança.</p>
              </div>

              {/* Dynamic Identity Preview Badge */}
              <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center gap-4 text-left">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black overflow-hidden shrink-0"
                  style={{ backgroundColor: theme.general.accent, color: '#fff' }}
                >
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    agency.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 leading-tight">{agency.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8px] bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">ATIVO</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{agency.language} • {agency.country}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => onComplete(agency, theme)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_20px_40px_-5px_rgba(15,23,42,0.15)] active:scale-[0.99]"
                >
                  Confirmar e Ativar Agência
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stepper Wizard Actions Footer */}
      <div className="relative z-10 max-w-5xl w-full mx-auto pt-4 border-t border-slate-200/60 mt-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onClose && step === 1 ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-colors text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              Sair
            </button>
          ) : (
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-colors ${
                step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Anterior
            </button>
          )}
        </div>

        {step < 3 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm group"
          >
            Avançar
            <ArrowRight size={14} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <div className="w-10 h-10" />
        )}
      </div>
    </div>
  );
};
