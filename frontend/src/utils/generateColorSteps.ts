/**
 * Linearly interpolate between two numbers
 */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Parse color string (HEX or rgb()) → RGB
 */
function parseColor(color: string) {
  if (color.startsWith("#")) return hexToRgb(color);

  const match = color.match(/rgb\s*\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
  if (match) {
    return {
      r: Number(match[1]),
      g: Number(match[2]),
      b: Number(match[3]),
    };
  }

  throw new Error(`Unsupported color format: ${color}`);
}

/**
 * Generate N heatmap steps from a base color.
 * Steps go from a very light version → the original color.
 */
export function generateColorSteps(baseColor: string, steps = 8): string[] {
  const { r, g, b } = parseColor(baseColor);

  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);

    // Interpolate from white → base color
    const rr = Math.round(lerp(255, r, t));
    const gg = Math.round(lerp(255, g, t));
    const bb = Math.round(lerp(255, b, t));

    colors.push(`rgb(${rr}, ${gg}, ${bb})`);
  }

  return colors;
}
