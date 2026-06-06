"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAudio, Track, Playlist, Collection } from "@/context/AudioContext";
import { supabase } from "@/lib/supabase";

interface HomeViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
}

interface ArtistRow { id: string; display_name: string; slug: string; image: string | null; track_count: number; album_count: number }
interface AlbumRow { id: string; title: string; slug: string; cover_image: string | null; cover_colors: string[]; track_count: number; artist_id: string; artists: { display_name: string; slug: string } | null }
interface GenreRow { id: string; name: string; slug: string }
interface LanguageRow { id: string; name: string; code: string | null; slug: string }
interface SingerRow { id: string; name: string; slug: string; image: string | null; track_count: number }

type FilterChip = "All" | "Music" | "Albums" | "Artists" | "Playlists";

export function HomeView({ onContextMenu }: HomeViewProps) {
  const router = useRouter();
  const { tracks, libraryTracks, recentlyPlayed, playTrack, isLoading, setView, isPrivateSession, likedSongs, playlists } = useAudio();

  const [dbArtists, setDbArtists] = useState<ArtistRow[]>([]);
  const [dbAlbums, setDbAlbums] = useState<AlbumRow[]>([]);
  const [popularAlbums, setPopularAlbums] = useState<AlbumRow[]>([]);
  const [newAlbums, setNewAlbums] = useState<AlbumRow[]>([]);
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const [singers, setSingers] = useState<SingerRow[]>([]);
  
  const [userTopArtists, setUserTopArtists] = useState<ArtistRow[]>([]);
  const [userRecentAlbums, setUserRecentAlbums] = useState<AlbumRow[]>([]);
  const [moreLikeAlbums, setMoreLikeAlbums] = useState<AlbumRow[]>([]);
  
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterChip>("All");
  const [greeting, setGreeting] = useState("Good day");

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Compute personalization from AudioContext synchronously
  const { historyTracks, topArtistId, topGenreId } = useMemo(() => {
    if (isPrivateSession || recentlyPlayed.length === 0) return { historyTracks: [], topArtistId: null, topGenreId: null };

    const hist: Track[] = [];
    recentlyPlayed.forEach(id => {
      const t = tracks.find(x => x.id === id);
      if (t) hist.push(t);
    });

    const artistCounts: Record<string, number> = {};
    const genreCounts: Record<string, number> = {};
    
    hist.forEach(t => {
      if (t.artist_id) artistCounts[t.artist_id] = (artistCounts[t.artist_id] || 0) + 1;
      if (t.genre_id) genreCounts[t.genre_id] = (genreCounts[t.genre_id] || 0) + 1;
    });

    const topArtId = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topGenId = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { historyTracks: hist, topArtistId: topArtId, topGenreId: topGenId };
  }, [recentlyPlayed, tracks, isPrivateSession]);

  useEffect(() => {
    if (!supabase) { setCatalogLoading(false); return; }
    let cancelled = false;

    // Extract unique IDs for personalization queries
    const recentArtistIds = Array.from(new Set(historyTracks.map(t => t.artist_id).filter(Boolean))) as string[];
    const recentAlbumIds = Array.from(new Set(historyTracks.map(t => t.album_id).filter(Boolean))) as string[];

    const queries = [
      supabase.from("albums").select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)").order("track_count", { ascending: false }).limit(10),
      supabase.from("albums").select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)").order("created_at", { ascending: false }).limit(10),
      supabase.from("genres").select("id,name,slug").neq("slug", "unknown").limit(20),
      supabase.from("languages").select("id,name,code,slug").neq("slug", "unknown").limit(10),
      supabase.from("singers").select("id,name,slug,image,track_count").order("track_count", { ascending: false }).gt("track_count", 0).limit(10),
      
      // Personalization
      recentArtistIds.length > 0 ? supabase.from("artists").select("id,display_name,slug,image,track_count,album_count").in("id", recentArtistIds) : Promise.resolve({ data: [] }),
      recentAlbumIds.length > 0 ? supabase.from("albums").select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)").in("id", recentAlbumIds) : Promise.resolve({ data: [] }),
      topArtistId ? supabase.from("albums").select("id,title,slug,cover_image,cover_colors,track_count,artist_id,artists(display_name,slug)").eq("artist_id", topArtistId).limit(8) : Promise.resolve({ data: [] }),
    ];

    Promise.all(queries).then((results) => {
      if (cancelled) return;
      setPopularAlbums((results[0].data as unknown as AlbumRow[]) ?? []);
      setNewAlbums((results[1].data as unknown as AlbumRow[]) ?? []);
      setGenres((results[2].data as GenreRow[]) ?? []);
      setLanguages((results[3].data as LanguageRow[]) ?? []);
      setSingers((results[4].data as SingerRow[]) ?? []);
      
      // Sort artists by history frequency
      const fetchedArtists = (results[5].data as ArtistRow[]) ?? [];
      const sortedArtists = [...fetchedArtists].sort((a, b) => {
        const aCount = historyTracks.filter(t => t.artist_id === a.id).length;
        const bCount = historyTracks.filter(t => t.artist_id === b.id).length;
        return bCount - aCount;
      });
      setUserTopArtists(sortedArtists);
      
      // Sort albums by history recency
      const fetchedAlbums = (results[6].data as unknown as AlbumRow[]) ?? [];
      const sortedAlbums = [];
      const seen = new Set();
      for (const t of historyTracks) {
        if (t.album_id && !seen.has(t.album_id)) {
          seen.add(t.album_id);
          const alb = fetchedAlbums.find(a => a.id === t.album_id);
          if (alb) sortedAlbums.push(alb);
        }
      }
      setUserRecentAlbums(sortedAlbums);
      
      setMoreLikeAlbums((results[7].data as unknown as AlbumRow[]) ?? []);
      
      setCatalogLoading(false);
    });

    return () => { cancelled = true; };
  }, [historyTracks, topArtistId]);

  // Heuristic Mix "Made for you" — must stay above any early return (Rules of Hooks)
  const madeForYou = useMemo(() => {
    if (!topGenreId && !topArtistId) return [];
    const candidates = libraryTracks.filter(t => t.genre_id === topGenreId || t.artist_id === topArtistId);
    return candidates.sort(() => Math.random() - 0.5).slice(0, 10);
  }, [libraryTracks, topGenreId, topArtistId]);

  if (isLoading || catalogLoading) return <HomeSkeleton />;

  // Derived data for shelves
  const jumpBackInTracks = historyTracks
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i && t.folder_type !== "collection")
    .slice(0, 10);
  
  // Quick Pick Grid items
  const quickPicks: { id: string; title: string; type: string; image?: string | null; color1: string; color2: string; onClick: () => void; onPlay: (e: any) => void }[] = [];
  if (likedSongs.size > 0) quickPicks.push({ id: "liked", title: "Liked Songs", type: "playlist", color1: "#F0824E", color2: "#E63E6D", onClick: () => setView("liked"), onPlay: (e: any) => { e.stopPropagation(); playTrack(Array.from(likedSongs)[0], Array.from(likedSongs)); } });
  playlists.slice(0, 3).forEach(pl => {
    quickPicks.push({ id: pl.id, title: pl.name, type: "playlist", color1: pl.cover_colors[0], color2: pl.cover_colors[1], onClick: () => setView(`playlist:${pl.id}`), onPlay: (e: any) => { e.stopPropagation(); if(pl.songs.length) playTrack(pl.songs[0], pl.songs); } });
  });
  userRecentAlbums.slice(0, 4).forEach(alb => {
    const c = alb.cover_colors;
    const color1 = Array.isArray(c) && c.length >= 2 ? c[0] : "#1E9E54";
    const color2 = Array.isArray(c) && c.length >= 2 ? c[1] : "#0E3B35";
    quickPicks.push({ 
      id: alb.id, title: alb.title, type: "album", image: alb.cover_image, color1, color2, 
      onClick: () => router.push(`/album/${alb.id}/${alb.slug}`),
      onPlay: (e: any) => { e.stopPropagation(); const albumTracks = tracks.filter(t => t.album_id === alb.id); if(albumTracks.length) playTrack(albumTracks[0].id, albumTracks.map(t=>t.id)); }
    });
  });

  const shouldShow = (category: string) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Music" && (category === "tracks" || category === "albums" || category === "artists" || category === "singers")) return true;
    if (activeFilter === "Albums" && category === "albums") return true;
    if (activeFilter === "Artists" && category === "artists") return true;
    if (activeFilter === "Playlists" && category === "playlists") return true;
    return false;
  };

  const getAlbumColors = (album: any): [string, string] => {
    const c = album.cover_colors;
    if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
    if (typeof c === "string") {
      try { const p = JSON.parse(c); if (Array.isArray(p)) return [p[0], p[1]]; } catch {}
    }
    return ["#F0824E", "#1E9E54"];
  };

  return (
    <div className="flex flex-col min-h-full pb-10 overflow-x-hidden">
      {/* Header */}
      <div className="pt-5 px-6 md:px-8 sticky top-0 z-20 bg-forest-dark/95 backdrop-blur-md border-b border-white/5 pb-3.5">
        <h2 className="font-display font-bold text-2xl md:text-3xl text-cream tracking-tight mb-3">{greeting}</h2>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(["All", "Music", "Albums", "Artists", "Playlists"] as const).map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex-none ${
                activeFilter === chip
                  ? "bg-cream text-forest-dark"
                  : "bg-white/6 text-muted hover:text-cream hover:bg-white/10"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Picks */}
      {shouldShow("playlists") && quickPicks.length > 0 && (
        <div className="px-6 md:px-8 pt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {quickPicks.map((qp) => (
            <div
              key={qp.id}
              onClick={qp.onClick}
              className="group bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-0 cursor-pointer transition-all relative overflow-hidden"
            >
              {qp.image ? (
                <img src={qp.image} alt={qp.title} className="w-14 h-14 object-cover flex-none rounded-l-lg" />
              ) : (
                <div
                  className="w-14 h-14 flex-none rounded-l-lg"
                  style={{ background: `linear-gradient(135deg, ${qp.color1}, ${qp.color2})` }}
                />
              )}
              <span className="font-semibold text-cream text-sm truncate px-3 flex-1">{qp.title}</span>
              <button
                onClick={qp.onPlay}
                className="w-9 h-9 bg-coral rounded-full flex items-center justify-center shadow-lg opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all absolute right-3"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-forest-dark ml-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 1. Jump back in (Tracks) */}
      {shouldShow("tracks") && jumpBackInTracks.length > 0 && (
        <Shelf title="Jump back in">
          {jumpBackInTracks.map(t => (
            <Card 
              key={t.id}
              title={t.title}
              subtitle={t.artist}
              colors={t.cover_colors}
              type="track"
              onClick={() => playTrack(t.id)}
              onPlay={(e) => { e.stopPropagation(); playTrack(t.id); }}
            />
          ))}
        </Shelf>
      )}

      {/* 3. Recently played (Albums) */}
      {shouldShow("albums") && userRecentAlbums.length > 0 && (
        <Shelf title="Recently played">
          {userRecentAlbums.map(alb => {
            const [c1, c2] = getAlbumColors(alb);
            const artistName = Array.isArray(alb.artists) ? alb.artists[0]?.display_name : alb.artists?.display_name;
            return (
              <Card 
                key={alb.id} title={alb.title} subtitle={artistName} image={alb.cover_image} colors={[c1, c2]} type="album"
                onClick={() => router.push(`/album/${alb.id}/${alb.slug}`)}
                onPlay={(e) => { e.stopPropagation(); const tr = tracks.filter(t=>t.album_id===alb.id); if(tr.length) playTrack(tr[0].id, tr.map(t=>t.id)); }}
              />
            )
          })}
        </Shelf>
      )}

      {/* 4. Made for you */}
      {shouldShow("tracks") && madeForYou.length > 0 && (
        <Shelf title="Made for you" subtitle="A heuristic mix based on your history">
          {madeForYou.map(t => (
            <Card 
              key={t.id} title={t.title} subtitle={t.artist} colors={t.cover_colors} type="track"
              onClick={() => playTrack(t.id)}
              onPlay={(e) => { e.stopPropagation(); playTrack(t.id); }}
            />
          ))}
        </Shelf>
      )}

      {/* 5. Your top artists */}
      {shouldShow("artists") && userTopArtists.length > 0 && (
        <Shelf title="Your top artists">
          {userTopArtists.map(art => (
            <Card 
              key={art.id} title={art.display_name} subtitle="Artist" image={art.image} type="artist"
              onClick={() => router.push(`/artist/${art.id}/${art.slug}`)}
              onPlay={(e) => { e.stopPropagation(); const tr = tracks.filter(t=>t.artist_id===art.id); if(tr.length) playTrack(tr[0].id, tr.map(t=>t.id)); }}
            />
          ))}
        </Shelf>
      )}

      {/* 6. More like Top Artist */}
      {shouldShow("albums") && moreLikeAlbums.length > 0 && userTopArtists[0] && (
        <Shelf title={`More from ${userTopArtists[0].display_name}`}>
          {moreLikeAlbums.map(alb => {
            const [c1, c2] = getAlbumColors(alb);
            return (
              <Card 
                key={alb.id} title={alb.title} subtitle="Album" image={alb.cover_image} colors={[c1, c2]} type="album"
                onClick={() => router.push(`/album/${alb.id}/${alb.slug}`)}
                onPlay={(e) => { e.stopPropagation(); const tr = tracks.filter(t=>t.album_id===alb.id); if(tr.length) playTrack(tr[0].id, tr.map(t=>t.id)); }}
              />
            )
          })}
        </Shelf>
      )}

      {/* 7. Popular albums */}
      {shouldShow("albums") && popularAlbums.length > 0 && (
        <Shelf title="Popular albums">
          {popularAlbums.map(alb => {
            const [c1, c2] = getAlbumColors(alb);
            const artistName = Array.isArray(alb.artists) ? alb.artists[0]?.display_name : alb.artists?.display_name;
            return (
              <Card 
                key={alb.id} title={alb.title} subtitle={artistName} image={alb.cover_image} colors={[c1, c2]} type="album"
                onClick={() => router.push(`/album/${alb.id}/${alb.slug}`)}
                onPlay={(e) => { e.stopPropagation(); const tr = tracks.filter(t=>t.album_id===alb.id); if(tr.length) playTrack(tr[0].id, tr.map(t=>t.id)); }}
              />
            )
          })}
        </Shelf>
      )}

      {/* 8. Browse by genre */}
      {shouldShow("playlists") && genres.length > 0 && (
        <Shelf title="Browse by genre">
          {genres.map(g => (
            <Card 
              key={g.id} title={g.name} subtitle="Genre" type="genre" colors={["#1E9E54", "#0E3B35"]}
              onClick={() => router.push(`/genre/${g.id}/${g.slug}`)}
            />
          ))}
        </Shelf>
      )}

      {/* 9. Browse by language */}
      {shouldShow("playlists") && languages.length > 0 && (
        <Shelf title="Browse by language">
          {languages.map(l => (
            <Card 
              key={l.id} title={l.name} subtitle="Language" type="language" colors={["#3E8B96", "#0E3B35"]}
              onClick={() => router.push(`/language/${l.id}/${l.slug}`)}
            />
          ))}
        </Shelf>
      )}

      {/* 10. Popular singers */}
      {shouldShow("singers") && singers.length > 0 && (
        <Shelf title="Popular singers">
          {singers.map(s => (
            <Card 
              key={s.id} title={s.name} subtitle="Singer" image={s.image} type="artist"
              onClick={() => router.push(`/singer/${s.id}/${s.slug}`)}
            />
          ))}
        </Shelf>
      )}

      {/* 11. Recently added */}
      {shouldShow("albums") && newAlbums.length > 0 && (
        <Shelf title="Recently added">
          {newAlbums.map(alb => {
            const [c1, c2] = getAlbumColors(alb);
            const artistName = Array.isArray(alb.artists) ? alb.artists[0]?.display_name : alb.artists?.display_name;
            return (
              <Card 
                key={alb.id} title={alb.title} subtitle={artistName} image={alb.cover_image} colors={[c1, c2]} type="album"
                onClick={() => router.push(`/album/${alb.id}/${alb.slug}`)}
                onPlay={(e) => { e.stopPropagation(); const tr = tracks.filter(t=>t.album_id===alb.id); if(tr.length) playTrack(tr[0].id, tr.map(t=>t.id)); }}
              />
            )
          })}
        </Shelf>
      )}

    </div>
  );
}

