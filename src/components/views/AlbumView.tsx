import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { useToast } from "../../context/ToastContext";
import { TrackRow } from "../ui/TrackRow";

interface AlbumViewProps {
  albumName: string;
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
}

export function AlbumView({ albumName, onContextMenu }: AlbumViewProps) {
  const { addToast } = useToast();
  const { tracks, playTrack } = useAudio();
  const [searchQuery, setSearchQuery] = useState("");

  const albumTracks = tracks.filter((t) => t.album === albumName);

  if (albumTracks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/30 flex flex-col gap-3">
          <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30 mx-auto">
             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          Album not found.
        </div>
      </div>
    );
  }

  const filteredTracks = albumTracks.filter(
    (t) =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const firstTrack = albumTracks[0];

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/?view=album:${albumName}`;
    navigator.clipboard.writeText(shareUrl);
    addToast("Share link copied to clipboard!", "success");
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Header Hero */}
      <div
        className="hero p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 transition-all relative overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-40 z-0 transition-colors duration-1000"
          style={{
            background: `linear-gradient(to bottom, ${firstTrack.cover_colors[0]}, var(--background))`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />

        <div
          className="hero-art w-40 h-40 md:w-56 md:h-56 rounded-xl shadow-2xl z-10 transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${firstTrack.cover_colors[0]}, ${firstTrack.cover_colors[1]})`,
          }}
        />
        
        <div className="hero-info flex flex-col gap-2 flex-1 min-w-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wider text-white/80">Album</span>
          </div>
          <h2
            className="font-display font-black text-5xl md:text-7xl lg:text-8xl text-white tracking-tighter truncate drop-shadow-lg py-2"
          >
            {albumName}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm font-semibold text-white drop-shadow">{firstTrack.artist}</span>
            <span className="text-sm text-white/70">•</span>
            <span className="text-sm text-white/90 font-medium">{albumTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Play Controls Row */}
      <div className="px-6 md:px-10 py-6 flex items-center gap-6 relative z-10">
        <button
          onClick={() => playTrack(albumTracks[0].id)}
          className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        
        <div className="flex items-center gap-4 ml-auto md:ml-0">
          <button
            onClick={handleShare}
            className="text-muted hover:text-white transition-colors"
            title="Share Album"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
               <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 flex flex-col gap-3 flex-1 mt-2">
        <div className="flex flex-col gap-1 bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
          {filteredTracks.map((t, idx) =>
            <TrackRow 
              key={t.id}
              track={t}
              index={idx}
              onContextMenu={onContextMenu}
            />
          )}
        </div>
      </div>
    </div>
  );
}
