import type { Bilingual, Doc, Edge, EdgeOp } from './types';

export type Box = { x: number; y: number; w: number; h: number };

export type Shape = 'box' | 'round' | 'diamond' | 'circle' | 'actor';

export type LaidOutNode = Box & {
  id: string;
  label: Bilingual;
  shape: Shape;
  isContainer: boolean;
};

export type LaidOutEdge = {
  from: string;
  to: string;
  points: [number, number][];
  label?: Bilingual;
  op: EdgeOp;
  isLifeline?: boolean;
};

export type LaidOut = {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
  kind: Doc['kind'];
};

type RouteObstacle = Box & { id: string; isContainer: boolean };
type RouteSide = 'right' | 'left' | 'bottom' | 'top';
type RoutePort = { point: [number, number]; side: RouteSide };
type ChildArrangement = 'stack' | 'grid';

const NODE_W = 36;
const NODE_H = 14;
const PAD = 6;
const GRID_GAP = 8;
const TITLE_H = 5;
const MARGIN = 8;
const ROOT_GAP = MARGIN * 4;
const ROUTE_GAP = PAD;
const OBSTACLE_PAD = 0.8;
const EPS = 0.001;

export function layout(doc: Doc): LaidOut {
  switch (doc.kind) {
    case 'block': return layoutBlock(doc);
    case 'flow':  return layoutFlow(doc);
    case 'state': return layoutState(doc);
    case 'seq':   return layoutSeq(doc);
  }
}

function layoutBlock(doc: Doc): LaidOut {
  const childMap = new Map<string, string[]>();
  for (const c of doc.containments) childMap.set(c.parent, c.children);
  const parentMap = new Map<string, string>();
  for (const c of doc.containments) {
    for (const child of c.children) parentMap.set(child, c.parent);
  }
  const childIds = new Set<string>();
  for (const cs of childMap.values()) for (const c of cs) childIds.add(c);
  const allIds = [...doc.nodes.keys()];
  const roots = allIds.filter(id => !childIds.has(id));

  const placed: LaidOutNode[] = [];
  const positions = new Map<string, Box>();

  function size(id: string): { w: number; h: number } {
    const children = childMap.get(id);
    if (!children || children.length === 0) return { w: NODE_W, h: NODE_H };
    const sizes = children.map(size);
    if (arrangementOf(id) === 'grid') {
      const cols = 2;
      const rows = Math.ceil(children.length / cols);
      const colW = Math.max(...sizes.map(s => s.w));
      const rowH = Math.max(...sizes.map(s => s.h));
      return {
        w: cols * colW + 2 * PAD + (cols - 1) * GRID_GAP,
        h: TITLE_H + rows * rowH + 2 * PAD + (rows - 1) * GRID_GAP,
      };
    }
    const maxW = Math.max(...sizes.map(s => s.w));
    const totH = sizes.reduce((a, b) => a + b.h, 0);
    return {
      w: maxW + 2 * PAD,
      h: TITLE_H + totH + 2 * PAD + (children.length - 1) * GRID_GAP,
    };
  }

  function arrangementOf(id: string): ChildArrangement {
    const children = childMap.get(id);
    if (!children || children.length <= 2) return 'stack';
    return hasLinearChildFlow(children, doc.edges, childMap) ? 'stack' : 'grid';
  }

  function place(id: string, ox: number, oy: number): void {
    const s = size(id);
    positions.set(id, { x: ox, y: oy, w: s.w, h: s.h });
    const node = doc.nodes.get(id);
    const children = childMap.get(id);
    if (!children || children.length === 0) {
      placed.push({
        id, x: ox, y: oy, w: s.w, h: s.h,
        label: node?.label ?? {},
        shape: 'box',
        isContainer: false,
      });
      return;
    }
    const sizes = children.map(size);
    if (arrangementOf(id) === 'grid') {
      const cols = 2;
      const colW = Math.max(...sizes.map(s => s.w));
      const rowH = Math.max(...sizes.map(s => s.h));
      for (let i = 0; i < children.length; i++) {
        const r = Math.floor(i / cols);
        const cc = i % cols;
        const cx = ox + PAD + cc * (colW + GRID_GAP) + (colW - sizes[i].w) / 2;
        const rowTop = oy + TITLE_H + PAD + r * (rowH + GRID_GAP);
        const cy = rowTop + (rowH - sizes[i].h) / 2;
        place(children[i], cx, cy);
      }
      alignGridRows(children, sizes, rowH, oy + TITLE_H + PAD, childMap, doc.edges, positions, placed);
    } else {
      const maxW = Math.max(...sizes.map(s => s.w));
      let yy = oy + TITLE_H + PAD;
      for (let i = 0; i < children.length; i++) {
        const cx = ox + PAD + (maxW - sizes[i].w) / 2;
        place(children[i], cx, yy);
        yy += sizes[i].h + GRID_GAP;
      }
    }
    placed.push({
      id, x: ox, y: oy, w: s.w, h: s.h,
      label: node?.label ?? {},
      shape: 'box',
      isContainer: true,
    });
  }

  let cur = MARGIN;
  for (const r of roots) {
    const previousIds = new Set(positions.keys());
    place(r, cur, MARGIN);
    const subtreeIds = collectSubtreeIds(r, childMap);
    const dy = rootAlignmentDelta(r, subtreeIds, previousIds, doc.edges, positions);
    if (Math.abs(dy) >= EPS) shiftSubtree(subtreeIds, dy, positions, placed);
    const sz = size(r);
    cur += sz.w + ROOT_GAP;
  }

  const edges = makeBlockEdges(doc.edges, positions, placed, parentMap);

  placed.sort((a, b) => {
    if (a.isContainer !== b.isContainer) return a.isContainer ? -1 : 1;
    if (a.isContainer && b.isContainer) {
      const depthDiff = depthOf(a.id, parentMap) - depthOf(b.id, parentMap);
      if (depthDiff !== 0) return depthDiff;
      return b.w * b.h - a.w * a.h;
    }
    return a.y - b.y || a.x - b.x;
  });

  const boxes = [...positions.values()];
  const width = boxes.length ? Math.max(...boxes.map(b => b.x + b.w)) + MARGIN : MARGIN * 2;
  const height = boxes.length ? Math.max(...boxes.map(b => b.y + b.h)) + MARGIN : MARGIN * 2;
  return { nodes: placed, edges, width, height, kind: 'block' };
}

