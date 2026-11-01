import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: 'src/index.ts',
  // The avatar is drawn in browsers and on servers alike, and neutral keeps the .js/.d.ts names the exports point at
  platform: 'neutral',
  dts: true,
});
