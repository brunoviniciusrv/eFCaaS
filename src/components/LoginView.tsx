import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Mail, ArrowRight, AlertCircle, CheckCircle2, Layout, Database, Radio } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { MOCK_USER } from '../constants';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulated login logic
    setTimeout(() => {
      if (email === 'admin@agencia.com' && password === 'admin123') {
        setSuccess(true);
        setTimeout(() => {
          onLogin(MOCK_USER);
          navigate('/');
        }, 1500);
      } else {
        setError('Credenciais inválidas. Use admin@agencia.com / admin123');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden font-sans selection:bg-black selection:text-white">
      {/* Visual Side */}
      <div className="hidden md:flex flex-1 bg-black relative p-20 flex-col justify-between items-start overflow-hidden border-r border-white/10">
        {/* Background Grid Elements */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px' 
          }} 
        />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        
        {/* Animated Crosshair */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/[0.03] rounded-full pointer-events-none flex items-center justify-center"
        >
          <div className="w-px h-full bg-white/[0.05]" />
          <div className="h-px w-full bg-white/[0.05] absolute" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-white text-black rounded-lg flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div className="h-px w-24 bg-white/20" />
          </div>
          <h1 className="font-display text-8xl font-black text-white leading-[0.85] tracking-tighter mb-8">
            FACT<br />
            CHECK<br />
            OS.
          </h1>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-technical text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">SISTEMA OPERACIONAL ATIVO</p>
            </div>
            <p className="font-serif text-2xl text-white/40 italic">Veritas Vincit</p>
          </div>
        </motion.div>

        <div className="relative z-10 grid grid-cols-2 gap-12 w-full mt-auto">
          <div>
            <p className="font-technical text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-4">MÉTRICAS DE REDE</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] text-white/50 font-bold">LATÊNCIA</span>
                <span className="font-technical text-[10px] text-white font-black">12ms</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] text-white/50 font-bold">UPTIME</span>
                <span className="font-technical text-[10px] text-white font-black">99.98%</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-end items-end text-right">
             <p className="font-technical text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-4">LOCALIZAÇÃO</p>
             <p className="font-technical text-[10px] text-white font-black">52.5200° N, 13.4050° E</p>
             <p className="text-[10px] text-white/50 font-bold mt-1">BERLIN NODE_01</p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white relative">
        <div className="absolute top-12 left-12 flex items-center gap-4 md:hidden">
          <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h2 className="font-display font-black tracking-tight text-xl">FACTCHECK OS</h2>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-sm"
        >
          <div className="mb-12">
            <p className="font-technical text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <Key size={12} className="text-black" />
              IDENTIFICAÇÃO REQUERIDA
            </p>
            <h3 className="font-display text-4xl font-black tracking-tighter text-black">Acessar Terminal</h3>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 rounded-3xl p-10 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-black text-emerald-900 mb-1">Bem-vindo, Curador</h4>
                <p className="text-emerald-700/60 text-sm font-bold">Iniciando sessão segura...</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-technical text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Email Institucional</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={18} />
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@agencia.com"
                        className="w-full h-14 pl-12 pr-6 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-black focus:ring-0 transition-all outline-none font-bold placeholder:text-black/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-technical text-[9px] font-black text-black/30 uppercase tracking-[0.2em] ml-2">Chave de Acesso</label>
                    <div className="relative group">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={18} />
                      <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-14 pl-12 pr-6 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-black focus:ring-0 transition-all outline-none font-bold placeholder:text-black/10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4"
                    >
                      <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                      <p className="text-xs font-bold text-red-700 leading-relaxed">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 bg-black text-white rounded-2xl flex items-center justify-between px-8 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 ease-in-out" />
                  <span className="font-technical text-xs font-black uppercase tracking-[0.2em] relative z-10">
                    {isLoading ? 'Autenticando...' : 'Iniciar Sessão'}
                  </span>
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                  ) : (
                    <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>

          <div className="mt-16 grid grid-cols-3 gap-8 grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-help">
            <div className="flex flex-col items-center gap-2">
              <Database size={20} />
              <span className="text-[8px] font-black">SECURE_SYNC</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Radio size={20} />
              <span className="text-[8px] font-black">ENCRYPT_TLS</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Layout size={20} />
              <span className="text-[8px] font-black">MULTI_TENANT</span>
            </div>
          </div>
        </motion.div>

        <div className="absolute bottom-12 text-center">
           <p className="font-technical text-[8px] font-black text-black/20 uppercase tracking-[0.4em]">
             Agencia de Fatos © {new Date().getFullYear()} — V3.0.4-STABLE
           </p>
        </div>
      </div>
    </div>
  );
}
