# Media assets

`hero.png` is a **real screenshot of the live app** (the globe with today's NASA imagery across the day/night terminator, city lights on the night side, and the data-layer panel).

## Re-capture the hero image

The WebGL globe **can** be captured headlessly, with a software GL backend and enough wait time for the imagery to load. From a scratch directory with `puppeteer` installed:

```js
const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
await page.goto("https://h-o-t-earth.vercel.app", { waitUntil: "load" });
await page.waitForSelector("canvas");
await new Promise((r) => setTimeout(r, 26000)); // let the globe + GIBS tiles render
await page.screenshot({ path: "docs/media/hero.png" });
```

Then downscale to ~2000 px wide so the file stays well under 1 MB (`sharp(p).resize(2000)`).

Prefer a visible browser instead? `npm run dev`, frame a good angle with the **Live satellite** layer, and use `Win+Shift+S`.

## Recommended additional assets

- `hero.gif` — a 10–15 s screen capture (ScreenToGif on Windows): rotate the globe, switch a layer, scrub the time control so the terminator sweeps, click a city to open the forecast, then open the Living Earth tab. Compress with `gifsicle -O3 --lossy=80` to keep it under ~10 MB, and swap it into the README hero slot for maximum conversion.
- `living-earth.png` — the Living Earth tab with cities glowing on the night side.
- `forecast.png` — the click-anywhere forecast panel open.
- Set `hero.png` as the repo **social preview** (Settings → General → Social preview) so shared links render the image.

Keep all assets on-brand: dark background (#05060a), the single solar-amber accent, no NASA logo (imagery is fine, the insignia is not — see [../DATA_SOURCES.md](../DATA_SOURCES.md)).
