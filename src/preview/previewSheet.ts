import { A } from '@mobily/ts-belt';
import { vyshyvankaSvg } from '../index';

const COLUMNS = 8;
const ROWS = 3;
const SIDE = 96;
const GAP = 16;

// Server-shaped seeds (12 hex characters), not picked by hand, so the sheet shows the style as players get it
const SEEDS = A.makeWithIndex(COLUMNS * ROWS, (i) =>
  (((i + 7) * 2246822519) % 2 ** 48).toString(16).padStart(12, '0')
);

// The README picture: each avatar nested as its own <svg>, whose ids already stay apart on one page
export function previewSheet(): string {
  const width = COLUMNS * SIDE + (COLUMNS - 1) * GAP;
  const height = ROWS * SIDE + (ROWS - 1) * GAP;
  const avatars = SEEDS.map((seed, i) => {
    const x = (i % COLUMNS) * (SIDE + GAP);
    const y = Math.floor(i / COLUMNS) * (SIDE + GAP);
    return vyshyvankaSvg(seed).replace(
      /^<svg /,
      `<svg x="${x}" y="${y}" width="${SIDE}" height="${SIDE}" `
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${avatars.join('')}</svg>\n`;
}
