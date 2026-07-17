/**
 * Route transition wrapper. A Next.js App Router `template` re-mounts on every
 * navigation, so wrapping children in `.route-fade` gives a subtle, fast
 * cross-route opacity fade. Opacity-only (GPU-cheap, no layout shift) and
 * neutralized under prefers-reduced-motion via globals.css.
 *
 * `position: fixed` scene canvases still anchor to the viewport because opacity
 * does not create a containing block for fixed descendants.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-fade">{children}</div>;
}
