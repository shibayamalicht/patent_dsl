import IPAEX_URL from './assets/ipaexg.ttf?url';

let cachedFontBase64: string | null = null;

const FONT_NAME = 'IPAexGothic';

async function loadFontBase64(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64;
  const r = await fetch(IPAEX_URL);
  if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
  const bytes = new Uint8Array(await r.arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as any);
  }
  cachedFontBase64 = btoa(bin);
  return cachedFontBase64;
}

export async function exportSvgAsPdf(svgEl: SVGSVGElement, filename = 'figure.pdf'): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { svg2pdf } = await import('svg2pdf.js');

  const vb = svgEl.getAttribute('viewBox')?.split(/\s+/).map(Number) ?? [0, 0, 210, 297];
  const w = vb[2] || 210;
  const h = vb[3] || 297;
  const orientation = w > h ? 'l' : 'p';
  const pdf = new jsPDF({ unit: 'mm', format: [w, h], orientation });

  try {
    const base64 = await loadFontBase64();
    pdf.addFileToVFS(`${FONT_NAME}.ttf`, base64);
    pdf.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');
  } catch (e) {
    console.warn('PatentDSL: Japanese font load failed, PDF text may break', e);
  }

  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('font-family', FONT_NAME);
  for (const t of clone.querySelectorAll('text')) t.setAttribute('font-family', FONT_NAME);

  await svg2pdf(clone, pdf, { x: 0, y: 0, width: w, height: h });
  pdf.save(filename);
}

export function exportSvgFile(svgEl: SVGSVGElement, filename = 'figure.svg'): void {
  const xml = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
    type: 'image/svg+xml',
  });
  download(blob, filename);
}

export function downloadText(text: string, filename: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  download(blob, filename);
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
