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
  Eye
} from 'lucide-react';
import { ThemeConfig, AgencyConfig } from '../types';
import { INITIAL_THEME_CONFIG } from '../constants';

interface OnboardingFlowProps {
  onComplete: (agency: AgencyConfig, theme: ThemeConfig) => void;
}

const PRESET_THEMES = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    colors: {
      accent: '#2563eb',
      background: '#f8fafc',
      sidebar: '#ffffff'
    }
  },
  {
    id: 'dark-slate',
    name: 'Dark Slate',
    colors: {
      accent: '#38bdf8',
      background: '#0f172a',
      sidebar: '#1e293b'
    }
  },
  {
    id: 'emerald-clean',
    name: 'Emerald Clean',
    colors: {
      accent: '#059669',
      background: '#f0fdf4',
      sidebar: '#ffffff'
    }
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
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

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(1);
  const [agency, setAgency] = useState<AgencyConfig>({
    name: 'Minha Agência de Checagem',
    logoUrl: '',
    isOnboardingCompleted: false
  });
  const [theme, setTheme] = useState<ThemeConfig>(INITIAL_THEME_CONFIG);

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleApplyTheme = (preset: typeof PRESET_THEMES[0]) => {
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Bem-vindo ao eFCaaS</h2>
              <p className="text-slate-500">Vamos começar configurando a identidade da sua agência.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Nome da Agência</label>
                <input 
                  type="text"
                  value={agency.name}
                  onChange={(e) => setAgency(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Agência Lupa, Aos Fatos..."
                />
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Identidade Visual</h2>
              <p className="text-slate-500">Adicione seu logo e escolha a tipografia da plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-semibold block">Logo da Agência</label>
                <div className="relative group w-32 h-32 mx-auto md:mx-0">
                  <div className="w-full h-full rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:bg-slate-100 transition-colors">
                    {agency.logoUrl ? (
                      <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon size={32} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold block">Fonte Principal</label>
                <div className="grid grid-cols-1 gap-2">
                  {FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.id }))}
                      className={`px-4 py-3 rounded-xl border text-left transition-all ${
                        theme.fontFamily === f.id 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ fontFamily: f.id }}
                    >
                      {f.name}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Cores e Temas</h2>
              <p className="text-slate-500">Escolha um tema base ou personalize as cores principais.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {PRESET_THEMES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleApplyTheme(p)}
                  className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                    theme.general.accent === p.colors.accent 
                      ? 'border-blue-500 ring-2 ring-blue-500/20' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.colors.accent }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.colors.background }} />
                    <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: p.colors.sidebar }} />
                  </div>
                  <span className="text-xs font-bold block">{p.name}</span>
                </button>
              ))}
            </div>

            <div className="pt-4 space-y-4">
              <label className="text-sm font-semibold block">Cor de Destaque (Accent)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={theme.general.accent}
                  onChange={(e) => setTheme(prev => ({ 
                    ...prev, 
                    general: { ...prev.general, accent: e.target.value },
                    buttons: { ...prev.buttons, primary: e.target.value }
                  }))}
                  className="w-12 h-12 rounded-lg cursor-pointer border-none"
                />
                <span className="text-sm font-mono text-slate-500 uppercase">{theme.general.accent}</span>
              </div>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold">Tudo pronto!</h2>
              <p className="text-slate-500">Confira como ficou a identidade da sua plataforma.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 space-y-6 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: theme.general.accent, color: '#fff' }}
                >
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="" className="w-8 h-8 object-contain" />
                  ) : (
                    <ShieldCheck size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg" style={{ fontFamily: theme.fontFamily }}>{agency.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Plataforma de Checagem</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="h-2 rounded-full bg-slate-100" />
                <div className="h-2 rounded-full" style={{ backgroundColor: theme.general.accent }} />
                <div className="h-2 rounded-full bg-slate-100" />
              </div>

              <button 
                disabled
                className="w-full py-3 rounded-xl text-sm font-bold opacity-80"
                style={{ backgroundColor: theme.buttons.primary, color: theme.buttons.primaryText }}
              >
                Botão de Exemplo
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar Info */}
        <div className="w-full md:w-64 bg-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-8">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-bold mb-2">Configuração Inicial</h1>
            <p className="text-slate-400 text-sm">Personalize sua instância do eFCaaS em poucos passos.</p>
          </div>

          <div className="space-y-4 mt-8 md:mt-0">
            {[
              { id: 1, label: 'Agência', icon: ShieldCheck },
              { id: 2, label: 'Identidade', icon: ImageIcon },
              { id: 3, label: 'Estilo', icon: Palette },
              { id: 4, label: 'Revisão', icon: Eye },
            ].map(s => (
              <div key={s.id} className={`flex items-center gap-3 transition-opacity ${step >= s.id ? 'opacity-100' : 'opacity-30'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.id ? 'bg-blue-600' : 'bg-slate-800'}`}>
                  {step > s.id ? <CheckCircle size={12} /> : s.id}
                </div>
                <span className="text-xs font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center justify-between">
            <button 
              onClick={prevStep}
              className={`flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors ${step === 1 ? 'invisible' : ''}`}
            >
              <ArrowLeft size={18} />
              Voltar
            </button>

            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                Próximo
                <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={() => onComplete(agency, theme)}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 active:scale-95"
              >
                Salvar e Começar
                <CheckCircle size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
