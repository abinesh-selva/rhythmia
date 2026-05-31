/**
 * Generates a deterministic 2-color HSL gradient pair from any two strings.
 * Used for album/artist cover art fallback when no cover image is present.
 */
export function generateCoverColors(seed1: string, seed2: string): [string, string] {
  const hash = hashString(seed1 + seed2);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 137) % 360; // golden-angle offset for good contrast
  return [
    `hsl(${hue1}, 72%, 52%)`,
    `hsl(${hue2}, 68%, 38%)`,
  ];
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
