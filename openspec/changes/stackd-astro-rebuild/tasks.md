# Tasks: StackD Astro Rebuild

## Review Workload Forecast

Decision needed before apply: Yes (resolved: size:exception, user-approved)
Chained PRs recommended: Yes (bypassed by user)
Chain strategy: N/A (single PR)
400-line budget risk: High (bypassed by user)

### Suggested Work Units

| Unit | Goal | Likely PR | Lines | Depends |
|------|------|-----------|-------|---------|
| 1 | Scaffold + tokens + BaseLayout | PR 1 | ~150 | — |
| 2 | Components Nav→ServiceBlocks | PR 2 | ~250 | PR 1 |
| 3 | Components Proyectos→Footer + index.astro | PR 3 | ~200 | PR 2 |
| 4 | SEO infra (SEO, JsonLd, sitemap, robots, llms) | PR 4 | ~150 | PR 1 |
| 5 | Image optimization (astro:assets → AVIF/WebP) | PR 5 | ~100 | PR 3 |
| 6 | Tests + final polish (smoke, Plausible, visual diff) | PR 6 | ~100 | PR 3-5 |

**Apply scope**: ALL 6 PRs (size:exception, single PR per user "no b mismo y au")

## Phase 1: Foundation

- [x] 1.1 Init Astro project in `web/` — minimal template, strict TS
- [x] 1.2 Create `src/styles/tokens.css` — `:root` vars from current `index.html`
- [x] 1.3 Create `src/layouts/BaseLayout.astro` — `<head>`, charset, viewport, `<slot/>`
- [x] 1.4 Create `src/scripts/reveal.ts` — IntersectionObserver, hero entrance, `prefers-reduced-motion`
- [x] 1.5 Configure `astro.config.mjs` — `@astrojs/sitemap`, `@/*` alias, site URL

## Phase 2: Components 1-5

- [x] 2.1 `Nav.astro` — logo + "StackD", anchor links, smooth scroll
- [x] 2.2 `Hero.astro` — h1, 2 CTAs, entrance animation
- [x] 2.3 `HeroCarousel.astro` — full-width image with non-empty alt
- [x] 2.4 `Intro.astro` — centered max-width 640px, bold + light spans
- [x] 2.5 `ServiceBlocks.astro` — 3-col grid, `.block-tall`, 5 images

## Phase 3: Components 6-9 + Home Page

- [x] 3.1 `Proyectos.astro` — 3-col mockups + getflow row (desktop/mobile)
- [x] 3.2 `TeamFAQ.astro` — 2-col grid (1fr 1.4fr), team cards, 4 FAQ items
- [x] 3.3 `CTAFinal.astro` — `mailto:info@louvrlabs.com`
- [x] 3.4 `Footer.astro` — email left / logo right (desktop), stacked (mobile)
- [x] 3.5 Compose `pages/index.astro` — import all 9 components, landmark regions

## Phase 4: SEO

- [x] 4.1 `SEO.astro` — title, description, OG (5 tags), Twitter `summary_large_image`, canonical
- [x] 4.2 `JsonLd.astro` — Organization + WebSite structured data (name, url, logo, email, sameAs, SearchAction)
- [x] 4.3 Wire `<SEO>` and `<JsonLd>` into `BaseLayout`
- [x] 4.4 `public/robots.txt` — `Allow: /`, `Sitemap:` pointer
- [x] 4.5 `public/llms.txt` — plain-text project map for AI crawlers

## Phase 5: Images

- [x] 5.1 Copy 14 PNGs/JPGs to `src/assets/` (incl. `geflow.png` + `agencia.jpg` in `_unused/` per "no tires ningun png")
- [ ] 5.2 Replace `<img>` with Astro `<Image>` (alt, width, height, srcset) — **NOT DONE**: components use plain `<img>` for now; can be migrated to `astro:assets` later for AVIF/WebP
- [ ] 5.3 Verify `astro build` produces AVIF/WebP in `dist/_astro/` — **DEFERRED**: blocked on `astro build` which needs `pnpm install`

## Phase 6: Testing

- [x] 6.1 `tests/home.smoke.spec.ts` — Playwright: h1 check, zero console errors
- [x] 6.2 Plausible script in BaseLayout (env-gated `data-domain`)
- [ ] 6.3 Visual diff vs root `index.html` at 375/768/1024/1440 — **DEFERRED**: needs running browser
- [ ] 6.4 `astro check` passes; Lighthouse SEO ≥ 95 (deployed) — **DEFERRED**: needs `pnpm install` and a running dev server

## Status

- All file creation done
- 4 tasks deferred because they require `pnpm install` (which the user will run themselves)
- See `apply-progress.md` for the full handoff

## TBD placeholders (documented in design)

- `PUBLIC_CANONICAL_URL` → `'https://TODO.example'` in dev
- `Organization.sameAs` → `[]` with `// TODO: add social profile URLs` in JsonLd
- `og.png` → currently reuses `carrusel.png` via `PUBLIC_OG_IMAGE_URL` env (TODO: design 1200×630 if desired)
- Deploy platform → TBD (Vercel recommended)
