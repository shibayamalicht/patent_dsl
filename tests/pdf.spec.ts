import { describe, expect, it } from 'vitest';
import {
  buildEditablePptxPackage,
  buildPptxPackage,
  fitRectIntoSlide,
  fitRectIntoPage,
  getSvgContentBox,
  parseSvgViewBox,
  rasterDimensionsForViewBox,
  svgDisplayDimensionsForViewBox,
} from '../src/pdf';

describe('PDF export sizing', () => {
  it('fits a wide SVG viewBox inside an A4 landscape page with margins', () => {
    const fit = fitRectIntoPage(360, 140, 297, 210, 10);

    expect(fit.width).toBeLessThanOrEqual(277);
    expect(fit.height).toBeLessThanOrEqual(190);
    expect(fit.x).toBeGreaterThanOrEqual(10);
    expect(fit.y).toBeGreaterThanOrEqual(10);
    expect(fit.x + fit.width).toBeLessThanOrEqual(287);
    expect(fit.y + fit.height).toBeLessThanOrEqual(200);
    expect(Math.abs(fit.x - (297 - fit.width) / 2)).toBeLessThan(0.001);
    expect(Math.abs(fit.y - (210 - fit.height) / 2)).toBeLessThan(0.001);
  });

  it('reads the SVG viewBox used for SVG and PDF exports', () => {
    const svg = fakeSvg({ viewBox: '0 0 368 159' });

    expect(parseSvgViewBox(svg)).toEqual({
      minX: 0,
      minY: 0,
      width: 368,
      height: 159,
    });
  });

  it('falls back to explicit SVG dimensions when viewBox is missing', () => {
    const svg = fakeSvg({ width: '420', height: '297' });

    expect(parseSvgViewBox(svg)).toEqual({
      minX: 0,
      minY: 0,
      width: 420,
      height: 297,
    });
  });

  it('computes a tight SVG content box before export padding', () => {
    const svg = fakeSvg({ viewBox: '0 0 100 100' }, [
      fakeBBox({ x: 10, y: 20, width: 30, height: 10 }),
      fakeBBox({ x: 50, y: 5, width: 20, height: 15 }),
    ]);

    expect(getSvgContentBox(svg, 0)).toEqual({
      minX: 10,
      minY: 5,
      width: 60,
      height: 25,
    });
  });

  it('adds a small export margin around the tight SVG content box', () => {
    const svg = fakeSvg({ viewBox: '0 0 100 100' }, [
      fakeBBox({ x: 10, y: 20, width: 30, height: 10 }),
      fakeBBox({ x: 50, y: 5, width: 20, height: 15 }),
    ]);

    expect(getSvgContentBox(svg)).toEqual({
      minX: 7,
      minY: 2,
      width: 66,
      height: 31,
    });
  });

  it('exports raster images at high resolution while capping extreme canvas sizes', () => {
    expect(rasterDimensionsForViewBox({ width: 320, height: 180 })).toEqual({
      width: 2560,
      height: 1440,
      scale: 8,
    });

    const large = rasterDimensionsForViewBox({ width: 8000, height: 2000 });
    expect(large.width).toBe(20000);
    expect(large.height).toBe(5000);
    expect(large.scale).toBe(2.5);
  });

  it('sets a readable standalone display size for exported SVG files', () => {
    expect(svgDisplayDimensionsForViewBox({ width: 320, height: 180 })).toEqual({
      width: 1600,
      height: 900,
      scale: 5,
    });

    expect(svgDisplayDimensionsForViewBox({ width: 2000, height: 800 })).toEqual({
      width: 2000,
      height: 800,
      scale: 1,
    });
  });

  it('fits exported figures into a widescreen PPTX slide with margins', () => {
    const fit = fitRectIntoSlide(1600, 900);

    expect(fit.x).toBeGreaterThanOrEqual(457200);
    expect(fit.y).toBeGreaterThanOrEqual(457200);
    expect(fit.x + fit.width).toBeLessThanOrEqual(12192000 - 457200);
    expect(fit.y + fit.height).toBeLessThanOrEqual(6858000 - 457200);
    expect(Math.abs(fit.width / fit.height - 16 / 9)).toBeLessThan(0.001);
  });

  it('creates a PPTX package with the rendered image on a slide', () => {
    const pptx = buildPptxPackage(new Uint8Array([137, 80, 78, 71]), 1600, 900);
    const text = bytesAsText(pptx);

    expect(pptx[0]).toBe(0x50);
    expect(pptx[1]).toBe(0x4b);
    expect(text).toContain('[Content_Types].xml');
    expect(text).toContain('ppt/presentation.xml');
    expect(text).toContain('ppt/slides/slide1.xml');
    expect(text).toContain('ppt/media/image1.png');
    expect(text).toContain('image/png');
  });

  it('creates an editable PPTX package from SVG primitives', () => {
    const svg = fakeSvg({ viewBox: '0 0 100 60' }, [
      fakeElement('rect', { x: '10', y: '10', width: '30', height: '12', fill: 'white', stroke: '#000', 'stroke-width': '0.4' }),
      fakeElement('path', { d: 'M 40 16 L 70 16', fill: 'none', stroke: '#000', 'stroke-width': '0.4' }),
      fakeElement('polygon', { points: '70,16 66,14 66,18', fill: '#000', stroke: '#000', 'stroke-width': '0' }),
      fakeElement('text', { x: '25', y: '17', 'font-size': '2.8', fill: '#000', 'text-anchor': 'middle' }, '10'),
    ]);
    const pptx = buildEditablePptxPackage(svg);
    const text = bytesAsText(pptx);

    expect(pptx[0]).toBe(0x50);
    expect(pptx[1]).toBe(0x4b);
    expect(text).toContain('ppt/slides/slide1.xml');
    expect(text).toContain('<p:sp>');
    expect(text).toContain('<p:cxnSp>');
    expect(text).toContain('<a:t>10</a:t>');
    expect(text).toContain('<a:custGeom>');
  });
});

function fakeSvg(attrs: Record<string, string>, elements: unknown[] = []): SVGSVGElement {
  return {
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
    querySelectorAll() {
      return elements;
    },
  } as unknown as SVGSVGElement;
}

function fakeBBox(box: { x: number; y: number; width: number; height: number }): SVGGraphicsElement {
  return {
    getBBox() {
      return box;
    },
  } as unknown as SVGGraphicsElement;
}

function fakeElement(tagName: string, attrs: Record<string, string>, textContent = ''): Element {
  return {
    tagName,
    textContent,
    getAttribute(name: string) {
      return attrs[name] ?? null;
    },
  } as unknown as Element;
}

function bytesAsText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
