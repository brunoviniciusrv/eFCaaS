import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronRight, 
  Info,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionProfile, ThemeConfig } from '../types';
import { SYSTEM_PERMISSIONS } from '../constants';
import { cn } from '../lib/utils';
import styles from './PermissionsManager.module.css';

interface PermissionsManagerProps {
  profiles: PermissionProfile[];
  onUpdateProfile: (profile: PermissionProfile) => void;
  onCreateProfile: (profile: Omit<PermissionProfile, 'id'>) => void;
  onDeleteProfile: (id: string) => void;
  themeConfig: ThemeConfig;
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  profiles,
  onUpdateProfile,
  onCreateProfile,
  onDeleteProfile,
  themeConfig
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [activeProfile, setActiveProfile] = useState<PermissionProfile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const handleEdit = (profile: PermissionProfile) => {
    setActiveProfile(profile);
    setEditingId(profile.id);
    setFormData({ name: profile.name, description: profile.description, permissions: [...profile.permissions] });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({ name: '', description: '', permissions: ['view_dashboard'] });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      if (prev.permissions.includes(permId)) {
        return { ...prev, permissions: prev.permissions.filter(id => id !== permId) };
      }
      return { ...prev, permissions: [...prev.permissions, permId] };
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (isCreating) {
      onCreateProfile({ name: formData.name, description: formData.description, permissions: formData.permissions, isDefault: false });
      setIsCreating(false);
    } else if (editingId) {
      onUpdateProfile({ id: editingId, name: formData.name, description: formData.description, permissions: formData.permissions, isDefault: activeProfile?.isDefault });
      setEditingId(null);
    }
  };

  const categories = ['navigation', 'actions', 'settings'] as const;
  const categoryLabels = {
    navigation: 'Navegação e Telas',
    actions: 'Ações e Funcionalidades',
    settings: 'Administração e Logs'
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle} style={{ color: themeConfig.dashboard.text }}>Gestão de Perfis</h2>
          <p className={styles.pageSubtitle}>Defina quem pode acessar o quê dentro da plataforma.</p>
        </div>
        <button 
          onClick={handleStartCreate}
          className={styles.newProfileBtn}
          style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
        >
          <Plus size={16} />
          Novo Perfil
        </button>
      </div>

