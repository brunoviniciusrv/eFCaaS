function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/** Converte markdown leve (**negrito**, listas com *) em HTML para PDF e preview. */
export function markdownLiteToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const parts: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        parts.push('</ul>');
        inList = false;
      }
      continue;
    }

    const bulletMatch = trimmed.match(/^[*-]\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        parts.push('<ul>');
        inList = true;
      }
      parts.push(`<li>${inlineMarkdown(bulletMatch[1])}</li>`);
      continue;
    }

    if (inList) {
      parts.push('</ul>');
      inList = false;
    }
    parts.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }

  if (inList) parts.push('</ul>');
  return parts.join('');
}
