import { A } from '@mobily/ts-belt';
import { el, type StyleAttributes, type StyleElement } from './styleDefinition';

const coordinate = (v: number): string => v.toFixed(2).replace(/\.?0+$/, '');

const point = (x: number, y: number): string => `${coordinate(x)} ${coordinate(y)}`;

// A point at radius r along angle t, shifted by `side` across the radius
const polar = (r: number, t: number, side = 0): string =>
  point(
    13 + r * Math.cos(t) - side * Math.sin(t),
    13 + r * Math.sin(t) + side * Math.cos(t)
  );

// Closed ring through n points from angle 0; n divisible by four keeps it on all four mirror axes
const closedRing = (n: number, radius: (k: number) => number): string =>
  `M${A.makeWithIndex(n, (k) => polar(radius(k), (2 * k * Math.PI) / n)).join('L')}z`;

// Zigzag ring of 16 teeth
const teeth = (): string => closedRing(32, (k) => (k % 2 === 0 ? 12.5 : 11.6));

// A wave of eight crests, an even count, so each mirror axis meets a crest
const waves = (): string =>
  closedRing(64, (k) => 12.1 + 0.45 * Math.cos((k * Math.PI) / 4));

// Two zigzags in opposite phase that touch between the teeth: a chain of 16 rhombs
const rhombChain = (): string =>
  closedRing(32, (k) => (k % 2 === 0 ? 12.65 : 12.05)) +
  closedRing(32, (k) => (k % 2 === 0 ? 11.45 : 12.05));

const angles = (n: number): readonly number[] =>
  A.makeWithIndex(n, (k) => (2 * k * Math.PI) / n);

// Sixteen grains along the ring, each a rhomb lying on its own radius
const seeds = (): string =>
  angles(16)
    .map(
      (t) =>
        `M${polar(12.85, t)}L${polar(12.1, t, 0.42)}L${polar(11.35, t)}L${polar(12.1, t, -0.42)}z`
    )
    .join('');

// Sixteen small crosses between the axes, each with one bar on its own radius
const crosses = (): string =>
  angles(16)
    .map((t) => t + Math.PI / 16)
    .map(
      (t) =>
        `M${polar(11.5, t)}L${polar(12.7, t)}M${polar(12.1, t, -0.6)}L${polar(12.1, t, 0.6)}`
    )
    .join('');

const ring = (attributes: StyleAttributes): StyleElement =>
  el('circle', { cx: '13', cy: '13', r: '12.2', fill: 'none', ...attributes });

// Borders inherit the threads: stroke is the main thread, currentColor the fill thread; dash counts divide by eight
export const BORDERS: Record<string, { weight: number; elements: StyleElement[] }> = {
  line: { weight: 2, elements: [ring({ 'stroke-width': '.7' })] },
  lineB: {
    weight: 2,
    elements: [ring({ stroke: 'currentColor', 'stroke-width': '.7' })],
  },
  running: {
    weight: 2,
    elements: [
      ring({
        'stroke-width': '.9',
        pathLength: '32',
        'stroke-dasharray': '.55 .45',
        'stroke-dashoffset': '.275',
      }),
    ],
  },
  beads: {
    weight: 2,
    elements: [
      ring({
        r: '12',
        stroke: 'currentColor',
        'stroke-width': '1.3',
        'stroke-linecap': 'round',
        pathLength: '24',
        'stroke-dasharray': '0 1',
      }),
    ],
  },
  double: {
    weight: 1,
    elements: [
      ring({ r: '12.4', 'stroke-width': '.45' }),
      ring({ r: '11.7', stroke: 'currentColor', 'stroke-width': '.45' }),
    ],
  },
  teeth: {
    weight: 1,
    elements: [
      el('path', {
        fill: 'none',
        'stroke-width': '.6',
        'stroke-linejoin': 'round',
        d: teeth(),
      }),
    ],
  },
  waves: {
    weight: 1,
    elements: [
      el('path', {
        fill: 'none',
        'stroke-width': '.5',
        'stroke-linejoin': 'round',
        d: waves(),
      }),
    ],
  },
  rhombs: {
    weight: 1,
    elements: [el('path', { fill: 'none', 'stroke-width': '.35', d: rhombChain() })],
  },
  seeds: { weight: 2, elements: [el('path', { fill: 'currentColor', d: seeds() })] },
  seedsC: { weight: 1, elements: [el('path', { d: seeds() })] },
  crosses: {
    weight: 2,
    elements: [el('path', { fill: 'none', 'stroke-width': '.4', d: crosses() })],
  },
};
