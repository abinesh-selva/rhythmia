import React from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

export function RecentlyPlayedView() {
  const { tracks, recentlyPlayed, playTrack } = useAudio();
  
  // recentlyPlayed is an array of track IDs ordered from most recent to least recent
  const recentTracks = recentlyPlayed
    .map(id => tracks.find(t => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header Hero */}
      <div className="hero recent-hero-bg p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 relative overflow-hidden transition-all">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent z-0" />

        <div className="hero-art recent-art-bg w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center flex-none shadow-2xl z-10 transition-transform hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-white shadow-inner drop-shadow-md">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </div>
        
        <div className="hero-info flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-white/80">Profile</span>
          <h2 className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter py-2 drop-shadow-lg">
            Recently Played
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-white drop-shadow">Vibeblower</span>
            <span className="text-sm text-white/70">•</span>
            <span className="text-sm text-white/90 font-medium">{recentTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play Controls Row */}
      {recentTracks.length > 0 && (
        <div className="px-6 md:px-8 py-6 flex items-center gap-6 relative z-10">
          <button
            onClick={() => playTrack(recentTracks[0].id)}
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
        {recentTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Your listening history will appear here once you start playing music!
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-white/5">
            {recentTracks.map((t, idx) => (
              <TrackRow 
                key={`${t.id}-${idx}`} 
                track={t} 
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
