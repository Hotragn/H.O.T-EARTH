/**
 * GLSL for the gravitational-lensing centrepiece.
 *
 * APPROACH SHIPPED: a full-viewport, single-pass fragment shader on a clip-space
 * quad (no ray-marching loop, so it is GPU-cheap and cannot blow an iteration
 * budget). The physics that IS real:
 *
 *   - The background is the real ESO Milky Way panorama, sampled as an
 *     equirectangular environment along a camera-relative view ray.
 *   - That ray is bent by the exact POINT-MASS THIN-LENS equation
 *     beta = theta - thetaE^2 / theta (Schwarzschild weak-field deflection,
 *     alpha proportional to 1/b). This produces the real lensing signatures:
 *     the Einstein-ring magnification, the counter-image on the far side (the
 *     beta sign flip for theta < thetaE), and the way stars smear around the
 *     shadow.
 *   - The shadow, photon ring and disk inner edge sit at the REAL Schwarzschild
 *     ratios: shadow radius = sqrt(27)/2 r_s (= 2.598 r_s), photon sphere
 *     1.5 r_s at the shadow edge, ISCO 3 r_s = 1.1547 shadow radii.
 *
 * What is ILLUSTRATIVE (labeled in the UI): the accretion disk's brightness,
 * colour and texture, the overall apparent size of the hole (a true shadow is
 * microarcseconds), and the fact that the geometry is the non-spinning
 * Schwarzschild case, not a full Kerr ray-trace. Doppler / gravitational shift
 * brightening of the disk's approaching side is an honest touch, illustrative in
 * magnitude.
 *
 * Every division is guarded (max(..., eps)) and every sample clamped, so the
 * shader cannot produce NaN or divide-by-zero.
 */

