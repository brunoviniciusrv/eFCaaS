import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, Settings, HelpCircle, X, Shield, User, Search, CheckCircle } from 'lucide-react';
import { UserProfile, ThemeConfig } from '../types';
import { MOCK_USERS } from '../constants';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
  onOpenOnboarding: () => void;
  themeConfig: ThemeConfig;
  agencyConfig: any;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onOpenOnboarding, themeConfig, agencyConfig }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email);
      if (user) {
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos. Use o "?" para ver os acessos de teste.');
        setIsLoading(false);
      }
    }, 1000);
  };

  const fillCredentials = (user: UserProfile) => {
    setEmail(user.email);
    setPassword('senha123'); // Custom mock password
    setShowHelp(false);
  };

  const isConfigured = agencyConfig?.isOnboardingCompleted;
  const brandName = isConfigured ? agencyConfig.name : 'eFCaaS';
  const brandSub = isConfigured ? '' : 'Evidence-based Fact-Checking as a Service';
  const accentColor = themeConfig.general.accent;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 font-sans" style={{ backgroundColor: `${accentColor}05` }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
      >
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg overflow-hidden"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 20px ${accentColor}30` }}
            >
              {agencyConfig?.logoUrl ? (
                <img src={agencyConfig.logoUrl} alt="Logo" className="w-full h-full object-fill" />
              ) : (
                <Shield className="text-white" size={32} />
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{brandName}</h1>
            {brandSub && <p className="text-sm text-slate-500 font-medium tracking-tight line-clamp-2">{brandSub}</p>}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                  <Mail size={18} />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail de acesso"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': `${accentColor}30` } as any}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">Senha</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                  <Lock size={18} />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
                  style={{ '--tw-ring-color': `${accentColor}30` } as any}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-bold text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              style={{ backgroundColor: accentColor, boxShadow: `0 10px 25px ${accentColor}40` }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  ACESSAR SISTEMA
                  <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-50 flex flex-col gap-4">
            <button 
              onClick={onOpenOnboarding}
              className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
              onMouseEnter={(e) => (e.currentTarget.style.color = accentColor)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '')}
            >
              <Settings size={14} />
              Configurar Agência
            </button>
          </div>
        </div>
      </motion.div>

      {/* Help Button */}
      <button 
        onClick={() => setShowHelp(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:shadow-xl transition-all"
      >
        <HelpCircle size={24} />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-black tracking-tight">Perfis de Teste</h2>
                <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MOCK_USERS.map((user) => (
                  <button 
                    key={user.id}
                    onClick={() => fillCredentials(user)}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                       <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                          {user.role === 'admin' && <Shield size={16} className="text-red-500" />}
                          {user.role === 'curator' && <Search size={16} className="text-blue-500" />}
                          {user.role === 'checker' && <CheckCircle size={16} className="text-green-500" />}
                          {user.role === 'editor' && <User size={16} className="text-slate-500" />}
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-tight text-slate-900">{user.role}</p>
                       </div>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 group-hover:text-blue-600 truncate">{user.email}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">Clique para preencher</p>
                  </button>
                ))}
              </div>
              <div className="p-6 bg-slate-50 text-center">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Senha padrão para todos: <span className="text-slate-900">qualquer senha</span></p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
