import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { vyshyvankaDataUri, vyshyvankaSvg } from './index';
import vyshyvanka from './vyshyvanka.json';

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');

const MIRRORS = [
  '',
  'matrix(-1 0 0 1 26 0)',
  'matrix(1 0 0 -1 0 26)',
  'matrix(-1 0 0 -1 26 26)',
];
const TRANSPOSE = 'matrix(0 1 1 0 0 0)';
// Server seeds are 12 hex characters
const SEEDS = Array.from({ length: 2000 }, (_, i) =>
  (((i + 1) * 2654435761) % 2 ** 48).toString(16).padStart(12, '0')
);

interface Use {
  readonly transform: string;
  readonly href: string;
}

const svgOf = vyshyvankaSvg;

const usesIn = (fragment: string): Use[] =>
  [...fragment.matchAll(/<use(?: transform="([^"]*)")? href="#([^"]+)"\/>/g)].map(
    (m) => ({
      transform: m[1] ?? '',
      href: m[2],
    })
  );

const idsIn = (svg: string): string[] =>
  [...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);

function quarter(svg: string): { id: string; uses: Use[] } {
  const defs = [...svg.matchAll(/<g id="(q-[^"]+)">((?:<use[^>]*\/>)*)<\/g>/g)];
  expect(defs).toHaveLength(1);
  return { id: defs[0][1], uses: usesIn(defs[0][2]) };
}

describe('vyshyvankaDataUri', () => {
  it('draws the SVG as a data URI', () => {
    const uri = vyshyvankaDataUri('0a1b2c3d4e5f');
    expect(uri).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(uri.slice(uri.indexOf(',') + 1))).toBe(
      vyshyvankaSvg('0a1b2c3d4e5f')
    );
  });

  // The test seeds draw every variant, so a redraw of any palette, border or part changes this
  it('draws all test seeds exactly as before', () => {
    expect(sha256(SEEDS.map(vyshyvankaDataUri).join('\n'))).toBe(
      'ee90122397af4a7b0c84dae6b4d485340b17d4c982821f606cf2e3c46f8332f9'
    );
  });

  it('draws every variant of the style among the test seeds', () => {
    const drawn = new Set(
      SEEDS.flatMap((seed) =>
        [...svgOf(seed).matchAll(/<g id="([a-z]+)-(\w+)-[0-9a-f]{8}">/g)].map(
          (m) => `${m[1]}.${m[2]}`
        )
      )
    );
    const variants = Object.entries(vyshyvanka.components).flatMap(([name, c]) =>
      Object.keys(c.variants).map((v) => `${name}.${v}`)
    );
    expect(variants.filter((v) => !drawn.has(v))).toEqual([]);
  });
});

// Mirror symmetry rests on DiceBear drawing one definition per component per avatar and placing it by reference
describe('vyshyvanka symmetry', () => {
  it.each(SEEDS)(
    'places one quarter four times, by the identity and the mirrors only: %s',
    (seed) => {
      const svg = svgOf(seed);
      const ids = idsIn(svg);
      expect(ids).toEqual([...new Set(ids)]);
      const { id } = quarter(svg);
      const placed = usesIn(svg).filter((u) => u.href.startsWith('q-'));
      expect(placed.map((u) => u.href)).toEqual([id, id, id, id]);
      expect(placed.map((u) => u.transform).sort()).toEqual([...MIRRORS].sort());
      // Nothing around the references may turn or move them, and no reference escapes the strict pattern
      expect(svg).not.toMatch(/<g[^>]*\btransform=/);
      expect(svg.match(/<use\b/g)).toHaveLength(usesIn(svg).length);
    }
  );

  it.each(SEEDS)(
    'draws both arms from one arm definition, and the parts nowhere else: %s',
    (seed) => {
      const svg = svgOf(seed);
      const ids = new Set(idsIn(svg));
      const { uses } = quarter(svg);
      expect(uses.map((u) => `${u.href.split('-')[0]}:${u.transform}`)).toEqual([
        'k:',
        'a:',
        `a:${TRANSPOSE}`,
        'x:',
      ]);
      expect(uses[1].href).toBe(uses[2].href);
      expect(uses.map((u) => u.href).filter((href) => !ids.has(href))).toEqual([]);
      expect(usesIn(svg).filter((u) => /^[kax]-/.test(u.href))).toHaveLength(uses.length);
    }
  );

  it('keeps ids apart between avatars, so several can share one page', () => {
    const owner = new Map<string, string>();
    const patterns = new Map<string, string>();
    for (const seed of SEEDS.slice(0, 300)) {
      const svg = svgOf(seed);
      for (const id of idsIn(svg)) {
        const first = owner.get(id);
        if (first !== undefined && first !== seed) {
          expect(id, seed).toMatch(/^t-[A-Za-z]+$/);
        }
        owner.set(id, first ?? seed);
      }
      for (const m of svg.matchAll(/<pattern id="([^"]+)"[^>]*>.*?<\/pattern>/g)) {
        expect(patterns.get(m[1]) ?? m[0], seed).toBe(m[0]);
        patterns.set(m[1], m[0]);
      }
    }
  });
});
