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
  Layout,
  Eye,
  Bot,
  Zap,
  Users,
  Check,
  Globe,
  Monitor,
  Settings,
  Sparkles,
  Command,
  Plus,
  Search,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { ThemeConfig, AgencyConfig } from '../types';
import { INITIAL_THEME_CONFIG } from '../constants';

interface OnboardingFlowProps {
  onComplete: (agency: AgencyConfig, theme: ThemeConfig) => void;
}

const PRESET_TEMMES = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Limpo, profissional e focado em confiança.',
    colors: {
      accent: '#2563eb',
      background: '#f8fafc',
      sidebar: '#ffffff'
    }
  },
  {
    id: 'dark-slate',
    name: 'Dark Slate',
    description: 'Elegante, focado em monitoramento intensivo.',
    colors: {
      accent: '#38bdf8',
      background: '#0f172a',
      sidebar: '#1e293b'
    }
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Clean',
    description: 'Suave, focado em saúde e bem-estar.',
    colors: {
      accent: '#059669',
      background: '#f0fdf4',
      sidebar: '#ffffff'
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    description: 'Bold e tecnológico, foco em inovação.',
    colors: {
      accent: '#7c3aed',
      background: '#f5f3ff',
      sidebar: '#ffffff'
    }
  }
];

const FONTS = [
  { id: 'Inter', name: 'Inter (Padrão)' },
  { id: 'Outfit', name: 'Outfit (Moderno)' },
  { id: 'Space Grotesk', name: 'Space Grotesk (Tech)' },
  { id: 'Playfair Display', name: 'Playfair Display (Serif)' }
];

