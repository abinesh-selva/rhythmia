import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

function getColors(cover_colors: any): [string, string] {
  if (Array.isArray(cover_colors) && cover_colors.length >= 2) return [cover_colors[0], cover_colors[1]];
  if (typeof cover_colors === "string") {
    try { const p = JSON.parse(cover_colors); if (Array.isArray(p)) return [p[0], p[1]]; } catch {}
  }
  return ["#F0824E", "#1E9E54"];
}

export default async function AlbumsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const isNew = sort === "new";

  const db = await createClient();
  if (!db) return notFound();

  const { data: albums } = await db
    .from("albums")
    .select("id, title, slug, cover_image, cover_colors, track_count, artists(display_name, slug)")
    .order(isNew ? "created_at" : "track_count", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col min-h-full pb-24">
      <div className="px-6 md:px-8 pt-8 pb-4 flex items-center gap-4">
        <Link href="/" className="text-muted hover:text-cream transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </Link>
        <h1 className="text-2xl font-bold font-display text-cream">
          {isNew ? "Recently Added" : "Popular Albums"}
        </h1>
      </div>

      <div className="flex gap-3 px-6 md:px-8 pb-6">
        <Link
          href="/albums"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${!isNew ? "bg-cream text-forest-dark" : "bg-white/8 text-muted hover:text-cream"}`}
        >
          Popular
        </Link>
        <Link
          href="/albums?sort=new"
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${isNew ? "bg-cream text-forest-dark" : "bg-white/8 text-muted hover:text-cream"}`}
        >
          Recently Added
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-6 md:px-8">
        {(albums ?? []).map((alb) => {
          const [c1, c2] = getColors(alb.cover_colors);
          const artistInfo = Array.isArray(alb.artists) ? alb.artists[0] : alb.artists;
          return (
            <Link
              key={alb.id}
              href={`/album/${alb.id}/${alb.slug}`}
              className="flex flex-col gap-2 p-3 rounded-xl bg-white/4 hover:bg-white/8 transition-all group cursor-pointer"
            >
              {alb.cover_image ? (
                <img src={alb.cover_image} alt={alb.title} className="w-full aspect-square rounded-lg object-cover shadow-md" />
              ) : (
                <div className="w-full aspect-square rounded-lg shadow-md" style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }} />
              )}
              <span className="text-sm font-semibold text-cream truncate leading-tight group-hover:text-coral transition-colors">{alb.title}</span>
              <span className="text-xs text-muted truncate">{artistInfo?.display_name ?? "Unknown Artist"}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
