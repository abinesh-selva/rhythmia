import { createClient } from "@/lib/supabase/server";
import { SingerDetailView } from "@/components/views/SingerDetailView";
import { notFound } from "next/navigation";

export default async function SingerPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  const { data: singer } = await db
    .from("singers")
    .select("id, name, slug, image, track_count")
    .eq("id", id)
    .single();

  if (!singer) return notFound();

  const { data: singerTracks } = await db
    .from("track_singers")
    .select(`
      tracks(
        id, title, artist, album, audio_url, cover_colors, duration_sec,
        is_active, track_number, artist_id, album_id,
        track_singers(singers(name)),
        track_genres(genres(name)),
        languages(name)
      )
    `)
    .eq("singer_id", id);

  const tracks = (singerTracks ?? [])
    .map((r: any) => r.tracks)
    .filter(Boolean)
    .sort((a: any, b: any) => (a.title ?? "").localeCompare(b.title ?? ""))
    .map((t: any) => {
      const { track_singers, track_genres, languages, ...scalar } = t;
      return {
        ...scalar,
        singers:  (track_singers ?? []).map((ts: any) => ts.singers?.name).filter(Boolean) as string[],
        genre:    (track_genres  ?? [])[0]?.genres?.name as string | undefined,
        language: languages?.name as string | undefined,
      };
    });

  const albumIds = [...new Set(tracks.map((t: any) => t.album_id).filter(Boolean))];
  const { data: albums } = albumIds.length
    ? await db.from("albums").select("id, title, slug, cover_colors, artists(display_name)").in("id", albumIds)
    : { data: [] };

  const appearsOnAlbums = (albums ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    cover_colors: Array.isArray(a.cover_colors) ? a.cover_colors : ["#F0824E", "#1E9E54"],
    artist_name: a.artists?.display_name ?? "",
  }));

  return (
    <SingerDetailView
      singer={{ ...singer, display_name: singer.name }}
      tracks={tracks}
      appearsOnAlbums={appearsOnAlbums}
    />
  );
}
