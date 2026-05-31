"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAudio, Track } from "@/context/AudioContext";
import { TrackRow } from "@/components/ui/TrackRow";

interface Artist {
  id: string;
  display_name: string;
  slug: string;
  image: string | null;
}

interface Album {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  cover_colors: string[] | string;
  track_count: number;
  year: number | null;
  artist_id: string;
  artists: Artist | Artist[] | null;
}

interface AlbumDetailViewProps {
  album: Album;
  tracks: Track[];
}

const fmt = (s: number) => {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
};

const fmtTotal = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
};

export function AlbumDetailView({ album, tracks }: AlbumDetailViewProps) {
  const router = useRouter();
  const { playTrack, toggleShuffle, addToQueue } = useAudio();
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const artist = Array.isArray(album.artists) ? album.artists[0] : album.artists;
  const colors: string[] = Array.isArray(album.cover_colors)
    ? album.cover_colors
    : typeof album.cover_colors === "string"
      ? JSON.parse(album.cover_colors)
      : ["#F0824E", "#1E9E54"];

  const totalDuration = tracks.reduce((s, t) => s + (t.duration_sec ?? 0), 0);
  const activeTracks  = tracks.filter((t) => t.is_active !== false);

  const handlePlayAll = () => {
    if (activeTracks.length === 0) return;
    playTrack(activeTracks[0].id, activeTracks.map((t) => t.id));
  };

  const handleShuffle = () => {
    if (activeTracks.length === 0) return;
    toggleShuffle();
    const rand = activeTracks[Math.floor(Math.random() * activeTracks.length)];
    playTrack(rand.id, activeTracks.map((t) => t.id));
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setActiveMenuTrackId(trackId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="flex flex-col min-h-full pb-20" onClick={() => setActiveMenuTrackId(null)}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="hero relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40 z-0"
          style={{ background: `linear-gradient(to bottom, ${colors[0]}, transparent)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />

        {/* Cover */}
        <div
          className="w-44 h-44 md:w-56 md:h-56 rounded-xl shadow-2xl z-10 flex-none flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        >
          {album.cover_image ? (
            <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/70">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-col gap-2 z-10 flex-1 min-w-0">
          <span className="text-xs font-bold text-white/70 uppercase tracking-widest">Album</span>
          <h1 className="font-display font-black text-4xl md:text-6xl lg:text-7xl text-white tracking-tighter drop-shadow-lg">
            {album.title}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {artist && (
              <button
                onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)}
                className="text-sm font-bold text-white hover:underline"
              >
                {artist.display_name}
              </button>
            )}
            {album.year && <span className="text-white/60 text-sm">· {album.year}</span>}
            <span className="text-white/60 text-sm">
              · {tracks.length} songs, {fmtTotal(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="px-6 md:px-10 py-6 flex items-center gap-4">
        {activeTracks.length > 0 && (
          <>
            <button
              onClick={handlePlayAll}
              className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={handleShuffle}
              className="text-muted hover:text-cream transition-colors hover:scale-110 active:scale-90"
              title="Shuffle"
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
                <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
              </svg>
            </button>
          </>
        )}
        <button
          onClick={handleShare}
          className="text-muted hover:text-cream transition-colors hover:scale-110 active:scale-90 ml-auto"
          title="Copy link"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
          </svg>
        </button>
      </div>

      {/* ── Track list ────────────────────────────────────────── */}
      <div className="px-6 md:px-10">
        {tracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/20">
            No tracks in this album yet.
          </div>
        ) : (
          <div className="flex flex-col bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
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
          style={{
            top:  Math.min(menuPosition.y, window.innerHeight - 120),
            left: Math.min(menuPosition.x, window.innerWidth  - 180),
          }}
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
