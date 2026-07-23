# H.O.T EARTH — Brand Mark + Documentation Site Plan

Status: **draft for your approval**. Nothing is built yet. Approve or edit any
section and I will start with the brand mark, then scaffold the site.

Scope of this plan: (1) a unique, professional brand mark and icon set, and
(2) a production-grade documentation site that surfaces the real content this
repo already contains.

---

## 0. Context I inferred from the repo (so this is not generic)

- **Project:** H.O.T EARTH, an honest open-source digital twin. 25 worlds,
  Next.js 15 + react-three-fiber, MIT, live at `h-o-t-earth.vercel.app`.
- **Existing brand:** only a text wordmark ("H.O.T EARTH" with a solar dot).
  No logo, favicon, app icon, `manifest`, or OG image exists yet. Net-new work.
- **Existing design tokens** (from `app/globals.css`, reused verbatim so the
  docs match the app): abyss `#05060a`, ink `#0b0e16`, ice `#edf0f5`,
  dim `#9aa2b1`, faint `#626a7a`, solar amber `#f2a63b`, hairline
  `rgba(255,255,255,.08)`. Fonts: Space Grotesk (display), IBM Plex Mono (code).
- **Existing content to surface:** ~44 methodology files in `docs/`
  (`*_PHYSICS.md` and `*_DATA_SOURCES.md` per world), plus `ARCHITECTURE.md`,
  `DATA_SOURCES.md`, `LAUNCH.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
  `SECURITY.md`, `CITATION.cff`, and `model/output/MODEL_CARD.md`. This is the
  substance of the site. No lorem ipsum needed; the docs are the differentiator.
- **Voice to match:** precise, honest, "no fake numbers," every accuracy claim
  stated and bounded. The site's tone will inherit this.

### Decisions I need you to confirm (defaults chosen, change any)

1. **Framework:** Astro v5 + Starlight. Rationale below. (Alt: Docusaurus, only
   if you want heavy versioning now. You do not, so I recommend Starlight.)
2. **Location (decided, research-backed):** a new `website/` directory inside
   this same repo, deployed as its own Vercel project, served at a `/docs`
   subpath via a Vercel rewrite once a custom domain is attached. See the
   industry research below. Until then it runs on its own Vercel subdomain.
3. **Domain:** `SITE_URL` env var so the real domain is a one-line change; the
   `/docs` rewrite lives in the main app's `vercel.json` when ready.
4. **Logo direction (decided):** Blend A + B. Terminator Orbit is the primary
   mark (header, README, social avatar, horizontal lockup); a Split-H rounded
   square is the app icon / favicon, with the terminator motif in its crossbar
   so the two read as one system.

### Industry research (how official projects actually do this)

Repo structure splits by how tightly docs track code:

- **Same repo (monorepo-style):** Next.js (`vercel/next.js`), Supabase
  (`apps/docs` in a Turborepo), shadcn/ui (`apps/www`), Starlight itself. Used
  when docs move in lockstep with code and ship in the same PR.
- **Separate repo:** Tailwind (`tailwindlabs/tailwindcss.com`), React
  (`reactjs/react.dev`), Astro (`withastro/docs`). Used for an independent
  cadence, a different stack, translations, or a dedicated docs team.

URL structure: the most polished docs are served at a **`/docs` subpath**, not a
subdomain: Stripe, Vercel, Tailwind, and Supabase all do this, often via a Vercel
rewrite that proxies the subpath to a separately deployed docs app. Subpaths
consolidate SEO authority on one domain; subdomains are for true separation
(`docs.github.com`, `docs.astro.build`).

Fit for H.O.T EARTH: solo maintainer, docs already in-repo and coupled to
fast-moving code, edit-this-page should open a PR here. That points to the
same-repo `website/` pattern (Next.js/Supabase/shadcn) with the `/docs` subpath
rewrite (Stripe/Vercel/Tailwind) as the SEO-correct finish once a domain exists.

Sources: Supabase docs rebuild (supabase.com/blog/new-supabase-docs-built-with-nextjs),
tailwindlabs/tailwindcss.com, reactjs/react.dev, vercel/next.js docs, Vercel
rewrites docs (vercel.com/docs/rewrites), and subpath-vs-subdomain SEO guidance
(ahrefs.com/blog/subdomain-vs-subfolder).

---

## 1. Brand mark and icon set

Goal: a mark in the register of OpenAI, Anthropic, Vercel, and Supabase. Simple
geometry, one idea, legible at 16px, memorable at billboard size. It must be
ownable (not a clip-art globe) and encode what the product actually is.

The product's two signatures are the **day/night terminator you can scrub** and
**real orbital mechanics**. The mark is built from exactly those two ideas.

### Concept A — "Terminator Orbit" (recommended)

A single circular disc split by a curved terminator (the day/night boundary),
with one small dot riding an elliptical orbit around it. The orbit ellipse is
drawn as a thin arc so it reads as motion, not a ring. Solar amber for the lit
half and the orbit dot; ice/graphite for the dark half; abyss background.

- Why it works: it is literally the app (terminator + orbit), it is geometric
  and distinctive, it survives monochrome and 16px, and it extends the "solar
  dot" already in the wordmark.
- Monogram lockup: the orbit dot doubles as the period in "H.O.T", so the
  horizontal logo reads `◐ H.O.T EARTH` with the dot as a live element.

### Concept B — "Split H"

A bold `H` whose crossbar is a terminator gradient (amber to graphite), inside a
soft-cornered square (app-icon friendly). Cleaner as a pure monogram, less
descriptive of the product than A.

### Concept C — "Orbit dot wordmark only"

No glyph, just the wordmark with the animated solar dot. Safest and most
minimal, but weakest as a standalone favicon/social avatar.

### Deliverables (all hand-authored SVG, no raster tracing, no AI-gen art)

- `logo-mark.svg` (glyph only, square, monochrome + color variants)
- `logo-horizontal.svg` and `logo-horizontal-light.svg` (glyph + wordmark)
- `favicon.svg` + `favicon.ico` (multi-size) + `apple-touch-icon.png` (180)
- `icon-192.png`, `icon-512.png`, `icon-maskable.png` + `site.webmanifest`
- `og-default.png` (1200x630 template) and a dynamic OG route (see SEO)
- A one-page `BRAND.md`: clear space, min size, do/dont, hex values, the two
  approved lockups. This also lets the main app adopt the same favicon.

I will render the SVGs and show you the mark before wiring it everywhere.

---

## 2. Stack and why

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Astro v5 + Starlight** | Ships static HTML, near-zero JS by default, best Lighthouse baseline. Three-column layout, dark mode, prev/next, TOC, breadcrumbs, "Edit this page", "Last updated" from git, and i18n are all native. Less custom code, fewer bugs. |
| Styling | **Tailwind v4** + Starlight CSS custom properties | Matches the app's Tailwind v4. Override Starlight tokens with our palette so the site is our brand, not the default theme. |
| Search | **Pagefind** | Bundled with Starlight, static, free, no external service, works offline. Algolia DocSearch left as a documented swap if you later want it. |
| Code blocks | **Expressive Code** (Shiki) | Native to Starlight. Copy button, terminal frames, titles, line highlights, and diff markers out of the box. Package-manager and language tabs via `<Tabs syncKey>`. |
| Analytics | **GA4 + Vercel Analytics**, behind env flags | No tracking script ships unless `PUBLIC_GA_ID` is set. Honest by default. |
| SEO | `@astrojs/sitemap`, custom `robots.txt`, dynamic OG images (Satori), JSON-LD | Covered in section 6. |
| Deploy | **Vercel** static output + edge cache headers | `vercel.json` with long-lived immutable asset caching and HTML revalidation. |
| Quality gate | **Lighthouse CI** + `astro check` + `pagefind` build check | So the "100 for A11y/SEO" claim is measured, not asserted. |

Honest note on the Lighthouse target: A11y and SEO at 100 are realistic and I
will verify them. Performance at exactly 100 depends on images and fonts; I will
target 95+ and report the real number rather than promise a round figure.

---

## 3. Design system

- **Dark-first**, matching the app. Light theme is a proper second theme (not an
  afterthought), toggled via Starlight's built-in switch, preference persisted.
- **Palette:** the app tokens above, mapped onto Starlight's `--sl-color-*`
  scale. Solar amber is the single accent (links, active nav, focus rings).
- **Typography:** Space Grotesk for headings, Inter for body (more readable at
  long-form than Space Grotesk), IBM Plex Mono for code. Self-hosted via
  Fontsource so no third-party font request (privacy + speed).
- **Surfaces:** abyss page, ink cards, hairline borders (the app's exact
  `rgba(255,255,255,.08)`), high-contrast code blocks.
- **Micro-interactions:** sidebar link hover slide + active marker, copy-button
  success state, section fade-in on scroll (respecting
  `prefers-reduced-motion`), smooth view transitions between pages via Astro's
  native `<ClientRouter>`.

---

## 4. Information architecture (Diátaxis, mapped to real content)

The four quadrants are populated from content that already exists, curated and
rewritten for the site (not copy-pasted raw):

- **Tutorials (learning):**
  - "Run H.O.T EARTH locally in 30 seconds" (clone, install, dev, no keys)
  - "Build your first world" (add a tab end-to-end, from `lib/worlds.ts` to a
    scene) — teaches the real registry pattern
- **How-To Guides (problem-oriented recipes):**
  - "Deploy to Vercel" (from `docs/LAUNCH.md`)
  - "Add a new data layer honestly" (licensing + attribution workflow)
  - "Wire an in-browser dataset" (the keyless pattern)
  - "Add the companion to a page" (the Sprocket companion)
- **Reference (information-oriented):**
  - "Worlds registry API" (`lib/worlds.ts`: types, helpers, invariants)
  - "Data sources index" (generated from the `*_DATA_SOURCES.md` set, one page
    per group, with license + attribution tables)
  - "Physics methods" (from the `*_PHYSICS.md` set, with the accuracy bounds)
  - "HTTP: the GIBS proxy route" (the one API route, request/response, status
    codes, cache behavior) — this is the requested "API reference" page, but
    real for this project rather than a fake CRUD endpoint
- **Explanation (understanding):**
  - "The honesty mandate" (why real-data-only, what "illustrative" means)
  - "Architecture" (from `docs/ARCHITECTURE.md`)
  - "The compute decision" (browser vs Vercel vs GitHub Actions)
  - "Model card" (from the existing model card)

### Sidebar tree (collapsible groups, persisted state)

```
Home (splash)
├─ Start Here
│  ├─ Introduction
│  ├─ Quickstart (30-second local run)
│  └─ Project structure
├─ Tutorials
│  ├─ Your first world
│  └─ Reading real data
├─ How-To Guides
│  ├─ Deploy to Vercel
│  ├─ Add a data layer (honestly)
│  └─ Add the companion
├─ Reference
│  ├─ Worlds registry API
│  ├─ Data sources (by group)
│  ├─ Physics methods (by world)
│  └─ HTTP: GIBS proxy route
├─ Explanation
│  ├─ The honesty mandate
│  ├─ Architecture
│  ├─ Compute decision
│  └─ Model card
├─ Contributing
└─ Blog
   └─ Launching the H.O.T EARTH docs