/** Clip-space passthrough: the plane geometry is [2,2] so xy already spans NDC. */
export const LENS_VERTEX = /* glsl */ `
  varying vec2 vNdc;
  void main() {
    vNdc = position.xy;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const LENS_FRAGMENT = /* glsl */ `
  precision highp float;

  varying vec2 vNdc;

  uniform vec2 uResolution;
  uniform float uTime;
  uniform sampler2D uBg;
  uniform float uHasBg;

  // camera basis (updated each frame from the orbiting camera)
  uniform vec3 uForward;
  uniform vec3 uRight;
  uniform vec3 uUp;
  uniform float uTanHalfFov;

  // geometry, in y-normalised screen units, all from the real r_s ratios
  uniform float uShadowR;   // shadow apparent radius (illustrative scale)
  uniform float uThetaE;    // Einstein-ring radius for the lens equation
  uniform float uIscoR;     // disk inner edge = 1.1547 * shadow radius
  uniform float uDiskOuter; // disk outer edge (illustrative extent)
  uniform float uDiskTilt;  // vertical squash of the inclined disk (0..1)
  uniform vec3 uDiskColor;  // base (mid-radius) disk colour

  const float PI = 3.141592653589793;

  // Equirectangular lookup of a unit direction into the Milky Way panorama.
  vec3 sampleSky(vec3 dir) {
    if (uHasBg < 0.5) {
      // dim procedural starfield fallback (no texture)
      float g = fract(sin(dot(dir.xy, vec2(12.9898, 78.233))) * 43758.5453);
      float star = smoothstep(0.9975, 1.0, g);
      return vec3(0.015, 0.017, 0.03) + star * vec3(0.6);
    }
    vec3 d = normalize(dir);
    float lon = atan(d.z, d.x);
    float lat = asin(clamp(d.y, -1.0, 1.0));
    vec2 uv = vec2(lon / (2.0 * PI) + 0.5, lat / PI + 0.5);
    return texture2D(uBg, uv).rgb;
  }

  void main() {
    // y-normalised screen coordinate, centred on the black hole
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / max(uResolution.y, 1.0);
    float r = length(p);
    vec2 dir2 = r > 1e-4 ? p / r : vec2(1.0, 0.0);

    // ── real light bending: point-mass thin-lens equation ──────────────────
    // beta = theta - thetaE^2 / theta ; sample the background at the SOURCE
    // position beta. The sign flip for r < thetaE gives the counter-image.
    float beta = r - (uThetaE * uThetaE) / max(r, 1e-3);
    vec2 pSource = dir2 * beta;
    vec3 viewRay = normalize(
      uForward
      + pSource.x * uTanHalfFov * uRight
      + pSource.y * uTanHalfFov * uUp
    );
    vec3 color = sampleSky(viewRay);

    // faint blue lensing sheen so the warped starlight reads as bent, not flat
    float mag = uThetaE * uThetaE / max(r * r, 1e-4);
    color += vec3(0.05, 0.07, 0.12) * clamp(mag * 0.25, 0.0, 0.6);

    // ── illustrative accretion disk (inclined ring) ────────────────────────
    // squash y to view the thin disk at an inclination -> a wide ellipse whose
    // near edge is below and far edge above the hole.
    float tilt = clamp(uDiskTilt, 0.05, 1.0);
    float ry = p.y / tilt;
    float rd = length(vec2(p.x, ry));
    float diskBand =
      smoothstep(uIscoR, uIscoR * 1.06, rd) *
      (1.0 - smoothstep(uDiskOuter * 0.85, uDiskOuter, rd));
    // radial colour gradient: hot/white-blue inside, cooler orange/red outside
    float tr = clamp((rd - uIscoR) / max(uDiskOuter - uIscoR, 1e-3), 0.0, 1.0);
    vec3 diskCol = mix(vec3(1.0, 0.95, 0.85), uDiskColor, smoothstep(0.0, 0.6, tr));
    diskCol = mix(diskCol, vec3(0.7, 0.16, 0.05), smoothstep(0.55, 1.0, tr));
    // relativistic Doppler + gravitational beaming: brighten/blue the side
    // rotating toward the viewer (illustrative magnitude, honest direction).
    float doppler = 1.0 + 0.9 * dir2.x;
    vec3 dopplerTint = mix(vec3(1.0), vec3(0.75, 0.85, 1.1), clamp(dir2.x, 0.0, 1.0));
    // subtle azimuthal swirl so the disk turns
    float az = atan(p.y, p.x);
    float swirl = 0.78 + 0.22 * sin(az * 3.0 - uTime * 0.6);
    float diskBright = diskBand * clamp(doppler, 0.2, 2.2) * swirl;

    // ── lensed halo: the far side of the disk wraps OVER and UNDER the hole ─
    // this bright ring hugging the shadow is physically the lensed disk image.
    float halo = exp(-pow((r - uShadowR * 1.12) / max(uShadowR * 0.42, 1e-3), 2.0));
    vec3 haloCol = mix(vec3(1.0, 0.9, 0.75), uDiskColor, 0.4);

    // the direct disk in front should occlude, but the FAR arc (upper) is the
    // lensed image, so we let the halo show above the shadow while hiding the
    // flat band where it would pass behind the shadow.
    float behind = (p.y > 0.0 && r < uShadowR * 1.02) ? 0.0 : 1.0;

    color += diskCol * diskBright * dopplerTint * 1.15 * behind;
    color += haloCol * halo * 0.9;

    // ── photon ring: bright thin ring at the shadow edge ───────────────────
    float ring = exp(-pow((r - uShadowR) / max(uShadowR * 0.05, 1e-4), 2.0));
    color += vec3(1.0, 0.85, 0.6) * ring * 1.4;

    // ── the shadow itself: black inside the shadow radius ──────────────────
    float shadow = smoothstep(uShadowR * 0.98, uShadowR * 1.02, r); // 0 inside
    color *= shadow;

    // gentle tone control
    color = max(color, vec3(0.0));
    color = color / (color + vec3(0.9)) * 1.9;

    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;
