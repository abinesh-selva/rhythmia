import { createClient } from "@/lib/supabase/server";
import { AlbumDetailView } from "@/components/views/AlbumDetailView";
import { notFound } from "next/navigation";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  // Fetch album with artist
  const { data: album } = await db
    .from("albums")
    .select("id, title, slug, cover_image, cover_colors, track_count, year, artist_id, artists(id, display_name, slug, image)")
    .eq("id", id)
    .single();

  if (!album) return notFound();

  // Fetch tracks ordered by track_number (nulls last), then title
  const { data: tracks } = await db
    .from("tracks")
    .select("id, title, artist, album, audio_url, cover_colors, duration_sec, track_number, is_active, asset_id, artist_id, album_id")
    .eq("album_id", id)
    .order("track_number", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  return (
    <AlbumDetailView
      album={album}
      tracks={tracks ?? []}
    />
  );
}
