/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, KeyRound, Lock, Shield } from 'lucide-react';
import { UserProfile } from '../types';
import { apiService } from '../services/apiService';
import styles from './ActivationPage.module.css';

interface ActivationPageProps {
  onActivated: (user: UserProfile) => Promise<void>;
}

export function ActivationPage({ onActivated }: ActivationPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tenantSlug = searchParams.get('tenant') ?? '';
  const token = searchParams.get('token') ?? '';

  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!tenantSlug || !token) {
      setError('Link inválido. Verifique se o e-mail contém tenant e token corretos.');
      return;
    }

    if (senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      const { user } = await apiService.ativarConta(tenantSlug, token, senha);
      await onActivated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ativar a conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.card}
      >
        <button type="button" className={styles.backLink} onClick={() => navigate('/')}>
          <ArrowLeft size={14} />
          Voltar ao início
        </button>

        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Shield size={28} className="text-white" />
          </div>
          <h1 className={styles.title}>Ativar conta</h1>
          <p className={styles.subtitle}>
            Defina sua senha para concluir o primeiro acesso
            {tenantSlug ? ` da agência ${tenantSlug}` : ''}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>Nova senha</span>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type="password"
                className={styles.input}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Confirmar senha</span>
            <div className={styles.inputWrap}>
              <KeyRound size={16} className={styles.inputIcon} />
              <input
                type="password"
                className={styles.input}
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? 'Ativando...' : 'Ativar e entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
