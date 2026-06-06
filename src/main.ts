import { parse } from './parser';
import { layout } from './layout';
import { render } from './render';
import { refsToCsv, refsToMarkdown } from './refs';
import { downloadText, exportSvgAsPdf, exportSvgFile } from './pdf';
import { SAMPLE_ORDER, SAMPLES, type SampleId } from './samples';
import { HELP_HTML } from './help';
import { buildNodeDefinitionLine, quoteIfNeeded, type GuiNodeShape } from './gui-format';
import {
  BRAND_MARK, ICON_DOWNLOAD, ICON_HELP, ICON_LIST, ICON_NEW, ICON_TRASH,
  ICON_MODE, ICON_OP, ICON_PATTERN, ICON_SHAPE, OP_LABEL,
} from './icons';
import { PATTERN_LABEL, PATTERN_SOURCE, type PatternId } from './patterns';
import type { Lang } from './types';

const SAMPLE = SAMPLES.block.source;
const STORAGE_KEY = 'patentdsl:source';
const LANG_KEY = 'patentdsl:lang';
const MODE_KEY = 'patentdsl:mode';
const INPUT_KEY = 'patentdsl:input';
const OP_KEY = 'patentdsl:edge-op';
const SHAPE_KEY = 'patentdsl:node-shape';

type ViewMode = 'edit' | 'split' | 'preview';
type InputMode = 'cli' | 'gui';
type NodeShape = GuiNodeShape;

const OP_ORDER = ['-', '->', '<-', '<->', '..', '.>', '=>'] as const;
const SHAPE_ORDER: { id: NodeShape; label: string }[] = [
  { id: 'normal', label: '四角' },
  { id: 'cond',   label: '菱形' },
];

const app = document.getElementById('app') as HTMLElement;
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const preview = document.getElementById('preview') as HTMLDivElement;
const refsPanel = document.getElementById('refs') as HTMLDivElement;
const diagBar = document.getElementById('diagnostics') as HTMLDivElement;
const footStat = document.getElementById('foot-stat') as HTMLElement;

const KIND_LABEL: Record<string, string> = {
  block: 'ブロック図', flow: 'フローチャート',
  state: '状態遷移図', seq: 'シーケンス図',
};

let lang: Lang = (localStorage.getItem(LANG_KEY) as Lang) ?? 'ja';
let viewMode: ViewMode = (localStorage.getItem(MODE_KEY) as ViewMode) ?? 'split';
let inputMode: InputMode = (localStorage.getItem(INPUT_KEY) as InputMode) ?? 'cli';
let currentOp: string = localStorage.getItem(OP_KEY) ?? '-';
let currentShape: NodeShape = (localStorage.getItem(SHAPE_KEY) as NodeShape) ?? 'normal';