```

---

## 5. Feature implementation checklist (your list, mapped)

Native to Starlight (configured, not custom-built): collapsible sidebar with
persisted state, prev/next pagination, breadcrumbs, three-column sticky layout,
mobile hamburger, dark/light toggle, "Edit this page", "Last updated" from git,
Shiki highlighting, copy button, terminal frames, sitemap.

Custom components I will build:

1. **Navigation:** package-manager tabs (`npm`/`yarn`/`pnpm`) and language tabs
   (JS/Python/cURL) using synced `<Tabs>`. Versioning: a documented placeholder
   using a `version` frontmatter + a ready-to-enable `starlight-versions`
   config, deferred until you cut v1.0 (the app is 0.1.0, so real versions now
   would be dishonest). Left as a clearly marked stub.
2. **Interactive code:** copy-to-clipboard with a toast (`CodeToast.astro`),
   terminal-window styling for shell examples (Expressive Code `frame="terminal"`).
3. **Trust and community:** `Feedback.astro` ("Was this helpful? Yes / No", No
   opens a prefilled GitHub issue), `CommunityCTA.astro` (GitHub Discussions +
   Stars), "Edit this page" and "Last updated" enabled globally.
4. **SEO and metadata:** `@astrojs/sitemap`, hand-written `robots.txt`, a dynamic
   OG image route (`/og/[...slug].png` via Satori using the brand template),
   JSON-LD `SoftwareApplication` on Home and `TechArticle` on doc pages, canonical
   URLs, and full Open Graph + Twitter card tags. Verified with Lighthouse CI.

---

## 6. File structure and component hierarchy

```
website/
├─ astro.config.mjs            # Starlight, sitemap, Tailwind, site URL, GA slot
├─ vercel.json                 # edge cache headers
├─ tailwind.config.* / src/tailwind.css
├─ lighthouserc.json           # quality gate
├─ public/
│  ├─ brand/ (logo + icon set)  robots.txt  site.webmanifest  og-default.png
├─ src/
│  ├─ content/docs/            # the IA above, as .md / .mdx
│  │  ├─ index.mdx             # Home splash (hero, feature grid, code demo)
│  │  ├─ start-here/… tutorials/… guides/… reference/… explanation/…
│  ├─ content/blog/            # launch post
│  ├─ components/
│  │  ├─ Logo.astro  Hero.astro  FeatureGrid.astro  TrustedBy.astro
│  │  ├─ CodeDemo.astro  Feedback.astro  CommunityCTA.astro  CodeToast.astro
│  ├─ styles/brand.css         # maps app tokens onto Starlight CSS vars
│  └─ pages/og/[...slug].png.ts # dynamic OG image endpoint
└─ package.json
```

Starlight component overrides (its documented extension point): `Header`,
`Footer`, `PageSidebar` (to inject Feedback + CommunityCTA), and `Hero`.

---

## 7. Content scaffolding (real, high-quality)

Every placeholder page ships with genuine content drawn from the repo:

- **Home:** hero with "Get Started" and "GitHub" CTAs, a 4-6 card feature grid
  (real physics, keyless, 25 worlds, MIT, in-browser LLM companion), a "Built
  with" strip (Next.js, three.js, NASA GIBS, Open-Meteo, NOAA GFS logos with
  correct attribution rather than a fake "trusted by" of company logos we are not
  endorsed by), and a live code preview of the worlds registry.
- **Quickstart:** the real 30-second local run, environment notes, first result.
- **Guides:** real Deploy-to-Vercel guide; the "Authentication guide" is
  reframed honestly as "Keyless by design: why there are no API keys and how the
  one proxy route works," because inventing an auth system this app does not have
  would violate the project's honesty rule. If you want a literal auth guide, say
  so and I will write it as clearly hypothetical.
- **API Reference:** the GIBS proxy route with method, params, response, status
  codes, and cache headers (a real endpoint), plus the worlds registry reference.
- **Contributing:** from `CONTRIBUTING.md`, with PR flow, code style, and how to
  run `vitest` and the build.
- **Blog:** a launch post announcing the docs, written in the project voice.

On the "Trusted By logo strip": I will not fabricate customer or company
endorsements. I will use a truthful "Data and tech" strip instead. Tell me if you
have real adopters to feature.

---

## 8. Build phases

1. **Brand mark:** author the SVGs (Concept A), export the icon set, write
   `BRAND.md`, show you the mark.
2. **Scaffold:** init Astro + Starlight in `website/`, add Tailwind, apply the
   brand tokens, wire config (site URL, GA slot, social links, edit-link base).
3. **Layout and components:** Hero, feature grid, code demo, Feedback,
   CommunityCTA, code toast, OG endpoint, header/footer overrides.
4. **Content:** author all pages in section 7 from the real repo content.
5. **SEO and deploy config:** sitemap, robots, JSON-LD, `vercel.json` cache
   headers, Lighthouse CI.
6. **Verify:** `astro build`, Pagefind index, Lighthouse CI run, and I report the
   real scores. Then local-run and deploy instructions.

## 9. Verification and deployment

- Local: `cd website && npm install && npm run dev` (I will confirm it builds;
  note that `next dev` is broken on this OneDrive path, but Astro is a separate
  toolchain and I will verify it independently with a production build + preview).
- Production: Vercel project with root `website/`, framework preset Astro,
  build `astro build`, output `dist/`. Cache headers via `vercel.json`.
- Quality: Lighthouse CI thresholds committed; A11y and SEO gated at 100,
  performance reported honestly.

---

## 10. What I will not do without your say-so

- Invent adopter/customer logos or testimonials.
- Ship analytics that tracks visitors by default (off unless you set the env id).
- Claim a fake "100/100 performance" number; I report measured results.
- Add real doc versioning while the app is pre-1.0 (stub only).

Approve as-is, or tell me which of the four decisions in section 0 to change and
whether you want Concept A, B, or C for the logo. On approval I will start with
the brand mark and show it to you before building the rest.
