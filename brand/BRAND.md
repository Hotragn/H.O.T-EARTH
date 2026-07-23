# H.O.T EARTH brand

The mark encodes what the product is: a day/night **terminator** you can scrub,
and real **orbital** mechanics. One idea, geometric, legible at 16px.

## The system (Blend A + B)

- **Primary mark:** `logo-mark.svg` (Terminator Orbit). Use in the site header,
  README, social avatar, and anywhere a single glyph appears.
- **Horizontal lockup:** `logo-horizontal.svg` (mark + wordmark). Use in wide
  headers and footers. The periods in "H.O.T" are amber to tie to the mark.
- **App icon / favicon:** `icon-app.svg` and `favicon.svg` (Split-H rounded
  square). The crossbar is the terminator (amber day, graphite night), so the
  monogram carries the same idea as the primary mark.

## Colors (locked to `app/globals.css`)

| Token | Hex | Use |
|---|---|---|
| abyss | `#05060a` | background |
| ink | `#0b0e16` | icon surface, cards |
| ice | `#edf0f5` | monogram strokes, wordmark |
| graphite | `#39415a` | terminator night half |
| solar | `#f2a63b` | terminator day, orbit, accent |
| hairline | `#ffffff` @ 8-14% | disc edge, icon border |

## Rules

- Clear space: at least the disc radius on all sides of the mark.
- Minimum size: mark 16px; horizontal lockup 120px wide.
- Do not recolor the solar accent, add gradients, add drop shadows, or rotate
  the mark. The orbit tilt is fixed at -24 degrees.
- On light backgrounds, use the same mark; the disc edge switches to a darker
  hairline (a `-light` variant is generated during the site build).

## Asset generation

SVG is the source of truth. During the site build, PNG icons (`apple-touch-icon`
180, `icon-192`, `icon-512`, `icon-maskable`) and `og-default.png` (1200x630) are
generated from these SVGs with `sharp`, and `site.webmanifest` references them.
