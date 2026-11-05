// Compilador propio de Markdown a PDF académico usando el Chromium de Playwright
// que ya vive en @smcta/e2e. Lee las fuentes desde "Documentos MD/" y escupe directo
// a "Documentos PDF/" en memoria sin dejar archivos HTML intermedios tirados en el repo.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { FIGURE_REGISTRY } from './svg-figures.mjs';

const repoRoot = path.resolve(import.meta.dirname, '..');
const docsRoot = path.join(repoRoot, 'Proyecto - SMCTA');
const mdRoot = path.join(docsRoot, 'Documentos MD');
const pdfRoot = path.join(docsRoot, 'Documentos PDF');
const requireE2E = createRequire(path.join(repoRoot, 'e2e', 'package.json'));
const { chromium } = requireE2E('@playwright/test');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripDecorativeEmojis(text) {
  return text.replace(/[ℹ️📁🖼️✅❌⚠️🎯📌🛠️]/gu, '').replace(/\s{2,}/g, ' ');
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Traduce el subconjunto de LaTeX usado en las fórmulas financieras y de métricas
// a HTML tipográfico puro para no depender de CDNs externos al imprimir offline.
function renderLatexExpr(tex, displayMode = false) {
  let s = tex.trim();
  const symbols = [
    ['\\le', '≤'],
    ['\\ge', '≥'],
    ['\\neq', '≠'],
    ['\\approx', '≈'],
    ['\\implies', '⟹'],
    ['\\to', '→'],
    ['\\forall', '∀'],
    ['\\in', '∈'],
    ['\\sum', '∑'],
    ['\\Delta', 'Δ'],
    ['\\phi', 'φ'],
    ['\\tau', 'τ'],
    ['\\sigma', 'σ'],
    ['\\alpha', 'α'],
    ['\\ln', 'ln'],
    ['\\max', 'max'],
    ['\\min', 'min'],
    ['\\times', '×'],
    ['\\cdot', '·'],
    ['\\dots', '…'],
    ['\\langle', '⟨'],
    ['\\rangle', '⟩'],
    ['\\lvert', '|'],
    ['\\rvert', '|'],
    ['\\{', '{'],
    ['\\}', '}'],
    ['\\|', '∥'],
    ['\\,', ' '],
    ['\\quad', ' &nbsp;&nbsp; '],
    ['\\%', '%'],
    ['\\$', '$'],
  ];

  s = s.replace(/\\mathbb\{Q\}/g, 'ℚ');
  s = s.replace(/\\mathcal\{L\}/g, 'ℒ');
  s = s.replace(/\\mathcal\{C\}/g, '𝒞');
  s = s.replace(/\\mathcal\{T\}/g, '𝒯');
  s = s.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  s = s.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  s = s.replace(/\\Big\(/g, '(').replace(/\\Big\)/g, ')');
  s = s.replace(/\\big\(/g, '(').replace(/\\big\)/g, ')');

  // Primero resolvemos comandos de texto y sub/superíndices internos para que \frac no falle por llaves anidadas
  for (let pass = 0; pass < 3; pass++) {
    s = s.replace(/\\textbf\{([^{}]+)\}/g, '<strong>$1</strong>');
    s = s.replace(/\\text\{([^{}]+)\}/g, '<span class="m-rom">$1</span>');
    s = s.replace(/\\overline\{([^{}]+)\}/g, '<span style="text-decoration:overline">$1</span>');
    s = s.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    s = s.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
  }

  for (const [k, v] of symbols) {
    s = s.split(k).join(v);
  }

  for (let pass = 0; pass < 2; pass++) {
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<span class="m-frac"><span class="m-num">$1</span><span class="m-den">$2</span></span>');
  }

  s = s.replace(/_([a-zA-Z0-9]+)/g, '<sub>$1</sub>');
  s = s.replace(/\^([a-zA-Z0-9+-]+)/g, '<sup>$1</sup>');

  return displayMode ? `<div class="math-block">${s}</div>` : `<span class="math-inline">${s}</span>`;
}

function renderInline(raw) {
  let text = stripDecorativeEmojis(raw);
  const codeSlots = [];
  text = text.replace(/`([^`]+)`/g, (_, code) => {
    const idx = codeSlots.push(`<code>${escapeHtml(code)}</code>`) - 1;
    return `@@CODE_${idx}@@`;
  });

  const mathSlots = [];
  // Distinguimos fórmulas reales ($CC \le 5$, $0,1 + 0,2 = ...$) de dos montos en dólares en el mismo párrafo ($100 y $150)
  text = text.replace(/\$([^$\n]+?)\$/g, (full, expr) => {
    const looksLikeTwoPrices = /^\d[\d.,]*\s+[a-zA-Záéíóúñ]/.test(expr) && !/[\\=_^<>+\-*/]/.test(expr);
    if (looksLikeTwoPrices) return full;
    const idx = mathSlots.push(renderLatexExpr(expr, false)) - 1;
    return `@@MATH_${idx}@@`;
  });

  text = escapeHtml(text);
  text = text.replace(/\*\*((?:(?!\*\*).)+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  text = text.replace(/@@MATH_(\d+)@@/g, (_, i) => mathSlots[Number(i)]);
  text = text.replace(/@@CODE_(\d+)@@/g, (_, i) => codeSlots[Number(i)]);
  return text;
}

function parseFrontmatterAndLegacyMeta(rawMd, fallbackFilename) {
  let content = rawMd.replace(/\r\n/g, '\n');
  const meta = {
    doc_code: '',
    title: '',
    subtitle: '',
    phase: '',
    version: '2.0.0',
    date: 'Noviembre 2026',
    authors: 'Equipo de Ingeniería de Software — Proyecto SMCTA',
    institution: 'Sistema de Mercado Comportamental y Trading de Activos (SMCTA v2)',
    toc: false,
  };

  if (content.startsWith('---\n')) {
    const endIdx = content.indexOf('\n---\n', 4);
    if (endIdx !== -1) {
      const yamlBlock = content.slice(4, endIdx);
      content = content.slice(endIdx + 5);
      for (const line of yamlBlock.split('\n')) {
        const m = line.match(/^([a-z_]+):\s*(.+)$/);
        if (m) {
          const val = m[2].trim();
          meta[m[1]] = val === 'true' ? true : val === 'false' ? false : val;
        }
      }
      return { meta, body: content };
    }
  }

  // Documentos existentes de Fases 01-05: extraemos # Título y bloque > **Proyecto:** ...
  const lines = content.split('\n');
  let cursor = 0;
  while (cursor < lines.length && !lines[cursor].trim()) cursor++;
  if (cursor < lines.length && lines[cursor].startsWith('# ')) {
    meta.title = stripDecorativeEmojis(lines[cursor].slice(2).trim());
    cursor++;
  } else {
    meta.title = fallbackFilename.replace(/^\d+_/, '').replace(/_/g, ' ');
  }

  while (cursor < lines.length && (lines[cursor].trim() === '' || lines[cursor].trim() === '---')) {
    cursor++;
  }

  // Consumimos los metadatos tipo > **Fase:** ... para subirlos limpios a la portada
  while (cursor < lines.length && lines[cursor].trim().startsWith('>')) {
    const rawLine = stripDecorativeEmojis(lines[cursor].replace(/^>\s*/, '').trim());
    if (/^\*\*Nota General/i.test(rawLine)) break;
    const kv = rawLine.match(/^\*\*([^*:]+):\*\*\s*(.+)$/);
    if (kv) {
      const k = kv[1].toLowerCase();
      const v = kv[2].trim();
      if (k.includes('fase') || k.includes('area') || k.includes('área')) meta.phase = v.replace(/_/g, ' ');
      else if (k.includes('codigo') || k.includes('código')) meta.doc_code = v;
      else if (k.includes('estado') || k.includes('objetivo')) meta.subtitle = v;
      else if (k.includes('proyecto')) meta.institution = v;
      cursor++;
    } else if (!rawLine) {
      cursor++;
    } else {
      break;
    }
  }

  return { meta, body: lines.slice(cursor).join('\n') };
}

function renderCodeBlock(codeLines, lang) {
  if (lang === 'mermaid') {
    return FIGURE_REGISTRY['FIG-TEAM-ROLES']('1');
  }
  const cleanLines = codeLines;
  const showLineNumbers = cleanLines.length >= 6;
  const rowsHtml = cleanLines
    .map((ln, idx) => {
      const numSpan = showLineNumbers ? `<span class="ln">${String(idx + 1).padStart(2, ' ')}</span>` : '';
      return `<span class="code-line">${numSpan}${escapeHtml(ln) || ' '}</span>`;
    })
    .join('\n');
  const badge = lang ? `<div class="code-lang">${escapeHtml(lang.toUpperCase())}</div>` : '';
  return `<div class="code-block">${badge}<pre><code>${rowsHtml}</code></pre></div>`;
}

function splitTableRow(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cur = '';
  let inMath = false;
  let inCode = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\\' && trimmed[i + 1] === '|') {
      cur += '|';
      i++;
      continue;
    }
    if (ch === '`') inCode = !inCode;
    else if (ch === '$' && !inCode) inMath = !inMath;
    if (ch === '|' && !inMath && !inCode) {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

function renderTable(tableLines) {
  if (tableLines.length < 2) return '';
  const headers = splitTableRow(tableLines[0]);
  const aligns = splitTableRow(tableLines[1]).map((sep) => {
    if (sep.startsWith(':') && sep.endsWith(':')) return 'center';
    if (sep.endsWith(':')) return 'right';
    return 'left';
  });
  const bodyRows = tableLines.slice(2).map(splitTableRow);

  const thHtml = headers
    .map((h, i) => `<th style="text-align:${aligns[i] || 'left'}">${renderInline(h)}</th>`)
    .join('');
  const trsHtml = bodyRows
    .map(
      (row) =>
        `<tr>${headers
          .map((_, i) => `<td style="text-align:${aligns[i] || 'left'}">${renderInline(row[i] ?? '')}</td>`)
          .join('')}</tr>`,
    )
    .join('\n');

  return `<div class="table-wrap"><table><thead><tr>${thHtml}</tr></thead><tbody>${trsHtml}</tbody></table></div>`;
}

function compileMarkdownBody(md, docMeta) {
  const lines = md.split('\n');
  const htmlParts = [];
  const headings = [];
  let figCounter = 0;
  let c4Injected = false;

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Marcador explícito de gráfico oficial vectorial
    const figMatch = trimmed.match(/^<!--\s*FIGURE:\s*([A-Z0-9-]+)\s*-->$/);
    if (figMatch) {
      const fn = FIGURE_REGISTRY[figMatch[1]];
      if (fn) {
        figCounter++;
        htmlParts.push(fn(String(figCounter)));
      }
      i++;
      continue;
    }

    // Separadores horizontales sutiles
    if (/^---+$/.test(trimmed)) {
      htmlParts.push('<hr class="section-rule"/>');
      i++;
      continue;
    }

    // Bloques de ecuación $$ ... $$
    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 4) {
        htmlParts.push(renderLatexExpr(trimmed.slice(2, -2), true));
        i++;
        continue;
      }
      const mathBuf = [trimmed.slice(2)];
      i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) {
        mathBuf.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        mathBuf.push(lines[i].trim().slice(0, -2));
        i++;
      }
      htmlParts.push(renderLatexExpr(mathBuf.join(' '), true));
      continue;
    }

    // Bloques de código cercados ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeBuf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeBuf.push(lines[i]);
        i++;
      }
      i++;
      htmlParts.push(renderCodeBlock(codeBuf, lang));
      continue;
    }

    // Encabezados ##, ###, ####
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const level = Math.min(4, Math.max(2, hMatch[1].length));
      const cleanTitle = stripDecorativeEmojis(hMatch[2].trim());
      const id = `${slugify(cleanTitle)}-${headings.length + 1}`;
      headings.push({ level, text: cleanTitle, id });
      htmlParts.push(`<h${level} id="${id}">${renderInline(cleanTitle)}</h${level}>`);
      i++;
      continue;
    }

    // Tablas Markdown
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|\s*[:\-| ]+\|$/.test(lines[i + 1].trim())) {
      const tblBuf = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tblBuf.push(lines[i]);
        i++;
      }
      htmlParts.push(renderTable(tblBuf));
      continue;
    }

    // Citas destacadas >
    if (trimmed.startsWith('>')) {
      const qBuf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        qBuf.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      const joined = qBuf.join(' ');
      if (joined.includes('02_Diagrama_C4_Contenedores.png') && !c4Injected) {
        c4Injected = true;
        figCounter++;
        htmlParts.push(FIGURE_REGISTRY['FIG-ARQ-HEX'](String(figCounter)));
      } else {
        htmlParts.push(`<blockquote><p>${renderInline(joined)}</p></blockquote>`);
      }
      continue;
    }

    // Listas desordenadas
    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      htmlParts.push(`<ul>${items.join('\n')}</ul>`);
      continue;
    }

    // Listas numeradas (preservando el índice inicial si un bloque de ecuación cortó la lista anterior)
    const olMatch = trimmed.match(/^(\d+)\.\s+/);
    if (olMatch) {
      const startNum = Number(olMatch[1]);
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      const startAttr = startNum > 1 ? ` start="${startNum}"` : '';
      htmlParts.push(`<ol${startAttr}>${items.join('\n')}</ol>`);
      continue;
    }

    // Párrafo normal (con guardia garantizada de avance si aparece un token suelto como '|')
    const pBuf = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('$$') &&
      !lines[i].trim().startsWith('<!-- FIGURE:') &&
      !/^---+$/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      pBuf.push(lines[i].trim());
      i++;
    }
    if (pBuf.length === 0) {
      pBuf.push(lines[i].trim());
      i++;
    }
    htmlParts.push(`<p>${renderInline(pBuf.join(' '))}</p>`);
  }

  let tocHtml = '';
  if (docMeta.toc || headings.length >= 10) {
    const tocItems = headings
      .filter((h) => h.level <= 3)
      .map(
        (h) =>
          `<li class="toc-item toc-l${h.level}"><a href="#${h.id}">${renderInline(h.text)}</a></li>`,
      )
      .join('\n');
    tocHtml = `<nav class="toc-box" aria-label="Índice de Contenidos">
      <div class="toc-title">Índice General de Contenidos</div>
      <ol class="toc-list">${tocItems}</ol>
    </nav>`;
  }

  // Insertamos el índice justo después de Resumen / Abstract si existen, o al inicio del cuerpo
  let fullBody = htmlParts.join('\n');
  if (tocHtml) {
    const firstSectionIdx = fullBody.search(/<h2 id="(?:1-|matriz-maestra|catalogo-consolidado|automata-finito)/);
    if (firstSectionIdx !== -1) {
      fullBody = `${fullBody.slice(0, firstSectionIdx)}${tocHtml}\n${fullBody.slice(firstSectionIdx)}`;
    } else {
      fullBody = `${tocHtml}\n${fullBody}`;
    }
  }

  return fullBody;
}

