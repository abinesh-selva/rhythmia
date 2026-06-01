"use client";

import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface CollectionTrack {
  id: string; title: string; artist: string; album: string;
  audio_url: string; cover_colors: string[]; duration_sec: number;
  is_active: boolean; singers?: string[]; genre?: string; language?: string;
}

interface CollectionDetailProps {
  collection: { id: string; name: string; slug: string; source_folder: string | null; cover_colors: string[]; track_count: number };
  tracks: CollectionTrack[];
}

export function CollectionDetailView({ collection, tracks }: CollectionDetailProps) {
  const { playTrack, addToQueue } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setActiveMenuTrackId(trackId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const activeTracks = tracks.filter((t) => t.is_active !== false);
  const filteredTracks = activeTracks.filter(
    (t) =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.singers ?? []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const colors = Array.isArray(collection.cover_colors) ? collection.cover_colors : ["#F0824E", "#1E9E54"];

  return (
    <div className="flex flex-col min-h-full pb-20" onClick={() => setActiveMenuTrackId(null)}>
      {/* Hero */}
      <div
        className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 overflow-hidden"
        style={{ background: `linear-gradient(to bottom, ${colors[0]}55, var(--theme-forest-dark))` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />

        {/* Cover art */}
        <div
          className="w-40 h-40 md:w-56 md:h-56 rounded-2xl shadow-2xl z-10 flex-none flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        >
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-cream/50 drop-shadow-lg">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 z-10 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cream/60">Collection</span>
            {collection.source_folder && (
              <span className="text-xs text-muted font-mono bg-panel/40 px-2 py-0.5 rounded-full">{collection.source_folder}</span>
            )}
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-white tracking-tighter drop-shadow-lg truncate">
            {collection.name}
          </h1>
          <p className="text-white/60 text-sm font-medium">{activeTracks.length} songs · Various Artists</p>
        </div>
      </div>

      {/* Controls */}
      {activeTracks.length > 0 && (
        <div className="px-6 md:px-10 py-6 flex items-center gap-4 flex-wrap">
          <button
            onClick={() => playTrack(activeTracks[0].id as any, activeTracks.map(t => t.id), activeTracks[0] as any)}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
          </button>
          <div className="text-sm text-muted">
            Compilation from Cloudinary — artist & album data from ID3 tags
          </div>
        </div>
      )}

      {/* Search + tracks */}
      <div className="px-6 md:px-10 flex flex-col gap-4 flex-1">
        {activeTracks.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-xs w-full group">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in collection…"
                className="w-full pl-9 pr-3 py-2 bg-panel/50 border border-cream/5 hover:border-cream/20 rounded-md text-cream text-sm placeholder-muted focus:outline-none focus:border-coral transition-colors"
              />
              <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 fill-muted">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream text-lg leading-none">&times;</button>
              )}
            </div>
            <span className="text-xs text-muted/60 hidden sm:block">{filteredTracks.length} tracks</span>
          </div>
        )}

        {filteredTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/30">
            {activeTracks.length === 0 ? "Collection is empty." : "No matching tracks."}
          </div>
        ) : (
          <div className="flex flex-col gap-1 bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {filteredTracks.map((t, idx) => (
              <TrackRow
                key={t.id}
                track={t as any}
                index={idx}
                playQueue={activeTracks.map(x => x.id)}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {activeMenuTrackId && (
        <div
          className="fixed z-50 w-44 bg-panel border border-cream/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
          style={{ top: Math.min(menuPosition.y, window.innerHeight - 100), left: Math.min(menuPosition.x, window.innerWidth - 184) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { addToQueue(activeMenuTrackId); setActiveMenuTrackId(null); }}
            className="w-full text-left px-4 py-3 text-sm text-cream hover:bg-panel-hover transition-colors font-medium"
          >
            Add to Queue
          </button>
        </div>
      )}
    </div>
  );
}
