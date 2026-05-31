import { createClient } from "@/lib/supabase/server";
import { LanguageDetailView } from "@/components/views/LanguageDetailView";
import { notFound } from "next/navigation";

export default async function LanguagePage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const { id } = await params;
  const db = await createClient();
  if (!db) return notFound();

  const { data: language } = await db.from("languages").select("id, name, code, slug").eq("id", id).single();
  if (!language) return notFound();

  const { data: langTracks } = await db
    .from("tracks")
    .select(`
      id, title, artist, album, audio_url, cover_colors, duration_sec,
      is_active, track_number, artist_id, album_id,
      track_singers(singers(name)),
      track_genres(genres(name))
    `)
    .eq("language_id", id)
    .order("title");

  const tracks = (langTracks ?? []).map((t: any) => {
    const { track_singers, track_genres, ...scalar } = t;
    return {
      ...scalar,
      singers: (track_singers ?? []).map((ts: any) => ts.singers?.name).filter(Boolean) as string[],
      genre:   (track_genres  ?? [])[0]?.genres?.name as string | undefined,
    };
  });

  return <LanguageDetailView language={language} tracks={tracks} />;
}