function bootstrap() {
  editor.value = localStorage.getItem(STORAGE_KEY) ?? SAMPLE;
  app.dataset.mode = viewMode;
  app.dataset.input = inputMode;

  insertIcons();

  for (const b of document.querySelectorAll<HTMLButtonElement>('.lang button')) {
    b.classList.toggle('active', b.dataset.lang === lang);
    b.addEventListener('click', () => {
      lang = b.dataset.lang as Lang;
      localStorage.setItem(LANG_KEY, lang);
      for (const x of document.querySelectorAll<HTMLButtonElement>('.lang button')) {
        x.classList.toggle('active', x.dataset.lang === lang);
      }
      refresh();
    });
  }

  const modeSwitch = document.getElementById('modeSwitch')!;
  for (const b of modeSwitch.querySelectorAll<HTMLButtonElement>('button')) {
    b.classList.toggle('active', b.dataset.mode === viewMode);
    b.addEventListener('click', () => {
      viewMode = b.dataset.mode as ViewMode;
      localStorage.setItem(MODE_KEY, viewMode);
      app.dataset.mode = viewMode;
      for (const x of modeSwitch.querySelectorAll<HTMLButtonElement>('button')) {
        x.classList.toggle('active', x.dataset.mode === viewMode);
      }
    });
  }

  const inputSwitch = document.getElementById('inputSwitch')!;
  for (const b of inputSwitch.querySelectorAll<HTMLButtonElement>('button')) {
    b.classList.toggle('active', b.dataset.input === inputMode);
    b.addEventListener('click', () => {
      inputMode = b.dataset.input as InputMode;
      localStorage.setItem(INPUT_KEY, inputMode);
      app.dataset.input = inputMode;
      for (const x of inputSwitch.querySelectorAll<HTMLButtonElement>('button')) {
        x.classList.toggle('active', x.dataset.input === inputMode);
      }
    });
  }

  document.getElementById('btn-svg')!.addEventListener('click', () => {
    const svg = preview.querySelector('svg');
    if (svg) exportSvgFile(svg as SVGSVGElement);
  });
  document.getElementById('btn-pdf')!.addEventListener('click', async () => {
    const svg = preview.querySelector('svg');
    if (!svg) return;
    try { await exportSvgAsPdf(svg as SVGSVGElement); }
    catch (e: any) { alert('PDF出力エラー: ' + (e?.message ?? String(e))); }
  });
  document.getElementById('btn-refs-md')!.addEventListener('click', () => {
    const doc = parse(editor.value);
    downloadText(refsToMarkdown(doc), 'reference-signs.md', 'text/markdown');
  });
  document.getElementById('btn-refs-csv')!.addEventListener('click', () => {
    const doc = parse(editor.value);
    downloadText(refsToCsv(doc), 'reference-signs.csv', 'text/csv');
  });

  document.getElementById('btn-new')!.addEventListener('click', () => {
    if (editor.value.trim() && !confirm('現在のソースを破棄してサンプルに戻します。よろしいですか?')) return;
    editor.value = SAMPLE;
    localStorage.setItem(STORAGE_KEY, SAMPLE);
    refresh();
  });

  document.getElementById('btn-clear')!.addEventListener('click', () => {
    if (editor.value.trim() && !confirm('ソースを全消去します(空にします)。よろしいですか?')) return;
    editor.value = '';
    localStorage.setItem(STORAGE_KEY, '');
    refresh();
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  editor.addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEY, editor.value);
    if (timer) clearTimeout(timer);
    timer = setTimeout(refresh, 150);
  });

  const sampleSelect = document.getElementById('sample') as HTMLSelectElement;
  buildSampleSelect(sampleSelect);
  sampleSelect.addEventListener('change', () => {
    const id = sampleSelect.value as SampleId | '';
    if (!id) return;
    const s = SAMPLES[id];
    if (!s) return;
    editor.value = s.source;
    localStorage.setItem(STORAGE_KEY, s.source);
    sampleSelect.value = '';
    refresh();
  });

  const helpDialog = document.getElementById('help-dialog') as HTMLDialogElement;
  helpDialog.innerHTML = HELP_HTML;
  const closeHelp = () => helpDialog.close();
  helpDialog.querySelector('.help-close')?.addEventListener('click', closeHelp);
  helpDialog.addEventListener('click', (e) => {
    if (e.target === helpDialog) closeHelp();
  });
  document.getElementById('btn-help')!.addEventListener('click', () => helpDialog.showModal());

  wireGuiBuilder();
  refresh();
}

function buildSampleSelect(select: HTMLSelectElement): void {
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'サンプル…';
  select.appendChild(placeholder);

  for (const id of SAMPLE_ORDER) {
    const sample = SAMPLES[id];
    const option = document.createElement('option');
    option.value = id;
    option.textContent = sample.label;
    option.title = sample.hint;
    select.appendChild(option);
  }
}

function insertIcons() {
  const brand = document.querySelector('.brand-icon');
  if (brand) brand.innerHTML = BRAND_MARK;

  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="mode-edit"]')) el.innerHTML = ICON_MODE.edit;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="mode-split"]')) el.innerHTML = ICON_MODE.split;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="mode-preview"]')) el.innerHTML = ICON_MODE.preview;

  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="help"]')) el.innerHTML = ICON_HELP;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="dl"]')) el.innerHTML = ICON_DOWNLOAD;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="list"]')) el.innerHTML = ICON_LIST;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="new"]')) el.innerHTML = ICON_NEW;
  for (const el of document.querySelectorAll<HTMLElement>('[data-icon="trash"]')) el.innerHTML = ICON_TRASH;

  for (const el of document.querySelectorAll<HTMLElement>('[data-icon]')) {
    el.classList.add('btn-icon');
  }
}

