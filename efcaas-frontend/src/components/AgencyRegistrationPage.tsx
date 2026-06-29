/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileUp,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react';
import { LANDING_PRICING } from '../content/landingContent';
import { apiService, AgencyPlan } from '../services/apiService';
import {
  isBrazilCountry,
  maskCnpj,
  maskPhoneBr,
  MAX_REGISTRATION_FILES,
  normalizeCnpjForApi,
  normalizePhoneForApi,
  validateAgencyRegistrationForm,
  isAllowedRegistrationFile,
  MAX_REGISTRATION_FILE_BYTES,
} from '../lib/brValidators';
import styles from './AgencyRegistrationPage.module.css';

export function AgencyRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = (searchParams.get('plano')?.toUpperCase() === 'PAID' ? 'PAID' : 'FREE') as AgencyPlan;

  const [plano, setPlano] = useState<AgencyPlan>(initialPlan);
  const [nomeAgencia, setNomeAgencia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pais, setPais] = useState('Brasil');
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [informacoesExtras, setInformacoesExtras] = useState('');
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const planCopy = useMemo(
    () => (plano === 'PAID' ? LANDING_PRICING.plans.paid : LANDING_PRICING.plans.free),
    [plano],
  );

  const brasil = isBrazilCountry(pais);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const next = [...documentos];
    for (const file of files) {
      if (next.length >= MAX_REGISTRATION_FILES) {
        setError(`Máximo de ${MAX_REGISTRATION_FILES} documentos por solicitação.`);
        break;
      }
      if (file.size > MAX_REGISTRATION_FILE_BYTES) {
        setError(`"${file.name}" excede 10 MB.`);
        continue;
      }
      if (!isAllowedRegistrationFile(file)) {
        setError(`Formato não permitido: "${file.name}". Use PDF, JPG, PNG ou WEBP.`);
        continue;
      }
      next.push(file);
    }
    setDocumentos(next);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setDocumentos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateAgencyRegistrationForm({
      nomeAgencia,
      cnpj,
      nomeResponsavel,
      emailContato,
      senha,
      confirmarSenha,
      telefone,
      pais,
      estado,
      cidade,
      plano,
      aceiteTermos,
      documentos,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.enviarSolicitacaoCadastro(
        {
          nomeAgencia: nomeAgencia.trim(),
          cnpj: cnpj.trim() ? normalizeCnpjForApi(cnpj) : undefined,
          nomeResponsavel: nomeResponsavel.trim(),
          emailContato: emailContato.trim().toLowerCase(),
          senha,
          telefone: telefone.trim() ? normalizePhoneForApi(telefone) : undefined,
          pais: pais.trim() || 'Brasil',
          estado: estado.trim().toUpperCase() || undefined,
          cidade: cidade.trim() || undefined,
          planoSolicitado: plano,
          informacoesExtras: informacoesExtras.trim() || undefined,
        },
        documentos,
      );
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.successCard}
        >
          <CheckCircle2 size={48} className={styles.successIcon} />
          <h1 className={styles.successTitle}>Solicitação enviada</h1>
          <p className={styles.successText}>
            Recebemos o cadastro da agência <strong>{nomeAgencia}</strong>. Nossa equipe analisará os
            documentos e retornará por e-mail em <strong>{emailContato}</strong>.
          </p>
          <button type="button" className={styles.primaryBtn} onClick={() => navigate('/')}>
            Voltar ao início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Voltar ao início
        </button>

        <header className={styles.header}>
          <h1 className={styles.title}>Cadastro de agência</h1>
          <p className={styles.subtitle}>
            Preencha os dados institucionais. A criação do ambiente ocorre somente após aprovação da
            equipe eFCaaS.
          </p>
        </header>

        <div className={styles.planPicker}>
          <button
            type="button"
            className={`${styles.planOption} ${plano === 'FREE' ? styles.planOptionActive : ''}`}
            onClick={() => setPlano('FREE')}
          >
            Plano Gratuito
          </button>
          <button
            type="button"
            className={`${styles.planOption} ${plano === 'PAID' ? styles.planOptionActivePaid : ''}`}
            onClick={() => setPlano('PAID')}
          >
            Plano Exclusivo
          </button>
        </div>

        <div className={styles.planInfo}>
          <p className={styles.planInfoTitle}>{planCopy.name}</p>
          <p className={styles.planInfoText}>
            {plano === 'FREE'
              ? 'Dados agregados podem ser compartilhados com o ecossistema eFCaaS.'
              : LANDING_PRICING.plans.paid.description}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Nome da agência *</span>
              <div className={styles.inputWrap}>
                <Building2 size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  value={nomeAgencia}
                  onChange={(e) => setNomeAgencia(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>CNPJ{brasil ? ' *' : ''}</span>
              <input
                className={styles.inputPlain}
                value={cnpj}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                required={brasil}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Responsável *</span>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  value={nomeResponsavel}
                  onChange={(e) => setNomeResponsavel(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>E-mail de contato *</span>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.inputIcon} />
                <input
                  type="email"
                  className={styles.input}
                  value={emailContato}
                  onChange={(e) => setEmailContato(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Senha de acesso *</span>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                />
              </div>
              <span className={styles.hint}>Mínimo de 8 caracteres. Você usará esta senha após a aprovação.</span>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Confirmar senha *</span>
              <div className={styles.inputWrap}>
                <KeyRound size={16} className={styles.inputIcon} />
                <input
                  type="password"
                  className={styles.input}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  minLength={8}
                  maxLength={100}
                  autoComplete="new-password"
                  required
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Telefone{brasil ? ' *' : ''}</span>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhoneBr(e.target.value))}
                  placeholder="(62) 99999-8888"
                  inputMode="tel"
                  required={brasil}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>País</span>
              <div className={styles.inputWrap}>
                <MapPin size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Estado (UF){brasil ? ' *' : ''}</span>
              <input
                className={styles.inputPlain}
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
                placeholder="GO"
                maxLength={2}
                required={brasil}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Cidade{brasil ? ' *' : ''}</span>
              <input
                className={styles.inputPlain}
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required={brasil}
              />
            </label>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Informações adicionais</span>
            <textarea
              className={styles.textarea}
              rows={4}
              value={informacoesExtras}
              onChange={(e) => setInformacoesExtras(e.target.value)}
              placeholder="Contexto da agência, volume de checagens, necessidades específicas..."
            />
          </label>

          <div className={styles.uploadSection}>
            <span className={styles.label}>Documentos comprobatórios *</span>
            <label className={styles.uploadDrop}>
              <FileUp size={20} />
              <span>Clique para anexar arquivos (PDF, imagem, etc.)</span>
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*" className={styles.fileInput} onChange={handleFiles} />
            </label>
            {documentos.length > 0 && (
              <ul className={styles.fileList}>
                {documentos.map((file, index) => (
                  <li key={`${file.name}-${index}`} className={styles.fileItem}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button type="button" className={styles.fileRemove} onClick={() => removeFile(index)}>
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {plano === 'FREE' && (
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={aceiteTermos}
                onChange={(e) => setAceiteTermos(e.target.checked)}
              />
              <span>{LANDING_PRICING.plans.free.termsLabel}</span>
            </label>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </form>
      </div>
    </div>
  );
}
