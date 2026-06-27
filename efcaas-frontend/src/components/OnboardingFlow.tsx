import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Image as ImageIcon, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Users,
  Plus,
  ChevronRight
} from 'lucide-react';
import { ThemeConfig, AgencyConfig } from '../types';
import { AiEngineModulesPanel } from './AiEngineModulesPanel';
import { AiModuleKey } from '../config/aiModules';
import { INITIAL_THEME_CONFIG } from '../constants';
import { THEME_PRESETS, applyThemePreset } from '../config/themePresets';
import styles from './OnboardingFlow.module.css';

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

  const stepItems = [
    { num: 1, label: 'Identidade' },
    { num: 2, label: 'Governança & IA' },
    { num: 3, label: 'Ativação' }
  ];

  return (
    <div className={styles.page}>
      {/* Background gradients */}
      <div className={styles.bgBlob1}>
        <div className={styles.bgGrad1} />
        <div className={styles.bgGrad2} />
      </div>

      {/* Mini top brand bar */}
      <div className={styles.topBar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={18} strokeWidth={2.5} />
          </div>
          <div>
            <span className={styles.brandTitle}>eFCaaS</span>
            <span className={styles.brandSub}>Setup & Identidade</span>
          </div>
        </div>

        {/* Minimal Stepper Tracking */}
        <div className={styles.stepper}>
          {stepItems.map((s) => (
            <div 
              key={s.num} 
              className={step === s.num ? styles.stepActive : step > s.num ? styles.stepDone : styles.stepPending}
            >
              <span className={step === s.num ? styles.stepNumActive : step > s.num ? styles.stepNumDone : styles.stepNumPending}>
                {step > s.num ? '✓' : s.num}
              </span>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Center Card Container */}
      <div className={styles.centerWrap}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-brand"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className={styles.stepGrid}
            >
              {/* Left Column: Essential branding */}
              <div className={styles.leftCard}>
                <div>
                  <span className={styles.cardSectionLabel} style={{ color: theme.general.accent }}>Identidade Básica</span>
                  <h2 className={styles.cardTitle}>Sobre sua Agência</h2>
                  <p className={styles.cardDesc}>Insira os dados identificadores de faturamento e governança que ficarão impressos nos relatórios públicos.</p>
                </div>

                <div className={styles.formSection}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Nome da Corporação</label>
                    <input 
                      type="text"
                      value={agency.name}
                      onChange={(e) => setAgency(prev => ({ ...prev, name: e.target.value }))}
                      className={styles.textInput}
                      placeholder="Ex: Agência Lupa, Aos Fatos..."
                    />
                  </div>

                  <div className={styles.twoCol}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Idioma Oficial</label>
                      <select 
                        value={agency.language}
                        onChange={(e) => setAgency(prev => ({ ...prev, language: e.target.value }))}
                        className={styles.select}
                      >
                        <option value="pt-BR">Português (BR)</option>
                        <option value="en">English (US)</option>
                        <option value="es">Español</option>
                      </select>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>País de Origem</label>
                      <select 
                        value={agency.country}
                        onChange={(e) => setAgency(prev => ({ ...prev, country: e.target.value }))}
                        className={styles.select}
                      >
                        <option value="Brasil">Brasil</option>
                        <option value="Portugal">Portugal</option>
                        <option value="EUA">Estados Unidos</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.logoSection}>
                    <label className={styles.fieldLabel}>Logotipo da Agência</label>
                    <div className={styles.logoDropzone}>
                      <div className={agency.logoUrl ? styles.logoThumbPlain : styles.logoThumb}>
                        {agency.logoUrl ? (
                          <img src={agency.logoUrl} alt="Logo" className={styles.logoImgPlain} />
                        ) : (
                          <ImageIcon size={22} className="text-slate-300" />
                        )}
                        <label className={styles.logoOverlay}>
                          Alt
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                      <div className={styles.logoInfo}>
                        <p className={styles.logoTitle}>Adicionar Logomarca</p>
                        <p className={styles.logoHint}>Arraste ou selecione arquivos SVG, PNG ou JPG de até 1MB.</p>
                        <label className={styles.logoLink}>
                          Procurar arquivo...
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic aesthetic pairings & font */}
              <div className={styles.rightCard}>
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Aparência da UI</span>
                    <h2 className={styles.cardTitle}>Paleta e Tipografia</h2>
                    <p className={styles.cardDesc}>Estabeleça a identidade visual utilizada em todo o painel operacional.</p>
                  </div>

                  <div className="space-y-2">
                    <label className={styles.fieldLabel}>Tema do Sistema</label>
                    <div className={styles.themeList}>
                      {THEME_PRESETS.map((themePreset) => {
                        const isSelected = selectedThemeId === themePreset.id;
                        const isDark = themePreset.mode === 'dark';
                        return (
                          <button
                            key={themePreset.id}
                            onClick={() => handleApplyTheme(themePreset)}
                            className={isSelected ? styles.themeBtnActive : styles.themeBtnInactive}
                          >
                            <div className={styles.themeBtnInner}>
                              <div
                                className={styles.themeSwatches}
                                style={{ backgroundColor: isDark ? themePreset.colors.background : '#f1f5f9' }}
                              >
                                <div className={styles.themeSwatch} style={{ backgroundColor: themePreset.colors.accent }} />
                                <div className={styles.themeSwatch} style={{ backgroundColor: isDark ? themePreset.colors.sidebar : '#ffffff' }} />
                              </div>
                              <div className={styles.themeInfo}>
                                <span className={styles.themeName}>
                                  {themePreset.name}
                                  {isDark && <span className={styles.themeDarkBadge}>· Escuro</span>}
                                </span>
                                <span className={styles.themeDesc}>{themePreset.description}</span>
                              </div>
                            </div>
                            {isSelected && <div className={styles.themeCheck}>✓</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={styles.fieldLabel}>Fonte Tipográfica</label>
                    <div className={styles.fontGrid}>
                      {FONTS.map((f) => {
                        const isChosen = theme.fontFamily === f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => setTheme(prev => ({ ...prev, fontFamily: f.id }))}
                            className={isChosen ? styles.fontBtnActive : styles.fontBtnInactive}
                            style={{ fontFamily: f.id }}
                          >
                            <span className={styles.fontName}>{f.name.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={styles.tip}>
                  <p className={styles.tipText}>
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
              className={styles.stepGrid}
            >
              {/* Left Column: AI Modules config */}
              <div className={styles.leftCard}>
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest block mb-1">Módulos Inteligentes</span>
                  <h2 className={styles.cardTitle}>Engine de Inteligência Artificial</h2>
                  <p className={styles.cardDesc}>Ative as funcionalidades avançadas de processamento natural (NLP) do eFCaaS.</p>
                </div>

                <AiEngineModulesPanel
                  config={agency}
                  onChange={(key: AiModuleKey, enabled) =>
                    setAgency((prev) => ({ ...prev, [key]: enabled }))
                  }
                />
              </div>

              {/* Right Column: Roles & Governance */}
              <div className={styles.rightCard}>
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase text-purple-600 tracking-widest block mb-1">Governança e Equipes</span>
                    <h2 className={styles.cardTitle}>Perfis & Redação</h2>
                    <p className={styles.cardDesc}>Defina o modelo de hierarquia para aprovação de checagem.</p>
                  </div>

                  <div className={styles.governanceList}>
                    <button
                      onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: true }))}
                      className={agency.useDefaultProfiles ? styles.optionBtnActive : styles.optionBtnInactive}
                    >
                      <div className={agency.useDefaultProfiles ? styles.optionIconActive : styles.optionIconInactive}>
                        <Users size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={styles.optionTitle}>Configuração Simplificada</span>
                          <span className={styles.recommendedBadge}>Recomendado</span>
                        </div>
                        <p className={styles.optionDesc}>Carrega os perfis recomendados pela IFCN: Redator-Chefe, Checador Pleno e Publicador Externo.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setAgency(prev => ({ ...prev, useDefaultProfiles: false }))}
                      className={!agency.useDefaultProfiles ? styles.optionBtnActive : styles.optionBtnInactive}
                    >
                      <div className={!agency.useDefaultProfiles ? styles.optionIconActive : styles.optionIconInactive}>
                        <Plus size={16} />
                      </div>
                      <div>
                        <span className={styles.optionTitle}>Personalização Livre</span>
                        <p className={styles.optionDesc}>Permite criar regras e dar cargos personalizados após ativação de maneira manual.</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className={styles.infoNote}>
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
              className={styles.launchCard}
            >
              <div className={styles.launchStripe} />

              <div className={styles.launchIcon}>
                <CheckCircle size={28} strokeWidth={2.5} />
              </div>

              <div>
                <span className={styles.launchTagline}>Pronto para Combater Desinformação</span>
                <h2 className={styles.launchTitle}>Configuração Concluída</h2>
                <p className={styles.launchDesc}>Os fluxos editoriais foram adequados às ótimas práticas de experiência (HCI) e governança.</p>
              </div>

              {/* Dynamic Identity Preview Badge */}
              <div className={styles.identityBadge}>
                <div 
                  className={agency.logoUrl ? styles.identityLogoPlain : styles.identityLogoWrap}
                  style={agency.logoUrl ? undefined : { backgroundColor: theme.general.accent, color: '#fff' }}
                >
                  {agency.logoUrl ? (
                    <img src={agency.logoUrl} alt="Logo" className={styles.identityLogoImg} />
                  ) : (
                    agency.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className={styles.identityName}>{agency.name}</h3>
                  <div className={styles.identityMeta}>
                    <span className={styles.identityActiveBadge}>ATIVO</span>
                    <span className={styles.identityLocale}>{agency.language} • {agency.country}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => onComplete(agency, theme)}
                  className={styles.confirmBtn}
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
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          {onClose && step === 1 ? (
            <button onClick={onClose} className={styles.exitBtn}>
              Sair
            </button>
          ) : (
            <button
              onClick={prevStep}
              disabled={step === 1}
              className={step === 1 ? styles.prevBtnHidden : styles.prevBtnVisible}
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Anterior
            </button>
          )}
        </div>

        {step < 3 ? (
          <button onClick={nextStep} className={styles.nextBtn}>
            Avançar
            <ArrowRight size={14} strokeWidth={2.5} className={styles.nextBtnIcon} />
          </button>
        ) : (
          <div className={styles.footerSpacer} />
        )}
      </div>
    </div>
  );
};
