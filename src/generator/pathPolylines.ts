import svgpath from 'svgpath';
import { fail } from './fail';

export type Point = readonly [number, number];

interface Polyline {
  readonly points: readonly Point[];
  readonly closed: boolean;
}

// Straight segments only (M L H V Z, absolute or relative): a curve or an arc is refused rather than checked
export function pathPolylines(d: string): Polyline[] {
  const path = svgpath(d).abs();
  // svgpath keeps a parse error in err, which its typings leave out
  if ('err' in path && path.err) {
    fail(`path ${d}: ${String(path.err)}`);
  }
  const lines: Array<{ points: Point[]; closed: boolean }> = [];
  const lineTo = (from: Point, to: Point): void => {
    const current = lines.at(-1);
    if (current && !current.closed) {
      current.points.push(to);
    } else {
      // After a Z, a drawing command starts a new subpath where the closed one started
      lines.push({ points: [from, to], closed: false });
    }
  };
  path.iterate((segment, _index, x, y) => {
    switch (segment[0]) {
      case 'M':
        lines.push({ points: [[segment[1], segment[2]]], closed: false });
        break;
      case 'L':
        lineTo([x, y], [segment[1], segment[2]]);
        break;
      case 'H':
        lineTo([x, y], [segment[1], y]);
        break;
      case 'V':
        lineTo([x, y], [x, segment[1]]);
        break;
      case 'Z':
      case 'z': {
        const current = lines.at(-1);
        if (current) {
          current.closed = true;
        }
        break;
      }
      default:
        fail(`path ${d}: only straight segments (M L H V Z) are allowed`);
    }
  });
  return lines;
}
