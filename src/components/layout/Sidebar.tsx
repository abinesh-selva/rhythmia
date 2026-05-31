"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAudio } from "../../context/AudioContext";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useDialog } from "../../context/DialogContext";

interface ArtistRow { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface AlbumRow  { id: string; title: string; slug: string; cover_colors: string[]; artist_id: string; artists: { display_name: string } | null }

export function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { view, setView, playlists, createPlaylist, likedSongs } = useAudio();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { showPrompt } = useDialog();

  const [libraryFilter, setLibraryFilter] = useState<"all" | "playlists" | "artists" | "albums">("all");
  const [dbArtists, setDbArtists] = useState<ArtistRow[]>([]);
  const [dbAlbums,  setDbAlbums]  = useState<AlbumRow[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

  const handleSpotifyEnrich = async () => {
    setIsEnriching(true);
    try {
      const res = await fetch("/api/spotify-enrich", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        addToast(data.message, "success");
      } else {
        addToast("Error: " + data.error, "error");
      }
    } catch (err: any) {
      addToast("Error: " + err.message, "error");
    }
    setIsEnriching(false);
  };

  useEffect(() => {
    if (!supabase) return;
    supabase.from("artists")
      .select("id,display_name,slug,image,track_count")
      .order("track_count", { ascending: false })
      .limit(30)
      .then(({ data }) => setDbArtists((data as ArtistRow[]) ?? []));

    supabase.from("albums")
      .select("id,title,slug,cover_colors,artist_id,artists(display_name)")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => setDbAlbums((data as unknown as AlbumRow[]) ?? []));
  }, []);

  const handleCreatePlaylist = async () => {
    const pName = await showPrompt({
      title: "New Playlist",
      description: "Give your playlist a name to get started.",
      placeholder: "My Playlist",
      confirmLabel: "Create",
    });
    if (!pName) return;
    const plId = await createPlaylist(pName);
    if (plId) setView(`playlist:${plId}`);
  };

  const isArtistActive = (id: string) => pathname === `/artist/${id}` || pathname.startsWith(`/artist/${id}/`);
  const isAlbumActive  = (id: string) => pathname === `/album/${id}`  || pathname.startsWith(`/album/${id}/`);

  const getAlbumColors = (album: AlbumRow): [string, string] => {
    const c = album.cover_colors;
    if (Array.isArray(c) && c.length >= 2) return [c[0], c[1]];
    if (typeof c === "string") {
      try { const p = JSON.parse(c); if (Array.isArray(p)) return [p[0], p[1]]; } catch {}
    }
    return ["#F0824E", "#1E9E54"];
  };

