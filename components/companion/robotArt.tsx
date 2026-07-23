/**
 * Sprocket, the companion mascot. A small, friendly SVG robot drawn with the
 * app's accent tokens. Purely decorative (aria-hidden); the animations are CSS
 * (see globals.css) and honour prefers-reduced-motion there.
 *
 * `mood` nudges the eyes: "idle" blinks, "think" squints while the model works,
 * "talk" widens while a reply streams in.
 */
export function RobotFace({
  size = 34,
  mood = "idle",
}: {
  size?: number;
  mood?: "idle" | "think" | "talk";
}) {
  const eyeH = mood === "think" ? 2 : mood === "talk" ? 7 : 5;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      className="companion-robot"
    >
      {/* antenna */}
      <line x1="20" y1="3" x2="20" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="3" r="2.4" className="companion-antenna" fill="currentColor" />
      {/* head */}
      <rect x="7" y="9" width="26" height="22" rx="7" fill="rgba(255,255,255,0.06)" stroke="currentColor" strokeWidth="1.6" />
      {/* ears */}
      <rect x="4.5" y="16" width="2.5" height="8" rx="1.25" fill="currentColor" />
      <rect x="33" y="16" width="2.5" height="8" rx="1.25" fill="currentColor" />
      {/* eyes */}
      <rect className="companion-eye" x="13" y={20 - eyeH / 2} width="4.5" height={eyeH} rx="2.25" fill="currentColor" />
      <rect className="companion-eye" x="22.5" y={20 - eyeH / 2} width="4.5" height={eyeH} rx="2.25" fill="currentColor" />
      {/* smile */}
      <path d="M15 26 q5 3 10 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
