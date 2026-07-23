// Generate PNG app icons and the default OG image from the source SVGs.
// SVG is the source of truth (brand/); this rasterizes for browsers/social.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const iconsDir = join(pub, "icons");
await mkdir(iconsDir, { recursive: true });

const appIcon = join(pub, "brand", "icon-app.svg");
const density = 384; // render SVGs crisply before downscaling

// Standard PNG icons from the Split-H app icon.
const sizes = [
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];
for (const { file, size } of sizes) {
  await sharp(appIcon, { density })
    .resize(size, size)
    .png()
    .toFile(join(iconsDir, file));
}

// Maskable: the icon on a full-bleed ink square (safe-zone padded) so launchers
// can crop to any shape without clipping the glyph.
const inner = Math.round(512 * 0.78);
const glyph = await sharp(appIcon, { density }).resize(inner, inner).png().toBuffer();
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: "#0b0e16",
  },
})
  .composite([{ input: glyph, gravity: "center" }])
  .png()
  .toFile(join(iconsDir, "icon-maskable.png"));

// Default OG image (1200x630): abyss background, the mark, wordmark, tagline.
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#05060a"/>
  <rect x="1" y="1" width="1198" height="628" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
  <g transform="translate(96 210) scale(2.6)">
    <clipPath id="d"><circle cx="32" cy="32" r="19"/></clipPath>
    <g clip-path="url(#d)"><rect x="13" y="13" width="38" height="38" fill="#f2a63b"/><ellipse cx="43" cy="32" rx="13" ry="22" fill="#0b0e16"/></g>
    <circle cx="32" cy="32" r="19" fill="none" stroke="#ffffff" stroke-opacity="0.14"/>
    <g transform="rotate(-24 32 32)"><ellipse cx="32" cy="32" rx="28" ry="10" fill="none" stroke="#f2a63b" stroke-opacity="0.5" stroke-width="1.4"/><circle cx="60" cy="32" r="5" fill="#f2a63b" opacity="0.18"/><circle cx="60" cy="32" r="2.6" fill="#f2a63b"/></g>
  </g>
  <text x="300" y="286" font-family="'Space Grotesk','Segoe UI',sans-serif" font-size="76" font-weight="700" letter-spacing="2" fill="#edf0f5">H<tspan fill="#f2a63b">.</tspan>O<tspan fill="#f2a63b">.</tspan>T EARTH</text>
  <text x="302" y="352" font-family="'IBM Plex Sans','Segoe UI',sans-serif" font-size="34" fill="#9aa2b1">Real physics, real data, no fake numbers.</text>
  <text x="96" y="560" font-family="'IBM Plex Mono',monospace" font-size="24" fill="#626a7a">A living digital twin of Earth and the cosmos - MIT - keyless</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile(join(pub, "og-default.png"));

console.log("Generated icons + og-default.png in public/");
