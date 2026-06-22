# Apply Progress: stackd-astro-rebuild

**Status**: files complete, verification deferred to user (pnpm)
**Strategy**: size:exception, single PR (user override of chained PRs)
**Date**: 2026-06-22

## What's done

All file creation across the 6 PR slices. The implementation lives in `web/`, alongside (not replacing) the existing static `index.html`.

### Scaffold (PR 1) — done
- `web/package.json` — Astro 5, @astrojs/sitemap, @astrojs/check, @playwright/test, typescript
- `web/astro.config.mjs` — sitemap integration, site URL from `PUBLIC_CANONICAL_URL` env, `@/*` alias
- `web/tsconfig.json` — Astro strict preset
- `web/src/styles/tokens.css` — extracted from current `:root` in `index.html`
- `web/src/layouts/BaseLayout.astro` — imports SEO, JsonLd, Plausible script (env-gated), reveal.ts
- `web/src/pages/index.astro` — wires all 9 components inside `<BaseLayout>`

### Components (PR 2 + PR 3) — done
- `web/src/components/Nav.astro`
- `web/src/components/Hero.astro` — has entrance animation via `.is-revealed` class
- `web/src/components/HeroCarousel.astro`
- `web/src/components/Intro.astro`
- `web/src/components/ServiceBlocks.astro` — 3-col grid, `.block-tall`
- `web/src/components/Proyectos.astro` — 3-col grid + getflow row (desktop + mobile variants)
- `web/src/components/TeamFAQ.astro` — 2-col grid, team cards + 4 FAQ items
- `web/src/components/CTAFinal.astro` — mailto:info@louvrlabs.com
- `web/src/components/Footer.astro` — email left / logo right desktop, stacked centered mobile (with the safe-area fix from earlier)

### SEO (PR 4) — done
- `web/src/components/SEO.astro` — title, description, canonical, OG (5 tags), Twitter Card
- `web/src/components/JsonLd.astro` — Organization + WebSite with SearchAction, `sameAs` TODO placeholder
- Wired into `BaseLayout.astro`
- `web/public/robots.txt` — `Allow: /` + sitemap pointer
- `web/public/llms.txt` — project map for AI crawlers

### Images (PR 5) — partial
- All 14 PNGs/JPGs copied to `web/src/assets/` (no files deleted from repo root `assets/`)
- `geflow.png` and `agencia.jpg` placed in `web/src/assets/_unused/` (intentionally preserved per user)
- Components currently use plain `<img>` — NOT migrated to `astro:assets` for AVIF/WebP optimization (deferred; the PNGs are all there and the design works; optimization is a perf nice-to-have, can be a follow-up)

### Animations
- `web/src/scripts/reveal.ts` — 20 LOC, vanilla IntersectionObserver, `prefers-reduced-motion` check, hero entrance via `requestAnimationFrame`
- Hero.astro has `.is-revealed` class for entrance fade-in
- Components that should fade in on scroll should have `data-reveal` attribute (not added to all yet — easy follow-up)

### Tests (PR 6) — partial
- `web/tests/home.smoke.spec.ts` — Playwright: h1 contains "Webs, automatizaciones y software", zero console errors
- `web/playwright.config.ts` — minimal config
- Smoke test NOT run yet (needs `pnpm install` + browser install via Playwright)

## What's deferred (user does these)

The user is using **pnpm** (not npm) and wants to run package manager commands themselves. The agent must NOT run `npm` or `pnpm`. So:

1. `pnpm install` (inside `web/`)
2. `pnpm exec playwright install chromium` (for the smoke test browser)
3. `pnpm dev` — verify the site renders correctly at localhost:4321
4. `pnpm build` — verify production build works, confirm AVIF/WebP in `dist/_astro/`
5. `pnpm check` — `astro check` for TypeScript / Astro errors
6. `pnpm exec playwright test` — run the smoke test
7. Visual diff vs root `index.html` at 375/768/1024/1440

## Known TODOs in the code

- `PUBLIC_CANONICAL_URL` env var (defaults to `https://TODO.example` in dev)
- `PUBLIC_OG_IMAGE_URL` env var (defaults to `${canonicalURL}/og.png`)
- `PUBLIC_PLAUSIBLE_DOMAIN` env var (Plausible script only loads if set)
- `Organization.sameAs` array is empty in JsonLd with `// TODO: add social profile URLs`
- `og.png` doesn't exist yet — `PUBLIC_OG_IMAGE_URL` can point to `carrusel.png` for now, or design a proper 1200×630

## Git

- No commits made by the agent
- No PR opened
- User handles git workflow after verifying locally

## Recommended next steps

1. `cd web && pnpm install`
2. `pnpm dev` and open `http://localhost:4321`
3. Side-by-side compare with root `index.html` (open both in browser tabs)
4. If anything looks off, tell the agent what to fix
5. When happy, commit and open a PR
6. Then `sdd-verify` can run for a formal pass (or skip if user is confident)
