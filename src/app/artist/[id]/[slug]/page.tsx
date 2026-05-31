import { createClient } from "@/lib/supabase/server";
import { ArtistDetailView } from "@/components/views/ArtistDetailView";
import { notFound } from "next/navigation";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  // Fetch artist
  const { data: artist } = await db
    .from("artists")
    .select("id, display_name, slug, image, album_count, track_count, created_at")
    .eq("id", id)
    .single();

  if (!artist) return notFound();

  // Fetch albums for this artist
  const { data: albums } = await db
    .from("albums")
    .select("id, title, slug, cover_image, cover_colors, track_count, year, created_at")
    .eq("artist_id", id)
    .order("year", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  // Fetch top tracks (all active tracks by this artist, ordered by track_number then title)
  const { data: tracks } = await db
    .from("tracks")
    .select("id, title, artist, album, audio_url, cover_colors, duration_sec, album_id, track_number, is_active, asset_id, artist_id")
    .eq("artist_id", id)
    .eq("is_active", true)
    .order("track_number", { ascending: true, nullsFirst: true })
    .order("title", { ascending: true })
    .limit(50);

  return (
    <ArtistDetailView
      artist={artist}
      albums={albums ?? []}
      tracks={tracks ?? []}
    />
  );
}