function buildHtmlDocument(meta, bodyHtml) {
  const codeBadge = meta.doc_code ? `<div class="cover-code">${escapeHtml(meta.doc_code)} · VERSIÓN ${escapeHtml(meta.version)}</div>` : `<div class="cover-code">DOCUMENTACIÓN TÉCNICA OFICIAL · VERSIÓN ${escapeHtml(meta.version)}</div>`;
  const subtitleHtml = meta.subtitle ? `<p class="cover-subtitle">${escapeHtml(meta.subtitle)}</p>` : '';
  const phaseHtml = meta.phase ? `<div class="meta-row"><span class="meta-label">Fase / Área Normativa</span><span class="meta-value">${escapeHtml(meta.phase)}</span></div>` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(meta.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg-page: #FFFFFF;
      --text-primary: #1A1A1A;
      --text-secondary: #4A4A4A;
      --text-muted: #64748B;
      --accent: #4F46E5;
      --bg-code: #F8FAFC;
      --border-subtle: #E2E8F0;
      --border-strong: #CBD5E1;
      --font-sans: 'Inter', 'Segoe UI', 'Helvetica Neue', Roboto, Arial, sans-serif;
      --font-mono: 'JetBrains Mono', 'Cascadia Mono', Consolas, monospace;
    }

    @page {
      size: A4;
      margin: 2.35cm 2.2cm 2.2cm 2.2cm;
    }

    @page :first {
      margin-top: 2.2cm;
    }

    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg-page);
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 11pt;
      line-height: 1.46;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Vista cómoda en navegador web cuando abren el .html directo */
    @media screen {
      body {
        max-width: 21cm;
        margin: 2rem auto;
        padding: 2.2cm;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      }
    }

    /* 1. Portada Académica Minimalista */
    .cover-page {
      min-height: 23.6cm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      break-after: page;
      padding-top: 1.2cm;
      padding-bottom: 0.6cm;
    }

    .cover-top {
      border-top: 2.5px solid var(--accent);
      padding-top: 1.4cm;
    }

    .cover-code {
      font-family: var(--font-mono);
      font-size: 9.5pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: var(--accent);
      text-transform: uppercase;
      margin-bottom: 0.9cm;
    }

    .cover-title {
      font-size: 23pt;
      font-weight: 700;
      line-height: 1.22;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin: 0 0 0.65cm 0;
    }

    .cover-subtitle {
      font-size: 13.5pt;
      font-weight: 400;
      line-height: 1.42;
      color: var(--text-secondary);
      margin: 0;
      max-width: 94%;
    }

    .cover-bottom {
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.75cm;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.32cm;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      font-size: 10pt;
    }

    .meta-label {
      color: var(--text-secondary);
      font-weight: 500;
      min-width: 170px;
    }

    .meta-value {
      color: var(--text-primary);
      font-weight: 600;
      text-align: right;
    }

    /* 2. Jerarquía Tipográfica de Secciones */
    h2 {
      font-size: 16.5pt;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.015em;
      margin-top: 1.9em;
      margin-bottom: 0.65em;
      padding-bottom: 0.22em;
      border-bottom: 1px solid var(--border-subtle);
      page-break-after: avoid;
      break-after: avoid;
    }

    h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 0.82em;
      background: var(--accent);
      margin-right: 0.48em;
      vertical-align: -0.08em;
      border-radius: 1px;
    }

    h3 {
      font-size: 13.5pt;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 1.45em;
      margin-bottom: 0.45em;
      page-break-after: avoid;
      break-after: avoid;
    }

    h4 {
      font-size: 11.5pt;
      font-weight: 600;
      color: var(--accent);
      margin-top: 1.2em;
      margin-bottom: 0.35em;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin: 0 0 0.85em 0;
      color: var(--text-primary);
      text-align: left;
    }

    ul, ol {
      margin: 0.35em 0 1em 0;
      padding-left: 1.45em;
    }

    li {
      margin-bottom: 0.38em;
      color: var(--text-primary);
    }

    li strong {
      color: var(--text-primary);
    }

    a {
      color: var(--accent);
      text-decoration: none;
    }

    hr.section-rule {
      border: none;
      border-top: 1px solid var(--border-subtle);
      margin: 1.5em 0;
    }

    /* 3. Índice de Contenidos */
    .toc-box {
      background: var(--bg-code);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      padding: 1.1em 1.4em;
      margin: 1.4em 0 2em 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .toc-title {
      font-size: 11.5pt;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.6em;
      letter-spacing: -0.01em;
    }

    .toc-list {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    .toc-item {
      margin-bottom: 0.28em;
      font-size: 10pt;
      line-height: 1.38;
    }

    .toc-item a {
      color: var(--text-secondary);
    }

    .toc-l2 {
      font-weight: 600;
      margin-top: 0.35em;
    }

    .toc-l2 a {
      color: var(--text-primary);
    }

    .toc-l3 {
      padding-left: 1.2em;
    }

    /* 4. Citas Destacadas */
    blockquote {
      margin: 1.15em 0;
      padding: 0.55em 1.1em;
      border-left: 3px solid var(--accent);
      background: #FAFBFD;
      color: var(--text-secondary);
      font-style: italic;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    blockquote p {
      margin: 0;
      color: var(--text-secondary);
    }

    /* 5. Código Monoespaciado */
    code {
      font-family: var(--font-mono);
      font-size: 9.5pt;
      background: var(--bg-code);
      color: var(--text-primary);
      padding: 0.12em 0.35em;
      border-radius: 4px;
      border: 1px solid var(--border-subtle);
    }

    .code-block {
      position: relative;
      background: var(--bg-code);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      margin: 1.1em 0 1.35em 0;
      padding: 0.85em 1em;
      overflow-x: hidden;
    }

    .code-lang {
      font-family: var(--font-mono);
      font-size: 8pt;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.06em;
      margin-bottom: 0.45em;
    }

    .code-block pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--font-mono);
      font-size: 9.2pt;
      line-height: 1.42;
    }

    .code-block code {
      background: transparent;
      border: none;
      padding: 0;
      font-size: inherit;
    }

    .code-line {
      display: inline;
    }

    .ln {
      display: inline-block;
      width: 2.1em;
      color: #94A3B8;
      user-select: none;
      margin-right: 0.65em;
      text-align: right;
      font-size: 8.5pt;
    }

    /* 6. Tablas Académicas Limpias (Solo Líneas Horizontales Finas) */
    .table-wrap {
      margin: 1.15em 0 1.5em 0;
      width: 100%;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.6pt;
      line-height: 1.38;
    }

    thead {
      display: table-header-group;
    }

    thead tr {
      background: var(--bg-code);
      border-top: 1.5px solid var(--text-primary);
      border-bottom: 1px solid var(--border-strong);
    }

    th {
      font-weight: 700;
      color: var(--text-primary);
      padding: 7px 9px;
      vertical-align: bottom;
    }

    td {
      padding: 6.5px 8px;
      color: var(--text-primary);
      border-bottom: 0.75px solid var(--border-subtle);
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    td code {
      font-size: 8.6pt;
      overflow-wrap: anywhere;
      word-break: break-word;
    }

    tbody tr:last-child td {
      border-bottom: 1.25px solid var(--border-strong);
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* 7. Gráficos y Diagramas Vectoriales */
    figure.academic-figure {
      margin: 1.4em 0 1.65em 0;
      padding: 0.9em 1em 0.75em 1em;
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      background: #FFFFFF;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .svg-container {
      width: 100%;
      margin-bottom: 0.55em;
    }

    figcaption {
      font-size: 9.4pt;
      line-height: 1.38;
      color: var(--text-secondary);
      border-top: 0.75px solid var(--border-subtle);
      padding-top: 0.5em;
    }

    figcaption strong {
      color: var(--accent);
    }

    /* 8. Expresiones Matemáticas */
    .math-block {
      margin: 1.05em 0;
      padding: 0.65em 1em;
      background: var(--bg-code);
      border-left: 2.5px solid var(--accent);
      border-radius: 0 5px 5px 0;
      text-align: center;
      font-family: 'Cambria Math', 'Times New Roman', Georgia, serif;
      font-size: 11.2pt;
      color: var(--text-primary);
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .math-inline {
      font-family: 'Cambria Math', 'Times New Roman', Georgia, serif;
      font-size: 10.8pt;
      white-space: nowrap;
    }

    .m-rom {
      font-family: var(--font-sans);
      font-size: 0.9em;
    }

    .m-frac {
      display: inline-flex;
      flex-direction: column;
      vertical-align: middle;
      text-align: center;
      padding: 0 0.2em;
      font-size: 0.9em;
      line-height: 1.1;
    }

    .m-num {
      border-bottom: 0.9px solid var(--text-primary);
      padding: 0 0.15em 1px 0.15em;
    }

    .m-den {
      padding: 1px 0.15em 0 0.15em;
    }
  </style>
</head>
<body>
  <section class="cover-page">
    <div class="cover-top">
      ${codeBadge}
      <h1 class="cover-title">${escapeHtml(meta.title)}</h1>
      ${subtitleHtml}
    </div>
    <div class="cover-bottom">
      <div class="meta-row">
        <span class="meta-label">Proyecto / Sistema</span>
        <span class="meta-value">${escapeHtml(meta.institution)}</span>
      </div>
      ${phaseHtml}
      <div class="meta-row">
        <span class="meta-label">Autoría y Gobernanza</span>
        <span class="meta-value">${escapeHtml(meta.authors)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Fecha de Emisión</span>
        <span class="meta-value">${escapeHtml(meta.date)}</span>
      </div>
    </div>
  </section>
  <main class="document-body">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

function collectMarkdownFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results.sort();
}

async function main() {
  const mdFiles = collectMarkdownFiles(mdRoot);
  console.log(`Encontrados ${mdFiles.length} documentos Markdown en Proyecto - SMCTA/Documentos MD.`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    for (const mdPath of mdFiles) {
      const rawMd = fs.readFileSync(mdPath, 'utf8');
      const baseNoExt = path.basename(mdPath, '.md');
      const { meta, body } = parseFrontmatterAndLegacyMeta(rawMd, baseNoExt);
      const bodyHtml = compileMarkdownBody(body, meta);
      const fullHtml = buildHtmlDocument(meta, bodyHtml);

      const relDir = path.relative(mdRoot, path.dirname(mdPath));
      const pdfPath = path.join(pdfRoot, relDir, `${baseNoExt}.pdf`);
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });

      const page = await context.newPage();
      await page.setContent(fullHtml, { waitUntil: 'load', timeout: 10000 });
      await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]));

      const shortHeaderTitle = escapeHtml(
        (meta.doc_code ? `${meta.doc_code} · ` : '') +
          (meta.title.length > 68 ? `${meta.title.slice(0, 65)}...` : meta.title),
      );

      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="width:100%; font-family:'Inter','Segoe UI',sans-serif; font-size:8pt; color:#64748B; padding:0 2.2cm; display:flex; justify-content:space-between; align-items:center;">
          <span>${shortHeaderTitle}</span>
          <span style="color:#4F46E5; font-weight:600;">SMCTA v2</span>
        </div>`,
        footerTemplate: `<div style="width:100%; font-family:'Inter','Segoe UI',sans-serif; font-size:8pt; color:#64748B; padding:0 2.2cm; display:flex; justify-content:space-between; align-items:center;">
          <span>Documentación Oficial de Ingeniería</span>
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
        </div>`,
        margin: {
          top: '2.35cm',
          bottom: '2.2cm',
          left: '2.2cm',
          right: '2.2cm',
        },
      });

      await page.close();
      console.log(`  [OK] ${path.relative(repoRoot, pdfPath)}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
