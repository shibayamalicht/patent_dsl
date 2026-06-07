import { describe, expect, it } from 'vitest';
import {
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
