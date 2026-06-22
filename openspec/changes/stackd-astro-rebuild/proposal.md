# Proposal: Rebuild StackD as Astro + Full SEO

## Intent

The StackD site is a single 310-line `index.html` — all styles inlined, zero SEO (no sitemap, OpenGraph, schema.org, semantic structure), no build pipeline, no type safety. Every future change (new pages, i18n, blog) would compound this debt. This rebuild moves StackD to Astro, preserving pixel-perfect design, and bundles a complete SEO pass so the agency's own site practices what it sells.

## Scope

### In Scope
- Astro project scaffold with componentized sections (9 sections from current HTML)
- Pixel-perfect CSS migration — preserve all breakpoints, hover states, smooth scroll
- Full SEO: sitemap.xml, robots.txt, OpenGraph, JSON-LD schema.org (Organization + WebSite), llms.txt
- Semantic HTML: heading hierarchy, landmark regions, image alt text
- Image optimization: responsive srcset, format selection via Astro Image
- Deploy config for chosen platform
- Testing baseline: `astro check` + one smoke test

### Out of Scope
- i18n, CMS, blog, auth, e-commerce, contact form backend, copy changes, custom animations

## Capabilities

### New Capabilities
- `stackd-site`: Astro project — pages, layouts, components, styling, responsive behavior, all 9 sections
- `stackd-seo`: sitemap.xml, robots.txt, OpenGraph, JSON-LD schema.org, llms.txt, semantic HTML, meta tags

### Modified Capabilities
None — `openspec/specs/` is empty.

## Approach

`npm create astro@latest` → migrate section by section: HTML → `.astro` components, inline CSS → scoped `<style>`. `astro check` after each migration. Once visual parity confirmed, layer SEO artifacts. Existing `index.html` stays live until Astro build verified and DNS cutover executed.

### Animations (tasteful, additive)

The current design has no animations beyond button hover and smooth scroll. We add a small, professional set that fits a "webs/automatizaciones/software for SMEs" agency:

- **Hero entrance**: fade-in + tiny Y translate on first load (text + CTAs), no scroll trigger
- **Service blocks & project images**: fade-in + 8px Y translate on scroll into view (IntersectionObserver, ~20 lines of vanilla JS, no library)
- **Team cards / FAQ items**: subtle hover lift (transform: translateY(-2px)) with transition
- **Buttons**: keep existing `translateY(-1px)` hover, add 200ms ease on background and border

No parallax, no scroll-jacking, no hero video, no excessive motion. Honors `prefers-reduced-motion`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `/` root | New | `astro.config.mjs`, `package.json`, `tsconfig.json` |
| `src/pages/` | New | `index.astro` replacing `index.html` |
| `src/components/` | New | Nav, Hero, Carousel, Intro, ServiceBlocks, Proyectos, TeamFAQ, CTA, Footer |
| `src/layouts/` | New | BaseLayout with metadata |
| `public/` | New | Static assets, robots.txt, llms.txt |
| `assets/` | Untouched (in v1) | All 14 images stay in `assets/`; Astro references them via `src/assets/` for optimization. `geflow.png` kept (unused but preserved per user). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Pixel drift from CSS migration | Medium | Side-by-side visual diff; preserve all values |
| Deploy cutover breaks live site | Low | Old site stays; swap DNS after verification |
| Image path breakage | Low | Audit all `src` refs; verify dev build |
| Astro learning curve | Low | `.astro` files are HTML-first |

## Rollback Plan

Existing `index.html` + `assets/` remain untouched on production. Astro project in separate folder. Revert = point DNS back to current server.

## Dependencies

- Node.js 18+, Astro latest stable
- Deploy platform account (TBD)
- Domain DNS access for cutover

## Decisions Resolved

- **Deploy target**: same as current (TBD — pending user input at deploy config time)
- **Domain**: current domain (TBD — pending user input for sitemap/canonical)
- **Contact form**: keep `mailto:info@louvrlabs.com` (no backend in v1)
- **Analytics**: Plausible (privacy-friendly, no cookie banner)
- **Image strategy**: `src/assets/` so Astro Image can optimize to AVIF/WebP
- **Unused asset**: keep `geflow.png` in `assets/` — do not delete (per user)
- **Project layout**: separate folder `web/` alongside the existing static HTML
- **TypeScript**: yes, strict mode (Astro default)
- **Content collections**: not in v1 (FAQ/team hardcoded as components)
- **Animations**: tasteful, scroll-triggered fade-ins + subtle hover lifts (see Approach)

## Success Criteria

- [ ] `astro build` passes with zero errors/warnings
- [ ] Pixel-identical at 375px, 768px, 1024px, 1440px
- [ ] Sitemap valid, robots.txt allows crawling and points to sitemap
- [ ] OpenGraph tags present on every page
- [ ] JSON-LD validates via Google Rich Results Test
- [ ] `llms.txt` at `/llms.txt` with project structure
- [ ] Lighthouse SEO ≥ 95
- [ ] All images have alt text + responsive srcset
