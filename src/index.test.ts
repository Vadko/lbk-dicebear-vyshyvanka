import { createHash } from 'node:crypto';
import { A, F } from '@mobily/ts-belt';
import { type Document, type Element, Window } from 'happy-dom';
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
// Each layout's quarter: the core, an arm-like part placed twice, a corner-like part
const QUARTERS: Record<string, readonly string[]> = {
  cross: ['k:', 'a:', `a:${TRANSPOSE}`, 'x:'],
  star: ['k:', 't:', `t:${TRANSPOSE}`, 'd:'],
};
// Server seeds are 12 hex characters
const SEEDS = A.makeWithIndex(2000, (i) =>
  (((i + 1) * 2654435761) % 2 ** 48).toString(16).padStart(12, '0')
);

interface Use {
  readonly transform: string;
  readonly href: string;
}

const { DOMParser } = new Window();
const svgOf = F.memoizeWithKey(F.identity<string>, (seed: string) =>
  new DOMParser().parseFromString(vyshyvankaSvg(seed), 'image/svg+xml')
);

// A reference carries only its target and an optional transform, and nothing inside it
const usesIn = (root: Document | Element): Use[] =>
  [...root.querySelectorAll('use')].map((use) => {
    expect(use.getAttributeNames().filter((name) => name !== 'transform')).toEqual([
      'href',
    ]);
    expect(use.childNodes).toHaveLength(0);
    const href = use.getAttribute('href') ?? '';
    expect(href).toMatch(/^#./);
    return { transform: use.getAttribute('transform') ?? '', href: href.slice(1) };
  });

const idsIn = (svg: Document): string[] =>
  [...svg.querySelectorAll('[id]')].map((e) => e.getAttribute('id') ?? '');

function quarter(svg: Document): { id: string; uses: Use[] } {
  const defs = [...svg.querySelectorAll('g[id^="q-"]')];
  expect(defs).toHaveLength(1);
  expect(defs[0].getAttributeNames()).toEqual(['id']);
  expect([...defs[0].children].map((e) => e.tagName)).toEqual([
    'use',
    'use',
    'use',
    'use',
  ]);
  return { id: defs[0].getAttribute('id') ?? '', uses: usesIn(defs[0]) };
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
      'f731a990a851d654cad83dc521cee17d43278b0db7ca46f2923f44e2510c970f'
    );
  });

  it('draws every variant of the style among the test seeds', () => {
    const drawn = new Set(
      SEEDS.flatMap((seed) =>
        idsIn(svgOf(seed)).flatMap((id) => {
          const m = /^([a-z]+)-(\w+)-[0-9a-f]{8}$/.exec(id);
          return m ? [`${m[1]}.${m[2]}`] : [];
        })
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
      // Nothing around the references may turn or move them
      expect(svg.querySelectorAll('g[transform]')).toHaveLength(0);
    }
  );

  it.each(SEEDS)(
    'draws both arms from one arm definition, and the parts nowhere else: %s',
    (seed) => {
      const svg = svgOf(seed);
      const ids = new Set(idsIn(svg));
      const { id, uses } = quarter(svg);
      const layout = id.split('-')[1];
      expect(uses.map((u) => `${u.href.split('-')[0]}:${u.transform}`)).toEqual(
        QUARTERS[layout]
      );
      expect(uses[1].href).toBe(uses[2].href);
      expect(uses.map((u) => u.href).filter((href) => !ids.has(href))).toEqual([]);
      expect(usesIn(svg).filter((u) => /^[kaxtd]-/.test(u.href))).toHaveLength(
        uses.length
      );
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
      for (const pattern of svg.querySelectorAll('pattern')) {
        const id = pattern.getAttribute('id') ?? '';
        expect(patterns.get(id) ?? pattern.outerHTML, seed).toBe(pattern.outerHTML);
        patterns.set(id, pattern.outerHTML);
      }
    }
  });
});