function layoutFlow(doc: Doc): LaidOut {
  const ids = [...doc.nodes.keys()];
  const { byRank } = computeRanks(doc);

  function shapeOf(id: string): Shape {
    const n = doc.nodes.get(id);
    const ja = n?.label.ja ?? '';
    const en = n?.label.en ?? '';
    if (ja.endsWith('?') || en.endsWith('?')) return 'diamond';
    const inc = doc.edges.filter(e => e.to === id).length;
    const out = doc.edges.filter(e => e.from === id).length;
    if (inc === 0 || out === 0) return 'round';
    return 'box';
  }

  const V_GAP = 14;
  const H_GAP = 10;
  const positions = new Map<string, Box>();
  const sortedRanks = [...byRank.keys()].sort((a, b) => a - b);
  let y = MARGIN;
  let maxX = 0;

  for (const r of sortedRanks) {
    const lane = byRank.get(r)!;
    const widths = lane.map(id => shapeOf(id) === 'diamond' ? NODE_W * 1.2 : NODE_W);
    const totalW = widths.reduce((a, b) => a + b, 0) + (lane.length - 1) * H_GAP;
    let x = MARGIN;
    const canvasW = Math.max(totalW + 2 * MARGIN, 200);
    x = (canvasW - totalW) / 2;
    for (let i = 0; i < lane.length; i++) {
      positions.set(lane[i], { x, y, w: widths[i], h: NODE_H });
      x += widths[i] + H_GAP;
    }
    if (x > maxX) maxX = x;
    y += NODE_H + V_GAP;
  }
  for (const id of ids) {
    if (!positions.has(id)) {
      positions.set(id, { x: MARGIN, y, w: NODE_W, h: NODE_H });
      y += NODE_H + V_GAP;
    }
  }

  const placed: LaidOutNode[] = [];
  for (const [id, b] of positions) {
    placed.push({
      id, ...b,
      label: doc.nodes.get(id)?.label ?? {},
      shape: shapeOf(id),
      isContainer: false,
    });
  }
  const edges = makeEdges(doc.edges, positions);
  return { nodes: placed, edges, width: maxX + MARGIN, height: y + MARGIN, kind: 'flow' };
}

