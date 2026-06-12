/**
 * Converts any string to a URL-safe slug.
 * Handles Latin-script strings and pre-transliterated non-ASCII folder names
 * (e.g. Cloudinary folders that are already in Latin characters).
 *
 * Guarantees a non-empty result: falls back to "id-<hash>" when the input
 * yields no usable characters (e.g. a purely Devanagari string with no
 * transliteration). Pass fallbackId (e.g. a UUID) for that guarantee.
 */
export function slugify(text: string, fallbackId?: string): string {
  const s = text
    .normalize("NFD")                      // decompose accented glyphs
    .replace(/[̀-ͯ]/g, "")       // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s._-]/g, "")       // keep alnum + space + safe punct
    .trim()
    .replace(/[\s_.]+/g, "-")             // spaces / underscores / dots → hyphen
    .replace(/-+/g, "-")                  // collapse consecutive hyphens
    .replace(/^-|-$/g, "");              // trim leading / trailing hyphens

  if (s) return s;

  const seed = fallbackId ?? text;
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  return "id-" + Math.abs(h).toString(36).slice(0, 8);
}

/**
 * Given a desired slug and the full set of existing slugs for that scope,
 * returns the slug unchanged if unique or appends "-<n>" until unique.
 * Used during sync to handle rare collisions within a single sync run.
 */
export function uniqueSlug(slug: string, existing: Set<string>): string {
  if (!existing.has(slug)) return slug;
  let n = 2;
  while (existing.has(`${slug}-${n}`)) n++;
  return `${slug}-${n}`;
}