function wireGuiBuilder() {
  buildOpPicker();
  buildShapePicker();
  buildPatternGrid();

  document.getElementById('gui-add-node')!.addEventListener('click', addNodeFromGui);
  document.getElementById('gui-add-cont')!.addEventListener('click', addContainmentFromGui);
  document.getElementById('gui-add-edge')!.addEventListener('click', addEdgeFromGui);

  document.getElementById('gui-node-en')!.addEventListener('keydown', e => {
    if ((e as KeyboardEvent).key === 'Enter') addNodeFromGui();
  });
  document.getElementById('gui-cont-children')!.addEventListener('keydown', e => {
    if ((e as KeyboardEvent).key === 'Enter') addContainmentFromGui();
  });
  document.getElementById('gui-edge-en')!.addEventListener('keydown', e => {
    if ((e as KeyboardEvent).key === 'Enter') addEdgeFromGui();
  });
}

function buildOpPicker() {
  const picker = document.getElementById('gui-edge-op')!;
  picker.dataset.op = currentOp;
  picker.innerHTML = '';
  for (const op of OP_ORDER) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.op = op;
    btn.title = OP_LABEL[op];
    btn.innerHTML = `${ICON_OP[op]}<span class="op-label">${OP_LABEL[op]}</span>`;
    if (op === currentOp) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentOp = op;
      localStorage.setItem(OP_KEY, op);
      picker.dataset.op = op;
      for (const b of picker.querySelectorAll<HTMLButtonElement>('button')) {
        b.classList.toggle('active', b.dataset.op === op);
      }
    });
    picker.appendChild(btn);
  }
}

function buildShapePicker() {
  const picker = document.getElementById('gui-node-shape')!;
  picker.dataset.shape = currentShape;
  picker.innerHTML = '';
  for (const s of SHAPE_ORDER) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.shape = s.id;
    btn.title = s.label;
    btn.innerHTML = `${ICON_SHAPE[s.id]}<span>${s.label}</span>`;
    if (s.id === currentShape) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentShape = s.id;
      localStorage.setItem(SHAPE_KEY, s.id);
      picker.dataset.shape = s.id;
      for (const b of picker.querySelectorAll<HTMLButtonElement>('button')) {
        b.classList.toggle('active', b.dataset.shape === s.id);
      }
    });
    picker.appendChild(btn);
  }
}

function buildPatternGrid() {
  const grid = document.getElementById('gui-patterns')!;
  grid.innerHTML = '';
  for (const id of Object.keys(PATTERN_LABEL) as PatternId[]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = `${PATTERN_LABEL[id]} を末尾に追記`;
    btn.innerHTML = `${ICON_PATTERN[id]}<span class="pattern-label">${PATTERN_LABEL[id]}</span>`;
    btn.addEventListener('click', () => appendPattern(id));
    grid.appendChild(btn);
  }
}

function appendPattern(id: PatternId) {
  const src = PATTERN_SOURCE[id];
  const header = `# ── ${PATTERN_LABEL[id]} ──\n`;
  appendLines(header + src);
}

function val(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value.trim();
}
function clearVal(...ids: string[]): void {
  for (const id of ids) (document.getElementById(id) as HTMLInputElement).value = '';
}
function isValidId(s: string): boolean { return /^[A-Za-z0-9_*]+$/.test(s); }
function flash(input: HTMLInputElement) {
  input.style.borderColor = 'var(--error)';
  setTimeout(() => { input.style.borderColor = ''; }, 800);
}
function appendLines(...lines: string[]): void {
  const cur = editor.value;
  const sep = cur.length === 0 || cur.endsWith('\n') ? '' : '\n';
  editor.value = cur + sep + lines.join('\n') + '\n';
  localStorage.setItem(STORAGE_KEY, editor.value);
  refresh();
}

function addNodeFromGui() {
  const id = val('gui-node-id');
  if (!id) { flash(document.getElementById('gui-node-id') as HTMLInputElement); return; }
  if (!isValidId(id)) { alert(`符号 "${id}" には英数字と _ * しか使えません`); return; }
  appendLines(buildNodeDefinitionLine(id, val('gui-node-ja'), val('gui-node-en'), currentShape));
  clearVal('gui-node-id', 'gui-node-ja', 'gui-node-en');
  (document.getElementById('gui-node-id') as HTMLInputElement).focus();
}