function layoutState(doc: Doc): LaidOut {
  const { byRank } = computeRanks(doc);
  function shapeOf(id: string): Shape {
    if (id === '*') return 'circle';
    return 'round';
  }
  const V_GAP = 14, H_GAP = 10;
  const positions = new Map<string, Box>();
  const sortedRanks = [...byRank.keys()].sort((a, b) => a - b);
  let y = MARGIN;
  let maxX = 0;
  for (const r of sortedRanks) {
    const lane = byRank.get(r)!;
    const widths = lane.map(id => shapeOf(id) === 'circle' ? 6 : NODE_W);
    const heights = lane.map(id => shapeOf(id) === 'circle' ? 6 : NODE_H);
    const totalW = widths.reduce((a, b) => a + b, 0) + (lane.length - 1) * H_GAP;
    const canvasW = Math.max(totalW + 2 * MARGIN, 200);
    let x = (canvasW - totalW) / 2;
    for (let i = 0; i < lane.length; i++) {
      positions.set(lane[i], { x, y: y + (NODE_H - heights[i]) / 2, w: widths[i], h: heights[i] });
      x += widths[i] + H_GAP;
    }
    if (x > maxX) maxX = x;
    y += NODE_H + V_GAP;
  }
  for (const id of doc.nodes.keys()) {
    if (!positions.has(id)) {
      positions.set(id, { x: MARGIN, y, w: NODE_W, h: NODE_H });
      y += NODE_H + V_GAP;
    }
  }
  const placed: LaidOutNode[] = [];
  for (const [id, b] of positions) {
    placed.push({
      id, ...b,
      label: doc.nodes.get(id)?.label ?? {},
      shape: shapeOf(id),
      isContainer: false,
    });
  }
  const edges = makeEdges(doc.edges, positions);
  return { nodes: placed, edges, width: maxX + MARGIN, height: y + MARGIN, kind: 'state' };
}

function layoutSeq(doc: Doc): LaidOut {
  const seen = new Set<string>();
  const actors: string[] = [];
  for (const e of doc.edges) {
    for (const id of [e.from, e.to]) {
      if (!seen.has(id)) { seen.add(id); actors.push(id); }
    }
  }
  for (const id of doc.nodes.keys()) {
    if (!seen.has(id)) { seen.add(id); actors.push(id); }
  }
  const ACTOR_W = 40, ACTOR_H = 12, COL_GAP = 28, MSG_GAP = 12;

  const xOf = new Map<string, number>();
  const placed: LaidOutNode[] = [];
  let x = MARGIN;
  for (const id of actors) {
    xOf.set(id, x + ACTOR_W / 2);
    placed.push({
      id, x, y: MARGIN, w: ACTOR_W, h: ACTOR_H,
      label: doc.nodes.get(id)?.label ?? {},
      shape: 'actor',
      isContainer: false,
    });
    x += ACTOR_W + COL_GAP;
  }

  let y = MARGIN + ACTOR_H + MSG_GAP;
  const msgEdges: LaidOutEdge[] = [];
  for (const e of doc.edges) {
    const xa = xOf.get(e.from);
    const xb = xOf.get(e.to);
    if (xa === undefined || xb === undefined) continue;
    msgEdges.push({
      from: e.from, to: e.to,
      points: [[xa, y], [xb, y]],
      label: e.label,
      op: e.op,
    });
    y += MSG_GAP;
  }
  const lifelines: LaidOutEdge[] = actors.map(id => ({
    from: id, to: id,
    points: [[xOf.get(id)!, MARGIN + ACTOR_H], [xOf.get(id)!, y + MSG_GAP]],
    op: 'dashed',
    isLifeline: true,
  }));

  return {
    nodes: placed,
    edges: [...lifelines, ...msgEdges],
    width: x,
    height: y + MARGIN * 2,
    kind: 'seq',
  };
}

