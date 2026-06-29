import { jsPDF } from 'jspdf';
import type { EditorialArticle } from '../types';

function sanitizeFilename(title: string): string {
  return title.substring(0, 40).replace(/\s+/g, '_').replace(/[^\w.-]/g, '') || 'materia';
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function exportArticleAsJson(article: EditorialArticle): void {
  downloadBlob(
    JSON.stringify(article, null, 2),
    'application/json',
    `${sanitizeFilename(article.title)}.json`,
  );
}

export function exportArticleAsHtml(article: EditorialArticle): void {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(article.title)}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; line-height: 1.6; color: #1e293b; }
    h1 { font-size: 1.75rem; margin-bottom: 1.5rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(article.title)}</h1>
  <div>${article.content}</div>
</body>
</html>`;
  downloadBlob(html, 'text/html;charset=utf-8', `${sanitizeFilename(article.title)}.html`);
}

export function exportArticleAsTxt(article: EditorialArticle): void {
  const text = `${article.title}\n\n${stripHtml(article.content)}`;
  downloadBlob(text, 'text/plain;charset=utf-8', `${sanitizeFilename(article.title)}.txt`);
}

export function exportArticleAsPdf(article: EditorialArticle): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  const maxWidth = 180;
  let y = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(article.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const bodyLines = doc.splitTextToSize(stripHtml(article.content), maxWidth);
  const pageHeight = doc.internal.pageSize.getHeight() - margin;

  bodyLines.forEach((line: string) => {
    if (y > pageHeight) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 6;
  });

  doc.save(`${sanitizeFilename(article.title)}.pdf`);
}

function downloadBlob(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
