import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, Settings, HelpCircle, X, Shield, User, Search, CheckCircle } from 'lucide-react';
import { ThemeConfig } from '../types';
import styles from './LoginView.module.css';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onOpenOnboarding: () => void;
  themeConfig: ThemeConfig;
  agencyConfig: any;
}

const TEST_ACCOUNTS = [
  { role: 'admin',   email: 'admin@efcaas.com' },
  { role: 'checker', email: 'beatriz.santos@factcheck.org' },
  { role: 'editor',  email: 'cadu.editor@ais-news.com' },
  { role: 'curator', email: 'juliana.mendes@curadoria.com' },
] as const;

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onOpenOnboarding, themeConfig, agencyConfig }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-mail ou senha incorretos.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Admin@2026!');
    setShowHelp(false);
  };

  const isConfigured = agencyConfig?.isOnboardingCompleted;
  const brandName = isConfigured ? agencyConfig.name : 'eFCaaS';
  const brandSub = isConfigured ? '' : 'Evidence-based Fact-Checking as a Service';
  const accentColor = themeConfig.general.accent;

  return (
    <div className={styles.page} style={{ backgroundColor: `${accentColor}05` }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className={styles.cardBody}>
          {/* Header */}
          <div className={styles.header}>
            <div 
              className={styles.logoWrap}
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px ${accentColor}30` }}
            >
              {agencyConfig?.logoUrl ? (
                <img src={agencyConfig.logoUrl} alt="Logo" className={styles.logoImg} />
              ) : (
                <Shield className="text-white" size={32} />
              )}
            </div>
            <h1 className={styles.brandName}>{brandName}</h1>
            {brandSub && <p className={styles.brandSub}>{brandSub}</p>}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>E-mail</label>
              <div className={styles.inputWrap}>
                <div className={styles.inputIcon}>
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail de acesso"
                  className={styles.input}
                  style={{ '--tw-ring-color': `${accentColor}30` } as any}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Senha</label>
              <div className={styles.inputWrap}>
                <div className={styles.inputIcon}>
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={styles.input}
                  style={{ '--tw-ring-color': `${accentColor}30` } as any}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={styles.errorMsg}
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px ${accentColor}40` }}
            >
              {isLoading ? (
                <div className={styles.spinner} />
              ) : (
                <>
                  ACESSAR SISTEMA
                  <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className={styles.footerSection}>
            <div className={styles.onboardingCard}>
              <div className={styles.onboardingCardContent}>
                <p className={styles.onboardingCardTitle}>Identidade Corporativa</p>
                <p className={styles.onboardingCardDesc}>Personalize a identidade visual, governança e ferramentas de IA da sua agência.</p>
              </div>
              <button 
                onClick={onOpenOnboarding}
                className={styles.onboardingBtn}
                style={{ backgroundColor: accentColor }}
              >
                <Settings size={10} strokeWidth={3} />
                Ajustar
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Help Button */}
      <button 
        onClick={() => setShowHelp(true)}
        className={styles.helpBtn}
        style={{ color: themeConfig.general.accent }}
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className={styles.overlay}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={styles.modal}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Perfis de Teste</h2>
                <button onClick={() => setShowHelp(false)} className={styles.modalCloseBtn}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.accountGrid}>
                {TEST_ACCOUNTS.map((account) => (
                  <button 
                    key={account.email}
                    onClick={() => fillCredentials(account.email)}
                    className={styles.accountCard}
                    style={{ borderColor: `${themeConfig.general.accent}20` }}
                  >
                    <div className={styles.accountCardTop}>
                       <div className={styles.accountIconWrap}>
                          {account.role === 'admin'   && <Shield      size={16} className="text-red-500" />}
                          {account.role === 'curator' && <Search      size={16} style={{ color: themeConfig.general.accent }} />}
                          {account.role === 'checker' && <CheckCircle size={16} className="text-green-500" />}
                          {account.role === 'editor'  && <User        size={16} className="text-slate-500" />}
                       </div>
                       <div className="flex-1">
                          <p className={styles.accountRoleLabel}>{account.role}</p>
                       </div>
                    </div>
                    <p className={styles.accountEmail}>{account.email}</p>
                    <p className={styles.accountHint}>Clique para preencher</p>
                  </button>
                ))}
              </div>
              <div className={styles.modalFooter}>
                <p className={styles.modalFooterText}>
                  Senha padrão para todos: <span className="text-slate-900">Admin@2026!</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
