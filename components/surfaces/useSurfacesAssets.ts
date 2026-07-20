"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";
import {
  DEM_META_PATH,
  DEM_PNG_PATH,
  PANORAMA_TEXTURE,
  SATURN_RINGS_TEXTURE,
  SATURN_TEXTURE,
} from "./surfacesUi";

/**
 * Loads the Surfaces tab's committed real assets once, defensively:
 *
 *   1. The REAL Gale Crater MOLA DEM (16-bit grayscale PNG + sidecar metadata,
 *      docs/SURFACES_DATA_SOURCES.md). Decoded at FULL 16-bit precision by a
 *      small in-browser PNG reader (chunk parse + DecompressionStream inflate +
 *      scanline unfilter), because canvas ImageData would quantize to 8 bits
 *      (~24 m steps over the 6060 m range). If that decoder is unavailable or
 *      fails, we fall back to the 8-bit canvas path and record bitDepthUsed=8
 *      so the UI can say so honestly. Elevations are mapped to REAL meters via
 *      the sidecar's linear mapping value/65535 * (max - min) + min.
 *   2. The real Curiosity 360 panorama (PIA25407), sRGB.
 *   3. The Saturn texture + ring texture (reused, Solar System Scope CC BY 4.0,
 *      already credited app-wide) for the Titan sky.
 *
 * Every load is guarded: a missing/failed asset yields null and the scenes draw
 * a labeled fallback; the tab never throws. No runtime network beyond these
 * same-origin static files; no API keys.
 */

export interface DemMeta {
  widthKm: number;
  heightKm: number;
  elevMinM: number;
  elevMaxM: number;
  resolutionMPerPx: number;
  centerLatDeg: number;
  centerLonEastDeg: number;
  credit: string;
}

export interface DecodedDem {
  /** row-major elevations in REAL meters (vs the areoid), size x size */
  heightsM: Float32Array;
  /** grid width = height in samples (512) */
  size: number;
  /** 16 when the full-precision decoder ran, 8 on the canvas fallback */
  bitDepthUsed: 8 | 16;
  meta: DemMeta;
}

export interface SurfacesAssets {
  dem: DecodedDem | null;
  panorama: THREE.Texture | null;
  saturn: THREE.Texture | null;
  saturnRings: THREE.Texture | null;
  ready: boolean;
}

const EMPTY: SurfacesAssets = {
  dem: null,
  panorama: null,
  saturn: null,
  saturnRings: null,
  ready: false,
};

function finite(x: unknown): x is number {
  return typeof x === "number" && Number.isFinite(x);
}

function validMeta(m: unknown): m is DemMeta {
  const x = m as DemMeta;
  return (
    typeof m === "object" &&
    m !== null &&
    finite(x.widthKm) &&
    finite(x.heightKm) &&
    finite(x.elevMinM) &&
    finite(x.elevMaxM) &&
    x.elevMaxM > x.elevMinM
  );
}

// ── 16-bit grayscale PNG decoder (IHDR/IDAT parse + inflate + unfilter) ──────

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function inflateZlib(data: Uint8Array): Promise<Uint8Array> {
  // "deflate" = zlib-wrapped deflate (RFC 1950), which is what PNG IDAT holds.
  const ds = new DecompressionStream("deflate");
  const stream = new Blob([data.buffer as ArrayBuffer]).stream().pipeThrough(ds);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Decode a 16-bit grayscale (color type 0, no interlace) PNG to Uint16 values.
 * Throws on any unexpected structure; the caller catches and falls back.
 */
async function decodeGray16Png(buf: ArrayBuffer): Promise<{
  width: number;
  height: number;
  values: Uint16Array;
}> {
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== PNG_SIG[i]) throw new Error("not a PNG");
  }
  const view = new DataView(buf);
  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = 0;
  const idat: Uint8Array[] = [];
  while (off + 8 <= bytes.length) {
    const len = view.getUint32(off);
    const type = String.fromCharCode(
      bytes[off + 4],
      bytes[off + 5],
      bytes[off + 6],
      bytes[off + 7]
    );
    const dataStart = off + 8;
    if (dataStart + len > bytes.length) throw new Error("truncated PNG");
    if (type === "IHDR") {
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      interlace = bytes[dataStart + 12];
    } else if (type === "IDAT") {
      idat.push(bytes.subarray(dataStart, dataStart + len));
    } else if (type === "IEND") {
      break;
    }
    off = dataStart + len + 4; // skip CRC
  }
  if (width <= 0 || height <= 0) throw new Error("bad dimensions");
  if (bitDepth !== 16 || colorType !== 0 || interlace !== 0) {
    throw new Error("not 16-bit grayscale non-interlaced");
  }
  const concat = new Uint8Array(idat.reduce((n, c) => n + c.length, 0));
  let p = 0;
  for (const c of idat) {
    concat.set(c, p);
    p += c.length;
  }
  const raw = await inflateZlib(concat);
  const bpp = 2; // bytes per pixel (16-bit gray)
  const stride = width * bpp;
  if (raw.length < height * (stride + 1)) throw new Error("short inflate");
  const out = new Uint16Array(width * height);
  const prevLine = new Uint8Array(stride);
  const curLine = new Uint8Array(stride);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    const filter = raw[rowStart];
    for (let x = 0; x < stride; x++) {
      const rx = raw[rowStart + 1 + x];
      const left = x >= bpp ? curLine[x - bpp] : 0;
      const up = prevLine[x];
      const upLeft = x >= bpp ? prevLine[x - bpp] : 0;
      let v: number;
      switch (filter) {
        case 0:
          v = rx;
          break;
        case 1:
          v = rx + left;
          break;
        case 2:
          v = rx + up;
          break;
        case 3:
          v = rx + ((left + up) >> 1);
          break;
        case 4:
          v = rx + paeth(left, up, upLeft);
          break;
        default:
          throw new Error(`unknown filter ${filter}`);
      }
      curLine[x] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      out[y * width + x] = (curLine[x * 2] << 8) | curLine[x * 2 + 1];
    }
    prevLine.set(curLine);
  }
  return { width, height, values: out };
}

