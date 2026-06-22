# Design: StackD Astro Rebuild

## Technical Approach

Rebuild `index.html` as an Astro project in `web/`. Existing `assets/` and `index.html` stay until DNS cutover. The 9 sections become `.astro` components; tokens, breakpoints, and selectors migrate verbatim into scoped styles + `tokens.css`. SEO via `<SEO>` + `<JsonLd>` in `BaseLayout`, with `@astrojs/sitemap` and static `robots.txt` / `llms.txt`. Vanilla TS handles reveals — no UI libs.

## Architecture Decisions

- **Location**: new `web/` at repo root — side-by-side with current site → visual diff + instant rollback.
- **Styling**: scoped `<style>` + `tokens.css` — preserves hand-written CSS 1:1.
- **Interactivity**: vanilla `reveal.ts` (~20 LOC) — only IntersectionObserver + hero entrance; islands add runtime for nothing.
- **Images**: `astro:assets` (AVIF/WebP, srcset) — satisfies REQ-SEO-10 with zero config.
- **Sitemap**: `@astrojs/sitemap` — auto from routes; future-proof.
- **JSON-LD**: inline `<script>` via `<JsonLd>` — two static nodes; a lib is overkill.
- **Content**: hardcoded components — collections out of scope (v1).
- **Deploy**: document candidates, defer to apply — domain + DNS untouched here.

## Project Structure

```
web/
├── astro.config.mjs, package.json, tsconfig.json (strict + @/* alias)
├── src/
│   ├── assets/              # all 14 PNGs/JPGs (geflow.png kept)
│   ├── components/          # 9 sections + SEO + JsonLd
│   ├── layouts/BaseLayout.astro
│   ├── pages/index.astro    # composes 9 sections
│   ├── scripts/reveal.ts    # IO observer + hero entrance
│   └── styles/tokens.css    # :root from current index.html
├── public/                  # robots.txt, llms.txt, favicon
└── tests/smoke.spec.ts      # Playwright: h1 + zero console errors
```

## Components

9 sections mapped 1:1 to REQ-SITE-3..7: `Nav`, `Hero`, `HeroCarousel`, `Intro`, `ServiceBlocks`, `Proyectos`, `TeamFAQ`, `CTAFinal`, `Footer` (specifics: logo+"StackD"+smooth scroll / h1+2 CTAs / full-width `<Image>` / 640px / 3-col+`block-tall` / 3 mockups+getflow row / `1fr 1.4fr` / `mailto:info@louvrlabs.com` / email+logo responsive).

Plus SEO: `SEO` (REQ-SEO-1..3), `JsonLd` (REQ-SEO-4..5), `BaseLayout` (`<head>`+`<SEO>`+`<JsonLd>`+Plausible+`<slot/>`).

## CSS Strategy

`tokens.css` holds the four `:root` vars verbatim. Each component imports it and declares its own scoped `<style>` — Astro auto-scopes selectors (`.hero` → `.hero-XXXXX`), killing global collisions. The 900px breakpoint and getflow desktop/mobile swap move into owning components. No utility framework, no extra reset.

## Animation

```ts
// src/scripts/reveal.ts — on DOMContentLoaded
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) {
  requestAnimationFrame(() =>
    document.querySelector('.hero')?.classList.add('is-revealed'));
  const io = new IntersectionObserver(es =>
    es.forEach(e => e.isIntersecting && e.target.classList.add('is-revealed')));
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}
```

CSS owns initial state (`.hero`, `[data-reveal]` start at `opacity:0; translateY(8px)`); `.is-revealed` resets with `transition: 600ms ease`. Hover lifts stay CSS. Reduced-motion media query neutralizes all transitions/animations.

## SEO

- **BaseLayout**: charset, viewport, `<SEO>`, `<JsonLd>`, Plausible.
- **`<SEO>`**: `<title>`, description, OG, Twitter (`summary_large_image`), canonical. Local-dev fallback: `https://TODO.example`.
- **`<JsonLd>`**: takes `{ name, url, logo, email, sameAs[] }`, renders Organization + WebSite (SearchAction → `/?q={search_term_string}`).
- **`@astrojs/sitemap`**: `site: PUBLIC_CANONICAL_URL`.
- **`public/robots.txt`**: `User-agent: *`, `Allow: /`, `Sitemap: <canonical>/sitemap-index.xml`.
- **`public/llms.txt`**: plain-text project map.
- **Images**: `astro:assets` `<Image>` with explicit `width`/`height` + alt (REQ-SEO-10). Alt preserved verbatim.

## TypeScript

`extends: "astro/tsconfigs/strict"`, `strict: true`, `paths: { "@/*": ["src/*"] }`. No `any`. `astro check` in CI per REQ-SITE-1/10.

## Testing

Static = `astro check` + `astro build` exit zero, `dist/index.html` exists. E2E = Playwright `tests/smoke.spec.ts`: load `/`, assert `h1` contains "Webs, automatizaciones", zero console errors. Strict TDD off per `openspec/config.yaml`; one smoke test, per the proposal.

## Build & Deploy

- **Vercel**: zero-config Astro preset, previews, free tier — recommended.
- **Netlify**: mature adapter, edge functions — acceptable.
- **Cloudflare Pages**: fastest CDN, no build-minute cap — best for global traffic.

Env vars: `PUBLIC_CANONICAL_URL`, `PUBLIC_OG_IMAGE_URL`, `PUBLIC_PLAUSIBLE_DOMAIN`. Local: `https://TODO.example`, empty `sameAs` with `// TODO` comment.

## Migration / Rollout

1. `npm create astro@latest -- --template minimal --typescript strict --no-install` in `web/`.
2. Copy `:root` vars into `tokens.css`.
3. Migrate sections in order, `astro check` + browser preview after each: Nav → Hero → HeroCarousel → Intro → ServiceBlocks → Proyectos → TeamFAQ → CTAFinal → Footer.
4. Compose `pages/index.astro`; visual diff vs root `index.html` at 375 / 768 / 1024 / 1440.
5. Add `<SEO>` + `<JsonLd>`; configure sitemap; write `robots.txt` + `llms.txt`.
6. Replace `<img>` with `astro:assets` `<Image>`; verify AVIF/WebP in `dist/_astro/`.
7. Add Plausible (env-gated); wire smoke test in CI.
8. **Cutover**: preview URL → manual QA → swap DNS → keep old site one cycle as fallback.

**Rollback**: revert DNS. `assets/` + `index.html` stay untouched.

## Risks

- **Pixel drift** — side-by-side at 4 viewports per section; copy values verbatim.
- **Image path breakage** — verify dev server, not just build output.
- **TBD placeholders leak to prod** — guard env reads; fail `astro build` if `PUBLIC_CANONICAL_URL` missing in prod mode.
- **Reveal hydration** — vanilla script after DOMContentLoaded, no island boundary.

## Open Questions

- Canonical domain (`PUBLIC_CANONICAL_URL`) — TBD at deploy.
- Social profile URLs for `Organization.sameAs` — TBD.
- Deploy platform (Vercel / Netlify / Cloudflare) — TBD at cutover.
- OG image source — design 1200×630 `og.png`, or reuse `carrusel.png`?