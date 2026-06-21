import React from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  Mail, 
  Lock, 
  LogOut 
} from 'lucide-react';
import { UserProfile, ThemeConfig } from '../types';
import styles from './ProfileView.module.css';

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
  return (
    <div className={styles.page} style={{ color: themeConfig.dashboard.text }}>
      <header className={styles.header}>
        <h1 className={styles.title} style={{ color: themeConfig.dashboard.text }}>Configurações de Perfil</h1>
        <p className={styles.subtitle}>Gerencie suas informações pessoais e segurança da conta.</p>
      </header>

      {profileMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.alert}
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

      <div className={styles.body}>
        {/* Dados Básicos */}
        <section 
          className={styles.section}
          style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
        >
          <div className={styles.sectionHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
            <User size={18} style={{ color: themeConfig.general.accent }} />
            <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>Dados Básicos</h2>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.profileRow}>
              <div className={styles.avatarWrap}>
                <div className={styles.avatarGroup}>
                  <img src={profileForm.avatarUrl} alt="Avatar" className={styles.avatarImg} style={{ borderColor: themeConfig.general.border }} />
                  <label className={styles.avatarOverlay}>
                    <Camera size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <p className={styles.avatarHint}>JPG ou PNG, máx 2MB</p>
              </div>
              
              <div className={styles.fields}>
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Nome Completo</label>
                    <input 
                      type="text" 
                      value={profileForm.name}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                      className={styles.input}
                      style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Cargo / Função</label>
                    <input 
                      type="text" 
                      value={profileForm.role}
                      disabled
                      className={styles.inputDisabled}
                      style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                    />
                  </div>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Biografia</label>
                  <textarea 
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className={styles.textarea}
                    style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                  />
                </div>
                <button 
                  onClick={handleSaveProfile}
                  className={styles.saveBtn}
                  style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText, boxShadow: `0 10px 15px -3px ${themeConfig.buttons.primary}30` }}
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <div className={styles.securityGrid}>
          <section 
            className={styles.section}
            style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
          >
            <div className={styles.sectionHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
              <Mail size={18} style={{ color: themeConfig.general.accent }} />
              <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>Alterar E-mail</h2>
            </div>
            <div className={styles.sectionBodySmall}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Novo E-mail</label>
                <input 
                  type="email" 
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                  placeholder="exemplo@email.com"
                  className={styles.input}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Senha Atual</label>
                <input 
                  type="password" 
                  value={emailForm.password}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  className={styles.input}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                />
              </div>
              <button 
                onClick={handleUpdateEmail}
                className={styles.actionBtn}
                style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
              >
                Solicitar Alteração
              </button>
            </div>
          </section>

          {/* Alterar Senha */}
          <section 
            className={styles.section}
            style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
          >
            <div className={styles.sectionHeader} style={{ backgroundColor: `${themeConfig.dashboard.background}50`, borderColor: themeConfig.general.border }}>
              <Lock size={18} style={{ color: themeConfig.general.accent }} />
              <h2 className={styles.sectionTitle} style={{ color: themeConfig.dashboard.text }}>Alterar Senha</h2>
            </div>
            <div className={styles.sectionBodySmall}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Senha Atual</label>
                <input 
                  type="password" 
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                  className={styles.input}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  className={styles.input}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} style={{ color: themeConfig.dashboard.text }}>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  className={styles.input}
                  style={{ backgroundColor: themeConfig.general.inputBackground, borderColor: themeConfig.general.inputBorder, color: themeConfig.general.inputText }}
                />
              </div>
              <button 
                onClick={handleUpdatePassword}
                className={styles.actionBtn}
                style={{ backgroundColor: themeConfig.buttons.secondary, color: themeConfig.buttons.secondaryText }}
              >
                Redefinir Senha
              </button>
            </div>
          </section>
        </div>

        <div className={styles.logoutWrap}>
          <button 
            onClick={handleLogout}
            className={styles.logoutBtn}
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
