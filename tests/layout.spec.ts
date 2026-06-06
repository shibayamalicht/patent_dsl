import { describe, expect, it } from 'vitest';
import type { Box } from '../src/layout';
import { layout } from '../src/layout';
import { parse } from '../src/parser';
import { SAMPLES } from '../src/samples';

const SYSTEM_SOURCE = `100 = システム本体 / Main system
10 = 制御部 / Control
20 = 通信部 / Comm
11 = CPU
12 = メモリ / memory
21 = 無線部 / wireless
22 = 有線部 / wired
30 = 外部サーバ / external server
40 = 外部端末 / external terminal
100 : 10 20
10 : 11 12
20 : 21 22
21 .> 40 : 無線 / wireless
22 -> 30 : 有線 / wired
30 <-> 40 : 通信 / comm`;

const BASIC_BLOCK_SOURCE = `10 = 制御装置 / control device
11 = CPU
12 = メモリ / memory
13 = "I/O インターフェース" / "I/O interface"
20 = 外部機器 / external device

10 : 11 12 13

11 - 12
11 - 13
13 -> 20 : 信号 / signal`;

const EXTERNAL_CONTROL_LOOP_SOURCE = `100 = 制御装置 / control device
10 = 制御部 / controller
11 = 目標値取得部 / target acquisition unit
12 = 偏差算出部 / error calculator
13 = 指令生成部 / command generator
20 = 駆動部 / driver
30 = センサ部 / sensor unit
40 = 対象装置 / controlled object

100 : 10 20
10 : 11 12 13

30 -> 12 : 測定値 / measured value
11 -> 12 : 目標値 / target value
12 -> 13 : 偏差 / error
13 -> 20 : 指令 / command
20 -> 40 : 駆動信号 / drive signal
40 .> 30 : フィードバック / feedback`;

