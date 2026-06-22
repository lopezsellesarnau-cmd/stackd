# stackd-site Specification

## Purpose

Astro-based StackD marketing site: single-page, 9-section landing, 900px breakpoint, tasteful animations, TypeScript strict, Plausible analytics, smoke test.

## Requirements

| ID | Requirement | Scenarios |
|----|-------------|-----------|
| REQ-SITE-1 | Astro latest stable, TypeScript strict, `astro build` zero errors/warnings | Clean build, Strict types |
| REQ-SITE-2 | `index.astro` renders 9 components: Nav, Hero, HeroCarousel, Intro, ServiceBlocks, Proyectos, TeamFAQ, CTAFinal, Footer — each with semantic landmarks | Full page |
| REQ-SITE-3 | Fixed nav: logo + "StackD", anchors with smooth scroll | Nav |
| REQ-SITE-4 | Hero: h1, primary CTA → `#contacto`, outline CTA → `#proyectos`, full-width carousel image with alt | Hero + CTAs |
| REQ-SITE-5 | Intro centered max-width 640px; ServiceBlocks 3-col grid, one `.block-tall`, 5 images; Proyectos 3-col mockups + getflow row (desktop/mobile) | Intro, Service blocks, Proyectos |
| REQ-SITE-6 | TeamFAQ: 2-col grid (1fr 1.4fr), team cards left, 4 FAQ items right | Layout |
| REQ-SITE-7 | CTAFinal: `mailto:info@louvrlabs.com`; Footer: email left / logo right desktop, stacked centered mobile | CTA, Footer |
| REQ-SITE-8 | Responsive: 900px breakpoint, grids stack vertically below, no horizontal overflow | Mobile |
| REQ-SITE-9 | Animations: hero fade-in + Y translate (once); scroll fade-in +8px Y on service blocks/projects (IntersectionObserver); hover lift 2px on team cards/FAQ; button -1px Y + 200ms ease bg/border; honors `prefers-reduced-motion: reduce` | Hero entrance, Scroll fades, Hover lifts, Reduced motion |
| REQ-SITE-10 | Smoke: `astro check` exits zero, `astro build` produces `dist/index.html`, headless browser load zero console errors | Verify |
| REQ-SITE-11 | Plausible analytics script with correct `data-domain` in `<head>` | Script present |

### Scenarios

#### REQ-SITE-1: Clean build
- GIVEN project installed
- THEN `npx astro build` exits zero, no errors/warnings, `dist/index.html` exists

#### REQ-SITE-1: Strict types
- GIVEN TypeScript strict mode and code using implicit `any`
- THEN `astro check` reports a type error

#### REQ-SITE-2: Full page
- GIVEN user loads site root
- THEN DOM contains all 9 section elements, each in a semantic landmark

#### REQ-SITE-3: Nav
- GIVEN desktop viewport (≥ 900px)
- THEN logo + "StackD" visible, nav links scroll smoothly to sections

#### REQ-SITE-4: Hero + CTAs
- GIVEN page loaded
- THEN h1 present, primary CTA → `#contacto`, outline CTA → `#proyectos`, carousel image with non-empty alt

#### REQ-SITE-5: Intro
- GIVEN intro in view
- THEN bold + light spans centered, max-width 640px

#### REQ-SITE-5: Service blocks
- GIVEN desktop viewport
- THEN 3 columns, one `.block-tall`, 5 images with alt

#### REQ-SITE-5: Proyectos
- GIVEN desktop viewport
- THEN 3-col mockup grid + getflow row with desktop and mobile images

#### REQ-SITE-6: Layout
- GIVEN desktop viewport
- THEN team cards left (1fr), 4 FAQ items right (1.4fr)

#### REQ-SITE-7: CTA
- GIVEN CTA button clicked
- THEN browser navigates to `mailto:info@louvrlabs.com`

#### REQ-SITE-7: Footer
- GIVEN desktop viewport, THEN email left / logo right
- GIVEN mobile viewport (< 900px), THEN both stacked centered

#### REQ-SITE-8: Mobile
- GIVEN mobile viewport
- THEN multi-column sections stack vertically, no horizontal scrollbar

#### REQ-SITE-9: Hero entrance
- GIVEN first visit
- THEN h1 + CTAs fade in with Y translate, runs once

#### REQ-SITE-9: Scroll fades
- GIVEN user scrolls and service block or project image enters viewport
- THEN element fades in +8px Y via IntersectionObserver (vanilla JS)

#### REQ-SITE-9: Hover lifts
- GIVEN user hovers team card or FAQ item
- THEN element lifts 2px with CSS transition, button shifts -1px Y + 200ms ease

#### REQ-SITE-9: Reduced motion
- GIVEN `prefers-reduced-motion: reduce`
- THEN no animations, transitions, or transforms play

#### REQ-SITE-10: Verify
- GIVEN project installed
- THEN `astro check` exits zero, `astro build` produces `dist/index.html`
- AND headless browser load shows zero console errors

#### REQ-SITE-11: Script present
- GIVEN site built
- THEN `<head>` contains Plausible `<script>` with correct `data-domain`
