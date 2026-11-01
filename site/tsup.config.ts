import { defineConfig } from 'tsup';

// The demo page has no package manager behind it, so DiceBear is bundled in
export default defineConfig({
  entry: { app: 'site/app.ts' },
  outDir: '_site',
  format: 'esm',
  platform: 'browser',
  target: 'es2023',
  noExternal: [/./],
  minify: true,
  clean: true,
  publicDir: 'site/public',
});