describe('block layout', () => {
  it('draws outer containers before nested containers', () => {
    const laid = layout(parse(SYSTEM_SOURCE));
    const containers = laid.nodes.filter(n => n.isContainer).map(n => n.id);

    expect(containers.indexOf('100')).toBeLessThan(containers.indexOf('10'));
    expect(containers.indexOf('100')).toBeLessThan(containers.indexOf('20'));
  });

  it('routes edges between horizontally separated boxes out from the side', () => {
    const laid = layout(parse(SYSTEM_SOURCE));
    const source = laid.nodes.find(n => n.id === '22');
    const edge = laid.edges.find(e => e.from === '22' && e.to === '30');
    const [start, next] = edge?.points ?? [];

    expect(source).toBeDefined();
    expect(start).toEqual([source!.x + source!.w, source!.y + source!.h / 2]);
    expect(next[1]).toBe(start[1]);
    expect(next[0]).toBeGreaterThan(start[0]);
  });

  it('keeps routed edges from crossing visible intermediate boxes', () => {
    const laid = layout(parse(SYSTEM_SOURCE));
    const wireless = laid.edges.find(e => e.from === '21' && e.to === '40');
    const server = laid.nodes.find(n => n.id === '30');

    expect(wireless).toBeDefined();
    expect(server).toBeDefined();
    expect(routeIntersectsBox(wireless!.points, server!, 0.8)).toBe(false);
  });

  it('avoids running routed edges along container borders', () => {
    const laid = layout(parse(SYSTEM_SOURCE));
    const wired = laid.edges.find(e => e.from === '22' && e.to === '30');
    const system = laid.nodes.find(n => n.id === '100');

    expect(wired).toBeDefined();
    expect(system).toBeDefined();
    expect(routeOverlapsBoxBorder(wired!.points, system!)).toBe(false);
  });

  it('aligns external root blocks with connected internal blocks instead of top-aligning them', () => {
    const laid = layout(parse(SYSTEM_SOURCE));
    const wired = laid.edges.find(e => e.from === '22' && e.to === '30');
    const wireless = laid.edges.find(e => e.from === '21' && e.to === '40');
    const wiredUnit = laid.nodes.find(n => n.id === '22');
    const server = laid.nodes.find(n => n.id === '30');
    const terminal = laid.nodes.find(n => n.id === '40');

    expect(wired).toBeDefined();
    expect(wireless).toBeDefined();
    expect(wiredUnit).toBeDefined();
    expect(server).toBeDefined();
    expect(terminal).toBeDefined();
    expect(centerY(server!)).toBe(centerY(wiredUnit!));
    expect(centerY(terminal!)).toBe(centerY(server!));
    expect(wired!.points[0][1]).toBe(wired!.points.at(-1)![1]);
  });

  it('keeps internal sibling routes inside their parent container', () => {
    const laid = layout(parse(BASIC_BLOCK_SOURCE));
    const internal = laid.edges.find(e => e.from === '11' && e.to === '13');
    const parent = laid.nodes.find(n => n.id === '10');
    const middle = laid.nodes.find(n => n.id === '12');

    expect(internal).toBeDefined();
    expect(parent).toBeDefined();
    expect(middle).toBeDefined();
    expect(routeFitsInsideBox(internal!.points, parent!, 2)).toBe(true);
    expect(routeIntersectsBox(internal!.points, middle!, 0.8)).toBe(false);
  });

  it('uses grid placement for three-child patent blocks to avoid bus-like detours', () => {
    const laid = layout(parse(BASIC_BLOCK_SOURCE));
    const cpu = laid.nodes.find(n => n.id === '11');
    const memory = laid.nodes.find(n => n.id === '12');
    const io = laid.nodes.find(n => n.id === '13');
    const internal = laid.edges.find(e => e.from === '11' && e.to === '13');

    expect(cpu).toBeDefined();
    expect(memory).toBeDefined();
    expect(io).toBeDefined();
    expect(memory!.x).toBeGreaterThan(cpu!.x);
    expect(io!.y).toBeGreaterThan(cpu!.y);
    expect(internal?.points).toHaveLength(2);
    expect(internal!.points[0][0]).toBe(internal!.points[1][0]);
  });

  it('stacks linear child flows inside patent block containers', () => {
    const laid = layout(parse(SAMPLES.iot.source));
    const receiver = laid.nodes.find(n => n.id === '310');
    const analyzer = laid.nodes.find(n => n.id === '320');
    const storage = laid.nodes.find(n => n.id === '330');
    const terminalDetector = laid.nodes.find(n => n.id === '10');
    const terminalProcessor = laid.nodes.find(n => n.id === '20');
    const terminalComm = laid.nodes.find(n => n.id === '30');

    expect(receiver).toBeDefined();
    expect(analyzer).toBeDefined();
    expect(storage).toBeDefined();
    expect(centerX(receiver!)).toBe(centerX(analyzer!));
    expect(centerX(analyzer!)).toBe(centerX(storage!));
    expect(receiver!.y).toBeLessThan(analyzer!.y);
    expect(analyzer!.y).toBeLessThan(storage!.y);

    expect(terminalDetector).toBeDefined();
    expect(terminalProcessor).toBeDefined();
    expect(terminalComm).toBeDefined();
    expect(centerX(terminalDetector!)).toBe(centerX(terminalProcessor!));
    expect(centerX(terminalProcessor!)).toBe(centerX(terminalComm!));
  });

  it('keeps IoT sample routes away from unrelated leaf boxes', () => {
    const laid = layout(parse(SAMPLES.iot.source));
    const leaves = laid.nodes.filter(n => !n.isContainer);

    for (const edge of laid.edges) {
      for (const leaf of leaves) {
        if (leaf.id === edge.from || leaf.id === edge.to) continue;
        expect(
          routeIntersectsBox(edge.points, leaf, 0.8),
          `${edge.from}->${edge.to} crosses ${leaf.id}`,
        ).toBe(false);
      }
    }
  });

  it('routes gateway-to-cloud-child connections horizontally after root alignment', () => {
    const laid = layout(parse(SAMPLES.iot.source));
    const relay = laid.edges.find(e => e.from === '200' && e.to === '310');
    const gateway = laid.nodes.find(n => n.id === '200');
    const receiver = laid.nodes.find(n => n.id === '310');
    const points = relay?.points ?? [];
    const end = points[points.length - 1];

    expect(gateway).toBeDefined();
    expect(receiver).toBeDefined();
    expect(centerY(gateway!)).toBe(centerY(receiver!));
    expect(end).toEqual([receiver!.x, centerY(receiver!)]);
    expect(points[0][1]).toBe(end[1]);
  });

  it('keeps the gateway relay label anchor clear of the cloud container title area', () => {
    const laid = layout(parse(SAMPLES.iot.source));
    const relay = laid.edges.find(e => e.from === '200' && e.to === '310');
    const gateway = laid.nodes.find(n => n.id === '200');
    const cloud = laid.nodes.find(n => n.id === '300');

    expect(relay).toBeDefined();
    expect(gateway).toBeDefined();
    expect(cloud).toBeDefined();
    expect(cloud!.x - (gateway!.x + gateway!.w)).toBeGreaterThanOrEqual(32);
    expect(longestSegmentMidpoint(relay!.points)[0]).toBeLessThan(cloud!.x);
  });

  it('lays out the built-in control loop as a compact clockwise loop', () => {
    const laid = layout(parse(SAMPLES.controlLoop.source));
    const feedback = laid.edges.find(e => e.from === '40' && e.to === '30');
    const sensor = laid.nodes.find(n => n.id === '30');
    const controller = laid.nodes.find(n => n.id === '10');
    const driver = laid.nodes.find(n => n.id === '20');
    const target = laid.nodes.find(n => n.id === '40');
    const drive = laid.edges.find(e => e.from === '20' && e.to === '40');

    expect(feedback).toBeDefined();
    expect(sensor).toBeDefined();
    expect(controller).toBeDefined();
    expect(driver).toBeDefined();
    expect(target).toBeDefined();
    expect(drive).toBeDefined();
    expect(sensor!.x).toBeLessThan(controller!.x);
    expect(target!.x).toBeLessThan(driver!.x);
    expect(sensor!.y).toBeLessThan(target!.y);
    expect(controller!.y).toBeLessThan(driver!.y);
    expect(drive!.points[0][1]).toBe(drive!.points.at(-1)![1]);
    expect(feedback!.points).toHaveLength(2);
    expect(feedback!.points[0][0]).toBe(feedback!.points[1][0]);
    expect(feedback!.points[0][1]).toBeGreaterThan(feedback!.points[1][1]);
  });

  it('vertically aligns user-authored external control-loop blocks by connection', () => {
    const laid = layout(parse(EXTERNAL_CONTROL_LOOP_SOURCE));
    const sensor = laid.nodes.find(n => n.id === '30');
    const error = laid.nodes.find(n => n.id === '12');
    const driver = laid.nodes.find(n => n.id === '20');
    const target = laid.nodes.find(n => n.id === '40');
    const measured = laid.edges.find(e => e.from === '30' && e.to === '12');
    const drive = laid.edges.find(e => e.from === '20' && e.to === '40');

    expect(sensor).toBeDefined();
    expect(error).toBeDefined();
    expect(driver).toBeDefined();
    expect(target).toBeDefined();
    expect(measured).toBeDefined();
    expect(drive).toBeDefined();
    expect(centerY(sensor!)).toBe(centerY(error!));
    expect(centerY(target!)).toBe(centerY(driver!));
    expect(measured!.points[0][1]).toBe(measured!.points.at(-1)![1]);
    expect(drive!.points[0][1]).toBe(drive!.points.at(-1)![1]);
  });

  it('keeps control-loop routes away from unrelated leaf boxes', () => {
    const laid = layout(parse(SAMPLES.controlLoop.source));
    const leaves = laid.nodes.filter(n => !n.isContainer);

    for (const edge of laid.edges) {
      for (const leaf of leaves) {
        if (leaf.id === edge.from || leaf.id === edge.to) continue;
        expect(
          routeIntersectsBox(edge.points, leaf, 0.8),
          `${edge.from}->${edge.to} crosses ${leaf.id}`,
        ).toBe(false);
      }
    }
  });
});

