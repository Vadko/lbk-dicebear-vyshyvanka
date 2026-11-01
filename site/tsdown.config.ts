import { defineConfig } from 'tsdown';

// Paths resolve from this directory, the config's own
export default defineConfig({
  entry: { app: 'app.ts' },
  outDir: '../_site',
  platform: 'browser',
  target: 'es2023',
  // The demo page has no package manager behind it, so DiceBear is bundled in
  deps: { alwaysBundle: ['@dicebear/core'], onlyBundle: ['@dicebear/core'] },
  dts: false,
  minify: true,
  copy: 'public/*',
});
