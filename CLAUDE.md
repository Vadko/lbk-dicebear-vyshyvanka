# lbk-dicebear-vyshyvanka

The LBK player avatar as a DiceBear style, used by lbk-launcher and lbk-landing. The public API is `src/index.ts` (`vyshyvankaSvg`, `vyshyvankaDataUri`); everything else is the generator.

| Command | Notes |
|---|---|
| `pnpm test` | Generator guards, golden hashes, mirror-symmetry checks. |
| `pnpm build:style` | Regenerates `src/vyshyvanka.json` through every guard (`vitest --update`); never edit the JSON by hand. `pnpm test` fails on a hand edit (`toMatchFileSnapshot`). |
| `pnpm build` | tsup bundles `src/index.ts` with the JSON inlined into `dist/`. |
| `pnpm type-check` / `pnpm format:check` | TypeScript and Biome. |

- `src/generator/` builds the style behind its mirror and §86a guards: no rotation-only figure may reach an avatar, only mirror symmetry (the hosting is in Germany). The `check*` guards run at build time, not in consumers; the tests beside them prove each guard rejects what it should.
- `@dicebear/core` is a pinned dependency, not a peer, and the API fixes the avatar options (`borderRadius: 50`), so every consumer draws a seed identically. `src/index.test.ts` holds golden hashes of the output: a change that alters them redraws every player, so a DiceBear bump or a style edit that changes them needs an explicit decision.
- Seeds come from the server (`review_authors.avatar_seed`, 12 hex characters).
- Comments are one line and in English; brace every control-flow body (Biome `useBlockStatements`).
- Published to npm as `@lbklauncher/dicebear-vyshyvanka` by `.github/workflows/release.yml` on a push to main whose `version` is not on npm yet, through npm trusted publishing (OIDC, no token; provenance is automatic). Bump `version` to release. Consumers pin the exact version and keep it out of `minimumReleaseAge` with `minimumReleaseAgeExclude`.
