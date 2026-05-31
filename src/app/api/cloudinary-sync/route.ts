import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { normalizeArtistName, normalizeAlbumTitle } from "@/lib/utils/normalization";
import { generateCoverColors } from "@/lib/utils/colors";

// ─── Cloudinary resource shapes ──────────────────────────────────────────────

interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  secure_url: string;
  folder: string;
  filename: string;
  duration?: number;
  resource_type: string;
}

// ─── Supabase service-role client (bypasses all RLS) ─────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service role credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Cloudinary Admin API helpers ─────────────────────────────────────────────

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY    = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";
const ROOT_FOLDER = (process.env.CLOUDINARY_FOLDER ?? "songs").replace(/\/$/, "");

function cloudinaryAuth(): string {
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
}

async function fetchAllResources(
  resourceType: "video" | "image",
  extraExpression = ""
): Promise<CloudinaryResource[]> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error("Cloudinary credentials not configured in server environment");
  }

  const baseExpression = `folder="${ROOT_FOLDER}/*" AND resource_type:${resourceType}`;
  const expression = extraExpression
    ? `${baseExpression} AND ${extraExpression}`
    : baseExpression;

  const all: CloudinaryResource[] = [];
  let nextCursor: string | undefined;
  let pages = 0;

  do {
    const body: Record<string, unknown> = {
      expression,
      max_results: 500,
      with_field: ["context", "tags"],
    };
    if (nextCursor) body.next_cursor = nextCursor;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: cloudinaryAuth(),
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Cloudinary API error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    all.push(...(data.resources ?? []));
    nextCursor = data.next_cursor;
    pages++;
    if (pages > 40) break; // safety: max ~20k resources
  } while (nextCursor);

  return all;
}

// ─── Track filename parser ────────────────────────────────────────────────────

const LEADING_NUMBER_RE = /^(\d{1,3})\s*[-–.)\s]\s*/;
const SUFFIX_RE = /_[a-zA-Z0-9]{4,8}$/;
const SEPARATOR_RE = /(?:\s+-\s+|_-_|\s+--\s+)/;

function toTitleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface ParsedTrack {
  title: string;
  trackNumber: number | null;
}

