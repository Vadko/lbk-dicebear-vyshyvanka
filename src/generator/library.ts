import { D, F } from '@mobily/ts-belt';
import { fail } from './fail';
import {
  type Grid,
  isThread,
  type Layout,
  MID,
  mirrorH,
  mirrorV,
  type Placed,
  type Region,
  region,
  THREADS,
  transpose,
} from './grid';
import { DRAWINGS, type PartKind } from './motifs';

export type Library = Readonly<Record<PartKind, Record<string, Placed[]>>>;

// Where each kind's drawing sits on the 13x13 grid (column, row), its size (rows, columns), and the layout region its stitches must stay in
export const ORIGIN: Record<PartKind, readonly [number, number]> = {
  core: [3, 3],
  arm: [3, 1],
  corner: [2, 2],
  tip: [4, 1],
  diagonal: [2, 2],
};
const SHAPE: Record<PartKind, readonly [number, number]> = {
  core: [7, 7],
  arm: [3, 7],
  corner: [3, 3],
  tip: [2, 5],
  diagonal: [4, 4],
};
export const EXPECTED: Record<PartKind, readonly [Layout, Region]> = {
  core: ['cross', 'k'],
  arm: ['cross', 'v'],
  corner: ['cross', 'x'],
  tip: ['star', 'v'],
  diagonal: ['star', 'x'],
};

function cellAt(grid: Grid, r: number, c: number): string {
  return grid[r]?.[c] ?? fail(`out of range ${r},${c}`);
}

function checkShape(
  kind: PartKind,
  name: string,
  grid: Grid,
  rows: number,
  cols: number
): void {
  if (grid.length !== rows || grid.some((line) => line.length !== cols)) {
    fail(`${kind} ${name}: expected ${rows}x${cols}`);
  }
  if (grid.some((line) => [...line].some((ch) => ch !== '.' && !isThread(ch)))) {
    fail(`${kind} ${name}: only . and ${THREADS.join(' ')} allowed`);
  }
}

// Every drawn grid needs a mirror axis; the composition relies on exactly these axes
const vertical = (kind: PartKind) => (name: string, grid: Grid) => {
  if (!F.equals(grid, mirrorH(grid))) {
    fail(`${kind} ${name}: needs a vertical mirror axis`);
  }
};

const diagonal = (kind: PartKind) => (name: string, grid: Grid) => {
  if (!F.equals(grid, transpose(grid))) {
    fail(`${kind} ${name}: needs the diagonal mirror axis`);
  }
};

const SYMMETRY: Record<PartKind, (name: string, grid: Grid) => void> = {
  core: (name, grid) => {
    if (!F.equals(grid, mirrorH(grid)) || !F.equals(grid, mirrorV(grid))) {
      fail(`core ${name}: needs vertical and horizontal mirror axes`);
    }
  },
  arm: vertical('arm'),
  corner: diagonal('corner'),
  tip: vertical('tip'),
  diagonal: diagonal('diagonal'),
};

const ANCHORS: Record<PartKind, (name: string, grid: Grid) => void> = {
  core: (name, grid) => {
    if (cellAt(grid, 0, 3) === '.' || cellAt(grid, 3, 0) === '.') {
      fail(`core ${name}: axis tips must be stitched`);
    }
  },
  arm: (name, grid) => {
    if (
      [cellAt(grid, 1, 3), cellAt(grid, 1, 2), cellAt(grid, 2, 2)].every(
        (ch) => ch === '.'
      )
    ) {
      fail(`arm ${name}: must touch the core tip`);
    }
  },
  corner: () => undefined,
  tip: () => undefined,
  diagonal: () => undefined,
};

// Places a part's full drawing on the 13x13 grid and checks every stitch stays inside its own region
function place(kind: PartKind, name: string, grid: Grid): Placed[] {
  const [c0, r0] = ORIGIN[kind];
  const [layout, expected] = EXPECTED[kind];
  const out: Placed[] = [];
  grid.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      if (!isThread(ch)) {
        return;
      }
      const col = c0 + c;
      const row = r0 + r;
      if (region(col, row, layout) !== expected) {
        fail(
          `${kind} ${name}: stitch at ${col},${row} lies in region ${region(col, row, layout)}`
        );
      }
      out.push({ col, row, t: ch });
    });
  });
  return out;
}

const quadrant = (cells: Placed[]): Placed[] =>
  cells.filter((p) => p.col <= MID && p.row <= MID);

// Checks every drawn part and keeps the top-left quarter of it, the slice the SVG draws
export function library(): Library {
  return D.mapWithKey(DRAWINGS, (kind, parts) =>
    D.mapWithKey(parts, (name, part) => {
      const [rows, cols] = SHAPE[kind];
      checkShape(kind, name, part.grid, rows, cols);
      SYMMETRY[kind](name, part.grid);
      ANCHORS[kind](name, part.grid);
      return quadrant(place(kind, name, part.grid));
    })
  );
}
