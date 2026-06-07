import IPAEX_URL from './assets/ipaexg.ttf?url';

let cachedFontBase64: string | null = null;

const FONT_NAME = 'IPAexGothic';

export type PdfFitRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type SvgViewBox = {
  minX: number;
  minY: number;
  width: number;
  height: number;
};

export type RasterFormat = 'png' | 'jpeg';

const RASTER_SCALE = 8;
const RASTER_MAX_SIDE = 24000;
const RASTER_MAX_PIXELS = 100_000_000;
const RASTER_BLEED = 3;
const JPEG_QUALITY = 1.0;
const SVG_DISPLAY_TARGET_SIDE = 1600;

export function parseSvgViewBox(svgEl: SVGSVGElement): SvgViewBox {
  const raw = svgEl.getAttribute('viewBox')?.trim();
  const values = raw?.split(/\s+/).map(Number).filter(Number.isFinite) ?? [];
  if (values.length === 4 && values[2] > 0 && values[3] > 0) {
    return { minX: values[0], minY: values[1], width: values[2], height: values[3] };
  }
  const width = parseLength(svgEl.getAttribute('width')) || 210;
  const height = parseLength(svgEl.getAttribute('height')) || 297;
  return { minX: 0, minY: 0, width, height };
}

function parseLength(value: string | null): number {
  if (!value) return 0;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function fitRectIntoPage(
  sourceW: number,
  sourceH: number,
  pageW: number,
  pageH: number,
  margin = 10,
): PdfFitRect {
  const usableW = Math.max(1, pageW - margin * 2);
  const usableH = Math.max(1, pageH - margin * 2);
  const scale = Math.min(usableW / sourceW, usableH / sourceH);
  const width = sourceW * scale;
  const height = sourceH * scale;
  return {
    x: (pageW - width) / 2,
    y: (pageH - height) / 2,
    width,
    height,
  };
}

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

  const vb = parseSvgViewBox(svgEl);
  const w = vb.width;
  const h = vb.height;
  const orientation = w > h ? 'l' : 'p';
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const fit = fitRectIntoPage(w, h, pageW, pageH);

  try {
    const base64 = await loadFontBase64();
    pdf.addFileToVFS(`${FONT_NAME}.ttf`, base64);
    pdf.addFont(`${FONT_NAME}.ttf`, FONT_NAME, 'normal');
  } catch {}

  const clone = cloneSvgForExport(svgEl, vb);
  clone.setAttribute('font-family', FONT_NAME);
  for (const t of clone.querySelectorAll('text')) t.setAttribute('font-family', FONT_NAME);

  await svg2pdf(clone, pdf, {
    x: fit.x,
    y: fit.y,
    width: fit.width,
    height: fit.height,
  });
  pdf.save(filename);
}

export function exportSvgFile(svgEl: SVGSVGElement, filename = 'figure.svg'): void {
  const viewBox = getSvgContentBox(svgEl);
  const clone = cloneSvgForExport(svgEl, viewBox);
  const display = svgDisplayDimensionsForViewBox(viewBox);
  clone.setAttribute('width', String(display.width));
  clone.setAttribute('height', String(display.height));
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
    type: 'image/svg+xml',
  });
  download(blob, filename);
}

export async function exportSvgAsRaster(
  svgEl: SVGSVGElement,
  format: RasterFormat,
  filename = `figure.${format === 'jpeg' ? 'jpg' : 'png'}`,
): Promise<void> {
  const viewBox = getSvgContentBox(svgEl);
  const { width, height } = rasterDimensionsForViewBox(viewBox);
  const clone = cloneSvgForExport(svgEl, viewBox);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));

  const xml = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n', xml], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas context is not available');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, mime, format === 'jpeg' ? JPEG_QUALITY : undefined);
    download(blob, filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function getSvgContentBox(svgEl: SVGSVGElement, bleed = RASTER_BLEED): SvgViewBox {
  const fallback = parseSvgViewBox(svgEl);
  let out: SvgViewBox | null = null;
  for (const el of Array.from(svgEl.querySelectorAll('*'))) {
    const getBBox = (el as SVGGraphicsElement).getBBox;
    if (typeof getBBox !== 'function') continue;
    try {
      const box = getBBox.call(el) as DOMRect;
      if (
        !Number.isFinite(box.x)
        || !Number.isFinite(box.y)
        || !Number.isFinite(box.width)
        || !Number.isFinite(box.height)
        || (box.width <= 0 && box.height <= 0)
      ) continue;
      const next = {
        minX: box.x,
        minY: box.y,
        width: Math.max(box.width, 0),
        height: Math.max(box.height, 0),
      };
      out = out ? unionViewBox(out, next) : next;
    } catch {}
  }
  return out ? padViewBox(out, bleed) : fallback;
}

export function rasterDimensionsForViewBox(
  viewBox: Pick<SvgViewBox, 'width' | 'height'>,
  scale = RASTER_SCALE,
): { width: number; height: number; scale: number } {
  const requested = Number.isFinite(scale) && scale > 0 ? scale : RASTER_SCALE;
  const sideScale = RASTER_MAX_SIDE / Math.max(viewBox.width, viewBox.height, 1);
  const pixelScale = Math.sqrt(RASTER_MAX_PIXELS / Math.max(viewBox.width * viewBox.height, 1));
  const capped = Math.min(requested, sideScale, pixelScale);
  return {
    width: Math.max(1, Math.ceil(viewBox.width * capped)),
    height: Math.max(1, Math.ceil(viewBox.height * capped)),
    scale: capped,
  };
}

export function svgDisplayDimensionsForViewBox(
  viewBox: Pick<SvgViewBox, 'width' | 'height'>,
  targetSide = SVG_DISPLAY_TARGET_SIDE,
): { width: number; height: number; scale: number } {
  const longest = Math.max(viewBox.width, viewBox.height, 1);
  const scale = Math.max(1, targetSide / longest);
  return {
    width: Math.max(1, Math.ceil(viewBox.width * scale)),
    height: Math.max(1, Math.ceil(viewBox.height * scale)),
    scale,
  };
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

function cloneSvgForExport(svgEl: SVGSVGElement, viewBox: SvgViewBox): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('version', '1.1');
  clone.removeAttribute('style');
  clone.setAttribute('viewBox', `${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`);
  clone.setAttribute('width', String(viewBox.width));
  clone.setAttribute('height', String(viewBox.height));
  clone.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return clone;
}

function unionViewBox(a: SvgViewBox, b: SvgViewBox): SvgViewBox {
  const left = Math.min(a.minX, b.minX);
  const top = Math.min(a.minY, b.minY);
  const right = Math.max(a.minX + a.width, b.minX + b.width);
  const bottom = Math.max(a.minY + a.height, b.minY + b.height);
  return { minX: left, minY: top, width: right - left, height: bottom - top };
}

function padViewBox(viewBox: SvgViewBox, pad: number): SvgViewBox {
  const p = Math.max(0, pad);
  return {
    minX: viewBox.minX - p,
    minY: viewBox.minY - p,
    width: Math.max(1, viewBox.width + p * 2),
    height: Math.max(1, viewBox.height + p * 2),
  };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image load failed'));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('canvas export failed'));
    }, mime, quality);
  });
}
