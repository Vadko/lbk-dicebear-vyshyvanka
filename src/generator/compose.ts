import { F } from '@mobily/ts-belt';
import {
  applyToPoint,
  compose as composeMatrices,
  fromDefinition,
  fromTransformAttribute,
} from 'transformation-matrix';
import { fail } from './fail';
import { type Layout, N, type Placed, UNIT } from './grid';
import type { Library } from './library';
import type { PartKind } from './motifs';

// The quarter is drawn once and placed by these four transforms only: identity and the three mirrors, never a rotation
export const MIRRORS: readonly string[] = [
  '',
  'matrix(-1 0 0 1 26 0)',
  'matrix(1 0 0 -1 0 26)',
  'matrix(-1 0 0 -1 26 26)',
];
// Inside the quarter the horizontal arm is the vertical one reflected across the diagonal, so it stays a mirror image too
export const TRANSPOSE = 'matrix(0 1 1 0 0 0)';
export type Slot = 'core' | 'arm' | 'corner';
export const QUARTER: ReadonlyArray<readonly [Slot, string]> = [
  ['core', ''],
  ['arm', ''],
  ['arm', TRANSPOSE],
  ['corner', ''],
];

// The drawings that fill the quarter's slots in each layout, and how often DiceBear picks the layout
export const LAYOUT_PARTS: Record<Layout, Record<Slot, PartKind>> = {
  cross: { core: 'core', arm: 'arm', corner: 'corner' },
  star: { core: 'core', arm: 'tip', corner: 'diagonal' },
};
export const LAYOUT_WEIGHT: Record<Layout, number> = { cross: 3, star: 2 };

// The DiceBear component that draws each kind
export const COMPONENT: Record<PartKind, string> = {
  core: 'k',
  arm: 'a',
  corner: 'x',
  tip: 't',
  diagonal: 'd',
};

// Every combination places its cells through the same few transforms, so each is parsed once
const matrixOf = F.memoizeWithKey(F.identity<string>, (transform: string) =>
  composeMatrices(fromDefinition(fromTransformAttribute(transform)))
);

// Maps a cell through an SVG transform the way the renderer does, via the cell's centre in user units
function applyMatrix(transform: string, p: Placed): Placed {
  if (transform === '') {
    return p;
  }
  const [x, y] = applyToPoint(matrixOf(transform), [
    p.col * UNIT + UNIT / 2,
    p.row * UNIT + UNIT / 2,
  ]);
  return { col: (x - UNIT / 2) / UNIT, row: (y - UNIT / 2) / UNIT, t: p.t };
}

// Rebuilds the 13x13 grid from the same transform tables the SVG uses: the quarter's parts, then the quarter four times
export function compose(
  lib: Library,
  layout: Layout,
  core: string,
  arm: string,
  corner: string
): string[][] {
  const names: Record<Slot, string> = { core, arm, corner };
  const q = QUARTER.flatMap(([slot, t]) => {
    const kind = LAYOUT_PARTS[layout][slot];
    const cells = lib[kind][names[slot]] ?? fail(`${kind} ${names[slot]}`);
    return cells.map((p) => applyMatrix(t, p));
  });
  const grid = Array.from({ length: N }, () => Array<string>(N).fill('.'));
  for (const transform of MIRRORS) {
    for (const p of q.map((cell) => applyMatrix(transform, cell))) {
      if (grid[p.row]?.[p.col] === undefined) {
        fail(`cell ${p.col},${p.row} off the grid in ${layout} ${core}/${arm}/${corner}`);
      }
      grid[p.row][p.col] = p.t;
    }
  }
  return grid;
}