  return (
    <aside className="sidebar hidden md:flex flex-col gap-2 min-h-0 relative z-20">
      {/* Navigation panel */}
      <nav className="nav bg-forest rounded-2xl py-4 px-3 flex flex-col gap-4 shadow-md border border-cream/5">
        <div className="brand flex items-center gap-3 px-3">
          <span className="logo w-9 h-9 rounded-full bg-coral flex items-center justify-center flex-none shadow-inner">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-4-2-8-6-12z" fill="#0E3B35" />
              <path d="M12 7v11" stroke="#fff" strokeWidth="1.4" fill="none" />
            </svg>
          </span>
          <h1 className="font-display font-black text-2xl tracking-tighter text-cream drop-shadow">Soniqo</h1>
        </div>
        <ul className="flex flex-col gap-1 mt-1">
          <li>
            <button
              onClick={() => setView("home")}
              className={`w-full flex items-center gap-4 py-3 px-3 rounded-xl font-bold text-sm transition-all ${
                view === "home" && pathname === "/" ? "text-cream bg-panel shadow-sm" : "text-muted hover:text-cream hover:bg-panel/30"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                {view === "home" && pathname === "/"
                  ? <path d="M12 3L4 9v12h5v-7h6v7h5V9z" />
                  : <path d="M12 3.5l6.5 5v10.5h-4v-7h-5v7h-4V8.5z" />}
              </svg>
              Home
            </button>
          </li>
          <li>
            <button
              onClick={() => setView("search")}
              className={`w-full flex items-center gap-4 py-3 px-3 rounded-xl font-bold text-sm transition-all ${
                view === "search" ? "text-cream bg-panel shadow-sm" : "text-muted hover:text-cream hover:bg-panel/30"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              Search
            </button>
          </li>
        </ul>
      </nav>

      {/* Library Panel */}
      <div className="lib bg-forest rounded-2xl flex-1 flex flex-col min-h-0 shadow-md border border-cream/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-coral/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between px-4 py-3 relative z-10">
          <button className="flex items-center gap-3 font-bold text-muted hover:text-cream transition-colors group">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current group-hover:-translate-y-0.5 transition-transform">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
            </svg>
            Library
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const themes = ["soniqo", "catppuccin", "nord", "spotify"] as const;
                const idx = themes.indexOf(theme);
                setTheme(themes[(idx + 1) % themes.length]);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-cream hover:bg-panel transition-colors"
              title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
            </button>
            <button
              onClick={handleCreatePlaylist}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-cream hover:bg-panel transition-colors"
              title="Create playlist"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
            </button>
            <button
              onClick={() => setView("sync")}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                view === "sync" ? "text-coral bg-coral/10" : "text-muted hover:text-cream hover:bg-panel"
              }`}
              title="Cloudinary Sync"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
            </button>
            <button
              onClick={handleSpotifyEnrich}
              disabled={isEnriching}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                isEnriching ? "text-green bg-green/10 cursor-wait" : "text-muted hover:text-green hover:bg-panel"
              }`}
              title="Enrich Meta with Spotify"
            >
              <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current ${isEnriching ? 'animate-spin' : ''}`}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.08c-.2.31-.61.41-.92.21-2.52-1.54-5.69-1.89-9.42-1.04-.36.08-.72-.15-.8-.51-.08-.36.15-.72.51-.8 4.14-.94 7.64-.53 10.42 1.17.31.2.41.61.21.92zm1.32-2.95c-.25.4-.77.53-1.17.27-2.87-1.77-7.25-2.3-10.74-1.26-.45.14-.92-.12-1.06-.57-.14-.45.12-.92.57-1.06 4.02-1.19 8.86-.59 12.13 1.42.4.26.53.78.27 1.18zm.11-3.1c-3.41-2.03-9.04-2.21-12.27-1.23-.54.16-1.11-.14-1.27-.68-.16-.54.14-1.11.68-1.27 3.73-1.13 10.01-.92 13.97 1.44.49.29.65.92.36 1.41-.28.49-.91.64-1.4.35z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Library Filters */}
        <div className="px-3 py-2 grid grid-cols-4 gap-1 relative z-10">
          {(["all", "playlists", "artists", "albums"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setLibraryFilter(f)}
              className={`py-1.5 rounded-full text-xs font-bold tracking-wide transition-all select-none text-center truncate ${
                libraryFilter === f
                  ? "bg-cream text-forest-dark shadow-sm"
                  : "bg-panel/40 text-muted hover:text-cream hover:bg-panel/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Library Items */}
        <div className="flex-1 overflow-y-auto mt-2 px-2 pb-2 custom-scrollbar relative z-10">
          {/* Liked Songs */}
          {(libraryFilter === "all" || libraryFilter === "playlists") && (
            <div
              onClick={() => setView("liked")}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                view === "liked" ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-coral to-pink flex items-center justify-center flex-none shadow-md">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream shadow-inner">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`text-sm font-bold truncate ${view === "liked" ? "text-coral" : "text-cream"}`}>Liked Songs</span>
                <div className="text-xs text-muted flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-coral rounded-sm inline-flex items-center justify-center font-bold text-xs text-forest-dark">S</span>
                  Playlist · {likedSongs.size} songs
                </div>
              </div>
            </div>
          )}

          {/* User playlists */}
          {(libraryFilter === "all" || libraryFilter === "playlists") &&
            playlists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setView(`playlist:${pl.id}`)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  view === `playlist:${pl.id}` ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-none shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/80">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${view === `playlist:${pl.id}` ? "text-coral" : "text-cream"}`}>{pl.name}</span>
                  <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                    {pl.collaborative && <span className="w-1.5 h-1.5 rounded-full bg-green" />}
                    <span>Playlist · You</span>
                  </div>
                </div>
              </div>
            ))}

          {/* DB Artists */}
          {(libraryFilter === "all" || libraryFilter === "artists") &&
            dbArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  isArtistActive(artist.id) ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-panel/50 border border-cream/5 flex items-center justify-center flex-none shadow-sm relative overflow-hidden">
                  {artist.image
                    ? <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                    : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-pink/10" />
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-muted">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${isArtistActive(artist.id) ? "text-coral" : "text-cream"}`}>
                    {artist.display_name}
                  </span>
                  <span className="text-xs text-muted">Artist · {artist.track_count} songs</span>
                </div>
              </div>
            ))}

          {/* DB Albums */}
          {(libraryFilter === "all" || libraryFilter === "albums") &&
            dbAlbums.map((album) => {
              const [c1, c2] = getAlbumColors(album);
              const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
              return (
                <div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                    isAlbumActive(album.id) ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
                  }`}
                >
                  <div
                    className="w-12 h-12 rounded-md flex-none shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-sm font-bold truncate ${isAlbumActive(album.id) ? "text-coral" : "text-cream"}`}>
                      {album.title}
                    </span>
                    <span className="text-xs text-muted truncate">
                      Album{artistInfo ? ` · ${artistInfo.display_name}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </aside>
  );
}
