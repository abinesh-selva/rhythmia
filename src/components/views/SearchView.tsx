"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAudio, Track } from "@/context/AudioContext";
import { supabase } from "@/lib/supabase";
import { TrackRow } from "@/components/ui/TrackRow";

interface SearchViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
  showToast: (msg: string) => void;
}

interface ArtistResult  { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface AlbumResult   { id: string; title: string; slug: string; cover_image: string | null; cover_colors: string[]; artists: { display_name: string; slug: string } | null }
interface PlaylistResult { id: string; name: string; cover_colors: string[] }

const GENRES = [
  { id: "music",    label: "All Music",     type: "music"    as const, keywords: [],                        gradient: "from-[#E13300] to-[#FF6B35]" },
  { id: "acoustic", label: "Acoustic Chill", type: "music"   as const, keywords: ["acoustic","chill","folk"], gradient: "from-[#1E3264] to-[#2E4A96]" },
  { id: "beats",    label: "Lo-Fi Beats",   type: "music"    as const, keywords: ["beat","lo-fi","lofi","anno"], gradient: "from-[#8D67AB] to-[#B388D6]" },
  { id: "podcast",  label: "Podcasts",      type: "podcast"  as const, keywords: [],                        gradient: "from-[#1DB954] to-[#34D068]" },
  { id: "audiobook",label: "Audiobooks",    type: "audiobook"as const, keywords: [],                        gradient: "from-[#B02897] to-[#D644BB]" },
];

function matchesGenre(track: Track, genre: (typeof GENRES)[number]): boolean {
  if (genre.type === "podcast")   return track.type === "podcast";
  if (genre.type === "audiobook") return track.type === "audiobook";
  if (track.type === "podcast" || track.type === "audiobook") return false;
  if (genre.keywords.length === 0) return true;
  const hay = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
  return genre.keywords.some((kw) => hay.includes(kw));
}

function getAlbumColors(album: AlbumResult): [string, string] {
  const c = album.cover_colors;
  if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
  if (typeof c === "string") {
    try { const p = JSON.parse(c); if (Array.isArray(p)) return [p[0], p[1]]; } catch {}
  }
  return ["#F0824E", "#1E9E54"];
}

export function SearchView({ onContextMenu, showToast }: SearchViewProps) {
  const router = useRouter();
  const { tracks, searchQuery, isLoading } = useAudio();
  const [activeGenre, setActiveGenre] = useState<(typeof GENRES)[number] | null>(null);

  // Grouped search results (DB-driven)
  const [artistResults,  setArtistResults]  = useState<ArtistResult[]>([]);
  const [albumResults,   setAlbumResults]   = useState<AlbumResult[]>([]);
  const [trackResults,   setTrackResults]   = useState<Track[]>([]);
  const [playlistResults,setPlaylistResults]= useState<PlaylistResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setArtistResults([]); setAlbumResults([]);
      setTrackResults([]); setPlaylistResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!supabase) {
        // Offline: filter from AudioContext tracks only
        const q = searchQuery.toLowerCase();
        const filtered = tracks.filter(
          (t) => t.is_active !== false && (
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q) ||
            (t.album ?? "").toLowerCase().includes(q)
          )
        );
        setTrackResults(filtered.slice(0, 20));
        return;
      }

      setSearching(true);
      const q = searchQuery;

      const [artRes, albRes, trkRes, plRes] = await Promise.all([
        supabase.from("artists")
          .select("id,display_name,slug,image,track_count")
          .ilike("display_name", `%${q}%`)
          .limit(6),
        supabase.from("albums")
          .select("id,title,slug,cover_image,cover_colors,artists(display_name,slug)")
          .ilike("title", `%${q}%`)
          .limit(6),
        supabase.from("tracks")
          .select("id,title,artist,album,audio_url,cover_colors,duration_sec,is_active,artist_id,album_id,track_number,asset_id")
          .or(`title.ilike.%${q}%,artist.ilike.%${q}%,album.ilike.%${q}%`)
          .eq("is_active", true)
          .limit(20),
        supabase.from("playlists")
          .select("id,name,cover_colors")
          .ilike("name", `%${q}%`)
          .eq("is_public", true)
          .limit(5),
      ]);

      setArtistResults((artRes.data as ArtistResult[]) ?? []);
      setAlbumResults((albRes.data as unknown as AlbumResult[]) ?? []);
      setTrackResults((trkRes.data as unknown as Track[]) ?? []);
      setPlaylistResults((plRes.data as PlaylistResult[]) ?? []);
      setSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, tracks]);

  if (isLoading) {
    return (
      <div className="flex flex-col p-6 md:p-10 min-h-full pb-20 animate-pulse">
        <div className="h-10 w-64 bg-cream/10 rounded-xl mb-3" />
        <div className="h-4 w-48 bg-cream/10 rounded mb-8" />
        {[1,2,3,4,5].map((i) => <div key={i} className="h-14 bg-cream/10 rounded-xl mb-2" />)}
      </div>
    );
  }

  const hasQuery  = searchQuery.length >= 2;
  const hasResults = artistResults.length + albumResults.length + trackResults.length + playlistResults.length > 0;

  // Genre-filtered local tracks (when no search query)
  const genreFilteredTracks = activeGenre
    ? tracks.filter((t) => t.is_active !== false && matchesGenre(t, activeGenre))
    : [];

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight">
          {searchQuery ? `Results for "${searchQuery}"` : activeGenre ? activeGenre.label : "Search Catalogue"}
        </h2>
        <p className="text-sm text-muted mt-1">
          {hasQuery
            ? searching ? "Searching…" : hasResults ? "Grouped results below" : "No results found"
            : "Search artists, albums, tracks, playlists"}
        </p>
      </div>

      {/* ── Active search: grouped results ─────────────────────── */}
      {hasQuery && (
        <div className="flex flex-col gap-8">
          {/* Artists */}
          {artistResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Artists</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {artistResults.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                    className="flex flex-col items-center gap-2 min-w-[120px] p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                  >
                    <div className="w-20 h-20 rounded-full bg-panel/50 border border-cream/5 overflow-hidden flex items-center justify-center">
                      {artist.image
                        ? <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                        : <svg viewBox="0 0 24 24" className="w-10 h-10 fill-muted"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                      }
                    </div>
                    <span className="text-sm font-bold text-cream text-center truncate w-full">{artist.display_name}</span>
                    <span className="text-xs text-muted">Artist</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {albumResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Albums</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {albumResults.map((album) => {
                  const [c1, c2] = getAlbumColors(album);
                  const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
                  return (
                    <div
                      key={album.id}
                      onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                      className="flex flex-col gap-2 min-w-[140px] p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                    >
                      <div
                        className="w-full aspect-square rounded-md overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                      >
                        {album.cover_image && <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-sm font-bold text-cream truncate">{album.title}</span>
                      {artistInfo && <span className="text-xs text-muted truncate">{artistInfo.display_name}</span>}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tracks */}
          {trackResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Tracks</h3>
              <div className="bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
                {trackResults.map((t, idx) => (
                  <TrackRow key={t.id} track={t} index={idx} onContextMenu={onContextMenu} />
                ))}
              </div>
            </section>
          )}

          {/* Playlists */}
          {playlistResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Playlists</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {playlistResults.map((pl) => {
                  const c = Array.isArray(pl.cover_colors) ? pl.cover_colors : ["#F0824E","#1E9E54"];
                  return (
                    <div key={pl.id} className="flex flex-col gap-2 min-w-[140px] p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all">
                      <div
                        className="w-full aspect-square rounded-md flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }}
                      >
                        <svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream/60"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg>
                      </div>
                      <span className="text-sm font-bold text-cream truncate">{pl.name}</span>
                      <span className="text-xs text-muted">Playlist</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {!searching && !hasResults && (
            <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/30 flex flex-col items-center gap-4">
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* ── Genre filter (no active search) ────────────────────── */}
      {!hasQuery && (
        <>
          {/* Genre-filtered track list */}
          {activeGenre && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted">{genreFilteredTracks.length} tracks</span>
                <button onClick={() => setActiveGenre(null)} className="text-xs text-coral font-semibold hover:underline flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                  Clear
                </button>
              </div>
              {genreFilteredTracks.length > 0 ? (
                <div className="bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5 mb-6">
                  {genreFilteredTracks.map((t, idx) => (
                    <TrackRow key={t.id} track={t} index={idx} onContextMenu={onContextMenu} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/20 mb-6">
                  No {activeGenre.label} tracks yet. Sync your Cloudinary library.
                </div>
              )}
            </div>
          )}

          {/* Browse All genre grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold tracking-tight text-cream">Browse by Category</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {GENRES.map((genre) => {
                const isActive = activeGenre?.id === genre.id;
                const count = tracks.filter((t) => t.is_active !== false && matchesGenre(t, genre)).length;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setActiveGenre(isActive ? null : genre)}
                    className={`p-5 rounded-2xl bg-gradient-to-br ${genre.gradient} font-bold text-xl md:text-2xl aspect-[1.3] relative overflow-hidden shadow-lg cursor-pointer text-left transition-all hover:scale-[1.03] active:scale-[0.98] ${
                      isActive ? "ring-4 ring-cream/60 scale-[1.03] brightness-110" : "hover:brightness-105"
                    }`}
                  >
                    <span className="relative z-10 text-white drop-shadow-md">{genre.label}</span>
                    <span className="relative z-10 text-white/70 text-xs font-normal block mt-1">
                      {count} track{count !== 1 ? "s" : ""}
                    </span>
                    {isActive && (
                      <span className="absolute top-3 right-3 bg-white/30 rounded-full p-1 z-10">
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                      </span>
                    )}
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/15 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
