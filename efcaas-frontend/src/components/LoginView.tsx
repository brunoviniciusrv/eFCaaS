import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, HelpCircle, X, Shield, User, Search, CheckCircle, ArrowLeft } from 'lucide-react';
import { PLATFORM_BRAND, PLATFORM_THEME } from '../platform/platformBranding';
import styles from './LoginView.module.css';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const TEST_ACCOUNTS = [
  { role: 'platform', email: 'platform@efcaas.com' },
  { role: 'admin', email: 'admin@efcaas.com' },
  { role: 'checker', email: 'beatriz.santos@factcheck.org' },
  { role: 'editor', email: 'cadu.editor@ais-news.com' },
  { role: 'curator', email: 'juliana.mendes@curadoria.com' },
] as const;

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const accentColor = PLATFORM_THEME.general.accent;

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

  return (
    <div className={styles.page} style={{ backgroundColor: `${accentColor}05` }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <div className={styles.cardBody}>
          <div className={styles.header}>
            <div className={styles.logoWrapPlain}>
              <img src={PLATFORM_BRAND.logoUrl} alt={PLATFORM_BRAND.name} className={styles.logoImgPlain} />
            </div>
            <h1 className={styles.brandName}>{PLATFORM_BRAND.name}</h1>
            <p className={styles.brandSub}>{PLATFORM_BRAND.tagline}</p>
          </div>

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
                  style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
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
                  style={{ '--tw-ring-color': `${accentColor}30` } as React.CSSProperties}
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

          <div className={styles.footerSection}>
            <button
              type="button"
              onClick={() => navigate('/')}
              className={styles.backLink}
              style={{ color: accentColor }}
            >
              <ArrowLeft size={14} />
              Voltar ao início
            </button>
          </div>
        </div>
      </motion.div>

      <button
        onClick={() => setShowHelp(true)}
        className={styles.helpBtn}
        style={{ color: accentColor }}
      >
        <HelpCircle size={24} />
      </button>

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
                    style={{ borderColor: `${accentColor}20` }}
                  >
                    <div className={styles.accountCardTop}>
                      <div className={styles.accountIconWrap}>
                        {account.role === 'platform' && <Shield size={16} className="text-purple-500" />}
                        {account.role === 'admin' && <Shield size={16} className="text-red-500" />}
                        {account.role === 'curator' && <Search size={16} style={{ color: accentColor }} />}
                        {account.role === 'checker' && <CheckCircle size={16} className="text-green-500" />}
                        {account.role === 'editor' && <User size={16} className="text-slate-500" />}
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
