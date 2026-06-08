import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ArtistsPage() {
  const db = await createClient();
  if (!db) return notFound();

  const { data: artists } = await db
    .from("artists")
    .select("id, display_name, slug, image, track_count")
    .order("track_count", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="px-6 md:px-8 pt-8 pb-6 flex items-center gap-4">
        <Link href="/" className="text-muted hover:text-cream transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </Link>
        <h1 className="text-2xl font-bold font-display text-cream">Your Top Artists</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-6 md:px-8">
        {(artists ?? []).map((artist) => (
          <Link
            key={artist.id}
            href={`/artist/${artist.id}/${artist.slug}`}
            className="flex flex-col items-center gap-3 p-3 rounded-xl bg-white/4 hover:bg-white/8 transition-all group cursor-pointer"
          >
            <div className="w-full aspect-square rounded-full bg-white/8 overflow-hidden shadow-md">
              {artist.image ? (
                <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-muted">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-cream text-center leading-tight group-hover:text-coral transition-colors line-clamp-2">{artist.display_name}</span>
            <span className="text-xs text-muted">{artist.track_count} songs</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
