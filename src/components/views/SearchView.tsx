"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAudio, Track } from "@/context/AudioContext";
import { supabase } from "@/lib/supabase";
import { TrackRow } from "@/components/ui/TrackRow";
import Image from "next/image";

interface ArtistResult   { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface AlbumResult    { id: string; title: string; slug: string; cover_image: string | null; cover_colors: string[]; artists: { display_name: string; slug: string } | null }
interface PlaylistResult { id: string; name: string; cover_colors: string[] }
interface SingerResult   { id: string; name: string; slug: string; image: string | null; track_count: number }
interface GenreResult    { id: string; name: string; slug: string }
interface LanguageResult { id: string; name: string; code: string | null; slug: string }

const GENRES = [
  { id: "music",     label: "All Music",     type: "music"     as const, keywords: [],                           from: "#E13300", to: "#FF6B35" },
  { id: "acoustic",  label: "Acoustic Chill", type: "music"    as const, keywords: ["acoustic","chill","folk"],   from: "#1E3264", to: "#2E4A96" },
  { id: "beats",     label: "Lo-Fi Beats",   type: "music"     as const, keywords: ["beat","lo-fi","lofi","anno"],from: "#8D67AB", to: "#B388D6" },
  { id: "podcast",   label: "Podcasts",      type: "podcast"   as const, keywords: [],                           from: "#1DB954", to: "#34D068" },
  { id: "audiobook", label: "Audiobooks",    type: "audiobook" as const, keywords: [],                           from: "#B02897", to: "#D644BB" },
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

const RECENT_SEARCHES_KEY = "vibeblower_recent_searches";
const MAX_RECENT = 10;

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveRecentSearch(query: string) {
  try {
    const existing = loadRecentSearches().filter((q) => q !== query);
    const updated = [query, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

function removeRecentSearch(query: string) {
  try {
    const updated = loadRecentSearches().filter((q) => q !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

export function SearchView() {
  const router = useRouter();
  const { tracks, libraryTracks, searchQuery, setSearchQuery, isLoading } = useAudio();
  const [activeGenre, setActiveGenre] = useState<(typeof GENRES)[number] | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const [artistResults,   setArtistResults]   = useState<ArtistResult[]>([]);
  const [albumResults,    setAlbumResults]    = useState<AlbumResult[]>([]);
  const [trackResults,    setTrackResults]    = useState<Track[]>([]);
  const [playlistResults, setPlaylistResults] = useState<PlaylistResult[]>([]);
  const [singerResults,   setSingerResults]   = useState<SingerResult[]>([]);
  const [genreResults,    setGenreResults]    = useState<GenreResult[]>([]);
  const [languageResults, setLanguageResults] = useState<LanguageResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const handleDeleteRecent = (query: string) => {
    removeRecentSearch(query);
    setRecentSearches(loadRecentSearches());
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery || searchQuery.length < 2) {
      setArtistResults([]); setAlbumResults([]);
      setTrackResults([]); setPlaylistResults([]);
      setSingerResults([]); setGenreResults([]); setLanguageResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      if (!supabase) {
        const q = searchQuery.toLowerCase();
        const filtered = libraryTracks.filter(
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

      const [artRes, albRes, trkRes, plRes, sinRes, genRes, langRes] = await Promise.all([
        supabase.from("artists").select("id,display_name,slug,image,track_count").ilike("display_name", `%${q}%`).limit(6),
        supabase.from("albums").select("id,title,slug,cover_image,cover_colors,artists(display_name,slug)").ilike("title", `%${q}%`).limit(6),
        supabase.from("tracks")
          .select("id,title,artist,album,audio_url,cover_colors,duration_sec,is_active,artist_id,album_id,track_number,asset_id,track_singers(singers(name))")
          .or(`title.ilike.%${q}%,artist.ilike.%${q}%,album.ilike.%${q}%`)
          .eq("is_active", true).neq("folder_type", "collection").limit(20),
        supabase.from("playlists").select("id,name,cover_colors").ilike("name", `%${q}%`).eq("is_public", true).limit(5),
        supabase.from("singers").select("id,name,slug,image,track_count").ilike("name", `%${q}%`).limit(6),
        supabase.from("genres").select("id,name,slug").ilike("name", `%${q}%`).limit(5),
        supabase.from("languages").select("id,name,code,slug").ilike("name", `%${q}%`).limit(5),
      ]);

      setArtistResults((artRes.data as ArtistResult[]) ?? []);
      setAlbumResults((albRes.data as unknown as AlbumResult[]) ?? []);
      setTrackResults(((trkRes.data as any[]) ?? []).map((t) => ({
        ...t,
        singers: (t.track_singers ?? []).map((ts: any) => ts.singers?.name).filter(Boolean),
      })) as Track[]);
      setPlaylistResults((plRes.data as PlaylistResult[]) ?? []);
      setSingerResults((sinRes.data as SingerResult[]) ?? []);
      setGenreResults((genRes.data as GenreResult[]) ?? []);
      setLanguageResults((langRes.data as LanguageResult[]) ?? []);
      setSearching(false);
      saveRecentSearch(q);
      setRecentSearches(loadRecentSearches());
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tracks]);

  const genreFilteredTracks = useMemo(() =>
    activeGenre ? libraryTracks.filter((t) => t.is_active !== false && matchesGenre(t, activeGenre)) : [],
    [activeGenre, libraryTracks]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col p-6 md:p-8 min-h-full pb-20 animate-pulse">
        <div className="h-9 w-56 bg-white/8 rounded-lg mb-2.5" />
        <div className="h-4 w-40 bg-white/8 rounded mb-8" />
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-white/8 rounded-lg mb-2" />)}
      </div>
    );
  }

  const hasQuery   = searchQuery.length >= 2;
  const hasResults = artistResults.length + albumResults.length + trackResults.length +
                     playlistResults.length + singerResults.length + genreResults.length + languageResults.length > 0;

  return (
    <div className="flex flex-col p-6 md:p-8 min-h-full pb-20">
      <div className="md:hidden relative w-full flex items-center bg-white/8 hover:bg-white/12 border border-white/10 rounded-full px-4 py-2.5 mb-6 transition-all">
        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-muted mr-2.5 flex-none">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="What do you want to play?"
          className="flex-1 bg-transparent border-none outline-none text-cream text-sm placeholder-muted/60 focus:ring-0 p-0"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold font-display text-cream tracking-tight">
          {searchQuery ? `Results for "${searchQuery}"` : activeGenre ? activeGenre.label : "Search Catalogue"}
        </h2>
        <p className="text-sm text-muted mt-1">
          {hasQuery
            ? searching ? "Searching…" : hasResults ? "Grouped results below" : "No results found"
            : "Search artists, albums, tracks, playlists"}
        </p>
      </div>

      {/* Recent searches — shown when no active query */}
      {!hasQuery && !activeGenre && recentSearches.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-cream uppercase tracking-wider">Recent Searches</h3>
            <button
              onClick={() => {
                try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch {}
                setRecentSearches([]);
              }}
              className="text-xs text-muted hover:text-cream transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-col gap-1">
            {recentSearches.map((q) => (
              <div
                key={q}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/6 transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted flex-none">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                </svg>
                <span
                  className="flex-1 text-sm text-cream"
                  onClick={() => handleRecentSearchClick(q)}
                >
                  {q}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteRecent(q); }}
                  aria-label={`Remove "${q}" from recent searches`}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-cream transition-all p-1 rounded"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasQuery && (
        <div className="flex flex-col gap-8">
          {artistResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Artists</h3>
              <div className="overflow-hidden"><div className="flex gap-4 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                {artistResults.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                    className="flex flex-col items-center gap-2 min-w-32 p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/6 border border-white/8 overflow-hidden flex items-center justify-center">
                      {artist.image
                        ? <Image width={400} height={400} src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                        : <svg viewBox="0 0 24 24" className="w-10 h-10 fill-muted"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                      }
                    </div>
                    <span className="text-sm font-bold text-cream text-center truncate w-full">{artist.display_name}</span>
                    <span className="text-xs text-muted">Artist</span>
                  </div>
                ))}
              </div></div>
            </section>
          )}

          {albumResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Albums</h3>
              <div className="overflow-hidden"><div className="flex gap-4 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                {albumResults.map((album) => {
                  const [c1, c2] = getAlbumColors(album);
                  const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
                  return (
                    <div
                      key={album.id}
                      onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                      className="flex flex-col gap-2 min-w-36 p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
                    >
                      <div
                        className="w-full aspect-square rounded-md overflow-hidden"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                      >
                        {album.cover_image && <Image width={400} height={400} src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-sm font-bold text-cream truncate">{album.title}</span>
                      {artistInfo && <span className="text-xs text-muted truncate">{artistInfo.display_name}</span>}
                    </div>
                  );
                })}
              </div></div>
            </section>
          )}

          {trackResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Tracks</h3>
              <div className="rounded-xl border border-white/5 overflow-hidden">
                {trackResults.map((t, idx) => (
                  <TrackRow key={t.id} track={t} index={idx} playQueue={trackResults.map(x => x.id)} />
                ))}
              </div>
            </section>
          )}

          {playlistResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Playlists</h3>
              <div className="overflow-hidden"><div className="flex gap-4 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                {playlistResults.map((pl) => {
                  const c = Array.isArray(pl.cover_colors) ? pl.cover_colors : ["#F0824E","#1E9E54"];
                  return (
                    <div key={pl.id} className="flex flex-col gap-2 min-w-36 p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all">
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
              </div></div>
            </section>
          )}

          {singerResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Singers</h3>
              <div className="overflow-hidden"><div className="flex gap-4 overflow-x-auto pb-4 -mb-4 no-scrollbar">
                {singerResults.map((singer) => (
                  <div key={singer.id} onClick={() => router.push(`/singer/${singer.id}/${singer.slug}`)}
                    className="flex flex-col items-center gap-2 min-w-32 p-3 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all">
                    <div className="w-20 h-20 rounded-full bg-white/6 border border-white/8 overflow-hidden flex items-center justify-center">
                      {singer.image
                        ? <Image width={400} height={400} src={singer.image} alt={singer.name} className="w-full h-full object-cover" />
                        : <svg viewBox="0 0 24 24" className="w-10 h-10 fill-muted">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2z" />
                          </svg>}
                    </div>
                    <span className="text-sm font-bold text-cream text-center truncate w-full">{singer.name}</span>
                    <span className="text-xs text-muted">Singer · {singer.track_count} songs</span>
                  </div>
                ))}
              </div></div>
            </section>
          )}

          {genreResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Genres</h3>
              <div className="flex gap-3 flex-wrap">
                {genreResults.map((genre) => (
                  <div key={genre.id} onClick={() => router.push(`/genre/${genre.id}/${genre.slug}`)}
                    className="px-4 py-2 rounded-full bg-coral/10 border border-coral/20 text-coral font-bold text-sm hover:bg-coral/20 transition-colors cursor-pointer">
                    {genre.name}
                  </div>
                ))}
              </div>
            </section>
          )}

          {languageResults.length > 0 && (
            <section>
              <h3 className="text-lg font-bold text-cream mb-3">Languages</h3>
              <div className="flex gap-3 flex-wrap">
                {languageResults.map((lang) => (
                  <div key={lang.id} onClick={() => router.push(`/language/${lang.id}/${lang.slug}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border border-green/20 text-green font-bold text-sm hover:bg-green/20 transition-colors cursor-pointer">
                    {lang.name}
                    {lang.code && <span className="text-xs font-mono opacity-60 uppercase">{lang.code}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!searching && !hasResults && (
            <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-panel/30 flex flex-col items-center gap-4">
              <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              No results for &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>
      )}

      {!hasQuery && (
        <>
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
                <div className="rounded-xl overflow-hidden border border-white/5 mb-6">
                  {genreFilteredTracks.map((t, idx) => (
                    <TrackRow key={t.id} track={t} index={idx} playQueue={genreFilteredTracks.map(x => x.id)} />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted text-sm border border-white/5 rounded-2xl bg-panel/20 mb-6">
                  No {activeGenre.label} tracks yet. Sync your library to add tracks.
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-lg font-bold text-cream mb-3">Browse by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {GENRES.map((genre) => {
                const isActive = activeGenre?.id === genre.id;
                const count = tracks.filter((t) => t.is_active !== false && matchesGenre(t, genre)).length;
                return (
                  <button
                    key={genre.id}
                    onClick={() => setActiveGenre(isActive ? null : genre)}
                    className={`p-4 rounded-xl relative overflow-hidden shadow-md cursor-pointer text-left transition-all hover:scale-[1.02] active:scale-[0.98] aspect-video ${
                      isActive ? "ring-2 ring-white/50" : ""
                    }`}
                    style={{ background: `linear-gradient(135deg, ${genre.from}, ${genre.to})` }}
                  >
                    <span className="relative z-10 text-white font-bold text-lg leading-tight block">{genre.label}</span>
                    <span className="relative z-10 text-white/60 text-xs block mt-1">
                      {count} track{count !== 1 ? "s" : ""}
                    </span>
                    {isActive && (
                      <span className="absolute top-2.5 right-2.5 bg-white/25 rounded-full p-1 z-10">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    )}
                    <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-xl rotate-12" />
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
