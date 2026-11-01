# lbk-dicebear-vyshyvanka

The LBK player avatar as a DiceBear style, used by lbk-launcher and lbk-landing. The public API is `src/index.ts` (`vyshyvankaSvg`, `vyshyvankaDataUri`); everything else is the generator.

| Command | Notes |
|---|---|
| `pnpm test` | Generator guards, golden hashes, mirror-symmetry checks. |
| `pnpm build:style` | Regenerates `src/vyshyvanka.json` through every guard (`vitest --update`), then the README picture `docs/preview.svg` (`src/preview/`); never edit either by hand. `pnpm test` fails on a hand edit or a stale picture (`toMatchFileSnapshot`). |
| `pnpm build` | tsup bundles `src/index.ts` with the JSON inlined into `dist/`. |
| `pnpm build:site` | The demo page (`site/`) into `_site/`, with DiceBear bundled in (`site/tsup.config.ts`); `.github/workflows/pages.yml` deploys it to GitHub Pages on every push to main. Preview it with `python3 -m http.server -d _site`: a module script does not load from `file://`. |
| `pnpm type-check` / `pnpm format:check` | TypeScript (the package, then `site/` with the DOM lib) and Biome. |

- Reach for a maintained library before writing a helper: the generator leans on `culori` (contrast, Lab), `svgpath` (path parsing), `transformation-matrix` (SVG transforms), `graphology` (connected components), `unist-util-visit-parents` (walking the element tree) and `@mobily/ts-belt`, and the output tests read the SVG through `happy-dom`. All of them are devDependencies: the package ships only `@dicebear/core` and the generated JSON.
- `src/generator/` builds the style behind its mirror and §86a guards: no rotation-only figure may reach an avatar, only mirror symmetry (the hosting is in Germany). The `check*` guards run at build time, not in consumers; the tests beside them prove each guard rejects what it should.
- `@dicebear/core` is a pinned dependency, not a peer, and the API fixes the avatar options (`borderRadius: 50`), so every consumer draws a seed identically. `src/index.test.ts` holds golden hashes of the output: a change that alters them redraws every player, so a DiceBear bump or a style edit that changes them needs an explicit decision.
- A quarter is drawn in one of two layouts (`LAYOUTS` in `src/generator/grid.ts`): a cross with arms on the axes, or a star with tips on the axes and parts on the diagonals. The quarter component `q` has one variant per layout, and DiceBear picks one variant per component per avatar, so all four references still draw the same quarter.
- Seeds come from the server (`review_authors.avatar_seed`, 12 hex characters).
- Comments are one line and in English; brace every control-flow body (Biome `useBlockStatements`).
- Published to npm as `@lbklauncher/dicebear-vyshyvanka` by `.github/workflows/release.yml` on a push to main whose `version` is not on npm yet, through npm trusted publishing (OIDC, no token; provenance is automatic). Bump `version` to release. Consumers pin the exact version and keep it out of `minimumReleaseAge` with `minimumReleaseAgeExclude`.
