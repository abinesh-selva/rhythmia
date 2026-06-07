import React from "react";
import { Track, useAudio } from "../../context/AudioContext";

const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

interface TrackRowProps {
  track: Track;
  index: number;
  isReorderable?: boolean;
  playlistId?: string;
  playlistTrackIds?: string[];
  playQueue?: string[];
  draggedIndex?: number | null;
  dragOverIndex?: number | null;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, targetIndex: number, playlistId: string, currentPlaylistTrackIds: string[]) => void;
  onDragEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent, trackId: string) => void;
}

export const TrackRow = React.memo(function TrackRow({
  track,
  index,
  isReorderable = false,
  playlistId,
  playlistTrackIds,
  playQueue,
  draggedIndex = null,
  dragOverIndex = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onContextMenu,
}: TrackRowProps) {
  const { currentTrack, isPlaying, likedSongs, playTrack, toggleLike } = useAudio();
  const isCurrent = currentTrack?.id === track.id;
  const isLiked = likedSongs.has(track.id);

  if (track.is_active === false) {
    return (
      <div className="grid grid-cols-[40px_1fr_52px_72px] md:grid-cols-[40px_1fr_1fr_52px_72px] gap-4 items-center px-4 py-2.5 rounded-lg opacity-30 cursor-not-allowed select-none">
        <span className="text-xs text-muted text-center">{index + 1}</span>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-white/5 flex-none" />
          <div className="min-w-0">
            <div className="text-sm text-muted truncate">{track.title}</div>
            <div className="text-xs text-muted/60 truncate mt-0.5">{track.artist}</div>
          </div>
        </div>
        <div className="text-xs text-muted truncate hidden md:block">{track.album}</div>
        <div /><div />
      </div>
    );
  }

  return (
    <div
      draggable={isReorderable}
      onDragStart={(e) => isReorderable && onDragStart && onDragStart(e, index)}
      onDragOver={(e) => isReorderable && onDragOver && onDragOver(e, index)}
      onDrop={(e) => isReorderable && playlistId && playlistTrackIds && onDrop && onDrop(e, index, playlistId, playlistTrackIds)}
      onDragEnd={isReorderable && onDragEnd ? onDragEnd : undefined}
      className={`group grid grid-cols-[40px_1fr_52px_72px] md:grid-cols-[40px_1fr_1fr_52px_72px] gap-4 items-center px-4 py-2.5 rounded-lg transition-colors cursor-pointer select-none border border-transparent ${
        isCurrent ? "bg-white/8" : "hover:bg-white/5"
      } ${dragOverIndex === index && draggedIndex !== index ? "border-dashed border-coral/40 bg-coral/5" : ""} ${
        draggedIndex === index ? "opacity-40" : ""
      }`}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, track.id)}
    >
      {/* Index / play indicator */}
      <div className="relative w-8 h-8 flex items-center justify-center flex-none">
        {isCurrent && isPlaying ? (
          /* Animated equalizer bars */
          <div className="flex items-end gap-[2px] h-4 w-4">
            <div className="w-[3px] bg-coral rounded-sm animate-eq-bar-1" style={{ height: "40%" }} />
            <div className="w-[3px] bg-coral rounded-sm animate-eq-bar-2" style={{ height: "70%" }} />
            <div className="w-[3px] bg-coral rounded-sm animate-eq-bar-3" style={{ height: "55%" }} />
          </div>
        ) : isCurrent ? (
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-coral">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : isReorderable ? (
          <>
            <span className="text-xs text-muted group-hover:hidden">{index + 1}</span>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-muted/60 hidden group-hover:block cursor-grab active:cursor-grabbing">
              <path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z" />
            </svg>
          </>
        ) : (
          <>
            <span className="text-xs text-muted group-hover:hidden">{index + 1}</span>
            <button
              onClick={(e) => { e.stopPropagation(); playTrack(track.id, playQueue, track); }}
              className="hidden group-hover:flex items-center justify-center w-full h-full"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-coral">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Title + artist + cover */}
      <div className="flex items-center gap-3 min-w-0" onClick={() => playTrack(track.id, playQueue, track)}>
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center flex-none shadow-sm overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}
        >
          {track.cover_image ? (
            <img src={track.cover_image} alt={track.album} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/70">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-medium truncate leading-tight ${isCurrent ? "text-coral" : "text-cream"}`}>
            {track.title}
          </div>
          <div className="text-xs text-muted truncate mt-0.5">
            {track.singers && track.singers.length > 0 ? track.singers.join(", ") : track.artist}
          </div>
        </div>
      </div>

      {/* Album */}
      <div className="text-xs text-muted truncate hidden md:block">{track.album}</div>

      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleLike(track.id); }}
        className={`justify-self-end transition-all hover:scale-110 active:scale-90 ${
          isLiked ? "text-coral opacity-100" : "text-muted/40 hover:text-muted opacity-0 group-hover:opacity-100"
        }`}
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <path
            d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
            stroke="currentColor"
            strokeWidth={isLiked ? "0" : "2"}
            fill={isLiked ? "currentColor" : "none"}
          />
        </svg>
      </button>

      {/* Duration + menu */}
      <div className="flex items-center justify-end gap-2 justify-self-end">
        <span className="text-xs text-muted/70 tabular-nums">{fmt(track.duration_sec)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onContextMenu && onContextMenu(e, track.id); }}
          className="text-muted/40 hover:text-muted opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded"
          title="Options"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
});
