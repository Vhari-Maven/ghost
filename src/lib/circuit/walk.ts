/**
 * Random walk along the tiled circuit graph. Pure (no DOM) so it can be
 * unit-tested and previewed offline; CircuitPulse.svelte drives it with the
 * live viewport size.
 */
import { TILE_SIZE, isPort, mainNetworkKeys, nodeKey, type Graph, type Node } from './tile';

/** A position on the infinite tiled graph. */
export interface Pos {
  tx: number;
  ty: number;
  node: Node;
}

export interface XY {
  x: number;
  y: number;
}

// edge: 0=top, 1=right, 2=bottom, 3=left
export const EDGE_DIR: Array<[number, number]> = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function worldOf(p: Pos): XY {
  return { x: p.tx * TILE_SIZE + p.node.x, y: p.ty * TILE_SIZE + p.node.y };
}

function sameWorld(a: Pos | null, b: Pos): boolean {
  if (!a) return false;
  const wa = worldOf(a);
  const wb = worldOf(b);
  return Math.abs(wa.x - wb.x) < 0.5 && Math.abs(wa.y - wb.y) < 0.5;
}

/** Neighbors of a position, following tile ports into adjacent tiles. */
export function neighborsOf(graph: Graph, p: Pos): Pos[] {
  const out: Pos[] = [];
  const push = (tx: number, ty: number, n: Node | undefined) => {
    if (!n) return;
    for (const key of n.neighbors) out.push({ tx, ty, node: graph.nodes.get(key)! });
  };
  push(p.tx, p.ty, p.node);
  const { x, y } = p.node;
  if (x === 0) push(p.tx - 1, p.ty, graph.nodes.get(nodeKey(TILE_SIZE, y)));
  else if (x === TILE_SIZE) push(p.tx + 1, p.ty, graph.nodes.get(nodeKey(0, y)));
  if (y === 0) push(p.tx, p.ty - 1, graph.nodes.get(nodeKey(x, TILE_SIZE)));
  else if (y === TILE_SIZE) push(p.tx, p.ty + 1, graph.nodes.get(nodeKey(x, 0)));
  return out;
}

export interface WalkOptions {
  width: number;
  height: number;
  /** Extra distance past the viewport before the walk stops (px). */
  margin?: number;
  maxSteps?: number;
  /** Strength of the pull toward the target edge. */
  bias?: number;
  random?: () => number;
}

export interface Walk {
  points: XY[];
  path: string;
  length: number;
}

/**
 * Walk from `start` along traces, biased toward `edge`, preferring unvisited
 * nodes, until the walk leaves the viewport or runs out of steps.
 */
export function walk(graph: Graph, start: Pos, edge: number, opts: WalkOptions): Walk {
  const { width, height, margin = 40, maxSteps = 80, bias = 3, random = Math.random } = opts;
  const [bx, by] = EDGE_DIR[edge];

  const points: XY[] = [worldOf(start)];
  const visited = new Set<string>();
  let prev: Pos | null = null;
  let cur = start;

  for (let step = 0; step < maxSteps; step++) {
    const here = points[points.length - 1];
    visited.add(`${here.x},${here.y}`);

    let options = neighborsOf(graph, cur).filter((n) => !sameWorld(prev, n));
    if (options.length === 0) options = neighborsOf(graph, cur); // dead end: turn around
    const fresh = options.filter((n) => {
      const w = worldOf(n);
      return !visited.has(`${w.x},${w.y}`);
    });
    if (fresh.length) options = fresh;

    const weights = options.map((n) => {
      const w = worldOf(n);
      const dx = w.x - here.x;
      const dy = w.y - here.y;
      const len = Math.hypot(dx, dy) || 1;
      const dot = (dx * bx + dy * by) / len;
      return Math.exp(bias * dot) * (0.6 + random() * 0.8);
    });
    const total = weights.reduce((a, b) => a + b, 0);
    let r = random() * total;
    let next = options[options.length - 1];
    for (let i = 0; i < options.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        next = options[i];
        break;
      }
    }

    const w = worldOf(next);
    points.push(w);
    prev = cur;
    cur = next;

    if (w.x < -margin || w.x > width + margin || w.y < -margin || w.y > height + margin) break;
  }

  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return { points, path, length };
}

/** Interior nodes of the main network — valid pulse start points. */
export function startNodes(graph: Graph): Node[] {
  const main = mainNetworkKeys(graph);
  return [...graph.nodes.values()].filter((n) => main.has(n.key) && !isPort(n));
}

/** Nearest start node to a viewport point. */
export function nearestNode(candidates: Node[], x: number, y: number): Pos {
  const tx = Math.floor(x / TILE_SIZE);
  const ty = Math.floor(y / TILE_SIZE);
  const lx = x - tx * TILE_SIZE;
  const ly = y - ty * TILE_SIZE;
  let best = candidates[0];
  let bestD = Infinity;
  for (const n of candidates) {
    const d = (n.x - lx) ** 2 + (n.y - ly) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return { tx, ty, node: best };
}
