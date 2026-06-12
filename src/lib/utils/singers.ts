/**
 * Singer name utilities — normalization + splitting.
 * "Singer" = vocal performer (TPE1), distinct from "Artist" = music director (L1 folder).
 */

const SINGER_ALIAS_MAP: Record<string, string> = {};

/** Split a raw singer string (from ID3 TPE1 or Cloudinary context) into individual names. */
export function splitSingerNames(raw: string): string[] {
  return raw
    .split(/[/,&]|feat\.?\s*/i)
    .map((s) => s.trim().replace(/^\(|\)$/g, ""))
    .filter((s) => s.length > 1);
}

/** Normalize a single singer name: trim, canonical alias lookup. */
export function normalizeSingerName(name: string): string {
  const trimmed = name.trim();
  const key = trimmed.toLowerCase();
  for (const [alias, canonical] of Object.entries(SINGER_ALIAS_MAP)) {
    if (alias.toLowerCase() === key) return canonical;
  }
  return trimmed;
}

/** Normalize a genre string coming from TCON/context (e.g. "(10)" → "Musical", free text → title-case). */
export function normalizeGenreName(raw: string): string {
  // ID3 TCON can encode genres as numeric codes like "(10)" — strip parens
  const stripped = raw.trim().replace(/^\((\d+)\)$/, (_, code) => id3GenreCode(Number(code)));
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase();
}

/** Normalize a language string (ISO code or human name). Always return human-readable name. */
export function normalizeLanguageName(raw: string): string {
  const trimmed = raw.trim();
  const mapped = ISO_LANGUAGE_MAP[trimmed.toLowerCase()];
  return mapped ?? (trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
}

// ─── ID3 TCON numeric genre table (ID3v1 genre codes 0–191) ─────────────────
const ID3_GENRES = [
  "Blues","Classic Rock","Country","Dance","Disco","Funk","Grunge","Hip-Hop","Jazz",
  "Metal","New Age","Oldies","Other","Pop","Rhythm and Blues","Rap","Reggae","Rock",
  "Techno","Industrial","Alternative","Ska","Death Metal","Pranks","Soundtrack",
  "Euro-Techno","Ambient","Trip-Hop","Vocal","Jazz & Funk","Fusion","Trance",
  "Classical","Instrumental","Acid","House","Game","Sound Clip","Gospel","Noise",
  "Alternative Rock","Bass","Soul","Punk","Space","Meditative","Instrumental Pop",
  "Instrumental Rock","Ethnic","Gothic","Darkwave","Techno-Industrial","Electronic",
  "Pop-Folk","Eurodance","Dream","Southern Rock","Comedy","Cult","Gangsta","Top 40",
  "Christian Rap","Pop/Funk","Jungle","Native US","Cabaret","New Wave","Psychadelic",
  "Rave","Showtunes","Trailer","Lo-Fi","Tribal","Acid Punk","Acid Jazz","Polka",
  "Retro","Musical","Rock & Roll","Hard Rock",
];

function id3GenreCode(n: number): string {
  return ID3_GENRES[n] ?? "Other";
}

// ─── ISO 639-1 / common language code → English name ────────────────────────
const ISO_LANGUAGE_MAP: Record<string, string> = {
  "ta": "Tamil", "tam": "Tamil",
  "hi": "Hindi", "hin": "Hindi",
  "te": "Telugu", "tel": "Telugu",
  "kn": "Kannada", "kan": "Kannada",
  "ml": "Malayalam", "mal": "Malayalam",
  "en": "English", "eng": "English",
  "pa": "Punjabi", "pan": "Punjabi",
  "bn": "Bengali", "ben": "Bengali",
  "mr": "Marathi", "mar": "Marathi",
  "gu": "Gujarati", "guj": "Gujarati",
  "ur": "Urdu", "urd": "Urdu",
  "or": "Odia", "ori": "Odia",
  "as": "Assamese", "asm": "Assamese",
  "sa": "Sanskrit", "san": "Sanskrit",
};