// ----------------------------------------------------
// UI Subcomponents
// ----------------------------------------------------

function Shelf({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="px-6 md:px-8 pt-8">
      <div className="mb-4 flex items-baseline gap-3">
        <h3 className="text-xl font-bold tracking-tight text-cream">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
        {children}
      </div>
    </div>
  );
}

interface CardProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  colors?: string[];
  type: "album" | "artist" | "track" | "playlist" | "genre" | "language";
  onClick: () => void;
  onPlay?: (e: React.MouseEvent) => void;
}

function Card({ title, subtitle, image, colors, type, onClick, onPlay }: CardProps) {
  const isRounded = type === "artist";
  const c1 = colors?.[0] || "#333";
  const c2 = colors?.[1] || "#111";

  return (
    <div
      onClick={onClick}
      className="flex flex-col gap-2.5 min-w-[148px] md:min-w-[168px] max-w-[148px] md:max-w-[168px] p-3 bg-white/4 hover:bg-white/8 rounded-xl cursor-pointer group transition-all"
    >
      <div
        className={`w-full aspect-square relative overflow-hidden flex items-center justify-center shadow-md ${isRounded ? "rounded-full" : "rounded-lg"}`}
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <svg viewBox="0 0 24 24" className={`fill-cream/40 ${isRounded ? "w-14 h-14" : "w-10 h-10"}`}>
            {isRounded
              ? <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              : <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />}
          </svg>
        )}
        {onPlay && (
          <button
            onClick={onPlay}
            className="absolute right-2 bottom-2 w-10 h-10 bg-coral rounded-full flex items-center justify-center shadow-lg translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-forest-dark ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>
      <div className="min-w-0">
        <span className="text-sm font-semibold text-cream truncate block leading-tight">{title}</span>
        {subtitle && <span className="text-xs text-muted truncate block mt-0.5">{subtitle}</span>}
      </div>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col min-h-full pb-10 animate-pulse">
      <div className="p-6 md:p-8 border-b border-white/5">
        <div className="h-8 w-48 bg-white/8 rounded-lg mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-8 w-20 bg-white/8 rounded-full" />)}
        </div>
      </div>
      <div className="px-6 md:px-8 pt-6 grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-14 bg-white/8 rounded-lg" />)}
      </div>
      {[1, 2, 3].map((section) => (
        <div key={section} className="px-6 md:px-8 pt-8">
          <div className="h-5 w-40 bg-white/8 rounded mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[148px] md:min-w-[168px] flex flex-col gap-2.5 p-3">
                <div className="w-full aspect-square rounded-lg bg-white/8" />
                <div className="h-3.5 w-3/4 bg-white/8 rounded" />
                <div className="h-3 w-1/2 bg-white/8 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
