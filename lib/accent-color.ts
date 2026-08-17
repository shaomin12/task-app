// Fixed palette of accent color choices, each just a base hue — hover/soft/dark
// variants are all derived from this one hex via HSL math (see deriveAccentShades),
// so picking a new accent never requires hand-tuning 6 more values.
export const ACCENT_SWATCHES = [
  { name: "Pine Teal", hex: "#2f5d50" },
  { name: "Indigo", hex: "#4c51bf" },
  { name: "Rust", hex: "#b5502e" },
  { name: "Forest", hex: "#3f6b2f" },
  { name: "Slate Blue", hex: "#3b5b8c" },
  { name: "Berry", hex: "#a13e5c" },
] as const;

export const DEFAULT_ACCENT = ACCENT_SWATCHES[0].hex;

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = (g - b) / d + (g < b ? 6 : 0);
      break;
    case g:
      h = (b - r) / d + 2;
      break;
    default:
      h = (r - g) / d + 4;
  }
  return { h: h / 6, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function withLightness(hex: string, s: number, l: number) {
  const rgb = hexToRgb(hex);
  const { h } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const shifted = hslToRgb(h, s, l);
  return rgbToHex(shifted.r, shifted.g, shifted.b);
}

export interface AccentShades {
  accent: string;
  accentHover: string;
  accentSoft: string;
}

// Derives a light-mode and dark-mode shade triple from one base hex.
// Light mode: the base color as-is, a darker hover, a very light tint for "soft".
// Dark mode: a lightened version of the base (so it reads against a dark
// background), an even lighter hover, and a very dark tint for "soft".
export function deriveAccentShades(hex: string): { light: AccentShades; dark: AccentShades } {
  const { r, g, b } = hexToRgb(hex);
  const { s } = rgbToHsl(r, g, b);

  return {
    light: {
      accent: hex,
      accentHover: withLightness(hex, s, 0.24),
      accentSoft: withLightness(hex, Math.min(s, 0.35), 0.93),
    },
    dark: {
      accent: withLightness(hex, Math.min(s, 0.5), 0.68),
      accentHover: withLightness(hex, Math.min(s, 0.5), 0.78),
      accentSoft: withLightness(hex, Math.min(s, 0.35), 0.18),
    },
  };
}
