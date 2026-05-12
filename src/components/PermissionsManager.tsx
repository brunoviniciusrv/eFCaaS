import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronRight, 
  Lock, 
  Info,
  Save,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionProfile, SystemPermission, ThemeConfig } from '../types';
import { SYSTEM_PERMISSIONS } from '../constants';
import { cn } from '../lib/utils';

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
    setFormData({
      name: profile.name,
      description: profile.description,
      permissions: [...profile.permissions]
    });
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      permissions: ['view_dashboard'] // Default minimal permission
    });
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
      onCreateProfile({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        isDefault: false
      });
      setIsCreating(false);
    } else if (editingId) {
      onUpdateProfile({
        id: editingId,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        isDefault: activeProfile?.isDefault
      });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight" style={{ color: themeConfig.dashboard.text }}>Gestão de Perfis</h2>
          <p className="text-sm opacity-60">Defina quem pode acessar o quê dentro da plataforma.</p>
        </div>
        <button 
          onClick={handleStartCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
          style={{ backgroundColor: themeConfig.buttons.primary, color: themeConfig.buttons.primaryText }}
        >
          <Plus size={16} />
          Novo Perfil
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile List */}
        <div className="lg:col-span-1 space-y-3">
          {profiles.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleEdit(profile)}
              className={cn(
                "w-full p-4 rounded-2xl border text-left transition-all group relative overflow-hidden",
                editingId === profile.id ? "ring-2 ring-offset-2" : "hover:border-slate-300"
              )}
              style={{ 
                backgroundColor: themeConfig.general.cardBackground,
                borderColor: editingId === profile.id ? themeConfig.general.accent : themeConfig.general.border,
                ringColor: themeConfig.general.accent
              } as any}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: themeConfig.general.accent }} />
                  <span className="font-black text-sm uppercase tracking-tight">{profile.name}</span>
                </div>
                {profile.isDefault && (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full opacity-60">Padrão</span>
                )}
              </div>
              <p className="text-[11px] opacity-60 line-clamp-1">{profile.description}</p>
              <div className="mt-3 flex items-center gap-2">
                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{profile.permissions.length} permissões</span>
                 <ChevronRight size={12} className={cn("ml-auto transition-transform", editingId === profile.id ? "rotate-90" : "group-hover:translate-x-1")} />
              </div>
            </button>
          ))}
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {(editingId || isCreating) ? (
              <motion.div 
                key="editor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="rounded-3xl border overflow-hidden"
                style={{ backgroundColor: themeConfig.general.cardBackground, borderColor: themeConfig.general.border }}
              >
                <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${themeConfig.general.accent}15` }}>
                      {isCreating ? <Plus size={20} style={{ color: themeConfig.general.accent }} /> : <Edit3 size={20} style={{ color: themeConfig.general.accent }} />}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-tight">{isCreating ? 'Criar Novo Perfil' : `Editando: ${activeProfile?.name}`}</h3>
                      <p className="text-[11px] opacity-60 uppercase tracking-widest font-bold">Personalização de permissões granulares</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCreating && !activeProfile?.isDefault && (
                      <button 
                        onClick={() => {
                          if (confirm('Deseja realmente excluir este perfil? Usuários vinculados a ele podem perder acesso.')) {
                            onDeleteProfile(editingId!);
                            setEditingId(null);
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir Perfil"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => { setEditingId(null); setIsCreating(false); }}
                      className="p-2 opacity-40 hover:opacity-100 rounded-xl transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Perfil</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Checador Sênior"
                        className="w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{'--tw-ring-color': `${themeConfig.general.accent}20`, borderColor: themeConfig.general.border} as any}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Curta</label>
                      <input 
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Breve resumo da finalidade deste perfil"
                        className="w-full px-4 py-3 bg-slate-50 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{'--tw-ring-color': `${themeConfig.general.accent}20`, borderColor: themeConfig.general.border} as any}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: themeConfig.general.border }}>
                       <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: themeConfig.general.accent }}>Permissões do Sistema</h4>
                       <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{formData.permissions.length} ativas</span>
                    </div>

                    <div className="space-y-6">
                      {categories.map(category => (
                        <div key={category} className="space-y-3">
                          <h5 className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: themeConfig.general.accent }} />
                            {categoryLabels[category]}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {SYSTEM_PERMISSIONS.filter(p => p.category === category).map(perm => (
                              <button
                                key={perm.id}
                                onClick={() => togglePermission(perm.id)}
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-xl border text-left transition-all",
                                  formData.permissions.includes(perm.id) 
                                    ? "bg-blue-50/50" 
                                    : "hover:bg-slate-50"
                                )}
                                style={{ 
                                  borderColor: formData.permissions.includes(perm.id) ? themeConfig.general.accent : themeConfig.general.border 
                                }}
                              >
                                <div 
                                  className={cn(
                                    "mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                                    formData.permissions.includes(perm.id) ? "text-white" : "bg-white"
                                  )}
                                  style={{ 
                                    backgroundColor: formData.permissions.includes(perm.id) ? themeConfig.general.accent : 'transparent',
                                    borderColor: formData.permissions.includes(perm.id) ? themeConfig.general.accent : themeConfig.general.border
                                  }}
                                >
                                  {formData.permissions.includes(perm.id) && <Check size={12} />}
                                </div>
                                <div>
                                  <p className={cn("text-xs font-bold leading-none mb-1", formData.permissions.includes(perm.id) ? "text-slate-900" : "text-slate-600")}>
                                    {perm.name}
                                  </p>
                                  <p className="text-[10px] opacity-50 leading-tight">
                                    {perm.description}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex items-center justify-between" style={{ borderColor: themeConfig.general.border }}>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Info size={14} />
                    Alterações afetam todos os usuários vinculados
                  </div>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-tight shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
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
                className="h-full flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 opacity-40">
                  <Shield size={32} className="text-slate-400" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-tight text-slate-400">Nenhum Perfil Selecionado</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-xs">Selecione um perfil na lista ao lado para editar suas permissões ou crie um novo perfil do zero.</p>
                <button 
                   onClick={handleStartCreate}
                   className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-white hover:bg-slate-100"
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
