import { describe, expect, it } from 'vitest';
import { pathPolylines } from './pathPolylines';

describe('pathPolylines', () => {
  it('reads absolute and relative straight segments', () => {
    expect(pathPolylines('M2 1h4v2H2zm4 0l2 2V7')).toEqual([
      {
        points: [
          [2, 1],
          [6, 1],
          [6, 3],
          [2, 3],
        ],
        closed: true,
      },
      {
        points: [
          [6, 1],
          [8, 3],
          [8, 7],
        ],
        closed: false,
      },
    ]);
  });

  it('starts a subpath after a close where the closed one started', () => {
    expect(pathPolylines('M1 1h2zl0 2')).toEqual([
      {
        points: [
          [1, 1],
          [3, 1],
        ],
        closed: true,
      },
      {
        points: [
          [1, 1],
          [1, 3],
        ],
        closed: false,
      },
    ]);
  });

  it.each([
    ['a curve', 'M0 0C1 1 2 2 3 3'],
    ['a quadratic', 'M0 0q1 1 2 2'],
    ['an arc', 'M0 0a1 1 0 0 1 2 2'],
    ['a missing number', 'M1 1L2'],
    ['an unknown command', 'M1 1x2'],
    ['no moveto', 'h2v2'],
  ])('refuses %s', (_, d) => {
    expect(() => pathPolylines(d)).toThrow(/^path /);
  });
});
