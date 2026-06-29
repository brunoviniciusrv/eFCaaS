import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = join(import.meta.dirname, '..', 'src');

/** Symbols that must not appear outside their definition files (removed dead code guard). */
const CANDIDATES = [
  { symbol: 'generateDraftReport', files: ['services/geminiService.ts'] },
  { symbol: 'reviewReport', files: ['services/geminiService.ts'] },
  { symbol: 'generateArticleSuggestions', files: ['services/geminiService.ts'] },
  { symbol: 'exportParecerElementPdf', files: ['lib/parecerPdfExport.tsx'] },
  { symbol: 'handleGenerateDraft', files: ['App.tsx', 'components/AnalysisView.tsx'] },
  { symbol: 'isGeneratingDraft', files: ['App.tsx', 'components/AnalysisView.tsx'] },
  { symbol: 'getMisinfoScore', files: ['lib/aiAnalysis.ts'] },
  { symbol: 'FactLabel', files: ['types.ts'] },
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) acc.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
  }
  return acc;
}

const files = walk(ROOT);
const usages = new Map();

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(join(import.meta.dirname, '..'), file).replace(/\\/g, '/');
  for (const { symbol } of CANDIDATES) {
    const re = new RegExp(`\\b${symbol}\\b`, 'g');
    const matches = text.match(re);
    if (!matches) continue;
    if (!usages.has(symbol)) usages.set(symbol, []);
    usages.get(symbol).push({ file: rel, count: matches.length });
  }
}

let failures = 0;

for (const candidate of CANDIDATES) {
  const refs = usages.get(candidate.symbol) ?? [];
  const definingOnly = refs.length === 1 && candidate.files.some((f) => refs[0].file.endsWith(f));
  const dead = refs.length === 0 || (definingOnly && refs[0].count <= 2);
  console.log(`${candidate.symbol}: ${dead ? 'DEAD' : 'USED'}`, refs);
  if (!dead) failures += 1;
}

process.exit(failures > 0 ? 1 : 0);
