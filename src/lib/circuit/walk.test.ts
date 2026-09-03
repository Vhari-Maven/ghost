import { describe, it, expect } from 'vitest';
import { buildGraph, validateTiling, nodeKey, TILE_SIZE } from './tile';
import { walk, startNodes, nearestNode, worldOf } from './walk';

const graph = buildGraph();
const starts = startNodes(graph);

function seeded(seed: number) {
  return () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
}

describe('circuit tile', () => {
  it('tiles seamlessly', () => {
    expect(validateTiling(graph)).toEqual([]);
  });

  it('has a main network covering most nodes', () => {
    expect(starts.length).toBeGreaterThan(graph.nodes.size / 2);
  });
});

describe('walk', () => {
  it('only visits points that lie on trace vertices, across tiles', () => {
    const random = seeded(42);
    let crossedTiles = false;
    for (let i = 0; i < 40; i++) {
      const start = { tx: 2, ty: 1, node: starts[Math.floor(random() * starts.length)] };
      const w = walk(graph, start, i % 4, { width: 1400, height: 900, random });
      const tiles = new Set<string>();
      for (const p of w.points) {
        const lx = ((p.x % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
        const ly = ((p.y % TILE_SIZE) + TILE_SIZE) % TILE_SIZE;
        expect(graph.nodes.has(nodeKey(lx, ly))).toBe(true);
        tiles.add(`${Math.floor(p.x / TILE_SIZE)},${Math.floor(p.y / TILE_SIZE)}`);
      }
      if (tiles.size > 1) crossedTiles = true;
      expect(w.length).toBeGreaterThan(0);
    }
    expect(crossedTiles).toBe(true);
  });

  it('can travel vertically through the bundle and off screen', () => {
    // Without bridges through the bundle, vertical walks stall within one tile.
    for (let seed = 1; seed <= 10; seed++) {
      const random = seeded(seed);
      const start = { tx: 2, ty: 1, node: nearestNode(starts, 700, 450).node };
      const up = walk(graph, start, 0, { width: 1400, height: 900, random });
      const down = walk(graph, start, 2, { width: 1400, height: 900, random });
      expect(up.points[up.points.length - 1].y).toBeLessThan(0);
      expect(down.points[down.points.length - 1].y).toBeGreaterThan(900);
    }
  });

  it('heads toward the requested edge', () => {
    const random = seeded(7);
    const start = { tx: 2, ty: 1, node: nearestNode(starts, 700, 450).node };
    const origin = worldOf(start);
    const toRight = walk(graph, start, 1, { width: 1400, height: 900, random });
    const toTop = walk(graph, start, 0, { width: 1400, height: 900, random });
    const endR = toRight.points[toRight.points.length - 1];
    const endT = toTop.points[toTop.points.length - 1];
    expect(endR.x).toBeGreaterThan(origin.x);
    expect(endT.y).toBeLessThan(origin.y);
  });
});