function parseTrackFilename(filename: string): ParsedTrack {
  let raw = filename;

  // 1. Strip Cloudinary suffix (e.g. _qepjk2)
  raw = raw.replace(SUFFIX_RE, "");

  // 2. Extract leading track number
  let trackNumber: number | null = null;
  const numMatch = LEADING_NUMBER_RE.exec(raw);
  if (numMatch) {
    trackNumber = parseInt(numMatch[1], 10);
    raw = raw.slice(numMatch[0].length);
  }

  // 3. If artist-title separator present, keep only the title portion
  if (SEPARATOR_RE.test(raw)) {
    raw = raw.split(SEPARATOR_RE)[0].trim();
  }

  // 4. Clean underscores/hyphens → spaces; title-case
  const title = toTitleCase(raw.replace(/[_-]/g, " ").trim()) || "Untitled";

  return { title, trackNumber };
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(_req: Request) {
  try {
    const db = getServiceClient();

    // ── Step 1: Fetch all audio (video) and artwork (image) resources ──────

    const [videoResources, imageResources] = await Promise.all([
      fetchAllResources("video"),
      fetchAllResources("image", `(filename:artist OR filename:cover)`).catch(
        () => [] as CloudinaryResource[]
      ),
    ]);

    if (videoResources.length === 0) {
      return NextResponse.json({ success: true, message: "No audio resources found", trackCount: 0 });
    }

    // ── Step 2: Build image lookup maps ──────────────────────────────────
    // folder → { artist?: url, cover?: url }
    const imageMap = new Map<string, { artist?: string; cover?: string }>();
    for (const img of imageResources) {
      const folderPath = img.folder || (img.public_id ? img.public_id.split("/").slice(0, -1).join("/") : "");
      const entry = imageMap.get(folderPath) ?? {};
      if (img.filename === "artist") entry.artist = img.secure_url;
      if (img.filename === "cover")  entry.cover  = img.secure_url;
      imageMap.set(folderPath, entry);
    }

    // ── Step 3: Build hierarchy from folder paths ─────────────────────────
    // folder format: "songs/{ArtistFolder}/{AlbumFolder}"
    //                "songs/{ArtistFolder}" (track directly under artist — rare)

    interface ArtistMeta {
      sourceFolder: string;
      displayName:  string;
      slug:         string;
      image?:       string;
    }
    interface AlbumMeta {
      artistSourceFolder: string;
      folderPath:         string;   // full: "songs/Artist/Album"
      title:              string;
      slug:               string;
      coverImage?:        string;
      coverColors:        [string, string];
    }

    const artistMap  = new Map<string, ArtistMeta>();  // sourceFolder → meta
    const albumMap   = new Map<string, AlbumMeta>();   // folderPath   → meta

    const artistSlugsUsed = new Set<string>();
    const albumSlugsUsedPerArtist = new Map<string, Set<string>>();

    for (const res of videoResources) {
      // folder: "songs/G. V. Prakash Kumar Complete/Aayirathil_Oruvan"
      const folderPath = res.folder || (res.public_id ? res.public_id.split("/").slice(0, -1).join("/") : "");
      const parts = folderPath.split("/");
      if (parts.length < 2) continue; // skip resources at root level

      const artistFolder = parts[1];
      const albumFolder  = parts[2] as string | undefined;

      // Artist
      if (!artistMap.has(artistFolder)) {
        const displayName = normalizeArtistName(artistFolder);
        let slug = slugify(displayName, artistFolder);
        slug = uniqueSlug(slug, artistSlugsUsed);
        artistSlugsUsed.add(slug);
        const artistImages = imageMap.get(`${ROOT_FOLDER}/${artistFolder}`);
        artistMap.set(artistFolder, { sourceFolder: artistFolder, displayName, slug, image: artistImages?.artist });
      }

      // Album (only if there's a third path segment)
      if (albumFolder) {
        if (!albumMap.has(folderPath)) {
          const artistMeta = artistMap.get(artistFolder)!;
          const title = normalizeAlbumTitle(albumFolder);

          let albumSlugsForArtist = albumSlugsUsedPerArtist.get(artistFolder);
          if (!albumSlugsForArtist) {
            albumSlugsForArtist = new Set<string>();
            albumSlugsUsedPerArtist.set(artistFolder, albumSlugsForArtist);
          }

          let slug = slugify(title, albumFolder);
          slug = uniqueSlug(slug, albumSlugsForArtist);
          albumSlugsForArtist.add(slug);

          const albumImages = imageMap.get(folderPath);
          const coverColors = generateCoverColors(title, artistMeta.displayName);

          albumMap.set(folderPath, {
            artistSourceFolder: artistFolder,
            folderPath,
            title,
            slug,
            coverImage: albumImages?.cover,
            coverColors,
          });
        }
      }
    }

    // ── Step 4: Upsert artists ─────────────────────────────────────────────
    const artistRows = Array.from(artistMap.values()).map((a) => ({
      display_name:  a.displayName,
      source_folder: a.sourceFolder,
      slug:          a.slug,
      image:         a.image ?? null,
    }));

    const { data: upsertedArtists, error: artistErr } = await db
      .from("artists")
      .upsert(artistRows, { onConflict: "slug", ignoreDuplicates: false })
      .select("id, slug, source_folder");

    if (artistErr) throw new Error(`Artist upsert failed: ${artistErr.message}`);

    // Build lookup: sourceFolder → DB id
    const artistIdByFolder = new Map<string, string>();
    for (const row of upsertedArtists ?? []) {
      if (row.source_folder) artistIdByFolder.set(row.source_folder, row.id as string);
    }

    // ── Step 5: Upsert albums ──────────────────────────────────────────────
    const albumRows = Array.from(albumMap.values()).map((al) => {
      const artistId = artistIdByFolder.get(al.artistSourceFolder);
      if (!artistId) return null;
      return {
        artist_id:   artistId,
        title:       al.title,
        slug:        al.slug,
        cover_image: al.coverImage ?? null,
        cover_colors: al.coverColors as unknown as string,
      };
    }).filter(Boolean) as {
      artist_id: string; title: string; slug: string;
      cover_image: string | null; cover_colors: string;
    }[];

    const { data: upsertedAlbums, error: albumErr } = await db
      .from("albums")
      .upsert(albumRows, { onConflict: "artist_id,slug", ignoreDuplicates: false })
      .select("id, artist_id, slug");

    if (albumErr) throw new Error(`Album upsert failed: ${albumErr.message}`);

    // Build lookup: "artistId/albumSlug" → DB album id
    const albumIdByKey = new Map<string, string>();
    for (const row of upsertedAlbums ?? []) {
      albumIdByKey.set(`${row.artist_id}/${row.slug}`, row.id as string);
    }

    // Also map folderPath → album id (convenience for track upsert)
    const albumIdByFolder = new Map<string, string>();
    for (const [folderPath, al] of albumMap.entries()) {
      const artistId  = artistIdByFolder.get(al.artistSourceFolder);
      if (!artistId) continue;
      const albumId = albumIdByKey.get(`${artistId}/${al.slug}`);
      if (albumId) albumIdByFolder.set(folderPath, albumId);
    }

    // ── Step 6: Upsert tracks ──────────────────────────────────────────────
    const BATCH = 100;
    let trackCount = 0;

    const trackRows = videoResources.map((res) => {
      const folderPath = res.folder || (res.public_id ? res.public_id.split("/").slice(0, -1).join("/") : "");
      const parts = folderPath.split("/");
      if (parts.length < 2) return null;

      const artistFolder = parts[1];
      const artistId     = artistIdByFolder.get(artistFolder) ?? null;
      const albumId      = albumIdByFolder.get(folderPath) ?? null;

      // Derive legacy artist / album strings (kept for backward compat)
      const artistMeta  = artistMap.get(artistFolder);
      const albumMeta   = albumMap.get(folderPath);
      const artistStr   = artistMeta?.displayName ?? artistFolder;
      const albumStr    = albumMeta?.title ?? (parts[2] ?? "Singles");

      const { title, trackNumber } = parseTrackFilename(res.filename);
      const coverColors = generateCoverColors(albumStr, artistStr);

      return {
        asset_id:      res.asset_id,
        title,
        artist:        artistStr,
        album:         albumStr,
        audio_url:     res.secure_url,
        cover_colors:  coverColors as unknown as string,
        duration_sec:  res.duration ? Math.round(Number(res.duration) * 10) / 10 : 0,
        artist_id:     artistId,
        album_id:      albumId,
        track_number:  trackNumber,
        source_folder: folderPath,
        source:        "cloudinary_sync",
        is_active:     true,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    // Upsert on audio_url (the existing UNIQUE key).
    // This handles both old tracks (asset_id=NULL from pre-migration sync) and new tracks.
    // The upsert populates asset_id, artist_id, album_id etc. on conflict.
    // Once asset_id is populated, future upserts remain idempotent because audio_url is stable.
    for (let i = 0; i < trackRows.length; i += BATCH) {
      const batch = trackRows.slice(i, i + BATCH);
      const { error } = await db
        .from("tracks")
        .upsert(batch, { onConflict: "audio_url", ignoreDuplicates: false });
      if (error) throw new Error(`Track upsert failed (batch ${i / BATCH}): ${error.message}`);
      trackCount += batch.length;
    }

    // ── Step 7: Inactive sweep (scoped to cloudinary_sync tracks only) ─────
    const cloudinaryAssetIds = new Set(videoResources.map((r) => r.asset_id));

    const { data: dbRows } = await db
      .from("tracks")
      .select("asset_id")
      .eq("source", "cloudinary_sync")
      .not("asset_id", "is", null);

    const toDeactivate = (dbRows ?? [])
      .map((r: { asset_id: string }) => r.asset_id)
      .filter((id: string) => !cloudinaryAssetIds.has(id));

    let deactivatedCount = 0;
    if (toDeactivate.length > 0) {
      const { error } = await db
        .from("tracks")
        .update({ is_active: false })
        .in("asset_id", toDeactivate);
      if (error) throw new Error(`Inactive sweep failed: ${error.message}`);
      deactivatedCount = toDeactivate.length;
    }

    // ── Step 8: Recompute denormalized counts ──────────────────────────────
    // (No stored procedure — recompute inline below)

    // Direct count updates as fallback / primary
    await db.from("albums").select("id").then(async ({ data: albIds }) => {
      if (!albIds) return;
      for (const { id } of albIds) {
        await db
          .from("albums")
          .update({
            track_count: (
              await db.from("tracks").select("id", { count: "exact", head: true })
                .eq("album_id", id).eq("is_active", true)
            ).count ?? 0,
          })
          .eq("id", id);
      }
    });

    await db.from("artists").select("id").then(async ({ data: artIds }) => {
      if (!artIds) return;
      for (const { id } of artIds) {
        const [{ count: tc }, { count: ac }] = await Promise.all([
          db.from("tracks").select("id", { count: "exact", head: true }).eq("artist_id", id).eq("is_active", true),
          db.from("albums").select("id",  { count: "exact", head: true }).eq("artist_id", id),
        ]);
        await db.from("artists").update({ track_count: tc ?? 0, album_count: ac ?? 0 }).eq("id", id);
      }
    });

    return NextResponse.json({
      success:      true,
      artistCount:  artistMap.size,
      albumCount:   albumMap.size,
      trackCount,
      deactivated:  deactivatedCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cloudinary-sync]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
