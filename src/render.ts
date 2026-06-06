import type { LaidOut, LaidOutEdge, LaidOutNode } from './layout';
import type { Bilingual, EdgeOp, Lang } from './types';

const NS = 'http://www.w3.org/2000/svg';
const FONT_FAMILY = '"Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", sans-serif';

export type RenderOptions = { lang?: Lang };

export function render(laid: LaidOut, opts: RenderOptions = {}): SVGSVGElement {
  const lang = opts.lang ?? 'ja';
  const svg = el('svg', {
    xmlns: NS,
    viewBox: `0 0 ${laid.width} ${laid.height}`,
    'font-family': FONT_FAMILY,
    'shape-rendering': 'geometricPrecision',
  });

  const defs = el('defs');
  defs.appendChild(arrowMarker('arrow-end'));
  defs.appendChild(arrowMarker('arrow-bold', true));
  svg.appendChild(defs);

  const containers = laid.nodes.filter(n => n.isContainer);
  const leaves = laid.nodes.filter(n => !n.isContainer);

  for (const c of containers) svg.appendChild(renderContainer(c, lang));
  for (const e of laid.edges) svg.appendChild(renderEdge(e, lang));
  for (const n of leaves) svg.appendChild(renderNode(n, lang));

  return svg;
}

function renderContainer(n: LaidOutNode, lang: Lang): SVGElement {
  const g = el('g');
  g.appendChild(el('rect', {
    x: n.x, y: n.y, width: n.w, height: n.h,
    fill: 'white',
    stroke: '#000',
    'stroke-width': 0.3,
  }));
  const labels = pickLabel(n.label, lang);
  if (labels.length || n.id) {
    const t = el('text', {
      x: n.x + 2,
      y: n.y + 3.5,
      'font-size': 2.6,
      fill: '#000',
    });
    t.textContent = (n.id ? n.id + ' ' : '') + (labels[0] ?? '');
    g.appendChild(t);
  }
  return g;
}

function renderNode(n: LaidOutNode, lang: Lang): SVGElement {
  const g = el('g');
  g.appendChild(renderShape(n));
  const lines: string[] = [];
  if (n.id && n.id !== '*') lines.push(n.id);
  const labels = pickLabel(n.label, lang);
  for (const l of labels) lines.push(l);
  if (lines.length === 0) return g;

  const fontSize = 2.8;
  const lineH = fontSize * 1.2;
  const totalH = lines.length * lineH;
  const startY = n.y + n.h / 2 - totalH / 2 + lineH * 0.8;
  for (let i = 0; i < lines.length; i++) {
    const t = el('text', {
      x: n.x + n.w / 2,
      y: startY + i * lineH,
      'font-size': fontSize,
      fill: '#000',
      'text-anchor': 'middle',
    });
    t.textContent = lines[i];
    g.appendChild(t);
  }
  return g;
}

function renderShape(n: LaidOutNode): SVGElement {
  const stroke = '#000';
  const fill = 'white';
  const sw = 0.4;
  switch (n.shape) {
    case 'round':
      return el('rect', {
        x: n.x, y: n.y, width: n.w, height: n.h,
        rx: Math.min(n.w, n.h) / 2, ry: Math.min(n.w, n.h) / 2,
        fill, stroke, 'stroke-width': sw,
      });
    case 'circle': {
      const r = Math.min(n.w, n.h) / 2;
      return el('circle', {
        cx: n.x + n.w / 2, cy: n.y + n.h / 2, r,
        fill: '#000', stroke,
      });
    }
    case 'diamond': {
      const cx = n.x + n.w / 2;
      const cy = n.y + n.h / 2;
      const pts = [[cx, n.y], [n.x + n.w, cy], [cx, n.y + n.h], [n.x, cy]]
        .map(p => p.join(',')).join(' ');
      return el('polygon', { points: pts, fill, stroke, 'stroke-width': sw });
    }
    case 'actor':
    case 'box':
    default:
      return el('rect', {
        x: n.x, y: n.y, width: n.w, height: n.h,
        fill, stroke, 'stroke-width': sw,
      });
  }
}

