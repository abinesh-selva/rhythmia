/**
 * Artist name normalization — two operations applied in order:
 *  1. Alias map (exact match → canonical name)
 *  2. Conservative suffix strip (remove trailing token if in STRIP_SUFFIXES)
 *
 * To extend, add entries to ALIAS_MAP or STRIP_SUFFIXES below.
 * These must remain manual — no heuristic can infer them correctly.
 */

const ALIAS_MAP: Record<string, string> = {
  "Yuvan": "Yuvan Shankar Raja",
  "Yuvan Hits": "Yuvan Shankar Raja",
};

const STRIP_SUFFIXES = new Set([
  "Complete",
  "Collection",
  "Hits",
  "Songs",
  "Discography",
]);

export function normalizeArtistName(folderName: string): string {
  const trimmed = folderName.trim();

  // 1. Alias map wins — exact match on the full folder name
  if (ALIAS_MAP[trimmed]) return ALIAS_MAP[trimmed];

  // 2. Strip a single trailing suffix token if present and list is multi-word
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1 && STRIP_SUFFIXES.has(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(" ");
  }

  return trimmed;
}

/**
 * Normalise a raw Cloudinary folder segment into a human-readable album title.
 * Replaces underscores with spaces; leaves casing as-is.
 */
export function normalizeAlbumTitle(folderSegment: string): string {
  return folderSegment.trim().replace(/_/g, " ");
}