function addContainmentFromGui() {
  const parent = val('gui-cont-parent');
  const childrenRaw = val('gui-cont-children');
  if (!parent) { flash(document.getElementById('gui-cont-parent') as HTMLInputElement); return; }
  if (!childrenRaw) { flash(document.getElementById('gui-cont-children') as HTMLInputElement); return; }
  if (!isValidId(parent)) { alert(`親の符号 "${parent}" が不正です`); return; }
  const children = childrenRaw.split(/\s+/).filter(Boolean);
  for (const c of children) {
    if (!isValidId(c)) { alert(`子の符号 "${c}" が不正です`); return; }
  }
  appendLines(`${parent} : ${children.join(' ')}`);
  clearVal('gui-cont-parent', 'gui-cont-children');
  (document.getElementById('gui-cont-parent') as HTMLInputElement).focus();
}

function addEdgeFromGui() {
  const from = val('gui-edge-from');
  const to = val('gui-edge-to');
  if (!from) { flash(document.getElementById('gui-edge-from') as HTMLInputElement); return; }
  if (!to) { flash(document.getElementById('gui-edge-to') as HTMLInputElement); return; }
  if (!isValidId(from)) { alert(`from "${from}" が不正です`); return; }
  if (!isValidId(to)) { alert(`to "${to}" が不正です`); return; }
  const ja = val('gui-edge-ja');
  const en = val('gui-edge-en');
  let line = `${from} ${currentOp} ${to}`;
  if (ja && en) line += ` : ${quoteIfNeeded(ja)} / ${quoteIfNeeded(en)}`;
  else if (ja) line += ` : ${quoteIfNeeded(ja)}`;
  else if (en) line += ` : ${quoteIfNeeded(en)}`;
  appendLines(line);
  clearVal('gui-edge-from', 'gui-edge-to', 'gui-edge-ja', 'gui-edge-en');
  (document.getElementById('gui-edge-from') as HTMLInputElement).focus();
}

function refresh() {
  const doc = parse(editor.value);

  const nNodes = [...doc.nodes.keys()].filter(id => id !== '*').length;
  const nEdges = doc.edges.length;
  footStat.innerHTML = nNodes === 0
    ? ''
    : `<span class="kind">${KIND_LABEL[doc.kind] ?? doc.kind}</span>符号 ${nNodes} 件 / 接続 ${nEdges} 件`;

  if (doc.diagnostics.length === 0) {
    diagBar.textContent = '';
    diagBar.classList.remove('has');
  } else {
    diagBar.innerHTML = doc.diagnostics.map(d => {
      const mark = d.severity === 'error' ? '✕' : d.severity === 'warning' ? '!' : 'i';
      return `<div class="d-${d.severity}">${mark} ${d.line}:${d.col} ${escapeHtml(d.message)}</div>`;
    }).join('');
    diagBar.classList.add('has');
  }

  preview.innerHTML = '';
  if (doc.nodes.size > 0) {
    try {
      const laid = layout(doc);
      preview.appendChild(render(laid, { lang }));
    } catch (e: any) {
      preview.innerHTML = `<div class="err">レイアウトエラー: ${escapeHtml(e?.message ?? String(e))}</div>`;
    }
  }

  refsPanel.innerHTML = '';
  const ids = [...doc.nodes.keys()]
    .filter(id => id !== '*')
    .sort((a, b) => {
      const na = parseInt(a, 10), nb = parseInt(b, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  if (ids.length === 0) {
    refsPanel.innerHTML = '<div class="hint">符号を定義してください</div>';
  } else {
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>符号</th><th>日本語</th><th>English</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const id of ids) {
      const n = doc.nodes.get(id)!;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td class="id">${id}</td><td>${escapeHtml(n.label.ja ?? '')}</td><td>${escapeHtml(n.label.en ?? '')}</td>`;
      if (n.implicit) tr.classList.add('implicit');
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    refsPanel.appendChild(table);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  } as Record<string, string>)[c]);
}

bootstrap();
