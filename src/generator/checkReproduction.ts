import { D } from '@mobily/ts-belt';
import { compose } from './compose';
import { fail } from './fail';
import { region } from './grid';
import { EXPECTED, type Library, ORIGIN } from './library';
import { CORES, DRAWINGS, type PartKind } from './motifs';

// The quarter slices plus mirrors must give back every drawn grid stitch for stitch
export function checkReproduction(lib: Library): void {
  const firstCore = Object.keys(CORES)[0];
  // Each kind composed with the plainest neighbours of its layout
  const build: Record<PartKind, (name: string) => string[][]> = {
    core: (name) => compose(lib, 'cross', name, 'stub', 'none'),
    arm: (name) => compose(lib, 'cross', firstCore, name, 'none'),
    corner: (name) => compose(lib, 'cross', firstCore, 'stub', name),
    tip: (name) => compose(lib, 'star', firstCore, name, 'none'),
    diagonal: (name) => compose(lib, 'star', firstCore, 'none', name),
  };
  for (const kind of D.keys(DRAWINGS)) {
    const [c0, r0] = ORIGIN[kind];
    const [layout, expected] = EXPECTED[kind];
    for (const [name, part] of Object.entries(DRAWINGS[kind])) {
      const grid = build[kind](name);
      part.grid.forEach((line, r) => {
        [...line].forEach((ch, c) => {
          const got = grid[r0 + r][c0 + c];
          if (region(c0 + c, r0 + r, layout) === expected && got !== ch) {
            fail(`${kind} ${name}: composed ${got} at ${c0 + c},${r0 + r}, drawn ${ch}`);
          }
        });
      });
    }
  }
}