const TEMPLATES = [
  { id: 'standard', name: 'Padrão Editorial', description: 'Fluxo completo de checagem com revisão por pares.', icon: Layout },
  { id: 'fast', name: 'Agência Ágil', description: 'Otimizado para tempo real e redes sociais.', icon: Zap },
  { id: 'academic', name: 'Pesquisa Global', description: 'Foco em fontes primárias e análise aprofundada.', icon: Globe }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [agency, setAgency] = useState<AgencyConfig>({
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
    templateId: 'standard'
  });
  const [theme, setTheme] = useState<ThemeConfig>(INITIAL_THEME_CONFIG);

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleApplyTheme = (preset: typeof PRESET_TEMMES[0]) => {
    setTheme(prev => ({
      ...prev,
      general: { ...prev.general, accent: preset.colors.accent },
      dashboard: { ...prev.dashboard, background: preset.colors.background },
      sidebar: { ...prev.sidebar, background: preset.colors.sidebar },
      buttons: { ...prev.buttons, primary: preset.colors.accent }
    }));
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-xl mx-auto"
          >
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20">
                <ShieldCheck size={32} className="text-white" />
              </div>
              <h2 className="text-4xl font-black tracking-tight">Bem-vindo ao eFCaaS</h2>
              <p className="text-slate-500">Inicie a configuração da sua agência global de checagem de fatos.</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest opacity-50">Nome da Agência</label>
                <input 
                  type="text"
                  value={agency.name}
                  onChange={(e) => setAgency(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-xl font-bold"
                  placeholder="Ex: Agência Lupa, Aos Fatos..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-50">Idioma</label>
                  <select 
                    value={agency.language}
                    onChange={(e) => setAgency(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium"
                  >
                    <option value="pt-BR">Português (BR)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest opacity-50">País Sede</label>
                  <select 
                    value={agency.country}
                    onChange={(e) => setAgency(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium"
                  >
                    <option value="Brasil">Brasil</option>
                    <option value="Portugal">Portugal</option>
                    <option value="EUA">Estados Unidos</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black">Identidade Visual</h2>
              <p className="text-slate-500">Defina o DNA visual da sua plataforma para os usuários.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest opacity-50 block text-center">Logotipo da Agência</label>
                <div className="relative group w-48 h-48 mx-auto">
                  <div className="w-full h-full rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 duration-500">
                    {agency.logoUrl ? (
                      <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                    ) : (
                      <div className="text-center space-y-2">
                        <ImageIcon size={48} className="text-slate-300 mx-auto" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload PNG/SVG</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest opacity-50 block">Tipografia de Sistema</label>
                <div className="grid grid-cols-1 gap-3">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.id }))}
                      className={`px-6 py-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                        theme.fontFamily === f.id 
                          ? 'border-blue-500 bg-blue-50/50 text-blue-700 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      <span className="font-bold">{f.name}</span>
                      {theme.fontFamily === f.id && <Check size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black">Templates & Temas</h2>
              <p className="text-slate-500">Acelere seu fluxo com configurações pré-definidas para diferentes necessidades.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setAgency(prev => ({ ...prev, templateId: t.id }))}
                  className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 group ${
                    agency.templateId === t.id 
                      ? 'border-blue-600 bg-blue-50/20 shadow-xl' 
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${agency.templateId === t.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <t.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">{t.name}</h3>
                    <p className="text-sm opacity-60 leading-relaxed">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest opacity-50 block text-center">Paleta de Cores (UI Theme)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PRESET_TEMMES.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleApplyTheme(p)}
                    className={`p-5 rounded-3xl border-2 transition-all text-left space-y-4 ${
                      theme.general.accent === p.colors.accent 
                        ? 'border-blue-500 bg-white shadow-xl ring-4 ring-blue-500/5' 
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                    }`}
                  >
                    <div className="flex gap-1.5">
                      <div className="w-5 h-5 rounded-full shadow-inner" style={{ backgroundColor: p.colors.accent }} />
                      <div className="w-5 h-5 rounded-full border shadow-inner" style={{ backgroundColor: p.colors.background }} />
                      <div className="w-5 h-5 rounded-full border shadow-inner" style={{ backgroundColor: p.colors.sidebar }} />
                    </div>
                    <div>
                      <span className="text-sm font-black block">{p.name}</span>
                      <span className="text-[10px] opacity-50 block">{p.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-4xl mx-auto"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black">Engine e Inteligência</h2>
              <p className="text-slate-500">Configure os módulos de processamento e fontes externas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* AI Modules Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50 px-2">Módulos de I.A. Generativa</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'enableAI', label: 'I.A. Generativa Core', desc: 'Triagem e redação assistida.', icon: Sparkles, color: 'blue', bg: 'bg-blue-600', lightBg: 'border-blue-500 bg-blue-50/30' },
                    { id: 'enableSocialSearch', label: 'Buscador de Redes Sociais', desc: 'Monitoramento em plataformas.', icon: Search, color: 'sky', bg: 'bg-sky-600', lightBg: 'border-sky-500 bg-sky-50/30' },
                    { id: 'enableTrendAnalyzer', label: 'Analisador de Tendências', desc: 'Detecção proativa de virais.', icon: Zap, color: 'amber', bg: 'bg-amber-600', lightBg: 'border-amber-500 bg-amber-50/30' },
                    { id: 'enableMisinfoRisk', label: 'Risco de Desinformação', desc: 'Scoring de veracidade.', icon: AlertTriangle, color: 'rose', bg: 'bg-rose-600', lightBg: 'border-rose-500 bg-rose-50/30' },
                    { id: 'enableIllicitRisk', label: 'Risco de Ilicitudes', desc: 'Segurança e compliance.', icon: ShieldAlert, color: 'indigo', bg: 'bg-indigo-600', lightBg: 'border-indigo-500 bg-indigo-50/30' },
                  ].map(feature => (
                    <div 
                      key={feature.id}
                      className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${agency[feature.id as keyof AgencyConfig] ? feature.lightBg : 'border-slate-100 bg-white'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${agency[feature.id as keyof AgencyConfig] ? `${feature.bg} text-white` : 'bg-slate-100 text-slate-400'}`}>
                        <feature.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{feature.label}</h4>
                        <p className="text-[10px] opacity-60 truncate">{feature.desc}</p>
                      </div>
                      <button 
                        onClick={() => setAgency(prev => ({ ...prev, [feature.id]: !prev[feature.id as keyof AgencyConfig] }))}
                        className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${agency[feature.id as keyof AgencyConfig] ? feature.bg : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${agency[feature.id as keyof AgencyConfig] ? 'left-5' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-50 px-2">Fontes e Redes Externas</h3>
                
                <div className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col gap-6 ${agency.enableSpecializedNetwork ? 'border-purple-500 bg-purple-50/30' : 'border-slate-100 bg-white'}`}>
                  <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${agency.enableSpecializedNetwork ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-lg">Rede Especializada</h3>
                      <p className="text-xs opacity-60">Acesso a especialistas globais para validação de alta complexidade.</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-purple-200/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">Status da Conexão</span>
                      <button 
                        onClick={() => setAgency(prev => ({ ...prev, enableSpecializedNetwork: !prev.enableSpecializedNetwork }))}
                        className={`w-14 h-8 rounded-full relative transition-colors ${agency.enableSpecializedNetwork ? 'bg-purple-600' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${agency.enableSpecializedNetwork ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    
                    <div className="bg-white/50 p-4 rounded-xl space-y-2">
                       <div className="flex items-center justify-between text-[10px] font-bold opacity-40">
                         <span>SLA DE RESPOSTA</span>
                         <span>LATÊNCIA MÉDIA</span>
                       </div>
                       <div className="flex items-center justify-between text-xs font-black">
                         <span>&lt; 2 HORAS</span>
                         <span>140 MS</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-100/50 rounded-[2rem] border border-slate-200">
                  <div className="flex gap-3 text-slate-500">
                    <Settings size={18} className="shrink-0 mt-1" />
                    <p className="text-[11px] leading-relaxed font-medium">As configurações de Engine afetam diretamente o consumo de créditos de I.A. e o tempo de resposta da triagem inicial.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-2xl mx-auto"
          >
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-black">Gestão de Equipe</h2>
              <p className="text-slate-500">Como você prefere gerenciar as permissões de acesso?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: true }))}
                className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-6 text-left ${agency.useDefaultProfiles ? 'border-blue-500 bg-blue-50/30 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${agency.useDefaultProfiles ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Users size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg">Perfis Padrões (Recomendado)</h3>
                  <p className="text-sm opacity-60">Utilizar Admin, Editor, Checador e Curador pré-configurados.</p>
                </div>
                {agency.useDefaultProfiles && <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check size={18} /></div>}
              </button>

              <button
                onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: false }))}
                className={`p-6 rounded-3xl border-2 transition-all flex items-center gap-6 text-left ${!agency.useDefaultProfiles ? 'border-amber-500 bg-amber-50/30 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${!agency.useDefaultProfiles ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Plus size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-lg">Criar Novos Perfis e Roles</h3>
                  <p className="text-sm opacity-60">Defina permissões personalizadas desde o início para cada membro.</p>
                </div>
                {!agency.useDefaultProfiles && <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center"><Check size={18} /></div>}
              </button>
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div 
            key="step6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 max-w-xl mx-auto"
          >
            <div className="space-y-4 text-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-4xl font-black">Configuração Concluída</h2>
              <p className="text-slate-500">Sua agência está pronta para iniciar o combate à desinformação.</p>
            </div>

            <div className="rounded-[2.5rem] border-2 border-slate-100 p-10 space-y-8 bg-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[5rem] -mr-10 -mt-10" />
               
               <div className="flex items-center gap-6 relative z-10">
                <div 
                  className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 overflow-hidden shrink-0 border-4 border-white"
                  style={{ backgroundColor: theme.general.accent, color: '#fff' }}
                >
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="" className="w-full h-full object-contain p-2" />
                  ) : (
                    <ShieldCheck size={40} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-2xl tracking-tight" style={{ fontFamily: theme.fontFamily }}>{agency.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest leading-none">Global</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black leading-none">{agency.language} • {agency.country}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Módulo I.A</span>
                  <span className={`text-xs font-bold ${agency.enableAI ? 'text-green-600' : 'text-slate-400'}`}>{agency.enableAI ? 'ATIVADO' : 'DESATIVADO'}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">Rede de Checadores</span>
                  <span className={`text-xs font-bold ${agency.enableSpecializedNetwork ? 'text-purple-600' : 'text-slate-400'}`}>{agency.enableSpecializedNetwork ? 'ATIVADO' : 'DESATIVADO'}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="opacity-40">CARREGANDO ENGINE...</span>
                  <span className="text-blue-600">100%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full" 
                    style={{ backgroundColor: theme.general.accent }} 
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex items-center justify-center p-0 overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -mr-96 -mt-96" />
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-[100px] -ml-64 -mb-64" />
      </div>

      <div className="relative z-10 w-full h-full bg-white shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-80 bg-slate-900 p-10 text-white flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-12">
               <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tighter uppercase leading-none">eFCaaS</h1>
                <p className="text-[10px] font-black tracking-widest opacity-50 uppercase leading-none mt-1">Setup Wizard</p>
              </div>
            </div>
            
            <div className="space-y-8">
              {[
                { id: 1, label: 'Agência (Indentidade)', icon: ShieldCheck },
                { id: 2, label: 'Visual (Cores/Fonts)', icon: Palette },
                { id: 3, label: 'Templates & Temas', icon: Layout },
                { id: 4, label: 'Engine de IA & Rede', icon: Bot },
                { id: 5, label: 'Equipe & Perfis', icon: Users },
                { id: 6, label: 'Revisão Final', icon: Eye },
              ].map(s => (
                <div key={s.id} className={`flex items-center gap-4 transition-all duration-500 ${step === s.id ? 'translate-x-2' : ''} ${step >= s.id ? 'opacity-100' : 'opacity-20'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all ${step === s.id ? 'bg-blue-600 scale-110 shadow-lg shadow-blue-600/30' : 'bg-slate-800'}`}>
                    {step > s.id ? <Check size={16} /> : s.id}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block opacity-40 leading-none mb-1">Passo 0{s.id}</span>
                    <span className={`text-xs font-extrabold block leading-none ${step === s.id ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 border-t border-slate-800">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                 <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Configurando como</p>
                 <p className="text-sm font-bold leading-none">Admin Master</p>
               </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white flex flex-col min-h-0 relative">
          <div className="absolute top-10 right-10 flex items-center gap-6">
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Progresso</span>
                <div className="flex gap-1">
                   {[1,2,3,4,5,6].map(i => (
                     <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? (step === i ? 'w-8 bg-blue-600' : 'w-4 bg-slate-900') : 'w-2 bg-slate-100'}`} />
                   ))}
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-10 md:px-20 py-20 flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {renderStep()}
              </AnimatePresence>
            </div>

            <div className="mt-20 flex items-center justify-between">
              <button 
                onClick={prevStep}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all ${step === 1 ? 'invisible' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <ArrowLeft size={20} />
                Voltar
              </button>

              <div className="flex gap-4">
                {step < 6 ? (
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-95 group"
                  >
                    Próximo Passo
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => onComplete(agency, theme)}
                    className="flex items-center gap-3 px-16 py-6 bg-blue-600 text-white rounded-[2rem] text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-[0_25px_50px_-12px_rgba(37,99,235,0.4)] active:scale-95"
                  >
                    Ativar Agência Agora
                    <CheckCircle size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20 hidden md:block">
            <div className="flex items-center gap-8 text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">
               <span>Powered by eFCaaS Engine</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span>v4.0.2 Stable</span>
               <div className="w-1 h-1 rounded-full bg-slate-300" />
               <span>Enterprise Deployment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

