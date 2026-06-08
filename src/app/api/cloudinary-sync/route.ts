import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { normalizeArtistName, normalizeAlbumTitle } from "@/lib/utils/normalization";
import { generateCoverColors } from "@/lib/utils/colors";
import {
  splitSingerNames,
  normalizeSingerName,
  normalizeGenreName,
  normalizeLanguageName,
} from "@/lib/utils/singers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  secure_url: string;
  folder: string;
  filename: string;
  duration?: number;
  resource_type: string;
  context?: { custom?: Record<string, string> };
  tags?: string[];
}

interface TrackMetadata {
  title:    string | null;   // TIT2 — override filename title for collection tracks
  artist:   string | null;   // TCOM (music director) or TPE2 (album artist)
  album:    string | null;   // TALB
  genre:    string | null;   // TCON
  language: string | null;   // TLAN
  singers:  string[];        // TPE1 — vocal performers (always separate from artist)
}

// ─── Supabase service-role client ────────────────────────────────────────────

function getServiceClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) throw new Error("Supabase service role credentials not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ─── Cloudinary Admin API helpers ────────────────────────────────────────────

const CLOUD_NAME  = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "").trim();
const API_KEY     = (process.env.CLOUDINARY_API_KEY ?? "").trim();
const API_SECRET  = (process.env.CLOUDINARY_API_SECRET ?? "").trim();
const ROOT_FOLDER = (process.env.CLOUDINARY_FOLDER ?? "songs").trim().replace(/\/$/, "");

function cloudinaryAuth(): string {
  return "Basic " + Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
}

