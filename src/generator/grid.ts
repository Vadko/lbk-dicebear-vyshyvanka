import { A } from '@mobily/ts-belt';

// Main (form), fill and accent threads
export const THREADS = ['A', 'B', 'C'] as const;
export type Thread = (typeof THREADS)[number];
export type Grid = readonly string[];
export type Region = 'k' | 'v' | 'h' | 'x' | 'o';

export interface Placed {
  readonly col: number;
  readonly row: number;
  readonly t: Thread;
}

export const N = 13;
export const MID = 6;
export const UNIT = 2;
export const SIZE = N * UNIT;

// The cross puts its arms on the axes, the star its branches on the diagonals
export const LAYOUTS = ['cross', 'star'] as const;
export type Layout = (typeof LAYOUTS)[number];

// Beyond this many cells from the centre a stitch would run under the border
const REACH = 5.6;
// How far a cell must lie off the diagonal to belong to an axis wedge; the star's wider diagonal wedge leaves the axes a narrow tip
const WEDGE: Record<Layout, number> = { cross: 2, star: 3 };

export const inDisc = (col: number, row: number): boolean =>
  Math.hypot(col - MID, row - MID) <= REACH;

// Cell (dx, dy) from the centre: core diamond, outer ring, vertical/horizontal axis wedges, diagonal wedge
export function region(col: number, row: number, layout: Layout): Region {
  const dx = Math.abs(col - MID);
  const dy = Math.abs(row - MID);
  if (dx + dy <= 3) {
    return 'k';
  }
  if (!inDisc(col, row)) {
    return 'o';
  }
  if (dy >= dx + WEDGE[layout]) {
    return 'v';
  }
  if (dx >= dy + WEDGE[layout]) {
    return 'h';
  }
  return 'x';
}

export const INNER: ReadonlyArray<readonly [number, number]> = A.filter(
  A.makeWithIndex(N * N, (i) => [Math.floor(i / N), i % N] as const),
  ([r, c]) => inDisc(c, r)
);

export const isThread = (ch: string): ch is Thread => THREADS.some((t) => t === ch);
export const mirrorH = (g: Grid): Grid => g.map((line) => A.reverse([...line]).join(''));
export const mirrorV = (g: Grid): Grid => A.reverse(g);
export const transpose = (g: Grid): Grid =>
  g.map((_, r) => g.map((line) => line[r]).join(''));