function computeRanks(doc: Doc): { byRank: Map<number, string[]> } {
  const ids = [...doc.nodes.keys()];
  const incoming = new Map<string, number>();
  for (const id of ids) incoming.set(id, 0);
  for (const e of doc.edges) incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
  const outgoing = new Map<string, string[]>();
  for (const e of doc.edges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from)!.push(e.to);
  }

  let sources = ids.filter(id => incoming.get(id) === 0);
  if (sources.length === 0) {
    sources = ids.includes('*') ? ['*'] : (ids.length ? [ids[0]] : []);
  }

  const rank = new Map<string, number>();
  const visited = new Set<string>();
  for (const s of sources) {
    rank.set(s, 0);
    visited.add(s);
  }
  let frontier = [...sources];
  while (frontier.length) {
    const next: string[] = [];
    for (const n of frontier) {
      const r = rank.get(n)!;
      for (const m of outgoing.get(n) ?? []) {
        if (!visited.has(m)) {
          rank.set(m, r + 1);
          visited.add(m);
          next.push(m);
        }
      }
    }
    frontier = next;
  }
  let maxRank = 0;
  for (const r of rank.values()) if (r > maxRank) maxRank = r;
  for (const id of ids) {
    if (!visited.has(id)) {
      maxRank++;
      rank.set(id, maxRank);
      visited.add(id);
    }
  }

  const byRank = new Map<number, string[]>();
  for (const [id, r] of rank) {
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r)!.push(id);
  }
  return { byRank };
}

function makeEdges(srcEdges: Edge[], positions: Map<string, Box>): LaidOutEdge[] {
  return srcEdges.map(e => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) {
      return { from: e.from, to: e.to, points: [], label: e.label, op: e.op };
    }
    return {
      from: e.from, to: e.to,
      points: orthogonalRoute(a, b),
      label: e.label,
      op: e.op,
    };
  });
}

function hasLinearChildFlow(
  children: string[],
  edges: Edge[],
  childMap: Map<string, string[]>,
): boolean {
  const childSet = new Set(children);
  const pairs = new Set<string>();
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const child of children) {
    incoming.set(child, 0);
    outgoing.set(child, 0);
  }

  for (const edge of edges) {
    const from = topChildFor(edge.from, childSet, childMap);
    const to = topChildFor(edge.to, childSet, childMap);
    if (!from || !to || from === to) continue;
    const key = `${from}|${to}`;
    if (pairs.has(key)) continue;
    pairs.add(key);
    outgoing.set(from, (outgoing.get(from) ?? 0) + 1);
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
  }

  if (pairs.size < children.length - 1) return false;
  let starts = 0;
  let ends = 0;
  for (const child of children) {
    const inc = incoming.get(child) ?? 0;
    const out = outgoing.get(child) ?? 0;
    if (inc > 1 || out > 1) return false;
    if (inc === 0 && out === 1) starts++;
    if (inc === 1 && out === 0) ends++;
  }
  return starts === 1 && ends === 1;
}

function topChildFor(
  id: string,
  childSet: Set<string>,
  childMap: Map<string, string[]>,
): string | undefined {
  if (childSet.has(id)) return id;
  for (const child of childSet) {
    if (containsDescendant(child, id, childMap)) return child;
  }
  return undefined;
}

function containsDescendant(
  ancestor: string,
  id: string,
  childMap: Map<string, string[]>,
): boolean {
  const children = childMap.get(ancestor);
  if (!children) return false;
  for (const child of children) {
    if (child === id || containsDescendant(child, id, childMap)) return true;
  }
  return false;
}

function collectSubtreeIds(id: string, childMap: Map<string, string[]>): Set<string> {
  const ids = new Set<string>([id]);
  for (const child of childMap.get(id) ?? []) {
    for (const descendant of collectSubtreeIds(child, childMap)) ids.add(descendant);
  }
  return ids;
}