      <div className={styles.layout}>
        {/* Profile List */}
        <div className={styles.profileList}>
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleEdit(profile)}
              className={cn(styles.profileCard, editingId === profile.id ? styles.profileCardActive : styles.profileCardInactive)}
              style={{ 
                backgroundColor: themeConfig.general.cardBackground,
                borderColor: editingId === profile.id ? themeConfig.general.accent : themeConfig.general.border,
                ringColor: themeConfig.general.accent
              } as any}
            >
              <div className={styles.profileCardTop}>
                <div className={styles.profileCardName}>
                  <Shield size={16} style={{ color: themeConfig.general.accent }} />
                  <span className={styles.profileName}>{profile.name}</span>
                </div>
                {profile.isDefault && (
                  <span className={styles.profileDefault}>Padrão</span>
                )}
              </div>
              <p className={styles.profileDesc}>{profile.description}</p>
              <div className={styles.profileFooter}>
                 <span className={styles.profileCount}>{profile.permissions.length} permissões</span>
                 <ChevronRight size={12} className={cn(styles.profileChevron, editingId === profile.id ? styles.profileChevronActive : styles.profileChevronInactive)} />
              </div>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className={styles.editorWrap}>
          <AnimatePresence mode="wait">
            {(editingId || isCreating) ? (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={styles.editor}
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className={styles.editorHeader} style={{ borderColor: themeConfig.general.border }}>
                  <div className={styles.editorHeaderLeft}>
                    <div className={styles.editorIconWrap} style={{ backgroundColor: `${themeConfig.general.accent}15` }}>
                      {isCreating ? <Plus size={20} style={{ color: themeConfig.general.accent }} /> : <Edit3 size={20} style={{ color: themeConfig.general.accent }} />}
                    </div>
                    <div>
                      <h3 className={styles.editorTitle}>{isCreating ? 'Criar Novo Perfil' : `Editando: ${activeProfile?.name}`}</h3>
                      <p className={styles.editorSubtitle}>Personalização de permissões granulares</p>
                    </div>
                  </div>
                  <div className={styles.editorHeaderRight}>
                    {!isCreating && !activeProfile?.isDefault && (
                      <button 
                        onClick={() => {
                          if (confirm('Deseja realmente excluir este perfil? Usuários vinculados a ele podem perder acesso.')) {
                            onDeleteProfile(editingId!);
                            setEditingId(null);
                          }
                        }}
                        className={styles.deleteBtn}
                        title="Excluir Perfil"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => { setEditingId(null); setIsCreating(false); }}
                      className={styles.closeBtn}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.editorBody}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Nome do Perfil</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Checador Sênior"
                        className={styles.formInput}
                        style={{'--tw-ring-color': `${themeConfig.general.accent}20`, borderColor: themeConfig.general.border} as any}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Descrição Curta</label>
                      <input 
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Breve resumo da finalidade deste perfil"
                        className={styles.formInput}
                        style={{'--tw-ring-color': `${themeConfig.general.accent}20`, borderColor: themeConfig.general.border} as any}
                      />
                    </div>
                  </div>

                  <div className={styles.permissionsWrap}>
                    <div className={styles.permissionsHeader} style={{ borderColor: themeConfig.general.border }}>
                       <h4 className={styles.permissionsTitle} style={{ color: themeConfig.general.accent }}>Permissões do Sistema</h4>
                       <span className={styles.permissionsCount}>{formData.permissions.length} ativas</span>
                    </div>

                    <div className={styles.categoryList}>
                      {categories.map(category => (
                        <div key={category} className={styles.category}>
                          <h5 className={styles.categoryTitle}>
                            <span className={styles.categoryDot} style={{ backgroundColor: themeConfig.general.accent }} />
                            {categoryLabels[category]}
                          </h5>
                          <div className={styles.permGrid}>
                            {SYSTEM_PERMISSIONS.filter(p => p.category === category).map(perm => {
                              const isActive = formData.permissions.includes(perm.id);
                              return (
                                <button
                                  key={perm.id}
                                  onClick={() => togglePermission(perm.id)}
                                  className={cn(styles.permBtn, isActive ? styles.permBtnActive : styles.permBtnInactive)}
                                  style={{ borderColor: isActive ? themeConfig.general.accent : themeConfig.general.border }}
                                >
                                  <div 
                                    className={cn(styles.checkbox, isActive ? styles.checkboxChecked : styles.checkboxUnchecked)}
                                    style={{ 
                                      backgroundColor: isActive ? themeConfig.general.accent : 'transparent',
                                      borderColor: isActive ? themeConfig.general.accent : themeConfig.general.border
                                    }}
                                  >
                                    {isActive && <Check size={12} />}
                                  </div>
                                  <div>
                                    <p className={isActive ? styles.permName : styles.permNameInactive}>{perm.name}</p>
                                    <p className={styles.permDesc}>{perm.description}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.editorFooter} style={{ borderColor: themeConfig.general.border }}>
                  <div className={styles.editorFooterNote}>
                    <Info size={14} />
                    Alterações afetam todos os usuários vinculados
                  </div>
                  <button
                    onClick={handleSave}
                    className={styles.saveBtn}
                    style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
                  >
                    <Save size={16} />
                    {isCreating ? 'Criar Perfil' : 'Salvar Alterações'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.emptyEditor}
              >
                <div className={styles.emptyIconWrap}>
                  <Shield size={32} className="text-slate-400" />
                </div>
                <h3 className={styles.emptyTitle}>Nenhum Perfil Selecionado</h3>
                <p className={styles.emptyDesc}>Selecione um perfil na lista ao lado para editar suas permissões ou crie um novo perfil do zero.</p>
                <button 
                   onClick={handleStartCreate}
                   className={styles.createBtn}
                >
                  <Plus size={16} />
                  Criar Primeiro Perfil Customizado
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
