import { createClient } from "@/lib/supabase/server";
import { CollectionDetailView } from "@/components/views/CollectionDetailView";
import { notFound } from "next/navigation";

export default async function CollectionPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  const { data: collection } = await db
    .from("collections")
    .select("id, name, slug, source_folder, cover_colors, track_count")
    .eq("id", id)
    .single();

  if (!collection) return notFound();

  const { data: collectionTracks } = await db
    .from("collection_tracks")
    .select(`
      position,
      tracks(
        id, title, artist, album, audio_url, cover_colors, duration_sec,
        is_active, track_number, artist_id, album_id,
        track_singers(singers(name)),
        track_genres(genres(name)),
        languages(name)
      )
    `)
    .eq("collection_id", id)
    .order("position");

  const tracks = (collectionTracks ?? [])
    .map((r: any) => r.tracks)
    .filter(Boolean)
    .map((t: any) => {
      const { track_singers, track_genres, languages, ...scalar } = t;
      return {
        ...scalar,
        singers:  (track_singers ?? []).map((ts: any) => ts.singers?.name).filter(Boolean) as string[],
        genre:    (track_genres  ?? [])[0]?.genres?.name as string | undefined,
        language: languages?.name as string | undefined,
      };
    });

  return (
    <CollectionDetailView
      collection={{
        id: collection.id,
        name: collection.name,
        slug: collection.slug,
        source_folder: collection.source_folder,
        cover_colors: Array.isArray(collection.cover_colors) ? collection.cover_colors : ["#F0824E", "#1E9E54"],
        track_count: collection.track_count,
      }}
      tracks={tracks}
    />
  );
}