function alignGridRows(
  children: string[],
  sizes: { w: number; h: number }[],
  rowH: number,
  firstRowTop: number,
  childMap: Map<string, string[]>,
  edges: Edge[],
  positions: Map<string, Box>,
  placed: LaidOutNode[],
): void {
  const cols = 2;
  const rows = Math.ceil(children.length / cols);
  for (let row = 0; row < rows; row++) {
    const rowChildren = children.slice(row * cols, row * cols + cols);
    const rowTop = firstRowTop + row * (rowH + GRID_GAP);
    for (const child of rowChildren) {
      const childIndex = children.indexOf(child);
      const childSize = sizes[childIndex];
      if (!childSize || childSize.h >= rowH - EPS) continue;
      const subtreeIds = collectSubtreeIds(child, childMap);
      const siblingIds = new Set<string>();
      for (const sibling of rowChildren) {
        if (sibling === child) continue;
        for (const id of collectSubtreeIds(sibling, childMap)) siblingIds.add(id);
      }
      const deltas: number[] = [];
      for (const edge of edges) {
        const fromChild = subtreeIds.has(edge.from);
        const toChild = subtreeIds.has(edge.to);
        if (fromChild && siblingIds.has(edge.to)) {
          addWeightedDelta(
            deltas,
            centerY(positions.get(edge.to)) - centerY(positions.get(edge.from)),
            alignmentWeight(edge, false),
          );
        } else if (toChild && siblingIds.has(edge.from)) {
          addWeightedDelta(
            deltas,
            centerY(positions.get(edge.from)) - centerY(positions.get(edge.to)),
            alignmentWeight(edge, true),
          );
        }
      }
      if (deltas.length === 0) continue;
      deltas.sort((a, b) => a - b);
      const desired = deltas[Math.floor(deltas.length / 2)];
      const box = positions.get(child);
      if (!box) continue;
      const minDy = rowTop - box.y;
      const maxDy = rowTop + rowH - childSize.h - box.y;
      const dy = Math.min(maxDy, Math.max(minDy, desired));
      if (Math.abs(dy) >= EPS) shiftSubtree(subtreeIds, dy, positions, placed);
    }
  }
}

function rootAlignmentDelta(
  rootId: string,
  subtreeIds: Set<string>,
  previousIds: Set<string>,
  edges: Edge[],
  positions: Map<string, Box>,
): number {
  const deltas: number[] = [];
  for (const edge of edges) {
    const fromCurrent = subtreeIds.has(edge.from);
    const toCurrent = subtreeIds.has(edge.to);
    const fromPrevious = previousIds.has(edge.from);
    const toPrevious = previousIds.has(edge.to);

    if (fromCurrent && toPrevious) {
      addWeightedDelta(
        deltas,
        centerY(positions.get(edge.to)) - centerY(positions.get(edge.from)),
        alignmentWeight(edge, false),
      );
    } else if (toCurrent && fromPrevious) {
      addWeightedDelta(
        deltas,
        centerY(positions.get(edge.from)) - centerY(positions.get(edge.to)),
        alignmentWeight(edge, true),
      );
    }
  }

  if (deltas.length === 0) return 0;
  deltas.sort((a, b) => a - b);
  const desired = deltas[Math.floor(deltas.length / 2)];
  const root = positions.get(rootId);
  if (!root) return desired;
  return Math.max(MARGIN - root.y, desired);
}

function addWeightedDelta(deltas: number[], delta: number, weight: number): void {
  if (!Number.isFinite(delta)) return;
  for (let i = 0; i < weight; i++) deltas.push(delta);
}

function alignmentWeight(edge: Edge, currentIsTarget: boolean): number {
  const feedback = edge.op === 'dashed' || edge.op === 'dashed-arrow';
  return (feedback ? 1 : 3) + (currentIsTarget ? 1 : 0);
}

function centerY(box: Box | undefined): number {
  return box ? box.y + box.h / 2 : Number.NaN;
}

function shiftSubtree(
  ids: Set<string>,
  dy: number,
  positions: Map<string, Box>,
  placed: LaidOutNode[],
): void {
  for (const id of ids) {
    const box = positions.get(id);
    if (box) box.y += dy;
  }
  for (const node of placed) {
    if (ids.has(node.id)) node.y += dy;
  }
}

function makeBlockEdges(
  srcEdges: Edge[],
  positions: Map<string, Box>,
  obstacles: RouteObstacle[],
  parentMap: Map<string, string>,
): LaidOutEdge[] {
  return srcEdges.map(e => {
    const a = positions.get(e.from);
    const b = positions.get(e.to);
    if (!a || !b) {
      return { from: e.from, to: e.to, points: [], label: e.label, op: e.op };
    }
    return {
      from: e.from, to: e.to,
      points: avoidObstaclesRoute(
        a,
        b,
        e.from,
        e.to,
        obstacles,
        commonRoutingBounds(e.from, e.to, parentMap, positions),
      ),
      label: e.label,
      op: e.op,
    };
  });
}

