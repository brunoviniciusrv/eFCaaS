import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Mail, 
  Lock, 
  LogOut 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, ThemeConfig, View } from '../types';
import { MOCK_USERS } from '../constants';

interface ProfileViewProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  profileForm: UserProfile;
  setProfileForm: React.Dispatch<React.SetStateAction<UserProfile>>;
  emailForm: any;
  setEmailForm: React.Dispatch<React.SetStateAction<any>>;
  passwordForm: any;
  setPasswordForm: React.Dispatch<React.SetStateAction<any>>;
  profileMessage: { type: 'success' | 'error', text: string } | null;
  handleSaveProfile: () => void;
  handleUpdateEmail: () => void;
  handleUpdatePassword: () => void;
  handleAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogout: () => void;
  themeConfig: ThemeConfig;
}

export const ProfileView = ({
  user,
  setUser,
  profileForm,
  setProfileForm,
  emailForm,
  setEmailForm,
  passwordForm,
  setPasswordForm,
  profileMessage,
  handleSaveProfile,
  handleUpdateEmail,
  handleUpdatePassword,
  handleAvatarUpload,
  handleLogout,
  themeConfig
}: ProfileViewProps) => {
  const navigate = useNavigate();
  return (
    <div className="p-8 max-w-4xl mx-auto" style={{ color: themeConfig.dashboard.text }}>
      <header className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: themeConfig.dashboard.text }}>Configurações de Perfil</h1>
        <p className="opacity-60">Gerencie suas informações pessoais e segurança da conta.</p>
      </header>

      {profileMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-2xl mb-8 flex items-center gap-3 text-sm font-medium border",
          )}
          style={{ 
            backgroundColor: profileMessage.type === 'success' ? `${themeConfig.status.success}15` : `${themeConfig.status.error}15`,
            color: profileMessage.type === 'success' ? themeConfig.status.success : themeConfig.status.error,
            borderColor: profileMessage.type === 'success' ? `${themeConfig.status.success}30` : `${themeConfig.status.error}30`
          }}
        >
          {profileMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {profileMessage.text}
        </motion.div>
      )}

      <div className="space-y-8">
        {/* Dados Básicos */}
        <section 
          className="rounded-3xl border shadow-sm overflow-hidden"
          style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
        >
          <div className="p-6 border-b flex items-center gap-2" style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
            <User size={18} style={{ color: themeConfig.general.accent }} />
            <h2 className="font-bold" style={{ color: themeConfig.dashboard.text }}>Dados Básicos</h2>
          </div>
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <img src={profileForm.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 shadow-inner" style={{ borderColor: themeConfig.general.border }} />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">JPG ou PNG, máx 2MB</p>
              </div>
              
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Nome Completo</label>
                    <input 
                      type="text" 
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Cargo / Função</label>
                    <input 
                      type="text" 
                      value={profileForm.role}
                      disabled
                      className="w-full px-4 py-2.5 border rounded-xl opacity-50 cursor-not-allowed"
                      style={{ 
                        backgroundColor: themeConfig.general.inputBackground, 
                        borderColor: themeConfig.general.inputBorder,
                        color: themeConfig.general.inputText
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Biografia</label>
                  <textarea 
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all resize-none"
                    style={{ 
                      backgroundColor: themeConfig.general.inputBackground, 
                      borderColor: themeConfig.general.inputBorder,
                      color: themeConfig.general.inputText
                    }}
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
                  style={{ 
                    backgroundColor: themeConfig.buttons.primary, 
                    color: themeConfig.buttons.primaryText,
                    boxShadow: `0 10px 15px -3px ${themeConfig.buttons.primary}30`
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section 
            className="rounded-3xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
          >
            <div className="p-6 border-b flex items-center gap-2" style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
              <Mail size={18} style={{ color: themeConfig.general.accent }} />
              <h2 className="font-bold" style={{ color: themeConfig.dashboard.text }}>Alterar E-mail</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Novo E-mail</label>
                <input 
                  type="email" 
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="exemplo@email.com"
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Senha Atual</label>
                <input 
                  type="password" 
                  value={emailForm.password}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText
                  }}
                />
              </div>
              <button 
                onClick={handleUpdateEmail}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ 
                  backgroundColor: themeConfig.buttons.secondary, 
                  color: themeConfig.buttons.secondaryText 
                }}
              >
                Solicitar Alteração
              </button>
            </div>
          </section>

          {/* Alterar Senha */}
          <section 
            className="rounded-3xl border shadow-sm overflow-hidden"
            style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
          >
            <div className="p-6 border-b flex items-center gap-2" style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
              <Lock size={18} style={{ color: themeConfig.general.accent }} />
              <h2 className="font-bold" style={{ color: themeConfig.dashboard.text }}>Alterar Senha</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Senha Atual</label>
                <input 
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold opacity-50 uppercase tracking-wider" style={{ color: themeConfig.dashboard.text }}>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-4 py-2.5 border rounded-xl focus:outline-none transition-all"
                  style={{ 
                    backgroundColor: themeConfig.general.inputBackground, 
                    borderColor: themeConfig.general.inputBorder,
                    color: themeConfig.general.inputText
                  }}
                />
              </div>
              <button 
                onClick={handleUpdatePassword}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ 
                  backgroundColor: themeConfig.buttons.secondary, 
                  color: themeConfig.buttons.secondaryText 
                }}
              >
                Redefinir Senha
              </button>
            </div>
          </section>
        </div>

        <div className="pt-8 flex justify-center">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-2xl transition-all hover:bg-red-50"
            style={{ color: themeConfig.status.error }}
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
