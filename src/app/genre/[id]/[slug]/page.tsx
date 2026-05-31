import { createClient } from "@/lib/supabase/server";
import { GenreDetailView } from "@/components/views/GenreDetailView";
import { notFound } from "next/navigation";

export default async function GenrePage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  const { data: genre } = await db.from("genres").select("id, name, slug").eq("id", id).single();
  if (!genre) return notFound();

  const { data: genreTracks } = await db
    .from("track_genres")
    .select(`
      tracks(
        id, title, artist, album, audio_url, cover_colors, duration_sec,
        is_active, track_number, artist_id, album_id,
        track_singers(singers(name)),
        languages(name)
      )
    `)
    .eq("genre_id", id);

  const tracks = (genreTracks ?? [])
    .map((r: any) => r.tracks)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.title ?? "").localeCompare(b.title ?? ""))
    .map((t: any) => {
      const { track_singers, languages, ...scalar } = t;
      return {
        ...scalar,
        singers:  (track_singers ?? []).map((ts: any) => ts.singers?.name).filter(Boolean) as string[],
        language: languages?.name as string | undefined,
      };
    });

  return <GenreDetailView genre={genre} tracks={tracks} />;
}