function depthOf(id: string, parentMap: Map<string, string>): number {
  let depth = 0;
  let cur = id;
  const seen = new Set<string>();
  while (parentMap.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    cur = parentMap.get(cur)!;
    depth++;
  }
  return depth;
}

function avoidObstaclesRoute(
  a: Box,
  b: Box,
  from: string,
  to: string,
  obstacles: RouteObstacle[],
  bounds?: Box,
): [number, number][] {
  const routedObstacles = obstacles.filter(o => o.id !== from && o.id !== to);
  const leafObstacles = routedObstacles.filter(o => !o.isContainer);
  const containerObstacles = routedObstacles.filter(o => o.isContainer);
  const lanes = routeLanes(a, b, routedObstacles, bounds);
  let best = orthogonalRoute(a, b);
  let bestScore = Number.POSITIVE_INFINITY;

  for (const start of portsOf(a)) {
    for (const end of portsOf(b)) {
      const sp = start.point;
      const ep = end.point;
      const candidates: [number, number][][] = [
        [sp, [ep[0], sp[1]], ep],
        [sp, [sp[0], ep[1]], ep],
      ];
      if (Math.abs(sp[0] - ep[0]) < EPS || Math.abs(sp[1] - ep[1]) < EPS) {
        candidates.push([sp, ep]);
      }
      for (const x of lanes.xs) {
        candidates.push([sp, [x, sp[1]], [x, ep[1]], ep]);
      }
      for (const y of lanes.ys) {
        candidates.push([sp, [sp[0], y], [ep[0], y], ep]);
      }
      for (const x of lanes.xs) {
        for (const y of lanes.ys) {
          candidates.push([sp, [x, sp[1]], [x, y], [ep[0], y], ep]);
          candidates.push([sp, [sp[0], y], [x, y], [x, ep[1]], ep]);
        }
      }

      for (const candidate of candidates) {
        const normalized = normalizeRoute(candidate);
        if (!isOrthogonalRoute(normalized)) continue;
        if (bounds && !routeFitsBounds(normalized, bounds)) continue;
        const score = scoreRoute(normalized, a, b, leafObstacles, containerObstacles)
          + portPairPenalty(a, b, start.side, end.side);
        if (score < bestScore) {
          best = normalized;
          bestScore = score;
        }
      }
    }
  }

  if (bestScore === Number.POSITIVE_INFINITY) return orthogonalRoute(a, b);
  return best;
}

function portsOf(box: Box): RoutePort[] {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return [
    { point: [box.x + box.w, cy], side: 'right' },
    { point: [box.x, cy], side: 'left' },
    { point: [cx, box.y + box.h], side: 'bottom' },
    { point: [cx, box.y], side: 'top' },
  ];
}

function portPairPenalty(source: Box, target: Box, start: RouteSide, end: RouteSide): number {
  const sx = source.x + source.w / 2;
  const sy = source.y + source.h / 2;
  const tx = target.x + target.w / 2;
  const ty = target.y + target.h / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  return sourcePortPenalty(start, dx, dy, source) + targetPortPenalty(end, dx, dy, target);
}

function sourcePortPenalty(side: RouteSide, dx: number, dy: number, box: Box): number {
  if (Math.abs(dx) > box.w * 0.5) {
    const desired = dx > 0 ? 'right' : 'left';
    if (side === desired) return 0;
    return side === oppositeSide(desired) ? 900 : 90;
  }
  if (Math.abs(dy) > box.h * 0.8) {
    const desired = dy > 0 ? 'bottom' : 'top';
    if (side === desired) return 0;
    return side === oppositeSide(desired) ? 600 : 120;
  }
  return 0;
}

function targetPortPenalty(side: RouteSide, dx: number, dy: number, box: Box): number {
  if (Math.abs(dy) > box.h * 0.35) {
    const desired = dy > 0 ? 'top' : 'bottom';
    if (side === desired) return 0;
    return (side === 'left' || side === 'right') ? 9000 : 1200;
  }
  if (Math.abs(dx) > box.w * 0.5) {
    const desired = dx > 0 ? 'left' : 'right';
    if (side === desired) return 0;
    return side === oppositeSide(desired) ? 1000 : 160;
  }
  return 0;
}