function centerX(box: Box): number {
  return box.x + box.w / 2;
}

function centerY(box: Box): number {
  return box.y + box.h / 2;
}

function longestSegmentMidpoint(points: [number, number][]): [number, number] {
  let best = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.abs(points[i + 1][0] - points[i][0])
      + Math.abs(points[i + 1][1] - points[i][1]);
    if (len > bestLen) {
      bestLen = len;
      best = i;
    }
  }
  return [
    (points[best][0] + points[best + 1][0]) / 2,
    (points[best][1] + points[best + 1][1]) / 2,
  ];
}

function routeIntersectsBox(points: [number, number][], box: Box, pad: number): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (boxInteriorOverlap(points[i], points[i + 1], box, pad) > 0) return true;
  }
  return false;
}

function routeOverlapsBoxBorder(points: [number, number][], box: Box): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    if (boxBorderOverlap(points[i], points[i + 1], box) > 0) return true;
  }
  return false;
}

function routeFitsInsideBox(points: [number, number][], box: Box, inset: number): boolean {
  const left = box.x + inset;
  const right = box.x + box.w - inset;
  const top = box.y + inset;
  const bottom = box.y + box.h - inset;
  return points.every(([x, y]) => x >= left && x <= right && y >= top && y <= bottom);
}

function boxInteriorOverlap(
  a: [number, number],
  b: [number, number],
  box: Box,
  pad: number,
): number {
  const left = box.x - pad;
  const right = box.x + box.w + pad;
  const top = box.y - pad;
  const bottom = box.y + box.h + pad;
  if (Math.abs(a[0] - b[0]) < 0.001) {
    const x = a[0];
    if (x <= left || x >= right) return 0;
    return intervalOverlap(a[1], b[1], top, bottom);
  }
  if (Math.abs(a[1] - b[1]) < 0.001) {
    const y = a[1];
    if (y <= top || y >= bottom) return 0;
    return intervalOverlap(a[0], b[0], left, right);
  }
  return 0;
}

function boxBorderOverlap(a: [number, number], b: [number, number], box: Box): number {
  if (Math.abs(a[0] - b[0]) < 0.001) {
    const x = a[0];
    if (Math.abs(x - box.x) >= 0.001 && Math.abs(x - (box.x + box.w)) >= 0.001) return 0;
    return intervalOverlap(a[1], b[1], box.y, box.y + box.h);
  }
  if (Math.abs(a[1] - b[1]) < 0.001) {
    const y = a[1];
    if (Math.abs(y - box.y) >= 0.001 && Math.abs(y - (box.y + box.h)) >= 0.001) return 0;
    return intervalOverlap(a[0], b[0], box.x, box.x + box.w);
  }
  return 0;
}

function intervalOverlap(a1: number, a2: number, b1: number, b2: number): number {
  const minA = Math.min(a1, a2);
  const maxA = Math.max(a1, a2);
  const minB = Math.min(b1, b2);
  const maxB = Math.max(b1, b2);
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}
