"use client";

import React, { useState } from "react";
import { useAudio, Track } from "../context/AudioContext";

// Helper to format track durations
const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export default function Page() {
  const {
    tracks,
    playlists,
    likedSongs,
    currentTrack,
    isPlaying,
    view,
    currentViewPlaylistId,
    playTrack,
    toggleLike,
    deletePlaylist,
    renamePlaylist,
    removeTrackFromPlaylist,
    reorderPlaylistTracks,
    addTrackToPlaylist,
    addToQueue,
    playNext,
    recentlyPlayed,
    searchQuery,
    queue,
    clearQueue,
    toggleCollaborative,
  } = useAudio();

  // Drag and Drop state trackers for Playlist Reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Context menu track selector
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Playlist search and toast notification states
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // 1. Time of day greeting
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  // 2. Row Context Menu Trigger
  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setActiveMenuTrackId(trackId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Close context menus
  React.useEffect(() => {
    const close = () => setActiveMenuTrackId(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // 3. Zero-dependency HTML5 drag-and-drop reorder handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, playlistId: string, currentPlaylistTrackIds: string[]) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = [...currentPlaylistTrackIds];
    const [removed] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, removed);

    await reorderPlaylistTracks(playlistId, list);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 4. Render Tracks List Utility
  const renderTrackRow = (track: Track, index: number, isReorderable = false, playlistId?: string, playlistTrackIds?: string[]) => {
    const isCurrent = currentTrack?.id === track.id;
    const isLiked = likedSongs.has(track.id);

    return (
      <div
        key={track.id}
        draggable={isReorderable}
        onDragStart={(e) => isReorderable && handleDragStart(e, index)}
        onDragOver={(e) => isReorderable && handleDragOver(e, index)}
        onDrop={(e) => isReorderable && playlistId && playlistTrackIds && handleDrop(e, index, playlistId, playlistTrackIds)}
        onDragEnd={isReorderable ? handleDragEnd : undefined}
        className={`row group grid grid-cols-[40px_1fr_1.2fr_60px_60px] gap-4 items-center px-4 py-2.5 rounded-lg transition-colors cursor-pointer select-none border border-transparent ${
          isCurrent ? "bg-panel/40" : "hover:bg-panel/20"
        } ${dragOverIndex === index && draggedIndex !== index ? "border-dashed border-coral bg-coral/5" : ""} ${
          draggedIndex === index ? "opacity-40" : ""
        }`}
        onContextMenu={(e) => handleContextMenu(e, track.id)}
      >
        {/* Track Index / Drag Handle */}
        <div className="num font-semibold text-sm text-muted text-center relative w-6 h-6 flex items-center justify-center">
          {isReorderable ? (
            <span className="idx group-hover:hidden transition-all text-xs font-medium text-muted">
              {index + 1}
            </span>
          ) : (
            <span className="idx group-hover:hidden transition-all">
              {index + 1}
            </span>
          )}

          {/* Draggable indicator in playlists */}
          {isReorderable && (
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 fill-current text-muted/60 hidden group-hover:block cursor-grab active:cursor-grabbing absolute inset-0 m-auto"
            >
              <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z" />
            </svg>
          )}

          {!isReorderable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                playTrack(track.id);
              }}
              className="pic hidden group-hover:flex items-center justify-center border-none bg-transparent absolute inset-0 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-coral">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Title & Artist & Album Cover */}
        <div className="tcell flex items-center gap-3 min-w-0" onClick={() => playTrack(track.id)}>
          <div
            className="cart w-10 h-10 rounded flex items-center justify-center flex-none shadow"
            style={{
              background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})`,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/80">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <div className="tt min-w-0">
            <div className={`nm font-medium text-sm truncate ${isCurrent ? "text-coral" : "text-cream"}`}>
              {track.title}
            </div>
            <div className="ar text-xs text-muted truncate mt-0.5">{track.artist}</div>
          </div>
        </div>

        {/* Album */}
        <div className="alb text-xs text-muted truncate">{track.album}</div>

        {/* Like Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(track.id);
          }}
          className={`like justify-self-end transition-colors cursor-pointer ${
            isLiked ? "text-coral opacity-100" : "text-muted hover:text-cream opacity-0 group-hover:opacity-100"
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-current">
            <path
              d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
              stroke="currentColor"
              strokeWidth={isLiked ? "0" : "2"}
              fill={isLiked ? "currentColor" : "none"}
            />
          </svg>
        </button>

        {/* Duration / Menu Trigger */}
        <div className="flex items-center justify-between gap-1 pr-2 justify-self-end min-w-[50px]">
          <span className="text-xs text-muted tabular-nums select-none">{fmt(track.duration_sec)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e, track.id);
            }}
            className="text-muted hover:text-cream opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-pointer"
            title="Options"
          >
            &#8942;
          </button>
        </div>
      </div>
    );
  };

  // 5. VIEW ROUTER RENDER ENGINE
  const renderViewContent = () => {
    // LIVE EVENTS VIEW
    if (view === "live") {
      const mockConcerts = [
        {
          id: "c1",
          artist: "Jessie Villa",
          title: "Wildfire Acoustic Session",
          date: "Saturday, Oct 14, 2026",
          city: "Seattle, WA",
          venue: "Forest Amphitheater",
          price: "$35.00",
          colors: ["#F0824E", "#1E9E54"],
        },
        {
          id: "c2",
          artist: "Blue Beat Review",
          title: "In The Morning Tour",
          date: "Thursday, Nov 2, 2026",
          city: "Austin, TX",
          venue: "Soniqo Arena",
          price: "$45.00",
          colors: ["#1E9E54", "#0E3B35"],
        },
        {
          id: "c3",
          artist: "The Soundlings",
          title: "Acoustic Chill Live",
          date: "Friday, Nov 17, 2026",
          city: "Portland, OR",
          venue: "Green Room Lounge",
          price: "$28.00",
          colors: ["#3E8B96", "#0E3B35"],
        },
        {
          id: "c4",
          artist: "Anno Domini Beats",
          title: "Electronic Lofi Session",
          date: "Wednesday, Dec 6, 2026",
          city: "Denver, CO",
          venue: "Red Rocks Pavilion",
          price: "$50.00",
          colors: ["#F4C9C2", "#F0824E"],
        },
      ];

      const handleBookTickets = (artist: string, venue: string) => {
        alert(`Mock Booking Successful!\n\nWe've reserved your spots for ${artist} live at ${venue}. A simulated confirmation token has been stored in your session. Enjoy Soniqo Live!`);
        setToastMessage(`Reserved: ${artist} tickets!`);
        setTimeout(() => setToastMessage(""), 3500);
      };

      return (
        <div className="flex flex-col p-6 min-h-full">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-coral animate-ping" />
              <h2 className="text-2xl font-bold font-display text-cream">Soniqo Live Events</h2>
            </div>
            <p className="text-xs text-muted mt-1">Discover upcoming concerts and ticket openings for your favorite catalog artists.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockConcerts.map((concert) => (
              <div
                key={concert.id}
                className="bg-panel/20 border border-cream/5 rounded-2xl p-5 hover:border-coral/25 transition-all flex flex-col justify-between gap-4 shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Concert ticket stub visualizer */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-none text-cream"
                    style={{
                      background: `linear-gradient(135deg, ${concert.colors[0]}, ${concert.colors[1]})`,
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current opacity-80">
                      <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-coral uppercase tracking-wider">{concert.artist}</span>
                    <h3 className="text-sm font-bold text-cream truncate mt-0.5">{concert.title}</h3>
                    <div className="text-xs text-muted mt-1.5 flex flex-col gap-0.5">
                      <span className="font-medium text-cream/90">{concert.venue}</span>
                      <span>{concert.city} • {concert.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-cream/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted uppercase">Ticket price</span>
                    <span className="text-xs font-bold text-cream">{concert.price}</span>
                  </div>
                  <button
                    onClick={() => handleBookTickets(concert.artist, concert.venue)}
                    className="text-xs font-bold bg-coral hover:bg-coral-bright text-forest-dark px-4 py-2 rounded-full shadow transition-all cursor-pointer hover:scale-103 active:scale-97"
                  >
                    Find Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // A. SEARCH VIEW
    if (view === "search") {
      const filtered = tracks.filter(
        (t) =>
          !searchQuery ||
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return (
        <div className="flex flex-col p-6 min-h-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold font-display text-cream">
              {searchQuery ? `Results for "${searchQuery}"` : "Search Catalogue"}
            </h2>
            <p className="text-xs text-muted mt-1">Explore all tracks or filter by title and artist</p>
          </div>

          <div className="list flex flex-col gap-1.5">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/25">
                No songs match your query. Try searching for a different keyword.
              </div>
            ) : (
              filtered.map((t, idx) => renderTrackRow(t, idx))
            )}
          </div>

          {!searchQuery && (
            <div className="mt-8 flex flex-col gap-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Browse All Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-blue to-forest font-bold text-lg aspect-[1.8] relative overflow-hidden shadow select-none">
                  Alternative
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full transform rotate-12" />
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-coral to-pink font-bold text-lg aspect-[1.8] relative overflow-hidden shadow select-none">
                  Acoustic Chill
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full transform rotate-12" />
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-green to-forest-dark font-bold text-lg aspect-[1.8] relative overflow-hidden shadow select-none">
                  Lo-Fi Beats
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full transform rotate-12" />
                </div>
                <div className="p-5 rounded-xl bg-gradient-to-br from-pink to-blue font-bold text-lg aspect-[1.8] relative overflow-hidden shadow select-none">
                  Instrumental
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/5 rounded-full transform rotate-12" />
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // B. LIKED SONGS VIEW
    if (view === "liked") {
      const likedTracks = tracks.filter((t) => likedSongs.has(t.id));

      return (
        <div className="flex flex-col min-h-full">
          {/* Header Hero */}
          <div className="hero bg-gradient-to-b from-coral/40 to-forest-dark p-8 flex items-end gap-6 border-b border-cream/5">
            <div className="hero-art w-48 h-48 rounded-2xl bg-gradient-to-br from-coral to-pink flex items-center justify-center flex-none shadow-2xl">
              <svg viewBox="0 0 24 24" className="w-20 h-20 fill-cream shadow-inner animate-pulse">
                <path d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z" />
              </svg>
            </div>
            <div className="hero-info flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-coral">Smart Playlist</span>
              <h2 className="font-display font-bold text-5xl md:text-6xl text-cream tracking-tight">Liked Songs</h2>
              <p className="text-xs text-muted">
                Persistent catalog • <b className="text-cream">{likedTracks.length} liked songs</b>
              </p>
            </div>
          </div>

          {/* Tracks list */}
          <div className="p-6 flex flex-col gap-1.5 flex-1">
            {likedTracks.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/25">
                No liked songs yet! Click the heart toggle on any track to populate this Smart Playlist.
              </div>
            ) : (
              likedTracks.map((t, idx) => renderTrackRow(t, idx))
            )}
          </div>
        </div>
      );
    }

    // C. CUSTOM PLAYLIST VIEW WITH REORDERING
    if (view.startsWith("playlist:") && currentViewPlaylistId) {
      const pl = playlists.find((p) => p.id === currentViewPlaylistId);

      if (!pl) {
        return (
          <div className="p-8 text-center text-muted text-sm">
            Playlist not found. It may have been deleted.
          </div>
        );
      }

      const plTracks = pl.songs.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean);

      const filteredPlaylistTracks = plTracks.filter(
        (t) =>
          !playlistSearchQuery ||
          t.title.toLowerCase().includes(playlistSearchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(playlistSearchQuery.toLowerCase())
      );

      const handleRename = () => {
        const newName = prompt("Rename playlist to:", pl.name);
        if (newName && newName.trim()) {
          renamePlaylist(pl.id, newName.trim());
        }
      };

      const handleSharePlaylist = () => {
        const shareUrl = `${window.location.origin}/?view=playlist:${pl.id}`;
        navigator.clipboard.writeText(shareUrl);
        setToastMessage("Share link copied to clipboard!");
        setTimeout(() => setToastMessage(""), 3000);
      };

      return (
        <div className="flex flex-col min-h-full">
          {/* Header Hero */}
          <div
            className="hero p-8 flex items-end gap-6 border-b border-cream/5 transition-all relative overflow-hidden"
            style={{
              background: `linear-gradient(to bottom, ${pl.cover_colors[0]}40, var(--background))`,
            }}
          >
            <div
              className="hero-art w-48 h-48 rounded-2xl flex items-center justify-center flex-none shadow-2xl transition-transform hover:scale-102"
              style={{
                background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})`,
              }}
            >
              <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/80">
                <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
              </svg>
            </div>
            <div className="hero-info flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">Playlist</span>
                {pl.collaborative && (
                  <span className="bg-green/15 text-green border border-green/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm select-none">
                    <span className="w-1 h-1 rounded-full bg-green animate-pulse" />
                    Collaborative
                  </span>
                )}
              </div>
              <h2
                onClick={handleRename}
                className="font-display font-bold text-5xl md:text-6xl text-cream tracking-tight truncate cursor-pointer hover:underline decoration-coral decoration-wavy decoration-2"
                title="Click to rename"
              >
                {pl.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5 text-xs text-muted">
                <span>Created by <b className="text-cream">Amigo</b></span>
                <span>•</span>
                <span>{plTracks.length} tracks</span>
                <span>•</span>
                <button
                  onClick={handleSharePlaylist}
                  className="text-coral hover:text-coral-bright font-semibold underline cursor-pointer"
                >
                  Share Playlist
                </button>
                <span>•</span>
                <button
                  onClick={() => toggleCollaborative(pl.id)}
                  className="text-muted hover:text-cream font-semibold underline cursor-pointer"
                >
                  {pl.collaborative ? "Make Private" : "Make Collaborative"}
                </button>
                <span>•</span>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this playlist?")) {
                      deletePlaylist(pl.id);
                    }
                  }}
                  className="text-pink hover:text-pink/90 font-semibold underline cursor-pointer"
                >
                  Delete Playlist
                </button>
              </div>
            </div>
          </div>

          {/* Playlist search & tracks (Reorderable) */}
          <div className="p-6 flex flex-col gap-3.5 flex-1">
            {plTracks.length > 0 && (
              <div className="flex items-center justify-between gap-4 border-b border-cream/5 pb-3">
                {/* Inline Playlist search bar */}
                <div className="relative max-w-xs w-full">
                  <input
                    value={playlistSearchQuery}
                    onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                    placeholder="Search in playlist"
                    className="w-full pl-9 pr-3 py-1.5 bg-[#162924] border border-cream/10 rounded-full text-cream text-xs placeholder-muted focus:outline-none focus:border-coral transition-colors"
                  />
                  <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 fill-muted">
                    <path d="M10 2a8 8 0 105 14.3l5 5 1.4-1.4-5-5A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z" />
                  </svg>
                  {playlistSearchQuery && (
                    <button
                      onClick={() => setPlaylistSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream text-xs select-none"
                    >
                      &times;
                    </button>
                  )}
                </div>
                {/* Drag info */}
                <div className="text-[10px] text-muted/80 uppercase tracking-widest font-semibold pr-2 select-none hidden sm:block">
                  Drag track row numbers to reorder
                </div>
              </div>
            )}

            {filteredPlaylistTracks.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/25 flex flex-col gap-2">
                <span>{plTracks.length === 0 ? "Playlist is empty." : "No matching tracks found."}</span>
                <span className="text-xs">
                  {plTracks.length === 0 
                    ? "Right-click any track or click the track menu (...) to add songs!" 
                    : "Clear search or try another keyword."}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filteredPlaylistTracks.map((t, idx) =>
                  renderTrackRow(t, idx, true, pl.id, pl.songs)
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // D. QUEUE LIST VIEW
    if (view === "queue") {
      const qTracks = queue.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean);

      return (
        <div className="flex flex-col p-6 min-h-full">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-display text-cream">Play Queue</h2>
              <p className="text-xs text-muted mt-1">Tracks queued to play next</p>
            </div>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs font-semibold px-4 py-2 border border-coral text-coral hover:bg-coral hover:text-forest-dark rounded-full transition-colors cursor-pointer"
              >
                Clear Queue
              </button>
            )}
          </div>

          <div className="list flex flex-col gap-1.5">
            {qTracks.length === 0 ? (
              <div className="p-8 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/25">
                Queue is empty. Right-click or click track options (...) to add tracks to the queue.
              </div>
            ) : (
              qTracks.map((t, idx) => renderTrackRow(t, idx))
            )}
          </div>
        </div>
      );
    }

    // E. HOME VIEW (DEFAULT)
    const recentlyPlayedTracks = recentlyPlayed
      .map((id) => tracks.find((t) => t.id === id)!)
      .filter(Boolean)
      .slice(0, 4);

    return (
      <div className="flex flex-col min-h-full">
        {/* Header Hero */}
        <div className="hero bg-gradient-to-b from-forest/30 to-forest-dark p-8 flex items-end gap-6 border-b border-cream/5 relative overflow-hidden">
          {/* Subtle logo vector */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-coral/5 rounded-full blur-3xl" />
          <div className="hero-art w-48 h-48 rounded-2xl bg-gradient-to-br from-green to-forest flex items-center justify-center flex-none shadow-2xl">
            <svg viewBox="0 0 24 24" className="w-20 h-20 fill-cream/80">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
          <div className="hero-info flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{getGreeting()}</span>
            <h2 className="font-display font-bold text-5xl md:text-6xl text-cream tracking-tight">Soniqo Library</h2>
            <p className="text-xs text-muted">
              Portfolio streaming player • <b className="text-cream">{tracks.length} original tracks</b>
            </p>
          </div>
        </div>

        {/* Recently Played Section */}
        {recentlyPlayedTracks.length > 0 && (
          <div className="px-6 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Recently Played</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentlyPlayedTracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => playTrack(track.id)}
                  className="p-3 bg-panel/30 hover:bg-panel/50 rounded-xl flex items-center gap-3 cursor-pointer transition-colors shadow border border-cream/5 min-w-0"
                >
                  <div
                    className="w-10 h-10 rounded flex items-center justify-center flex-none"
                    style={{
                      background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})`,
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/80">
                      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-cream truncate">{track.title}</div>
                    <div className="text-[10px] text-muted truncate mt-0.5">{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tracks List */}
        <div className="p-6 flex flex-col gap-1.5 flex-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-1 px-1">All Songs</h3>
          {tracks.map((t, idx) => renderTrackRow(t, idx))}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderViewContent()}

      {/* 6. Context Add-to-Playlist Overlay Menu */}
      {activeMenuTrackId && (
        <div
          className="menu fixed z-50 bg-[#162924] border border-cream/10 rounded-xl p-1.5 shadow-2xl min-w-[200px]"
          style={{
            left: Math.min(menuPosition.x, typeof window !== "undefined" ? window.innerWidth - 220 : 0),
            top: menuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              addToQueue(activeMenuTrackId);
              setActiveMenuTrackId(null);
            }}
            className="w-full text-left text-xs py-2 px-3 hover:bg-panel rounded transition-colors text-cream cursor-pointer"
          >
            Add to Queue
          </button>
          <button
            onClick={() => {
              playNext(activeMenuTrackId);
              setActiveMenuTrackId(null);
            }}
            className="w-full text-left text-xs py-2 px-3 hover:bg-panel rounded transition-colors text-cream cursor-pointer"
          >
            Play Next
          </button>
          
          <div className="h-px bg-cream/10 my-1" />

          {/* Add to Playlist Nested list */}
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => {
                addTrackToPlaylist(pl.id, activeMenuTrackId);
                setActiveMenuTrackId(null);
              }}
              className="w-full text-left text-xs py-2 px-3 hover:bg-panel rounded transition-colors text-cream cursor-pointer"
            >
              Add to "{pl.name}"
            </button>
          ))}

          {/* Remove from Playlist row option (Only show if viewed in playlist) */}
          {view.startsWith("playlist:") && currentViewPlaylistId && (
            <>
              <div className="h-px bg-cream/10 my-1" />
              <button
                onClick={() => {
                  removeTrackFromPlaylist(currentViewPlaylistId, activeMenuTrackId);
                  setActiveMenuTrackId(null);
                }}
                className="w-full text-left text-xs py-2 px-3 hover:bg-panel rounded transition-colors text-pink cursor-pointer font-semibold"
              >
                Remove from playlist
              </button>
            </>
          )}
        </div>
      )}

      {/* Toast Notification Overlay */}
      {toastMessage && (
        <div className="fixed bottom-28 right-6 z-50 bg-[#162924] border-2 border-coral rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2.5 text-cream text-xs font-bold animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
          {toastMessage}
        </div>
      )}
    </>
  );
}
