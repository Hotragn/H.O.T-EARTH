// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Real domain is a one-line change via SITE_URL. Until a custom domain is
// attached, the docs run on their own Vercel URL; then a /docs rewrite in the
// main app makes this a subpath (the Stripe/Vercel/Tailwind pattern).
const SITE = process.env.SITE_URL || "https://hot-earth-docs.vercel.app";
const REPO = "https://github.com/Hotragn/H.O.T-EARTH";
// Analytics ship only when this is set. Off by default, honestly.
const GA_ID = process.env.PUBLIC_GA_ID || "";

export default defineConfig({
  site: SITE,
  vite: { plugins: [tailwindcss()] },
  integrations: [
    starlight({
      title: "H.O.T EARTH",
      description:
        "A living digital twin of Earth and the cosmos. Real physics, real data, no fake numbers. Docs for the 25 worlds, their methods, and their sources.",
      logo: {
        light: "./src/assets/logo-mark-light.svg",
        dark: "./src/assets/logo-mark.svg",
        alt: "H.O.T EARTH",
        replacesTitle: false,
      },
      favicon: "/favicon.svg",
      lastUpdated: true,
      pagination: true,
      credits: false,
      social: [
        { icon: "github", label: "GitHub", href: REPO },
      ],
      editLink: { baseUrl: `${REPO}/edit/main/website/` },
      customCss: ["./src/styles/tailwind.css", "./src/styles/brand.css"],
      expressiveCode: {
        themes: ["github-dark-default", "github-light-default"],
        styleOverrides: { borderRadius: "0.5rem" },
      },
      components: {
        Footer: "./src/components/overrides/Footer.astro",
        Head: "./src/components/overrides/Head.astro",
        PageTitle: "./src/components/overrides/PageTitle.astro",
      },
      head: [
        ...(GA_ID
          ? [
              {
                tag: "script",
                attrs: {
                  src: `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`,
                  async: true,
                },
              },
              {
                tag: "script",
                content: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
              },
            ]
          : []),
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Introduction", slug: "start-here/introduction" },
            { label: "Quickstart", slug: "start-here/quickstart" },
            { label: "Project structure", slug: "start-here/project-structure" },
          ],
        },
        {
          label: "Tutorials",
          collapsed: false,
          items: [
            { label: "Build your first world", slug: "tutorials/first-world" },
            { label: "Read real data in the browser", slug: "tutorials/reading-real-data" },
          ],
        },
        {
          label: "How-To Guides",
          collapsed: false,
          items: [
            { label: "Deploy to Vercel", slug: "guides/deploy-to-vercel" },
            { label: "Add a data layer honestly", slug: "guides/add-a-data-layer" },
            { label: "Add the companion to a page", slug: "guides/add-the-companion" },
          ],
        },
        {
          label: "Reference",
          collapsed: false,
          items: [
            { label: "Worlds registry API", slug: "reference/worlds-registry" },
            { label: "Data sources", slug: "reference/data-sources" },
            { label: "Physics methods", slug: "reference/physics-methods" },
            { label: "HTTP: GIBS proxy route", slug: "reference/gibs-proxy" },
          ],
        },
        {
          label: "Explanation",
          collapsed: false,
          items: [
            { label: "The honesty mandate", slug: "explanation/honesty-mandate" },
            { label: "Architecture", slug: "explanation/architecture" },
            { label: "The compute decision", slug: "explanation/compute-decision" },
          ],
        },
        {
          label: "Community",
          items: [
            { label: "Contributing", slug: "community/contributing" },
            { label: "Blog", link: "/blog/launching-the-docs/" },
          ],
        },
      ],
    }),
    sitemap(),
  ],
});