/** 8-bit canvas fallback (quantized; bitDepthUsed=8 is surfaced to the UI). */
async function decodeViaCanvas(
  url: string
): Promise<{ width: number; height: number; values: Uint16Array } | null> {
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const values = new Uint16Array(canvas.width * canvas.height);
    for (let i = 0; i < values.length; i++) {
      // expand 8-bit back to the 16-bit scale so the meter mapping is shared
      values[i] = data[i * 4] * 257;
    }
    return { width: canvas.width, height: canvas.height, values };
  } catch {
    return null;
  }
}

async function loadDem(): Promise<DecodedDem | null> {
  try {
    const [metaRes, pngRes] = await Promise.all([
      fetch(DEM_META_PATH),
      fetch(DEM_PNG_PATH),
    ]);
    if (!metaRes.ok || !pngRes.ok) return null;
    const meta = (await metaRes.json()) as unknown;
    if (!validMeta(meta)) return null;
    const buf = await pngRes.arrayBuffer();

    let decoded: { width: number; height: number; values: Uint16Array } | null =
      null;
    let bitDepthUsed: 8 | 16 = 16;
    if (typeof DecompressionStream !== "undefined") {
      try {
        decoded = await decodeGray16Png(buf);
      } catch {
        decoded = null;
      }
    }
    if (decoded === null) {
      decoded = await decodeViaCanvas(DEM_PNG_PATH);
      bitDepthUsed = 8;
    }
    if (decoded === null || decoded.width !== decoded.height) return null;

    const range = meta.elevMaxM - meta.elevMinM;
    const heightsM = new Float32Array(decoded.values.length);
    for (let i = 0; i < heightsM.length; i++) {
      // the sidecar's documented linear mapping, in REAL meters
      heightsM[i] = (decoded.values[i] / 65535) * range + meta.elevMinM;
    }
    return { heightsM, size: decoded.width, bitDepthUsed, meta };
  } catch {
    return null;
  }
}

// ── textures ─────────────────────────────────────────────────────────────────

function prepSrgb(tex: THREE.Texture): THREE.Texture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function useSurfacesAssets(): SurfacesAssets {
  const [state, setState] = useState<SurfacesAssets>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    const tryTex = async (path: string): Promise<THREE.Texture | null> => {
      try {
        return prepSrgb(await loader.loadAsync(path));
      } catch {
        return null;
      }
    };

    (async () => {
      const [dem, panorama, saturn, saturnRings] = await Promise.all([
        loadDem(),
        tryTex(PANORAMA_TEXTURE),
        tryTex(SATURN_TEXTURE),
        tryTex(SATURN_RINGS_TEXTURE),
      ]);
      if (cancelled) {
        panorama?.dispose();
        saturn?.dispose();
        saturnRings?.dispose();
        return;
      }
      setState({ dem, panorama, saturn, saturnRings, ready: true });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dispose loaded textures on unmount (final instances).
  useEffect(() => {
    return () => {
      state.panorama?.dispose();
      state.saturn?.dispose();
      state.saturnRings?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.panorama, state.saturn, state.saturnRings]);

  return state;
}
