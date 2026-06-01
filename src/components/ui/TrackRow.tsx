import React from "react";
import { Track, useAudio } from "../../context/AudioContext";

// Helper to format track durations
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
  playQueue?: string[]; // if provided, sets the playback queue on click (e.g. all tracks in a collection/album)
  draggedIndex?: number | null;
  dragOverIndex?: number | null;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, targetIndex: number, playlistId: string, currentPlaylistTrackIds: string[]) => void;
  onDragEnd?: () => void;
  onContextMenu?: (e: React.MouseEvent, trackId: string) => void;
}

export function TrackRow({
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
  const { currentTrack, likedSongs, playTrack, toggleLike } = useAudio();
  const isCurrent = currentTrack?.id === track.id;
  const isLiked = likedSongs.has(track.id);

  // Inactive tracks: render greyed-out "Unavailable" row — non-playable, non-interactive
  if (track.is_active === false) {
    return (
      <div className="row grid track-row-grid gap-4 items-center px-4 py-2.5 rounded-lg opacity-40 cursor-not-allowed select-none">
        <span className="text-xs text-muted text-center">{index + 1}</span>
        <div className="tcell flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded bg-panel/50 flex-none border border-cream/10" />
          <div className="tt min-w-0">
            <div className="nm text-sm text-muted truncate">{track.title}</div>
            <div className="ar text-xs text-muted/60 truncate mt-0.5">Unavailable · {track.artist}</div>
          </div>
        </div>
        <div className="alb text-xs text-muted truncate">{track.album}</div>
        <div /><div />
      </div>
    );
  }

  return (
    <div
      key={track.id}
      draggable={isReorderable}
      onDragStart={(e) => isReorderable && onDragStart && onDragStart(e, index)}
      onDragOver={(e) => isReorderable && onDragOver && onDragOver(e, index)}
      onDrop={(e) => isReorderable && playlistId && playlistTrackIds && onDrop && onDrop(e, index, playlistId, playlistTrackIds)}
      onDragEnd={isReorderable && onDragEnd ? onDragEnd : undefined}
      className={`row group grid track-row-grid gap-4 items-center px-4 py-2.5 rounded-lg transition-colors cursor-pointer select-none border border-transparent ${
        isCurrent ? "bg-panel/40" : "hover:bg-panel/20"
      } ${dragOverIndex === index && draggedIndex !== index ? "border-dashed border-coral bg-coral/5" : ""} ${
        draggedIndex === index ? "opacity-40" : ""
      }`}
      onContextMenu={(e) => onContextMenu && onContextMenu(e, track.id)}
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
              playTrack(track.id, playQueue, track);
            }}
            className="pic hidden group-hover:flex items-center justify-center border-none bg-transparent absolute inset-0 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-coral">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* Title & Artist & Album Cover */}
      <div className="tcell flex items-center gap-3 min-w-0" onClick={() => playTrack(track.id, playQueue, track)}>
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
          <div className="ar text-xs text-muted truncate mt-0.5">
            {track.singers && track.singers.length > 0
              ? track.singers.join(", ")
              : track.artist}
          </div>
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
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path
            d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
            stroke="currentColor"
            strokeWidth={isLiked ? "0" : "2"}
            fill={isLiked ? "currentColor" : "none"}
          />
        </svg>
      </button>

      {/* Duration / Menu Trigger */}
      <div className="flex items-center justify-between gap-1 pr-2 justify-self-end min-w-12">
        <span className="text-xs text-muted tabular-nums select-none">{fmt(track.duration_sec)}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onContextMenu) {
              onContextMenu(e, track.id);
            }
          }}
          className="text-muted hover:text-cream opacity-0 group-hover:opacity-100 transition-opacity ml-1 cursor-pointer"
          title="Options"
        >
          &#8942;
        </button>
      </div>
    </div>
  );
}