async function fetchAllResources(
  resourceType: "video" | "image",
  extraExpression = ""
): Promise<CloudinaryResource[]> {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET)
    throw new Error("Credentials not configured in server environment");

  const baseExpression = `folder="${ROOT_FOLDER}/*" AND resource_type:${resourceType}`;
  const expression = extraExpression ? `${baseExpression} AND ${extraExpression}` : baseExpression;
  const all: CloudinaryResource[] = [];
  let nextCursor: string | undefined;
  let pages = 0;

  do {
    const body: Record<string, unknown> = {
      expression, max_results: 500, with_field: ["context", "tags"],
    };
    if (nextCursor) body.next_cursor = nextCursor;

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`,
      { method: "POST", headers: { "Content-Type": "application/json", Authorization: cloudinaryAuth() }, body: JSON.stringify(body) }
    );
    if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    all.push(...(data.resources ?? []));
    nextCursor = data.next_cursor;
    pages++;
    if (pages > 40) break;
  } while (nextCursor);

  return all;
}

// ─── ID3 tag parsing via ranged GET (first 256 KB only) ──────────────────────

async function fetchId3Metadata(audioUrl: string): Promise<TrackMetadata> {
  const empty: TrackMetadata = { title: null, artist: null, album: null, genre: null, language: null, singers: [] };
  try {
    const res = await fetch(audioUrl, {
      headers: { Range: "bytes=0-262143" },
      signal: AbortSignal.timeout(8000),
    });
    const buf = new Uint8Array(await res.arrayBuffer());
    const mm  = await import("music-metadata");
    const meta = await mm.parseBuffer(buf, "audio/mpeg", { skipCovers: true });
    const { common } = meta;

    // TPE1 → singers (vocal performers — always separate from folder artist)
    const rawSingers: string[] = [];
    if (common.artists?.length) rawSingers.push(...common.artists);
    else if (common.artist) rawSingers.push(common.artist);
    const singers = rawSingers.flatMap(splitSingerNames).map(normalizeSingerName).filter(Boolean);

    // TCOM → music director / album artist (used as `artist` for collection tracks)
    const composer = common.composer?.[0]?.trim() ?? null;
    const albumArtist = (common as any).albumartist?.trim() ?? null;
    const artist = composer || albumArtist || null;

    // TCON → genre, TLAN → language, TALB → album, TIT2 → title
    const rawGenre = common.genre?.[0] ?? null;
    const rawLang  = (common as unknown as Record<string, unknown>).language as string | undefined ?? null;

    return {
      title:    common.title?.trim() || null,
      artist,
      album:    common.album?.trim() || null,
      genre:    rawGenre ? normalizeGenreName(rawGenre) : null,
      language: rawLang  ? normalizeLanguageName(rawLang) : null,
      singers,
    };
  } catch {
    return empty;
  }
}

// ─── Cloudinary context/tags override ────────────────────────────────────────

function extractContextMetadata(resource: CloudinaryResource): Partial<TrackMetadata> {
  const ctx = resource.context?.custom ?? {};
  const result: Partial<TrackMetadata> = {};
  if (ctx.genre)    result.genre    = normalizeGenreName(ctx.genre.split("|")[0].trim());
  if (ctx.language) result.language = normalizeLanguageName(ctx.language.trim());
  if (ctx.singers)  result.singers  = ctx.singers.split(";").flatMap(splitSingerNames).map(normalizeSingerName).filter(Boolean);
  return result;
}

// ─── Concurrency-limited batch runner ────────────────────────────────────────

async function pLimit<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) { const i = idx++; results[i] = await fn(items[i]); }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

// ─── Filename parser ──────────────────────────────────────────────────────────

const LEADING_NUMBER_RE = /^(\d{1,3})\s*[-–.)\s]\s*/;
const SUFFIX_RE         = /_[a-zA-Z0-9]{4,8}$/;
const SEPARATOR_RE      = /(?:\s+-\s+|_-_|\s+--\s+)/;

function toTitleCase(s: string): string {
  return s.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function parseTrackFilename(filename: string): { title: string; trackNumber: number | null } {
  let raw = filename.replace(SUFFIX_RE, "");
  let trackNumber: number | null = null;
  const numMatch = LEADING_NUMBER_RE.exec(raw);
  if (numMatch) { trackNumber = parseInt(numMatch[1], 10); raw = raw.slice(numMatch[0].length); }
  if (SEPARATOR_RE.test(raw)) raw = raw.split(SEPARATOR_RE)[0].trim();
  const title = toTitleCase(raw.replace(/[_-]/g, " ").trim()) || "Untitled";
  return { title, trackNumber };
}

function getFolder(res: CloudinaryResource & { asset_folder?: string }): string {
  return res.asset_folder || res.folder || res.public_id.split("/").slice(0, -1).join("/");
}

// ─── Main POST handler ────────────────────────────────────────────────────────

export async function POST(_req: Request) {
  try {
    const db = getServiceClient();

    // ── Step 1: Fetch resources ─────────────────────────────────────────────
    const [videoResources, imageResources] = await Promise.all([
      fetchAllResources("video"),
      fetchAllResources("image", `(filename:artist OR filename:cover)`).catch(() => [] as CloudinaryResource[]),
    ]);

    if (videoResources.length === 0)
      return NextResponse.json({ success: true, message: "No audio resources found", trackCount: 0 });

    // ── Step 2: Image lookup map ────────────────────────────────────────────
    const imageMap = new Map<string, { artist?: string; cover?: string }>();
    for (const img of imageResources) {
      const fp = getFolder(img);
      const e  = imageMap.get(fp) ?? {};
      if (img.filename === "artist") e.artist = img.secure_url;
      if (img.filename === "cover")  e.cover  = img.secure_url;
      imageMap.set(fp, e);
    }

    // ── Step 3: Classify L1 folders — Artist vs Collection ─────────────────
    // A folder is an "artist" folder if it has any L2 (album) subfolders.
    // A folder with ONLY direct tracks and no album subfolders is a "collection".
    const l1WithSubfolders = new Set<string>(); // L1 folders that have L2 subfolders
    for (const res of videoResources) {
      const fp    = getFolder(res);
      const parts = fp.split("/");
      if (parts.length >= 3) l1WithSubfolders.add(parts[1]); // has album subfolder
    }

    const artistFolders     = l1WithSubfolders; // confirmed artist folders
    const collectionFolders = new Set<string>();
    for (const res of videoResources) {
      const fp    = getFolder(res);
      const parts = fp.split("/");
      // L1 folder with ONLY direct tracks (depth 2) and no subfolders → collection
      if (parts.length === 2 && !artistFolders.has(parts[1])) {
        collectionFolders.add(parts[1]);
      }
    }

    // ── Step 4: Build artist / album hierarchy (artist folders only) ────────
    interface ArtistMeta { sourceFolder: string; displayName: string; slug: string; image?: string }
    interface AlbumMeta  { artistSourceFolder: string; folderPath: string; title: string; slug: string; coverImage?: string; coverColors: [string, string] }

    const artistMap  = new Map<string, ArtistMeta>();
    const albumMap   = new Map<string, AlbumMeta>();
    const artistSlugsUsed         = new Set<string>();
    const albumSlugsUsedPerArtist = new Map<string, Set<string>>();

    for (const res of videoResources) {
      const fp    = getFolder(res);
      const parts = fp.split("/");
      if (parts.length < 2) continue;
      const l1 = parts[1];
      if (!artistFolders.has(l1)) continue; // skip collection folders here

      const albumFolder = parts[2] as string | undefined;

      if (!artistMap.has(l1)) {
        const displayName = normalizeArtistName(l1);
        let slug = slugify(displayName, l1);
        slug = uniqueSlug(slug, artistSlugsUsed);
        artistSlugsUsed.add(slug);
        artistMap.set(l1, {
          sourceFolder: l1, displayName, slug,
          image: imageMap.get(`${ROOT_FOLDER}/${l1}`)?.artist,
        });
      }

      if (albumFolder && !albumMap.has(fp)) {
        const artistMeta = artistMap.get(l1)!;
        const title = normalizeAlbumTitle(albumFolder);
        let albumSet = albumSlugsUsedPerArtist.get(l1);
        if (!albumSet) { albumSet = new Set(); albumSlugsUsedPerArtist.set(l1, albumSet); }
        let slug = slugify(title, albumFolder);
        slug = uniqueSlug(slug, albumSet);
        albumSet.add(slug);
        albumMap.set(fp, {
          artistSourceFolder: l1, folderPath: fp, title, slug,
          coverImage: imageMap.get(fp)?.cover,
          coverColors: generateCoverColors(title, artistMeta.displayName),
        });
      }
    }

    // ── Step 5: Upsert artists ──────────────────────────────────────────────
    const { data: upsertedArtists, error: artistErr } = await db
      .from("artists")
      .upsert(
        Array.from(artistMap.values()).map((a) => ({
          display_name: a.displayName, source_folder: a.sourceFolder, slug: a.slug, image: a.image ?? null,
        })),
        { onConflict: "slug", ignoreDuplicates: false }
      )
      .select("id, slug, source_folder");
    if (artistErr) throw new Error(`Artist upsert: ${artistErr.message}`);

    const artistIdByFolder = new Map<string, string>();
    for (const row of upsertedArtists ?? []) {
      if (row.source_folder) artistIdByFolder.set(row.source_folder, row.id as string);
    }

    // ── Step 6: Upsert albums ───────────────────────────────────────────────
    const albumRows = Array.from(albumMap.values()).map((al) => {
      const artistId = artistIdByFolder.get(al.artistSourceFolder);
      if (!artistId) return null;
      return { artist_id: artistId, title: al.title, slug: al.slug, cover_image: al.coverImage ?? null, cover_colors: al.coverColors as unknown as string };
    }).filter(Boolean) as { artist_id: string; title: string; slug: string; cover_image: string | null; cover_colors: string }[];

    const { data: upsertedAlbums, error: albumErr } = await db
      .from("albums")
      .upsert(albumRows, { onConflict: "artist_id,slug", ignoreDuplicates: false })
      .select("id, artist_id, slug");
    if (albumErr) throw new Error(`Album upsert: ${albumErr.message}`);

    const albumIdByKey    = new Map<string, string>();
    const albumIdByFolder = new Map<string, string>();
    for (const row of upsertedAlbums ?? []) albumIdByKey.set(`${row.artist_id}/${row.slug}`, row.id as string);
    for (const [fp, al] of albumMap.entries()) {
      const aId = artistIdByFolder.get(al.artistSourceFolder);
      if (!aId) continue;
      const albumId = albumIdByKey.get(`${aId}/${al.slug}`);
      if (albumId) albumIdByFolder.set(fp, albumId);
    }

    // ── Step 7: Build collections (flat Cloudinary folders) ────────────────
    interface CollectionMeta { sourceFolder: string; name: string; slug: string; coverColors: [string, string] }
    const collectionMap      = new Map<string, CollectionMeta>();
    const collectionSlugsUsed = new Set<string>();

    for (const folder of collectionFolders) {
      const name = normalizeAlbumTitle(folder);
      let   slug = slugify(name, folder);
      slug = uniqueSlug(slug, collectionSlugsUsed);
      collectionSlugsUsed.add(slug);
      collectionMap.set(folder, {
        sourceFolder: folder, name, slug,
        coverColors: generateCoverColors(name, ""),
      });
    }

    const { data: upsertedCollections, error: colErr } = collectionMap.size > 0
      ? await db
          .from("collections")
          .upsert(
            Array.from(collectionMap.values()).map((c) => ({
              name: c.name, slug: c.slug, source_folder: c.sourceFolder,
              cover_colors: c.coverColors as unknown as string,
            })),
            { onConflict: "slug", ignoreDuplicates: false }
          )
          .select("id, slug, source_folder")
      : { data: [], error: null };
    if (colErr) throw new Error(`Collection upsert: ${colErr.message}`);

    const collectionIdByFolder = new Map<string, string>();
    for (const row of upsertedCollections ?? []) {
      if (row.source_folder) collectionIdByFolder.set(row.source_folder, row.id as string);
    }

    // ── Step 8: Upsert tracks ───────────────────────────────────────────────
    const BATCH = 100;
    let trackCount = 0;

    const trackRows = videoResources.map((res) => {
      const fp    = getFolder(res);
      const parts = fp.split("/");
      if (parts.length < 2) return null;
      const l1 = parts[1];

      const isCollection = collectionFolders.has(l1);
      const artistId     = isCollection ? null : (artistIdByFolder.get(l1) ?? null);
      const albumId      = isCollection ? null : (albumIdByFolder.get(fp) ?? null);
      const artistMeta   = artistMap.get(l1);
      const albumMeta    = albumMap.get(fp);

      // For collection tracks: artist = "Various Artists" (overridden by ID3 later)
      const artistStr = isCollection ? "Various Artists"   : (artistMeta?.displayName ?? l1);
      const albumStr  = isCollection ? collectionMap.get(l1)?.name ?? l1 : (albumMeta?.title ?? (parts[2] ?? "Singles"));

      const { title, trackNumber } = parseTrackFilename(res.filename);
      const coverColors = generateCoverColors(albumStr, artistStr);

      return {
        asset_id:     res.asset_id,
        title,
        artist:       artistStr,
        album:        albumStr,
        audio_url:    res.secure_url,
        cover_colors: coverColors as unknown as string,
        duration_sec: res.duration ? Math.round(Number(res.duration) * 10) / 10 : 0,
        artist_id:    artistId,
        album_id:     albumId,
        track_number: trackNumber,
        source_folder: fp,
        source:        "cloudinary_sync",
        is_active:     true,
        folder_type:  isCollection ? "collection" : "artist_album",
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    for (let i = 0; i < trackRows.length; i += BATCH) {
      const { error } = await db.from("tracks").upsert(trackRows.slice(i, i + BATCH), { onConflict: "audio_url", ignoreDuplicates: false });
      if (error) throw new Error(`Track upsert batch ${i / BATCH}: ${error.message}`);
      trackCount += Math.min(BATCH, trackRows.length - i);
    }

    // ── Step 9: Link collection tracks ─────────────────────────────────────
    if (collectionMap.size > 0) {
      // Query by folder_type — avoids a huge .in(audio_url) that exceeds PostgREST URL limits
      const { data: collectionTrackRows } = await db
        .from("tracks")
        .select("id, source_folder")
        .eq("folder_type", "collection")
        .eq("source", "cloudinary_sync")
        .eq("is_active", true);

      const linkRows: { collection_id: string; track_id: string; position: number }[] = [];
      const positionByCollection = new Map<string, number>();

      for (const row of collectionTrackRows ?? []) {
        const parts = (row.source_folder as string ?? "").split("/");
        const l1 = parts[1];
        const collId = collectionIdByFolder.get(l1);
        if (!collId) continue;
        const pos = (positionByCollection.get(collId) ?? 0);
        positionByCollection.set(collId, pos + 1);
        linkRows.push({ collection_id: collId, track_id: row.id as string, position: pos });
      }

      for (let i = 0; i < linkRows.length; i += BATCH) {
        await db.from("collection_tracks")
          .upsert(linkRows.slice(i, i + BATCH), { onConflict: "collection_id,track_id", ignoreDuplicates: true });
      }
    }

    // ── Step 10: Inactive sweep ─────────────────────────────────────────────
    const cloudinaryAssetIds = new Set(videoResources.map((r) => r.asset_id));
    const { data: dbRows } = await db.from("tracks").select("asset_id").eq("source", "cloudinary_sync").not("asset_id", "is", null);
    const toDeactivate = (dbRows ?? []).map((r: { asset_id: string }) => r.asset_id).filter((id: string) => !cloudinaryAssetIds.has(id));
    let deactivatedCount = 0;
    if (toDeactivate.length > 0) {
      const { error } = await db.from("tracks").update({ is_active: false }).in("asset_id", toDeactivate);
      if (error) throw new Error(`Inactive sweep: ${error.message}`);
      deactivatedCount = toDeactivate.length;
    }

    // ── Step 11: Metadata — singers / genre / language (+ artist/title/album for collection tracks) ──
    const { data: unparsedRows } = await db
      .from("tracks")
      .select("id, audio_url, asset_id, folder_type")
      .eq("source", "cloudinary_sync")
      .eq("metadata_parsed", false)
      .eq("is_active", true);

    const unparsed = unparsedRows ?? [];
    const resourceByAssetId = new Map<string, CloudinaryResource>();
    for (const r of videoResources) resourceByAssetId.set(r.asset_id, r);

    // Pre-load dimension caches
    const genreIdByName    = new Map<string, string>();
    const languageIdByName = new Map<string, string>();
    const singerIdByName   = new Map<string, string>();
    const genreSlugsUsed   = new Set<string>();
    const langSlugsUsed    = new Set<string>();
    const singerSlugsUsed  = new Set<string>();

    const [egRes, elRes, esRes] = await Promise.all([
      db.from("genres").select("id, name"),
      db.from("languages").select("id, name"),
      db.from("singers").select("id, name"),
    ]);
    for (const g of egRes.data ?? []) { genreIdByName.set(g.name.toLowerCase(), g.id as string); genreSlugsUsed.add(g.name.toLowerCase().replace(/\s+/g, "-")); }
    for (const l of elRes.data ?? []) { languageIdByName.set(l.name.toLowerCase(), l.id as string); langSlugsUsed.add(l.name.toLowerCase().replace(/\s+/g, "-")); }
    for (const s of esRes.data ?? []) { singerIdByName.set(s.name.toLowerCase(), s.id as string); singerSlugsUsed.add(s.name.toLowerCase().replace(/\s+/g, "-")); }

    async function ensureGenre(name: string): Promise<string> {
      const key = name.toLowerCase();
      if (genreIdByName.has(key)) return genreIdByName.get(key)!;
      let slug = slugify(name, name); slug = uniqueSlug(slug, genreSlugsUsed); genreSlugsUsed.add(slug);
      const { data } = await db.from("genres").upsert({ name, slug }, { onConflict: "slug" }).select("id").single();
      const id = data?.id as string; genreIdByName.set(key, id); return id;
    }
    async function ensureLanguage(name: string): Promise<string> {
      const key = name.toLowerCase();
      if (languageIdByName.has(key)) return languageIdByName.get(key)!;
      let slug = slugify(name, name); slug = uniqueSlug(slug, langSlugsUsed); langSlugsUsed.add(slug);
      const { data } = await db.from("languages").upsert({ name, slug }, { onConflict: "slug" }).select("id").single();
      const id = data?.id as string; languageIdByName.set(key, id); return id;
    }
    async function ensureSinger(name: string): Promise<string> {
      const key = name.toLowerCase();
      if (singerIdByName.has(key)) return singerIdByName.get(key)!;
      let slug = slugify(name, name); slug = uniqueSlug(slug, singerSlugsUsed); singerSlugsUsed.add(slug);
      const { data } = await db.from("singers").upsert({ name, slug }, { onConflict: "slug" }).select("id").single();
      const id = data?.id as string; singerIdByName.set(key, id); return id;
    }

    let metadataParsedCount = 0;

    await pLimit(
      unparsed as { id: string; audio_url: string; asset_id: string; folder_type: string }[],
      8,
      async (row) => {
        try {
          const meta = await fetchId3Metadata(row.audio_url);

          // Cloudinary context overrides ID3 for singers/genre/language
          const resource = resourceByAssetId.get(row.asset_id);
          if (resource) {
            const ctx = extractContextMetadata(resource);
            if (ctx.genre)    meta.genre    = ctx.genre;
            if (ctx.language) meta.language = ctx.language;
            if (ctx.singers?.length) meta.singers = ctx.singers;
          }

          const genreName    = meta.genre    || "Unknown";
          const languageName = meta.language || "Unknown";
          const [genreId, languageId] = await Promise.all([ensureGenre(genreName), ensureLanguage(languageName)]);
          const singerIds = await Promise.all(meta.singers.map(ensureSinger));

          // Build track update payload
          const trackUpdate: Record<string, unknown> = { language_id: languageId, metadata_parsed: true };

          // For collection tracks: override artist, album, title from ID3 tags
          if (row.folder_type === "collection") {
            if (meta.artist) trackUpdate.artist = meta.artist;
            if (meta.album)  trackUpdate.album  = meta.album;
            if (meta.title)  trackUpdate.title  = meta.title;
          }

          await db.from("tracks").update(trackUpdate).eq("id", row.id);

          if (genreId) {
            await db.from("track_genres").upsert({ track_id: row.id, genre_id: genreId }, { onConflict: "track_id,genre_id", ignoreDuplicates: true });
          }
          if (singerIds.length > 0) {
            await db.from("track_singers").upsert(
              singerIds.map((sid) => ({ track_id: row.id, singer_id: sid })),
              { onConflict: "track_id,singer_id", ignoreDuplicates: true }
            );
          }
          metadataParsedCount++;
        } catch {
          await db.from("tracks").update({ metadata_parsed: true }).eq("id", row.id);
        }
      }
    );

    // ── Step 12: Recompute denormalized counts ──────────────────────────────
    const { data: allAlbums } = await db.from("albums").select("id");
    for (const { id } of allAlbums ?? []) {
      const { count } = await db.from("tracks").select("id", { count: "exact", head: true }).eq("album_id", id).eq("is_active", true);
      await db.from("albums").update({ track_count: count ?? 0 }).eq("id", id);
    }

    const { data: allArtists } = await db.from("artists").select("id");
    for (const { id } of allArtists ?? []) {
      const [{ count: tc }, { count: ac }] = await Promise.all([
        db.from("tracks").select("id", { count: "exact", head: true }).eq("artist_id", id).eq("is_active", true),
        db.from("albums").select("id",  { count: "exact", head: true }).eq("artist_id", id),
      ]);
      await db.from("artists").update({ track_count: tc ?? 0, album_count: ac ?? 0 }).eq("id", id);
    }

    const { data: allSingers } = await db.from("singers").select("id");
    for (const { id } of allSingers ?? []) {
      const { count } = await db.from("track_singers").select("track_id", { count: "exact", head: true }).eq("singer_id", id);
      await db.from("singers").update({ track_count: count ?? 0 }).eq("id", id);
    }

    const { data: allCollections } = await db.from("collections").select("id");
    for (const { id } of allCollections ?? []) {
      const { count } = await db.from("collection_tracks").select("track_id", { count: "exact", head: true }).eq("collection_id", id);
      await db.from("collections").update({ track_count: count ?? 0 }).eq("id", id);
    }

    // ── Step 13: Prune orphaned albums and artists (from renamed/deleted folders) ──
    // Albums with zero active tracks were either never populated or belong to a renamed folder.
    await db.from("albums").delete().eq("track_count", 0);
    // After album cleanup, artists with zero tracks AND zero albums are safe to remove.
    await db.from("artists").delete().eq("track_count", 0).eq("album_count", 0);

    return NextResponse.json({
      success:          true,
      artistCount:      artistMap.size,
      albumCount:       albumMap.size,
      collectionCount:  collectionMap.size,
      trackCount,
      metadataParsed:   metadataParsedCount,
      deactivated:      deactivatedCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cloudinary-sync]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
