# Media assets

`hero.png` is currently a **branded placeholder title card**, not a real screenshot. The live WebGL globe can't be captured by a headless/automated tool (react-three-fiber doesn't preserve the drawing buffer, and the render loop pauses in occluded tabs), so the real hero shot has to be grabbed from a visible browser once.

## Capture the real hero image (2 minutes)

1. `npm run dev`, open http://localhost:3000 in a **visible, focused** browser window.
2. Rotate to frame a good angle (e.g. day/night terminator across a recognizable continent), pick the **Live satellite** layer, and enable **Wind**.
3. Resize the window to roughly 1280×640 (or capture and crop to that 2:1 ratio for GitHub's social preview).
4. Screenshot (Win: `Win+Shift+S`) → save as `docs/media/hero.png`, overwriting the placeholder.

## Recommended additional assets

- `hero.gif` — a 10–15 s screen capture (ScreenToGif on Windows): rotate the globe, switch a layer, scrub the time control so the terminator sweeps, click a city to open the forecast, then open the Living Earth tab. Compress with `gifsicle -O3 --lossy=80` to keep it under ~10 MB, and swap it into the README hero slot for maximum conversion.
- `living-earth.png` — the Living Earth tab with cities glowing on the night side.
- `forecast.png` — the click-anywhere forecast panel open.
- Set `hero.png` as the repo **social preview** (Settings → General → Social preview) so shared links render the image.

Keep all assets on-brand: dark background (#05060a), the single solar-amber accent, no NASA logo (imagery is fine, the insignia is not — see [../DATA_SOURCES.md](../DATA_SOURCES.md)).
