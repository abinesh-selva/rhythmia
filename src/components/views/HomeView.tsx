"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAudio } from "@/context/AudioContext";
import { supabase } from "@/lib/supabase";
import { TrackRow } from "@/components/ui/TrackRow";

interface HomeViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
}

interface ArtistRow {
  id: string;
  display_name: string;
  slug: string;
  image: string | null;
  track_count: number;
  album_count: number;
}

interface AlbumRow {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  cover_colors: string[];
  track_count: number;
  artist_id: string;
  artists: { display_name: string; slug: string } | null;
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col min-h-full pb-10 animate-pulse">
      <div className="p-6 md:p-10 border-b border-cream/5">
        <div className="h-4 w-32 bg-cream/10 rounded-full mb-3" />
        <div className="h-10 w-48 bg-cream/10 rounded-xl" />
      </div>
      <div className="px-6 md:px-10 pt-10">
        <div className="h-7 w-64 bg-cream/10 rounded-lg mb-5" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-40 md:min-w-44 flex flex-col gap-3">
              <div className="w-full aspect-square rounded-xl bg-cream/10" />
              <div className="h-4 w-3/4 bg-cream/10 rounded" />
              <div className="h-3 w-1/2 bg-cream/10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 md:p-10 flex flex-col gap-2 mt-4">
        <div className="h-6 w-40 bg-cream/10 rounded-lg mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-cream/10 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function HomeView({ onContextMenu }: HomeViewProps) {
  const router = useRouter();
  const { tracks, recentlyPlayed, playTrack, isLoading } = useAudio();

  const [artists, setArtists]           = useState<ArtistRow[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<AlbumRow[]>([]);
  const [newAlbums, setNewAlbums]       = useState<AlbumRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [homeCategory, setHomeCategory] = useState<"all" | "music" | "podcast">("all");

  useEffect(() => {
    if (!supabase) { setCatalogLoading(false); return; }
    let cancelled = false;

    Promise.all([
      supabase.from("artists").select("id,display_name,slug,image,track_count,album_count")
        .order("track_count", { ascending: false }).limit(10),
      supabase.from("albums")
        .select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)")
        .order("track_count", { ascending: false }).limit(10),
      supabase.from("albums")
        .select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)")
        .order("created_at", { ascending: false }).limit(8),
    ]).then(([artRes, popAlbRes, newAlbRes]) => {
      if (cancelled) return;
      setArtists((artRes.data as ArtistRow[]) ?? []);
      setPopularAlbums((popAlbRes.data as unknown as AlbumRow[]) ?? []);
      setNewAlbums((newAlbRes.data as unknown as AlbumRow[]) ?? []);
      setCatalogLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  if (isLoading || catalogLoading) return <HomeSkeleton />;

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  const recentlyPlayedTracks = recentlyPlayed
    .map((id) => tracks.find((t) => t.id === id)!)
    .filter(Boolean)
    .slice(0, 6);

  const filteredTracks = tracks.filter((t) => {
    if (t.is_active === false) return false;
    if (homeCategory === "all") return true;
    if (homeCategory === "music") return !t.type || t.type === "music";
    return t.type === homeCategory;
  });

  const getAlbumColors = (album: AlbumRow): [string, string] => {
    const c = album.cover_colors;
    if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
    if (typeof c === "string") {
      try {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed) && parsed.length >= 2) return [parsed[0], parsed[1]];
      } catch {}
    }
    return ["#F0824E", "#1E9E54"];
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Hero */}
      <div className="hero bg-gradient-to-b from-forest/40 to-forest-dark p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-green/5 rounded-full blur-3xl" />
        <div className="hero-info flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-cream/70">{getGreeting()}</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-cream tracking-tight">Discover</h2>
        </div>
      </div>

      {/* Popular Albums */}
      {popularAlbums.length > 0 && (
        <div className="px-6 md:px-10 pt-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-cream">Popular albums</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {popularAlbums.map((album) => {
              const [c1, c2] = getAlbumColors(album);
              const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
              return (
                <div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  className="flex flex-col gap-3 min-w-36 md:min-w-44 p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                >
                  <div
                    className="w-full aspect-square rounded-md shadow-lg relative overflow-hidden flex-none"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    {album.cover_image && (
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute right-2 bottom-2 w-12 h-12 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all z-10">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-bold text-cream truncate block">{album.title}</span>
                    {artistInfo && (
                      <span className="text-sm text-muted truncate block mt-1">{artistInfo.display_name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popular Artists */}
      {artists.length > 0 && (
        <div className="px-6 md:px-10 pt-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-cream">Popular artists</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {artists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                className="flex flex-col items-center gap-3 min-w-36 md:min-w-40 p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
              >
                <div className="w-full aspect-square rounded-full bg-panel/50 border border-cream/5 shadow-lg flex items-center justify-center group-hover:bg-panel transition-colors overflow-hidden relative">
                  {artist.image ? (
                    <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-coral/20 to-pink/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <svg viewBox="0 0 24 24" className="w-16 h-16 fill-muted group-hover:fill-cream transition-colors">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </>
                  )}
                  <div className="absolute right-1 bottom-1 w-10 h-10 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all z-10">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-forest-dark ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="min-w-0 text-center">
                  <span className="text-sm font-bold text-cream truncate block">{artist.display_name}</span>
                  <span className="text-xs text-muted block mt-0.5">{artist.track_count} songs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Releases */}
      {newAlbums.length > 0 && (
        <div className="px-6 md:px-10 pt-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-cream">New releases</h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {newAlbums.map((album) => {
              const [c1, c2] = getAlbumColors(album);
              const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
              return (
                <div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  className="flex flex-col gap-3 min-w-36 md:min-w-44 p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                >
                  <div
                    className="w-full aspect-square rounded-md shadow-lg relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    {album.cover_image && (
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute right-2 bottom-2 w-12 h-12 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all z-10">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-base font-bold text-cream truncate block">{album.title}</span>
                    {artistInfo && (
                      <span className="text-sm text-muted truncate block mt-1">{artistInfo.display_name}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Jump back in */}
      {recentlyPlayedTracks.length > 0 && (
        <div className="px-6 md:px-10 pt-10 animate-fade-in">
          <h3 className="text-xl font-bold tracking-tight text-cream mb-4">Jump back in</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentlyPlayedTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track.id)}
                className="group relative p-4 bg-panel/30 hover:bg-panel/60 rounded-xl flex flex-col gap-3 cursor-pointer transition-all hover:scale-105 shadow-sm hover:shadow-md border border-cream/5"
              >
                <div
                  className="w-full aspect-square rounded-md shadow-lg relative overflow-hidden flex items-center justify-center flex-none"
                  style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-cream/50 transition-transform group-hover:scale-110">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                  <div className="absolute right-2 bottom-2 w-10 h-10 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all z-10">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-cream truncate">{track.title}</div>
                  <div className="text-xs text-muted truncate mt-1">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tracks — Made for you */}
      <div className="p-6 md:p-10 flex flex-col gap-1.5 flex-1 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 px-1">
          <h3 className="text-xl font-bold tracking-tight text-cream">Made for you</h3>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {(["all", "music", "podcast"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setHomeCategory(cat)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer flex-none ${
                  homeCategory === cat
                    ? "bg-cream text-forest-dark shadow-md"
                    : "bg-panel/30 hover:bg-panel border border-cream/5 text-muted hover:text-cream"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/10 flex flex-col items-center gap-3 shadow-inner">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-40">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>No tracks found. Sync your Cloudinary library to get started.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {filteredTracks.map((t, idx) => (
              <TrackRow key={t.id} track={t} index={idx} onContextMenu={onContextMenu} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
