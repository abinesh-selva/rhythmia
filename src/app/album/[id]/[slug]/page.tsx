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

  const { data: album } = await db
    .from("albums")
    .select("id, title, slug, cover_image, cover_colors, track_count, year, artist_id, artists(id, display_name, slug, image)")
    .eq("id", id)
    .single();

  if (!album) return notFound();

  const { data: rawTracks } = await db
    .from("tracks")
    .select(`
      id, title, artist, album, audio_url, cover_colors, duration_sec,
      track_number, is_active, asset_id, artist_id, album_id, language_id,
      track_singers(singers(id, name, slug)),
      track_genres(genres(id, name, slug)),
      languages(id, name)
    `)
    .eq("album_id", id)
    .order("track_number", { ascending: true, nullsFirst: false })
    .order("title", { ascending: true });

  // Destructure join columns out; pass only plain scalar fields to the Client Component
  const tracks = (rawTracks ?? []).map((t: any) => {
    const { track_singers, track_genres, languages, ...scalar } = t;
    return {
      ...scalar,
      singers:  (track_singers  ?? []).map((ts: any) => ts.singers?.name).filter(Boolean) as string[],
      genre:    (track_genres   ?? [])[0]?.genres?.name as string | undefined,
      genre_id: (track_genres   ?? [])[0]?.genres?.id  as string | undefined,
      language: languages?.name as string | undefined,
    };
  });

  return (
    <AlbumDetailView
      album={album}
      tracks={tracks}
    />
  );
}
