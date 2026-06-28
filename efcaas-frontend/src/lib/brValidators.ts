/** Validações e máscaras para formulários brasileiros (cadastro de agência). */

const BRAZILIAN_UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const ALLOWED_DOC_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ALLOWED_DOC_EXT = /\.(pdf|jpe?g|png|webp)$/i;

export const MAX_REGISTRATION_FILES = 5;
export const MAX_REGISTRATION_FILE_BYTES = 10 * 1024 * 1024;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskCnpj(value: string): string {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function maskPhoneBr(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function cnpjCheckDigit(base: string, weights: number[]): number {
  const sum = base.split('').reduce((acc, digit, i) => acc + Number(digit) * weights[i], 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
}

export function isValidCnpj(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1+$/.test(d)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = cnpjCheckDigit(d.slice(0, 12), w1);
  const d2 = cnpjCheckDigit(d.slice(0, 12) + d1, w2);
  return d.slice(12) === `${d1}${d2}`;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function isValidBrazilianPhone(value: string): boolean {
  const d = digitsOnly(value);
  return d.length === 10 || d.length === 11;
}

export function isValidBrazilianUf(value: string): boolean {
  return BRAZILIAN_UFS.has(value.trim().toUpperCase());
}

export function isBrazilCountry(pais: string): boolean {
  const normalized = pais.trim().toLowerCase();
  return normalized === 'brasil' || normalized === 'brazil' || normalized === 'br';
}

export function isAllowedRegistrationFile(file: File): boolean {
  if (ALLOWED_DOC_MIME.has(file.type)) return true;
  return ALLOWED_DOC_EXT.test(file.name);
}

export interface AgencyRegistrationForm {
  nomeAgencia: string;
  cnpj: string;
  nomeResponsavel: string;
  emailContato: string;
  senha: string;
  confirmarSenha: string;
  telefone: string;
  pais: string;
  estado: string;
  cidade: string;
  plano: 'FREE' | 'PAID';
  aceiteTermos: boolean;
  documentos: File[];
}

export function validateAgencyRegistrationForm(form: AgencyRegistrationForm): string | null {
  const nomeAgencia = form.nomeAgencia.trim();
  const nomeResponsavel = form.nomeResponsavel.trim();
  const email = form.emailContato.trim();
  const pais = form.pais.trim() || 'Brasil';
  const brasil = isBrazilCountry(pais);

  if (nomeAgencia.length < 3) return 'Nome da agência deve ter pelo menos 3 caracteres.';
  if (nomeAgencia.length > 150) return 'Nome da agência deve ter no máximo 150 caracteres.';
  if (nomeResponsavel.length < 3) return 'Nome do responsável deve ter pelo menos 3 caracteres.';
  if (!isValidEmail(email)) return 'Informe um e-mail de contato válido.';

  if (form.senha.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
  if (form.senha.length > 100) return 'A senha deve ter no máximo 100 caracteres.';
  if (form.senha !== form.confirmarSenha) return 'As senhas não coincidem.';

  if (brasil) {
    if (!form.cnpj.trim()) return 'CNPJ é obrigatório para agências no Brasil.';
    if (!isValidCnpj(form.cnpj)) return 'CNPJ inválido. Verifique os dígitos informados.';
    if (!form.estado.trim()) return 'Estado (UF) é obrigatório para agências no Brasil.';
    if (!isValidBrazilianUf(form.estado)) return 'Informe uma UF válida (ex.: GO, SP).';
    if (!form.cidade.trim()) return 'Cidade é obrigatória para agências no Brasil.';
    if (form.cidade.trim().length < 2) return 'Informe o nome da cidade.';
    if (!form.telefone.trim()) return 'Telefone é obrigatório para agências no Brasil.';
    if (!isValidBrazilianPhone(form.telefone)) {
      return 'Telefone inválido. Use DDD + número (10 ou 11 dígitos).';
    }
  } else if (form.cnpj.trim() && !isValidCnpj(form.cnpj)) {
    return 'CNPJ inválido. Verifique os dígitos informados.';
  }

  if (form.plano === 'FREE' && !form.aceiteTermos) {
    return 'É necessário aceitar os termos de compartilhamento de dados do plano gratuito.';
  }

  if (form.documentos.length === 0) {
    return 'Anexe ao menos um documento comprobatório da agência.';
  }
  if (form.documentos.length > MAX_REGISTRATION_FILES) {
    return `Envie no máximo ${MAX_REGISTRATION_FILES} documentos.`;
  }

  for (const file of form.documentos) {
    if (file.size > MAX_REGISTRATION_FILE_BYTES) {
      return `O arquivo "${file.name}" excede o limite de 10 MB.`;
    }
    if (!isAllowedRegistrationFile(file)) {
      return `Formato não permitido: "${file.name}". Use PDF, JPG, PNG ou WEBP.`;
    }
  }

  return null;
}

/** Normaliza CNPJ para armazenamento (apenas dígitos). */
export function normalizeCnpjForApi(value: string): string {
  return digitsOnly(value);
}

/** Normaliza telefone para armazenamento (apenas dígitos). */
export function normalizePhoneForApi(value: string): string {
  return digitsOnly(value);
}
