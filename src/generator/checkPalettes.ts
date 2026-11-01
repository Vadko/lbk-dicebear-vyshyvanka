import { N } from '@mobily/ts-belt';
import { converter, differenceEuclidean, wcagContrast } from 'culori';
import { fail } from './fail';
import { PALETTES } from './palettes';

// The launcher's own page background, which a dark disc's rim must stand out from
const PAGE = '#0f0f10';
// The launcher cream reads lemon next to the linen canvases, so it may only be a thread
const BRAND_CREAM = '#efeead';

const toLinear = converter('lrgb');
const labDistance = differenceEuclidean('lab65');

// Viénot, Brettel and Mollon's linear-RGB projections for deuteranopia and protanopia
const DICHROMACY: Record<'deutan' | 'protan', number[][]> = {
  deutan: [
    [0.29275, 0.70725, 0],
    [0.29275, 0.70725, 0],
    [-0.02234, 0.02234, 1],
  ],
  protan: [
    [0.11238, 0.88762, 0],
    [0.11238, 0.88762, 0],
    [0.00401, -0.00401, 1],
  ],
};

function deltaE(a: string, b: string, kind: keyof typeof DICHROMACY): number {
  const seen = (hex: string) => {
    const { r, g, b } = toLinear(hex) ?? fail(`unreadable colour ${hex}`);
    const [sr, sg, sb] = DICHROMACY[kind].map((row) =>
      N.clamp(row[0] * r + row[1] * g + row[2] * b, 0, 1)
    );
    return { mode: 'lrgb' as const, r: sr, g: sg, b: sb };
  };
  return labDistance(seen(a), seen(b));
}

// The form thread must read against the canvas, and touching threads must stay apart for dichromats
export function checkPalettes(): void {
  for (const p of PALETTES) {
    const form = wcagContrast(p.a, p.canvas);
    if (form < 4.5) {
      fail(`palette ${p.name}: main thread ${form.toFixed(2)}:1 against the canvas`);
    }
    if (p.rim && wcagContrast(p.rim, PAGE) < 3) {
      fail(`palette ${p.name}: rim too dark for the page`);
    }
    if (p.canvas === BRAND_CREAM) {
      fail(`palette ${p.name}: the brand cream is a thread colour, not a canvas`);
    }
    const pairs: Array<[string, string]> = [
      [p.a, p.b],
      [p.a, p.c],
      [p.b, p.c],
    ];
    const worst = pairs
      .filter(([x, y]) => x !== y)
      .map(([x, y]) => Math.min(deltaE(x, y, 'deutan'), deltaE(x, y, 'protan')));
    const min = Math.min(...worst);
    if (min < 20) {
      fail(
        `palette ${p.name}: two touching threads merge for dichromats (dE ${min.toFixed(1)})`
      );
    }
    const fill = Math.min(wcagContrast(p.b, p.canvas), wcagContrast(p.c, p.canvas));
    if (fill < 1.5) {
      fail(
        `palette ${p.name}: a fill thread vanishes into the canvas (${fill.toFixed(2)}:1)`
      );
    }
  }
}
