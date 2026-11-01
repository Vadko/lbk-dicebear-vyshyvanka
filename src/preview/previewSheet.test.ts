import { describe, expect, it } from 'vitest';
import { previewSheet } from './previewSheet';

describe('previewSheet', () => {
  // `pnpm build:style` rewrites the README picture through this test, after the style itself
  it('matches the committed README picture', async () => {
    await expect(previewSheet()).toMatchFileSnapshot('../../docs/preview.svg');
  });
});