function oppositeSide(side: RouteSide): RouteSide {
  switch (side) {
    case 'right': return 'left';
    case 'left': return 'right';
    case 'bottom': return 'top';
    case 'top': return 'bottom';
  }
}

function routeLanes(
  a: Box,
  b: Box,
  obstacles: RouteObstacle[],
  bounds?: Box,
): { xs: number[]; ys: number[] } {
  const boxes = [a, b, ...obstacles];
  const minX = bounds ? bounds.x : Math.max(0, Math.min(...boxes.map(o => o.x)) - MARGIN);
  const maxX = bounds ? bounds.x + bounds.w : Math.max(...boxes.map(o => o.x + o.w)) + MARGIN;
  const minY = bounds ? bounds.y : Math.max(0, Math.min(...boxes.map(o => o.y)) - MARGIN);
  const maxY = bounds ? bounds.y + bounds.h : Math.max(...boxes.map(o => o.y + o.h)) + MARGIN;
  const xs = [(a.x + a.w / 2 + b.x + b.w / 2) / 2];
  const ys = [(a.y + a.h / 2 + b.y + b.h / 2) / 2];

  for (const box of boxes) {
    xs.push(box.x - ROUTE_GAP / 2, box.x + box.w + ROUTE_GAP / 2);
    ys.push(box.y - ROUTE_GAP / 2, box.y + box.h + ROUTE_GAP / 2);
    xs.push(box.x - ROUTE_GAP, box.x + box.w + ROUTE_GAP);
    ys.push(box.y - ROUTE_GAP, box.y + box.h + ROUTE_GAP);
  }
  if (bounds) {
    xs.push(bounds.x, bounds.x + bounds.w);
    ys.push(bounds.y, bounds.y + bounds.h);
  }

  return {
    xs: uniqueSorted(xs.filter(x => x >= minX && x <= maxX)),
    ys: uniqueSorted(ys.filter(y => y >= minY && y <= maxY)),
  };
}

function commonRoutingBounds(
  from: string,
  to: string,
  parentMap: Map<string, string>,
  positions: Map<string, Box>,
): Box | undefined {
  const common = nearestCommonAncestor(from, to, parentMap);
  if (!common) return undefined;
  const box = positions.get(common);
  if (!box) return undefined;
  const inset = ROUTE_GAP / 2;
  return {
    x: box.x + inset,
    y: box.y + TITLE_H + inset,
    w: Math.max(0, box.w - inset * 2),
    h: Math.max(0, box.h - TITLE_H - inset * 2),
  };
}

function nearestCommonAncestor(
  from: string,
  to: string,
  parentMap: Map<string, string>,
): string | undefined {
  const toAncestors = new Set(ancestorsOf(to, parentMap));
  return ancestorsOf(from, parentMap).find(id => toAncestors.has(id));
}

function ancestorsOf(id: string, parentMap: Map<string, string>): string[] {
  const out: string[] = [];
  let cur = id;
  const seen = new Set<string>();
  while (parentMap.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    cur = parentMap.get(cur)!;
    out.push(cur);
  }
  return out;
}

function routeFitsBounds(points: [number, number][], bounds: Box): boolean {
  const right = bounds.x + bounds.w;
  const bottom = bounds.y + bounds.h;
  return points.every(([x, y]) => (
    x >= bounds.x - EPS
    && x <= right + EPS
    && y >= bounds.y - EPS
    && y <= bottom + EPS
  ));
}

function uniqueSorted(values: number[]): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  for (const value of values) {
    const rounded = Math.round(value * 1000) / 1000;
    const key = rounded.toFixed(3);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rounded);
  }
  return out.sort((a, b) => a - b);
}

