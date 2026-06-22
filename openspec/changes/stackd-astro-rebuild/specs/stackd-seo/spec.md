# stackd-seo Specification

## Purpose

Full SEO infrastructure: structured metadata, search-engine directives, semantic HTML, image optimization, AI-crawler discovery. Lighthouse SEO ≥ 95.

## Requirements

| ID | Requirement |
|----|-------------|
| REQ-SEO-1 | Meta tags: `<title>`, `<meta name="description">`, charset, viewport in `<head>` |
| REQ-SEO-2 | OpenGraph: `og:title`, `og:description`, `og:image`, `og:type`, `og:url` all non-empty |
| REQ-SEO-3 | Twitter Card: `twitter:card=summary_large_image`, title, description, image |
| REQ-SEO-4 | JSON-LD Organization: name, url, logo, contactPoint (email), sameAs |
| REQ-SEO-5 | JSON-LD WebSite: name, url, potentialAction (SearchAction with URL template) |
| REQ-SEO-6 | sitemap.xml: all routes listed with `<loc>` and `<lastmod>` |
| REQ-SEO-7 | robots.txt: `User-agent: *`, `Allow: /`, `Sitemap:` pointer |
| REQ-SEO-8 | llms.txt at `/llms.txt`: project structure with key URLs and descriptions |
| REQ-SEO-9 | Semantic HTML: single `<h1>`, no heading skips, `<header>/<nav>/<main>/<footer>` each once |
| REQ-SEO-10 | Image optimization: alt on all images, Astro Image srcset with AVIF/WebP, explicit width/height |
| REQ-SEO-11 | Lighthouse SEO audit score ≥ 95 |

### REQ-SEO-1: Meta Tags

Every page MUST emit `<title>`, `<meta name="description">`, charset, and viewport.

#### Scenario: Head inspection
- GIVEN site built
- THEN `<head>` contains non-empty title, description, charset, viewport

### REQ-SEO-2: OpenGraph Tags

Every page MUST emit five OpenGraph `<meta property="og:*">` tags.

#### Scenario: Social crawler
- GIVEN site deployed
- THEN `og:title`, `og:description`, `og:image`, `og:type`, `og:url` all present and non-empty

### REQ-SEO-3: Twitter Card

Every page MUST emit `twitter:card=summary_large_image` plus title, description, image.

#### Scenario: Twitter share
- GIVEN page URL shared on Twitter
- THEN card is `summary_large_image`, title/description/image tags non-empty

### REQ-SEO-4: JSON-LD Organization

Every page MUST include `Organization` node with name, url, logo, contactPoint, sameAs.

#### Scenario: Rich Results validation
- GIVEN page rendered
- WHEN validated via Google Rich Results Test
- THEN `Organization` passes zero errors, all five properties present

### REQ-SEO-5: JSON-LD WebSite

Every page MUST include `WebSite` node with name, url, potentialAction (SearchAction).

#### Scenario: WebSite validation
- GIVEN page rendered
- WHEN validated via Google Rich Results Test
- THEN `WebSite` passes zero errors, `potentialAction` defines SearchAction with URL template

### REQ-SEO-6: Sitemap

`sitemap.xml` MUST list every route with `<loc>` and `<lastmod>`.

#### Scenario: Sitemap fetch
- GIVEN site deployed
- WHEN `GET /sitemap.xml`
- THEN valid XML `<urlset>`, every route has `<loc>` + `<lastmod>`

### REQ-SEO-7: Robots.txt

`robots.txt` MUST allow all crawlers and reference the sitemap.

#### Scenario: Robots fetch
- GIVEN site deployed
- WHEN `GET /robots.txt`
- THEN contains `User-agent: *`, `Allow: /`, and `Sitemap:` with full URL

### REQ-SEO-8: llms.txt

`/llms.txt` MUST describe project structure for AI crawlers.

#### Scenario: LLMs fetch
- GIVEN site deployed
- WHEN `GET /llms.txt`
- THEN returns plain text listing key sections with descriptions and URLs

### REQ-SEO-9: Semantic HTML

Page MUST use landmarks exactly once and maintain heading hierarchy.

#### Scenario: Audit
- GIVEN page built
- THEN one `<h1>`, no heading skips (h1→h3 without h2)
- AND `<header>`, `<nav>`, `<main>`, `<footer>` each appear exactly once

### REQ-SEO-10: Image Optimization

All images MUST have alt, Astro Image srcset with AVIF/WebP, and explicit dimensions.

#### Scenario: Build output
- GIVEN site built
- THEN every `<img>` has non-empty alt, width, height
- AND Astro Images include `srcset` with AVIF and WebP variants

### REQ-SEO-11: Lighthouse SEO ≥ 95

Deployed site MUST score ≥ 95 on Lighthouse SEO audit.

#### Scenario: Lighthouse run
- GIVEN site deployed and reachable
- WHEN Lighthouse SEO audit runs (mobile, simulated)
- THEN score ≥ 95
