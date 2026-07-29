# H.O.T EARTH docs

The documentation site for [H.O.T EARTH](https://github.com/Hotragn/H.O.T-EARTH),
built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).
Dark-first, static, keyless, with Pagefind search.

## Local development

```sh
cd website
npm install
npm run dev        # http://localhost:4321
```

## Build and preview

```sh
npm run build      # static output to ./dist, builds the Pagefind index + sitemap
npm run preview    # serve ./dist locally
```

## Brand assets

The logo and icons are hand-authored SVGs in `../brand/` (the source of truth).
PNG app icons and the default OG image are generated from them:

```sh
npm run icons      # writes public/icons/* and public/og-default.png (gitignored)
```

Run `npm run icons` before a build if you change the brand SVGs.

## Configuration

Set via environment variables (all optional):

| Variable | Purpose | Default |
| --- | --- | --- |
| `SITE_URL` | Canonical site URL (sitemap, OG, JSON-LD) | the Vercel URL |
| `PUBLIC_GA_ID` | Google Analytics 4 id. No analytics ship unless set. | unset (off) |

## Deploy (Vercel)

Deploy as its own project:

- **Root directory:** `website`
- **Framework preset:** Astro
- **Build command:** `astro build`, **Output:** `dist`

Add a build step to regenerate icons if you want them fresh on each deploy:
`npm run icons && astro build`.

Once a custom domain is attached, serve these docs at `/docs` with a rewrite in
the main app, so the docs share the primary domain for SEO. See
`docs/deploy-to-vercel`.

## Quality

`lighthouserc.json` gates Accessibility and SEO at 100 and warns below 0.9 on
performance. After a build:

```sh
npm run lighthouse
```

Measured on the production build (desktop, 2026-07-29):

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| Home (splash) | 100 | 100 | 100 | 100 |
| Doc page (Introduction) | 100 | 100 | 100 | 100 |
| Reference (GIBS proxy) | 100 | 100 | 100 | 100 |

Two honest notes:

- Performance varies run to run on a local machine (one outlier run scored the
  home page 78 before three consecutive 100s). Treat a single local run as
  indicative, not definitive.
- One axe rule, `label-content-name-mismatch`, still flags Starlight's own search
  button: its visible "Search" label is `aria-hidden` upstream, so axe compares
  the accessible name against the "Ctrl K" shortcut hint. The rule carries zero
  weight in the Accessibility score and the button's accessible name is correct.
- On Windows, `lhci autorun` can crash during Chrome cleanup (an `EPERM` in
  `chrome-launcher` removing its temp profile) *after* the audit has finished.
  The scores are still produced; re-run or audit against a manually launched
  Chrome if that bites.

## Structure

Content lives in `src/content/docs/`, organised by the
[Diátaxis](https://diataxis.fr/) framework (Tutorials, How-To, Reference,
Explanation). Custom components are in `src/components/`, theme tokens in
`src/styles/`.
