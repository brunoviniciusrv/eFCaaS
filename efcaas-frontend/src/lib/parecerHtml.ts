export function parecerToEditorHtml(text: string): string {
  if (!text.trim()) return '';
  if (text.trim().startsWith('<')) return text;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function htmlToPlainText(value: string): string {
  if (!value.trim()) return '';
  if (!value.includes('<')) return value.trim();
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const STRUCTURED_PARECER_PREFIX = '<!--efcaas-structured-parecer:v1-->';

interface LegacyStructuredSection {
  id?: string;
  type?: string;
  content?: string;
  included?: boolean;
}

interface LegacyStructuredParecer {
  sections?: LegacyStructuredSection[];
}

/** Converte parecer JSON legado (experimento estruturado) de volta para texto editável. */
export function normalizeReportForEditor(raw?: string): string {
  const value = raw?.trim() ?? '';
  if (!value) return '';

  let jsonPayload = value;
  if (value.startsWith(STRUCTURED_PARECER_PREFIX)) {
    jsonPayload = value.slice(STRUCTURED_PARECER_PREFIX.length);
  } else if (!value.startsWith('{')) {
    return value;
  }

  try {
    const parsed = JSON.parse(jsonPayload) as LegacyStructuredParecer;
    if (!Array.isArray(parsed.sections)) return value;

    const lide = parsed.sections.find((s) => s.id === 'pub_lide' && s.included !== false)?.content?.trim();
    const body = parsed.sections.find((s) => s.id === 'pub_body' && s.included !== false)?.content?.trim();
    const combined = [lide, body].filter(Boolean).join('\n\n').trim();
    return combined || value;
  } catch {
    return value;
  }
}

export function sanitizeParecerFilename(title: string, referenceNumber?: number): string {
  const ref = referenceNumber != null ? `_${referenceNumber}` : '';
  const slug = title
    .substring(0, 40)
    .replace(/\s+/g, '_')
    .replace(/[^\w.-]/g, '') || 'parecer';
  return `parecer${ref}_${slug}.pdf`;
}

export function getContrastTextColor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1e293b' : '#ffffff';
}
