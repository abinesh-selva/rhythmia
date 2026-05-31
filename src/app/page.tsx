"use client";

import React, { useState } from "react";
import { useAudio } from "../context/AudioContext";
import { useToast } from "../context/ToastContext";
import { HomeView } from "../components/views/HomeView";
import { SearchView } from "../components/views/SearchView";
import { PlaylistView } from "../components/views/PlaylistView";
import { LikedSongsView } from "../components/views/LikedSongsView";
import { QueueView } from "../components/views/QueueView";
import { CloudinarySyncView } from "../components/views/CloudinarySyncView";
import { AlbumView } from "../components/views/AlbumView";
import { ArtistView } from "../components/views/ArtistView";
import { LiveEventsView } from "../components/views/LiveEventsView";

export default function Page() {
  const { view, playlists, addToQueue, addTrackToPlaylist } = useAudio();
  const { addToast } = useToast();

  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setActiveMenuTrackId(trackId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const renderView = () => {
    if (view === "home") {
      return <HomeView onContextMenu={handleContextMenu} />;
    } else if (view === "search") {
      return <SearchView onContextMenu={handleContextMenu} />;
    } else if (view.startsWith("playlist:")) {
      const playlistId = view.split(":")[1];
      return <PlaylistView playlistId={playlistId} onContextMenu={handleContextMenu} />;
    } else if (view.startsWith("album:")) {
      const albumName = view.split(":")[1];
      return <AlbumView albumName={albumName} onContextMenu={handleContextMenu} />;
    } else if (view.startsWith("artist:")) {
      const artistName = view.split(":")[1];
      return <ArtistView artistName={artistName} onContextMenu={handleContextMenu} />;
    } else if (view === "liked") {
      return <LikedSongsView onContextMenu={handleContextMenu} />;
    } else if (view === "queue") {
      return <QueueView onContextMenu={handleContextMenu} />;
    } else if (view === "sync") {
      return <CloudinarySyncView />;
    } else if (view === "live") {
      return <LiveEventsView />;
    }
    return <HomeView onContextMenu={handleContextMenu} />;
  };

  return (
    <div onClick={() => setActiveMenuTrackId(null)}>
      {renderView()}

      {/* GLOBAL TRACK CONTEXT MENU */}
      {activeMenuTrackId && (
        <div
          className="fixed z-50 w-48 bg-panel border border-cream/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
          style={{
            top: Math.min(menuPosition.y, window.innerHeight - 250),
            left: Math.min(menuPosition.x, window.innerWidth - 200),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              addToQueue(activeMenuTrackId);
              setActiveMenuTrackId(null);
              addToast("Added to queue", "success");
            }}
            className="w-full text-left px-4 py-3 text-sm text-cream hover:bg-panel-hover transition-colors font-medium border-b border-cream/5"
          >
            Add to Queue
          </button>

          <div className="px-4 py-2 text-xs font-bold text-muted uppercase tracking-wider bg-black/20">
            Add to Playlist
          </div>
          <div className="max-h-40 overflow-y-auto">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => {
                  addTrackToPlaylist(pl.id, activeMenuTrackId);
                  setActiveMenuTrackId(null);
                  addToast(`Added to ${pl.name}`, "success");
                }}
                className="w-full text-left px-4 py-2 text-sm text-cream hover:bg-panel-hover transition-colors"
              >
                {pl.name}
              </button>
            ))}
            {playlists.length === 0 && (
              <div className="px-4 py-3 text-xs text-muted">No custom playlists</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
