"use client";

import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { useToast } from "../../context/ToastContext";
import { useDialog } from "../../context/DialogContext";
import { TrackRow } from "../ui/TrackRow";

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { addToast } = useToast();
  const { showPrompt, showConfirm } = useDialog();
  const { 
    tracks, 
    playlists, 
    playTrack,
    deletePlaylist,
    renamePlaylist,
    reorderPlaylistTracks,
    toggleCollaborative
  } = useAudio();
  
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const pl = playlists.find((p) => p.id === playlistId);

  if (!pl) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col gap-3">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30 mx-auto">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          Playlist not found. It may have been deleted.
        </div>
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

  const handleRename = async () => {
    const newName = await showPrompt({
      title: "Rename Playlist",
      placeholder: pl.name,
      defaultValue: pl.name,
      confirmLabel: "Rename",
    });
    if (newName && newName.trim()) {
      renamePlaylist(pl.id, newName.trim());
    }
  };

  const handleSharePlaylist = () => {
    const shareUrl = `${window.location.origin}/playlist/${pl.id}`;
    navigator.clipboard.writeText(shareUrl);
    addToast("Share link copied to clipboard!", "success");
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number, currentPlaylistId: string, currentPlaylistTrackIds: string[]) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const list = [...currentPlaylistTrackIds];
    const [removed] = list.splice(draggedIndex, 1);
    list.splice(targetIndex, 0, removed);

    await reorderPlaylistTracks(currentPlaylistId, list);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header Hero */}
      <div
        className="hero p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 transition-all relative overflow-hidden"
      >
        {/* Dynamic Background Blur */}
        <div 
          className="absolute inset-0 opacity-40 z-0 transition-colors duration-1000"
          style={{
            background: `linear-gradient(to bottom, ${pl.cover_colors[0]}, var(--background))`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />

        <div
          className="hero-art w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center flex-none shadow-2xl z-10 transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})`,
          }}
        >
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-cream/80 drop-shadow-md">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        
        <div className="hero-info flex flex-col gap-2 flex-1 min-w-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-white/80">Playlist</span>
            {pl.collaborative && (
              <span className="bg-green/15 text-green border border-green/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                Collaborative
              </span>
            )}
          </div>
          <h2
            onClick={handleRename}
            className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter truncate cursor-pointer hover:underline decoration-white/30 decoration-2 drop-shadow-lg py-2"
            title="Click to rename"
          >
            {pl.name}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-blue flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">A</span>
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">Amigo</span>
            <span className="text-sm text-white/70">•</span>
            <span className="text-sm text-white/90 font-medium">{plTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play Controls Row */}
      <div className="px-6 md:px-8 py-6 flex items-center gap-6 relative z-10">
        {plTracks.length > 0 && (
          <button
            onClick={() => playTrack(plTracks[0].id, pl.songs)}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <button
            onClick={handleSharePlaylist}
            className="text-muted hover:text-white transition-colors"
            title="Share Playlist"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
               <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
          
          {/* Options Menu Trigger placeholder (You could expand this into a real dropdown) */}
          <div className="relative group cursor-pointer">
             <button className="text-muted hover:text-white transition-colors">
               <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                 <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
               </svg>
             </button>
             <div className="absolute right-0 mt-2 w-48 bg-panel border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <div className="p-1 flex flex-col">
                 <button onClick={handleRename} className="text-left px-3 py-2 text-sm text-cream hover:bg-white/8 rounded">Rename</button>
                 <button onClick={() => toggleCollaborative(pl.id)} className="text-left px-3 py-2 text-sm text-cream hover:bg-white/8 rounded">
                   {pl.collaborative ? "Make Private" : "Make Collaborative"}
                 </button>
                 <div className="h-px bg-cream/10 my-1"></div>
                 <button
                   onClick={async () => {
                     const ok = await showConfirm({
                       title: "Delete Playlist",
                       description: `"${pl.name}" will be permanently removed. This cannot be undone.`,
                       confirmLabel: "Delete",
                       variant: "danger",
                     });
                     if (ok) deletePlaylist(pl.id);
                   }}
                   className="text-left px-3 py-2 text-sm text-pink hover:bg-pink/10 rounded"
                 >
                   Delete
                 </button>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Playlist search & tracks (Reorderable) */}
      <div className="px-6 md:px-8 flex flex-col gap-3 flex-1 mt-2">
        {plTracks.length > 0 && (
          <div className="flex items-center justify-between gap-4 pb-4">
            {/* Inline Playlist search bar */}
            <div className="relative max-w-xs w-full group">
              <input
                value={playlistSearchQuery}
                onChange={(e) => setPlaylistSearchQuery(e.target.value)}
                placeholder="Find in playlist"
                className="w-full pl-9 pr-3 py-2 bg-white/6 border border-white/8 hover:border-white/20 rounded-md text-cream text-sm placeholder-muted focus:outline-none focus:border-white/30 transition-colors"
              />
              <svg viewBox="0 0 24 24" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 fill-muted group-hover:fill-cream/70 transition-colors">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              {playlistSearchQuery && (
                <button
                  onClick={() => setPlaylistSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-cream text-lg leading-none select-none"
                >
                  &times;
                </button>
              )}
            </div>
            
            <div className="text-xs text-muted uppercase tracking-widest font-semibold select-none hidden sm:block opacity-60">
              Drag rows to reorder
            </div>
          </div>
        )}

        {filteredPlaylistTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col gap-3">
            <span>{plTracks.length === 0 ? "Playlist is empty." : "No matching tracks found."}</span>
            <span className="text-xs opacity-70">
              {plTracks.length === 0 
                ? "Right-click any track or click the track menu (...) to add songs!" 
                : "Clear search or try another keyword."}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1 rounded-xl overflow-hidden border border-white/5">
            {filteredPlaylistTracks.map((t, idx) =>
              <TrackRow 
                key={t.id}
                track={t}
                index={idx}
                isReorderable={true}
                playlistId={pl.id}
                playlistTrackIds={pl.songs}
                playQueue={pl.songs}
                draggedIndex={draggedIndex}
                dragOverIndex={dragOverIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
