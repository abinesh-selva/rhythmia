"use client";

import React from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

export function LikedSongsView() {
  const { tracks, likedSongs, playTrack } = useAudio();
  const likedTracks = tracks.filter((t) => likedSongs.has(t.id));

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header Hero */}
      <div className="hero liked-hero-bg p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 relative overflow-hidden transition-all">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent z-0" />

        <div className="hero-art liked-art-bg w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center flex-none shadow-2xl z-10 transition-transform hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-white shadow-inner drop-shadow-md">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        
        <div className="hero-info flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-white/80">Playlist</span>
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter py-2 drop-shadow-lg">
            Liked Songs
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-coral flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">S</span>
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">Vibeblower</span>
            <span className="text-sm text-white/70">•</span>
            <span className="text-sm text-white/90 font-medium">{likedTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play Controls Row */}
      {likedTracks.length > 0 && (
        <div className="px-6 md:px-8 py-6 flex items-center gap-6 relative z-10">
          <button
            onClick={() => playTrack(likedTracks[0].id, likedTracks.map(t => t.id))}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}

      {/* Tracks list */}
      <div className="px-6 md:px-8 flex flex-col gap-1.5 flex-1 mt-2">
        {likedTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
              <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
            </svg>
            No liked songs yet! Click the heart toggle on any track to populate this playlist.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-white/5">
            {likedTracks.map((t, idx) => (
              <TrackRow 
                key={t.id} 
                track={t} 
                index={idx} 
                playQueue={likedTracks.map(x => x.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
