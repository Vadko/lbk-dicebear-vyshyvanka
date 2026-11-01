import { A, D } from '@mobily/ts-belt';
import { checkCombo } from './checkCombo';
import type { ComboStats } from './comboStats';
import { compose, LAYOUT_PARTS, LAYOUT_WEIGHT } from './compose';
import { LAYOUTS } from './grid';
import type { Library } from './library';
import { DRAWINGS, type Part } from './motifs';

interface Combo {
  readonly p: number;
  readonly stats: ComboStats;
}

const weightOf = (part: Part): number => part.weight ?? 1;

// Each drawing with its share of its kind's weight: the chance DiceBear's weighted pick gives it
function shares(parts: Record<string, Part>): ReadonlyArray<readonly [string, number]> {
  const total = A.reduce(D.values(parts), 0, (s, part) => s + weightOf(part));
  return D.toPairs(D.map(parts, (part) => weightOf(part) / total));
}

// Every combination of every layout, checked, with the probability DiceBear's independent weighted picks give it
export function combos(lib: Library): Combo[] {
  const layoutTotal = A.reduce(LAYOUTS, 0, (s, layout) => s + LAYOUT_WEIGHT[layout]);
  const out: Combo[] = [];
  for (const layout of LAYOUTS) {
    const lp = LAYOUT_WEIGHT[layout] / layoutTotal;
    const slots = LAYOUT_PARTS[layout];
    for (const [k, kp] of shares(DRAWINGS[slots.core])) {
      for (const [a, ap] of shares(DRAWINGS[slots.arm])) {
        for (const [x, xp] of shares(DRAWINGS[slots.corner])) {
          const stats = checkCombo(
            compose(lib, layout, k, a, x),
            `${layout} ${k}/${a}/${x}`
          );
          out.push({ p: lp * kp * ap * xp, stats });
        }
      }
    }
  }
  return out;
}
