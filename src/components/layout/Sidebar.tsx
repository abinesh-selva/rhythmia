import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";

export function Sidebar() {
  const { view, setView, playlists, createPlaylist, likedSongs, tracks } = useAudio();
  const [libraryFilter, setLibraryFilter] = useState<"all" | "playlists" | "artists" | "albums">("all");

  const handleCreatePlaylist = async () => {
    const pName = prompt("Enter a playlist name:");
    if (!pName) return;
    const plId = await createPlaylist(pName);
    if (plId) {
      setView(`playlist:${plId}`);
    }
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
                view === "home" ? "text-cream bg-panel shadow-sm" : "text-muted hover:text-cream hover:bg-panel/30"
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                {view === "home" ? (
                  <path d="M12 3L4 9v12h5v-7h6v7h5V9z" />
                ) : (
                  <path d="M12 3.5l6.5 5v10.5h-4v-7h-5v7h-4V8.5z" />
                )}
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
                {view === "search" ? (
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" strokeWidth="2" />
                ) : (
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                )}
              </svg>
              Search
            </button>
          </li>
          <li>
            <button
              onClick={() => setView("live")}
              className={`w-full flex items-center justify-between py-3 px-3 rounded-xl font-bold text-sm transition-all ${
                view === "live" ? "text-cream bg-panel shadow-sm" : "text-muted hover:text-cream hover:bg-panel/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zM12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
                Live Events
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-coral animate-ping"></span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Library Panel */}
      <div className="lib bg-forest rounded-2xl flex-1 flex flex-col min-h-0 shadow-md border border-cream/5 relative overflow-hidden">
        {/* Decorative subtle background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-coral/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between px-4 py-3 relative z-10">
          <button className="flex items-center gap-3 font-bold text-muted hover:text-cream transition-colors group">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current group-hover:-translate-y-0.5 transition-transform">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
            </svg>
            Your Library
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCreatePlaylist}
              className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-cream hover:bg-panel transition-colors"
              title="Create playlist"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
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
          </div>
        </div>

        {/* Library Filters */}
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar relative z-10">
          {[
            { id: "all", label: "All" },
            { id: "playlists", label: "Playlists" },
            { id: "artists", label: "Artists" },
            { id: "albums", label: "Albums" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setLibraryFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all select-none flex-none ${
                libraryFilter === f.id
                  ? "bg-cream text-forest-dark shadow-sm"
                  : "bg-panel/40 text-muted hover:text-cream hover:bg-panel/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Library Items List */}
        <div className="flex-1 overflow-y-auto mt-2 px-2 pb-2 custom-scrollbar relative z-10">
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
                <span className={`text-sm font-bold truncate ${view === "liked" ? "text-coral" : "text-cream"}`}>
                  Liked Songs
                </span>
                <div className="text-[11px] text-muted flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-coral rounded-sm inline-flex items-center justify-center font-bold text-[8px] text-forest-dark">
                    S
                  </span>
                  Playlist • {likedSongs.size} songs
                </div>
              </div>
            </div>
          )}

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
                  style={{
                    background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})`,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-cream/80">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${view === `playlist:${pl.id}` ? "text-coral" : "text-cream"}`}>
                    {pl.name}
                  </span>
                  <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                    {pl.collaborative && <span className="w-1.5 h-1.5 rounded-full bg-green"></span>}
                    <span>Playlist • You</span>
                  </div>
                </div>
              </div>
            ))}

          {(libraryFilter === "all" || libraryFilter === "artists") &&
            Array.from(new Set(tracks.map((t) => t.artist))).slice(0, 10).map((artist, idx) => (
              <div
                key={`artist-${idx}`}
                onClick={() => setView(`artist:${artist}`)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  view === `artist:${artist}` ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-panel/50 border border-cream/5 flex items-center justify-center flex-none shadow-sm relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-coral/10 to-pink/10" />
                   <svg viewBox="0 0 24 24" className="w-6 h-6 fill-muted">
                     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                   </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${view === `artist:${artist}` ? "text-coral" : "text-cream"}`}>
                    {artist}
                  </span>
                  <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                    <span>Artist</span>
                  </div>
                </div>
              </div>
            ))}

          {(libraryFilter === "all" || libraryFilter === "albums") && (() => {
            const uniqueAlbumsMap = new Map<string, typeof tracks[0]>();
            tracks.forEach((t) => {
              if (t.album && !uniqueAlbumsMap.has(t.album)) {
                uniqueAlbumsMap.set(t.album, t);
              }
            });
            return Array.from(uniqueAlbumsMap.values()).slice(0, 10).map((albumTrack, idx) => (
              <div
                key={`album-${idx}`}
                onClick={() => setView(`album:${albumTrack.album}`)}
                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                  view === `album:${albumTrack.album}` ? "bg-panel/80 shadow-sm" : "hover:bg-panel/40"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center flex-none shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${albumTrack.cover_colors[0]}, ${albumTrack.cover_colors[1]})`,
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-bold truncate ${view === `album:${albumTrack.album}` ? "text-coral" : "text-cream"}`}>
                    {albumTrack.album}
                  </span>
                  <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                    <span>Album • {albumTrack.artist}</span>
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>
    </aside>
  );
}