function renderEdge(e: LaidOutEdge, lang: Lang): SVGElement {
  const g = el('g');
  if (e.points.length < 2) return g;
  const d = e.points
    .map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`))
    .join(' ');
  const path = el('path', {
    d,
    fill: 'none',
    stroke: '#000',
    'stroke-width': strokeWidth(e.op),
  });
  const dash = strokeDash(e.op);
  if (dash) path.setAttribute('stroke-dasharray', dash);
  if (!e.isLifeline) {
    const endM = markerEndFor(e.op);
    const startM = markerStartFor(e.op);
    if (endM) path.setAttribute('marker-end', endM);
    if (startM) path.setAttribute('marker-start', startM);
  }
  g.appendChild(path);

  const labels = pickLabel(e.label, lang);
  if (labels.length) {
    const { mid, vertical } = midpointAndDir(e.points);
    const OFFSET = 2.8;
    const FONT_JA = 2.4;
    const FONT_EN = 2.1;
    const GAP = 0.6;
    const ja = labels[0];
    const en = labels[1];

    const drawText = (
      text: string, x: number, y: number, fontSize: number,
      anchor: string, baseline: string,
    ) => {
      const haloStrokeWidth = fontSize * 0.7;
      const halo = el('text', {
        x, y,
        'font-size': fontSize,
        fill: 'white',
        stroke: 'white',
        'stroke-width': haloStrokeWidth,
        'text-anchor': anchor,
        'dominant-baseline': baseline,
        'paint-order': 'stroke',
      });
      halo.textContent = text;
      const t = el('text', {
        x, y,
        'font-size': fontSize,
        fill: '#000',
        'text-anchor': anchor,
        'dominant-baseline': baseline,
      });
      t.textContent = text;
      g.appendChild(halo);
      g.appendChild(t);
    };

    if (vertical) {
      const x = mid[0] + OFFSET;
      const anchor = 'start';
      if (en) {
        drawText(ja, x, mid[1] - FONT_JA / 2 - GAP / 2, FONT_JA, anchor, 'middle');
        drawText(en, x, mid[1] + FONT_EN / 2 + GAP / 2, FONT_EN, anchor, 'middle');
      } else {
        drawText(ja, x, mid[1], FONT_JA, anchor, 'middle');
      }
    } else {
      const x = mid[0];
      const anchor = 'middle';
      if (en) {
        const enBaselineY = mid[1] - OFFSET;
        const jaBaselineY = enBaselineY - FONT_EN - GAP;
        drawText(ja, x, jaBaselineY, FONT_JA, anchor, 'alphabetic');
        drawText(en, x, enBaselineY, FONT_EN, anchor, 'alphabetic');
      } else {
        drawText(ja, x, mid[1] - OFFSET, FONT_JA, anchor, 'alphabetic');
      }
    }
  }

  return g;
}

function strokeWidth(op: EdgeOp): number {
  return op === 'thick' ? 0.7 : 0.4;
}

function strokeDash(op: EdgeOp): string | null {
  return (op === 'dashed' || op === 'dashed-arrow') ? '1.4 1.2' : null;
}

function markerEndFor(op: EdgeOp): string | null {
  switch (op) {
    case 'line':
    case 'dashed':         return null;
    case 'thick':          return 'url(#arrow-bold)';
    case 'arrow':
    case 'bidir':
    case 'dashed-arrow':   return 'url(#arrow-end)';
  }
}

function markerStartFor(op: EdgeOp): string | null {
  return op === 'bidir' ? 'url(#arrow-end)' : null;
}

function arrowMarker(id: string, bold = false): SVGMarkerElement {
  const m = el('marker', {
    id,
    viewBox: '0 0 10 10',
    refX: 9, refY: 5,
    markerWidth: bold ? 6 : 5,
    markerHeight: bold ? 6 : 5,
    orient: 'auto-start-reverse',
  });
  const path = el('path', {
    d: 'M 0 0 L 10 5 L 0 10 z',
    fill: '#000',
    stroke: '#000',
    'stroke-width': 0.5,
  });
  m.appendChild(path);
  return m;
}

function el<K extends keyof SVGElementTagNameMap>(
  tag: K, attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function pickLabel(b: Bilingual | undefined, lang: Lang): string[] {
  if (!b) return [];
  if (lang === 'ja') return b.ja ? [b.ja] : (b.en ? [b.en] : []);
  if (lang === 'en') return b.en ? [b.en] : (b.ja ? [b.ja] : []);
  const out: string[] = [];
  if (b.ja) out.push(b.ja);
  if (b.en) out.push(b.en);
  return out;
}

function midpointAndDir(pts: [number, number][]): {
  mid: [number, number]; vertical: boolean;
} {
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const len = dx * dx + dy * dy;
    if (len > bestLen) { bestLen = len; best = i; }
  }
  const a = pts[best];
  const b = pts[best + 1];
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const dx = Math.abs(b[0] - a[0]);
  const dy = Math.abs(b[1] - a[1]);
  return { mid, vertical: dy >= dx };
}
