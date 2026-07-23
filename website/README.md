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
performance. Run with `npx @lhci/cli autorun` after a build.

## Structure

Content lives in `src/content/docs/`, organised by the
[Diátaxis](https://diataxis.fr/) framework (Tutorials, How-To, Reference,
Explanation). Custom components are in `src/components/`, theme tokens in
`src/styles/`.
