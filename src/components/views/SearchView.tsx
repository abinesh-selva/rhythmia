import React from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface SearchViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
  showToast: (msg: string) => void;
}

export function SearchView({ onContextMenu, showToast }: SearchViewProps) {
  const { tracks, searchQuery, playTrack } = useAudio();

  const filtered = tracks.filter(
    (t) =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.album?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight">
          {searchQuery ? `Results for "${searchQuery}"` : "Search Catalogue"}
        </h2>
        <p className="text-sm text-muted mt-2">Explore all tracks or filter by title and artist</p>
      </div>

      <div className="list flex flex-col gap-2">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/30 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            No songs match your query. Try searching for a different keyword.
          </div>
        ) : (
          <div className="bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {filtered.map((t, idx) => (
              <TrackRow 
                key={t.id} 
                track={t} 
                index={idx} 
                onContextMenu={onContextMenu} 
              />
            ))}
          </div>
        )}
      </div>

      {!searchQuery && (
        <div className="mt-12 flex flex-col gap-6 animate-fade-in">
          <h3 className="text-xl font-bold tracking-tight text-cream">Browse All</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E13300] to-[#FF6B35] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">Alternative</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E3264] to-[#2E4A96] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">Acoustic Chill</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#8D67AB] to-[#B388D6] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">Lo-Fi Beats</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#E8115B] to-[#FF4585] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">Instrumental</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1DB954] to-[#34D068] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">Podcasts</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#B02897] to-[#D644BB] font-bold text-xl md:text-2xl aspect-[1.2] relative overflow-hidden shadow-lg select-none cursor-pointer hover:scale-[1.02] transition-transform">
              <span className="relative z-10 text-white drop-shadow-md">New Releases</span>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/20 rounded-xl transform rotate-12 backdrop-blur-md shadow-inner" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
