"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  const { view, setView, playlists, collections, createPlaylist, likedSongs, addLocalFiles, tracks, refreshTracks } = useAudio();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const { showPrompt } = useDialog();

  const [libraryFilter, setLibraryFilter] = useState<"all" | "playlists" | "collections" | "artists" | "albums">("all");
  const [dbArtists, setDbArtists] = useState<ArtistRow[]>([]);
  const [dbAlbums,  setDbAlbums]  = useState<AlbumRow[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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

  const handleCloudinarySync = async () => {
    setIsSyncing(true);
    addToast("Started syncing your library. This might take a while...", "success");
    try {
      const res = await fetch("/api/cloudinary-sync", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshTracks();
        addToast(`Sync complete! Processed ${data.trackCount} tracks across ${data.albumCount} albums.`, "success");
      } else {
        addToast("Error: " + (data.error || "Failed to sync"), "error");
      }
    } catch (err: any) {
      addToast("Error: " + err.message, "error");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const loadData = async () => {
      try {
        const { data: artistData, error: artistError } = await client
          .from("artists")
          .select("id,display_name,slug,image,track_count")
          .order("track_count", { ascending: false })
          .limit(30);

        if (artistError) {
          console.error("Sidebar artists query error:", artistError.message);
        } else if (artistData) {
          setDbArtists(artistData as ArtistRow[]);
        }
      } catch (err) {
        console.error("Sidebar artists catch error:", err);
      }

      try {
        const { data: albumData, error: albumError } = await client
          .from("albums")
          .select("id,title,slug,cover_colors,artist_id,artists(display_name)")
          .order("created_at", { ascending: false })
          .limit(30);

        if (albumError) {
          console.error("Sidebar albums query error:", albumError.message);
        } else if (albumData) {
          setDbAlbums(albumData as unknown as AlbumRow[]);
        }
      } catch (err) {
        console.error("Sidebar albums catch error:", err);
      }
    };

    loadData();
  }, [tracks]);

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

  const [folders, setFolders] = useState<{id: string, name: string, playlistIds: string[], expanded: boolean}[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("vibeblower_folders");
    if (saved) {
      try { setFolders(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveFolders = (newFolders: typeof folders) => {
    setFolders(newFolders);
    localStorage.setItem("vibeblower_folders", JSON.stringify(newFolders));
  };

  const handleCreateFolder = async () => {
    const fName = await showPrompt({
      title: "New Folder",
      description: "Give your folder a name.",
      placeholder: "My Folder",
      confirmLabel: "Create",
    });
    if (!fName) return;
    saveFolders([...folders, { id: `folder-${Date.now()}`, name: fName, playlistIds: [], expanded: true }]);
  };

  const handleDropToFolder = (folderId: string, playlistId: string) => {
    if (!playlistId.startsWith("playlist:")) return;
    const plId = playlistId.replace("playlist:", "");
    const newFolders = folders.map(f => {
      const cleanedIds = f.playlistIds.filter(id => id !== plId);
      if (f.id === folderId) {
        cleanedIds.push(plId);
      }
      return { ...f, playlistIds: cleanedIds };
    });
    saveFolders(newFolders);
  };

  const handleRemoveFromFolder = (playlistId: string) => {
    const newFolders = folders.map(f => ({
      ...f,
      playlistIds: f.playlistIds.filter(id => id !== playlistId)
    }));
    saveFolders(newFolders);
  };

  const playlistsInFolders = new Set(folders.flatMap(f => f.playlistIds));
  const unassignedPlaylists = playlists.filter(pl => !playlistsInFolders.has(pl.id));

  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("vibeblower_library_collapsed");
    if (savedCollapsed) {
      setIsLibraryCollapsed(savedCollapsed === "true");
    }
  }, []);

  const toggleLibraryCollapse = () => {
    const newVal = !isLibraryCollapsed;
    setIsLibraryCollapsed(newVal);
    localStorage.setItem("vibeblower_library_collapsed", String(newVal));
    window.dispatchEvent(new Event("sidebar-collapse-toggle"));
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

  const cycleTheme = () => {
    const themes = ["vibeblower", "catppuccin", "nord", "spotify"] as const;
    const idx = themes.indexOf(theme);
    setTheme(themes[(idx + 1) % themes.length]);
  };

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "playlists", label: "Playlists" },
    { key: "collections", label: "Collections" },
    { key: "artists", label: "Artists" },
    { key: "albums", label: "Albums" },
  ] as const;

  return (
    <aside className={`w-full h-full hidden md:flex flex-col bg-forest rounded-xl py-4 min-h-0 relative z-20 border border-white/5 transition-all duration-300 ${
      isLibraryCollapsed ? "px-2 gap-3" : "px-3 gap-4"
    }`}>
      <div className={`flex flex-none ${isLibraryCollapsed ? "flex-col items-center gap-4 px-0 pb-2" : "items-center justify-between px-2 pb-1.5"}`}>
        <button
          onClick={toggleLibraryCollapse}
          className="flex items-center gap-2 font-semibold text-sm text-muted hover:text-cream transition-colors group/lib"
          title={isLibraryCollapsed ? "Expand Library" : "Collapse Library"}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-muted group-hover/lib:text-cream transition-colors flex-none">
            <path d="M4 19H2V5h2v14zm4 0H6V5h2v14zm1.75-1.12l-1.22-1.6 9.5-7.2 1.22 1.6-9.5 7.2zM22 5v14H10V5h12z" />
          </svg>
          {!isLibraryCollapsed && <span className="truncate">Your Library</span>}
        </button>

        {isLibraryCollapsed ? (
          <button
            onClick={handleCreatePlaylist}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-muted hover:text-cream hover:bg-white/10 transition-colors flex-none"
            aria-label="Create playlist"
            title="Create playlist"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center gap-0.5 flex-none">
            <button
              onClick={handleCreatePlaylist}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-cream hover:bg-white/10 transition-colors"
              aria-label="Create playlist"
              title="Create playlist"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>

            <div className="relative group">
              <button
                className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:text-cream hover:bg-white/10 transition-colors"
                title="More options"
                aria-label="Library options"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>

              <div className="absolute right-0 top-8 w-52 bg-panel border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-1.5">
                <button
                  onClick={handleCreateFolder}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream hover:bg-white/8 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-muted flex-none">
                    <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  </svg>
                  Create folder
                </button>

                <label className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream hover:bg-white/8 transition-colors cursor-pointer">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-muted flex-none">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z" />
                  </svg>
                  Add local files
                  <input
                    type="file"
                    multiple
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) addLocalFiles(e.target.files);
                    }}
                  />
                </label>

                <div className="h-px bg-white/8 my-1 mx-3" />

                <button
                  onClick={handleCloudinarySync}
                  disabled={isSyncing}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isSyncing ? "text-coral cursor-wait" : "text-cream hover:bg-white/8"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current flex-none ${isSyncing ? "text-coral animate-pulse" : "text-muted"}`}>
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.36 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                  </svg>
                  {isSyncing ? "Syncing…" : "Sync Library"}
                </button>

                <button
                  onClick={handleSpotifyEnrich}
                  disabled={isEnriching}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isEnriching ? "text-green cursor-wait" : "text-cream hover:bg-white/8"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 fill-current flex-none ${isEnriching ? "text-green animate-spin" : "text-muted"}`}>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.6 14.08c-.2.31-.61.41-.92.21-2.52-1.54-5.69-1.89-9.42-1.04-.36.08-.72-.15-.8-.51-.08-.36.15-.72.51-.8 4.14-.94 7.64-.53 10.42 1.17.31.2.41.61.21.92zm1.32-2.95c-.25.4-.77.53-1.17.27-2.87-1.77-7.25-2.3-10.74-1.26-.45.14-.92-.12-1.06-.57-.14-.45.12-.92.57-1.06 4.02-1.19 8.86-.59 12.13 1.42.4.26.53.78.27 1.18zm.11-3.1c-3.41-2.03-9.04-2.21-12.27-1.23-.54.16-1.11-.14-1.27-.68-.16-.54.14-1.11.68-1.27 3.73-1.13 10.01-.92 13.97 1.44.49.29.65.92.36 1.41-.28.49-.91.64-1.4.35z" />
                  </svg>
                  {isEnriching ? "Enriching…" : "Enrich Metadata"}
                </button>

                <div className="h-px bg-white/8 my-1 mx-3" />

                <button
                  onClick={cycleTheme}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-cream hover:bg-white/8 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-muted flex-none">
                    <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
                  </svg>
                  Theme: {theme === 'spotify' ? 'Emerald' : theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
          {!isLibraryCollapsed && (
            <div className="flex flex-wrap gap-1 px-2 pb-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setLibraryFilter(f.key)}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-none ${
                    libraryFilter === f.key
                      ? "bg-cream text-forest-dark"
                      : "bg-white/6 text-muted hover:text-cream hover:bg-white/10"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div 
            className="flex-1 overflow-y-auto px-1 pb-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id.startsWith("playlist:")) {
                handleRemoveFromFolder(id.replace("playlist:", ""));
              }
            }}
          >
            {(libraryFilter === "all" || libraryFilter === "playlists") && (
              <LibraryItem
                active={view === "liked"}
                onClick={() => setView("liked")}
                collapsed={isLibraryCollapsed}
                art={
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-coral to-pink flex items-center justify-center flex-none shadow-sm">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                }
                title="Liked Songs"
                subtitle={`Playlist · ${likedSongs.size} songs`}
              />
            )}

            {(libraryFilter === "all" || libraryFilter === "playlists") &&
              folders.map((folder) => {
                const folderPlaylists = playlists.filter(p => folder.playlistIds.includes(p.id));
                return (
                  <div 
                    key={folder.id} 
                    className="mb-1"
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleDropToFolder(folder.id, e.dataTransfer.getData("text/plain"));
                    }}
                  >
                    <button
                      onClick={() => saveFolders(folders.map(f => f.id === folder.id ? { ...f, expanded: !f.expanded } : f))}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-white/5 transition-colors group ${
                        isLibraryCollapsed ? "justify-center p-1.5" : ""
                      }`}
                      title={isLibraryCollapsed ? folder.name : undefined}
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-none shadow-sm">
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/70">
                          {folder.expanded ? (
                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v8c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3v-8c0-1.66-1.34-3-3-3zm0 12H5c-.55 0-1-.45-1-1v-8c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v8c0 .55-.45 1-1 1z" />
                          ) : (
                            <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                          )}
                        </svg>
                      </div>
                      {!isLibraryCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-cream truncate">{folder.name}</p>
                          <p className="text-xs text-muted truncate">Folder · {folderPlaylists.length} playlists</p>
                        </div>
                      )}
                    </button>
                    {folder.expanded && (
                      <div className={`${isLibraryCollapsed ? "pl-0 ml-0 border-l-0" : "pl-4 border-l border-white/10 ml-6"} mt-1 flex flex-col gap-0.5`}>
                        {folderPlaylists.map(pl => (
                          <div 
                            key={pl.id} 
                            draggable 
                            onDragStart={(e) => e.dataTransfer.setData("text/plain", `playlist:${pl.id}`)}
                          >
                            <LibraryItem
                              active={view === `playlist:${pl.id}`}
                              onClick={() => setView(`playlist:${pl.id}`)}
                              collapsed={isLibraryCollapsed}
                              art={
                                <div
                                  className="w-8 h-8 rounded-md flex items-center justify-center flex-none shadow-sm"
                                  style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}
                                >
                                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/70">
                                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                                  </svg>
                                </div>
                              }
                              title={pl.name}
                              subtitle={`Playlist${pl.collaborative ? " · Collab" : ""}`}
                              badge={pl.collaborative ? <span className="w-1.5 h-1.5 rounded-full bg-green flex-none" /> : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            {(libraryFilter === "all" || libraryFilter === "playlists") &&
              unassignedPlaylists.map((pl) => (
                <div 
                  key={pl.id} 
                  draggable 
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", `playlist:${pl.id}`)}
                >
                  <LibraryItem
                    active={view === `playlist:${pl.id}`}
                    onClick={() => setView(`playlist:${pl.id}`)}
                    collapsed={isLibraryCollapsed}
                    art={
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-none shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}
                      >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/70">
                          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                        </svg>
                      </div>
                    }
                    title={pl.name}
                    subtitle={`Playlist${pl.collaborative ? " · Collaborative" : ""}`}
                    badge={pl.collaborative ? <span className="w-1.5 h-1.5 rounded-full bg-green flex-none" /> : undefined}
                  />
                </div>
              ))}

            {(libraryFilter === "all" || libraryFilter === "collections") &&
              collections.map((col) => (
                <LibraryItem
                  key={col.id}
                  active={false}
                  onClick={() => router.push(`/collection/${col.id}/${col.slug}`)}
                  collapsed={isLibraryCollapsed}
                  art={
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-none shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${col.cover_colors[0]}, ${col.cover_colors[1]})` }}
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-cream/70">
                        <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
                      </svg>
                    </div>
                  }
                  title={col.name}
                  subtitle={`Collection · ${col.track_count} songs`}
                />
              ))}

            {(libraryFilter === "all" || libraryFilter === "artists") &&
              dbArtists.map((artist) => (
                <LibraryItem
                  key={artist.id}
                  active={isArtistActive(artist.id)}
                  onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                  collapsed={isLibraryCollapsed}
                  art={
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-none overflow-hidden relative">
                      {artist.image ? (
                        <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-muted">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                    </div>
                  }
                  title={artist.display_name}
                  subtitle={`Artist · ${artist.track_count} songs`}
                />
              ))}

            {(libraryFilter === "all" || libraryFilter === "albums") &&
              dbAlbums.map((album) => {
                const [c1, c2] = getAlbumColors(album);
                const artistInfo = Array.isArray(album.artists) ? album.artists[0] : album.artists;
                return (
                  <LibraryItem
                    key={album.id}
                    active={isAlbumActive(album.id)}
                    onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                    collapsed={isLibraryCollapsed}
                    art={
                      <div
                        className="w-10 h-10 rounded-md flex-none shadow-sm"
                        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                      />
                    }
                    title={album.title}
                    subtitle={`Album${artistInfo ? ` · ${artistInfo.display_name}` : ""}`}
                  />
                );
              })}
          </div>
        </div>
    </aside>
  );
}

interface LibraryItemProps {
  active: boolean;
  onClick: () => void;
  art: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  collapsed?: boolean;
}

function LibraryItem({ active, onClick, art, title, subtitle, badge, collapsed }: LibraryItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-all ${
        collapsed ? "justify-center px-1" : "hover:bg-white/5"
      } ${
        active ? "bg-white/10" : ""
      }`}
      title={collapsed ? `${title} • ${subtitle}` : undefined}
    >
      {art}
      {!collapsed && (
        <div className="flex flex-col min-w-0 flex-1">
          <span className={`text-sm font-semibold truncate leading-tight ${active ? "text-coral" : "text-cream"}`}>
            {title}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            {badge}
            <span className="text-xs text-muted truncate">{subtitle}</span>
          </div>
        </div>
      )}
    </div>
  );
}