function normalizeRoute(points: [number, number][]): [number, number][] {
  const deduped: [number, number][] = [];
  for (const point of points) {
    const prev = deduped[deduped.length - 1];
    if (!prev || Math.abs(prev[0] - point[0]) >= EPS || Math.abs(prev[1] - point[1]) >= EPS) {
      deduped.push(point);
    }
  }

  const out: [number, number][] = [];
  for (const point of deduped) {
    out.push(point);
    while (out.length >= 3) {
      const a = out[out.length - 3];
      const b = out[out.length - 2];
      const c = out[out.length - 1];
      const sameX = Math.abs(a[0] - b[0]) < EPS && Math.abs(b[0] - c[0]) < EPS;
      const sameY = Math.abs(a[1] - b[1]) < EPS && Math.abs(b[1] - c[1]) < EPS;
      if (!sameX && !sameY) break;
      out.splice(out.length - 2, 1);
    }
  }
  return out;
}

function isOrthogonalRoute(points: [number, number][]): boolean {
  if (points.length < 2) return false;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (Math.abs(a[0] - b[0]) >= EPS && Math.abs(a[1] - b[1]) >= EPS) return false;
  }
  return true;
}

function scoreRoute(
  points: [number, number][],
  source: Box,
  target: Box,
  leafObstacles: RouteObstacle[],
  containerObstacles: RouteObstacle[],
): number {
  let score = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    score += segmentLength(a, b);
    score += boxInteriorOverlap(a, b, source, 0) * 5000;
    score += boxInteriorOverlap(a, b, target, 0) * 5000;
    for (const obstacle of leafObstacles) {
      const overlap = boxInteriorOverlap(a, b, obstacle, OBSTACLE_PAD);
      if (overlap > 0) score += 10000 + overlap * 100;
    }
    for (const obstacle of containerObstacles) {
      const overlap = boxBorderOverlap(a, b, obstacle);
      if (overlap > 0) score += 1500 + overlap * 60;
    }
  }
  score += Math.max(0, points.length - 2) * 3;
  return score;
}

function segmentLength(a: [number, number], b: [number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
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
  if (Math.abs(a[0] - b[0]) < EPS) {
    const x = a[0];
    if (x <= left || x >= right) return 0;
    return intervalOverlap(a[1], b[1], top, bottom);
  }
  if (Math.abs(a[1] - b[1]) < EPS) {
    const y = a[1];
    if (y <= top || y >= bottom) return 0;
    return intervalOverlap(a[0], b[0], left, right);
  }
  return 0;
}

function boxBorderOverlap(a: [number, number], b: [number, number], box: Box): number {
  if (Math.abs(a[0] - b[0]) < EPS) {
    const x = a[0];
    if (Math.abs(x - box.x) >= EPS && Math.abs(x - (box.x + box.w)) >= EPS) return 0;
    return intervalOverlap(a[1], b[1], box.y, box.y + box.h);
  }
  if (Math.abs(a[1] - b[1]) < EPS) {
    const y = a[1];
    if (Math.abs(y - box.y) >= EPS && Math.abs(y - (box.y + box.h)) >= EPS) return 0;
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

function orthogonalRoute(a: Box, b: Box): [number, number][] {
  const ca = { x: a.x + a.w / 2, y: a.y + a.h / 2 };
  const cb = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const dx = cb.x - ca.x;
  const dy = cb.y - ca.y;

  let pa: [number, number], pb: [number, number];
  const separatedHorizontally = a.x + a.w <= b.x || b.x + b.w <= a.x;
  const separatedVertically = a.y + a.h <= b.y || b.y + b.h <= a.y;
  const horizontal = separatedHorizontally
    ? true
    : separatedVertically
      ? false
      : Math.abs(dx) > Math.abs(dy);

  if (horizontal) {
    pa = [dx > 0 ? a.x + a.w : a.x, ca.y];
    pb = [dx > 0 ? b.x : b.x + b.w, cb.y];
    if (Math.abs(pa[1] - pb[1]) < 0.5) return [pa, pb];
    const midX = (pa[0] + pb[0]) / 2;
    return [pa, [midX, pa[1]], [midX, pb[1]], pb];
  } else {
    pa = [ca.x, dy > 0 ? a.y + a.h : a.y];
    pb = [cb.x, dy > 0 ? b.y : b.y + b.h];
    if (Math.abs(pa[0] - pb[0]) < 0.5) return [pa, pb];
    const midY = (pa[1] + pb[1]) / 2;
    return [pa, [pa[0], midY], [pb[0], midY], pb];
  }
}
