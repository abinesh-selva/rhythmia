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
  album_count: number;
  track_count: number;
}

interface Album {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  cover_colors: string[];
  track_count: number;
  year: number | null;
}

interface ArtistDetailViewProps {
  artist: Artist;
  albums: Album[];
  tracks: Track[];
}

const fmt = (s: number) => {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function ArtistDetailView({ artist, albums, tracks }: ArtistDetailViewProps) {
  const router = useRouter();
  const { playTrack, addToQueue } = useAudio();
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setActiveMenuTrackId(trackId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0].id, tracks.map((t) => t.id));
  };

  const heroGradient = tracks[0]?.cover_colors
    ? `linear-gradient(135deg, ${tracks[0].cover_colors[0]}, ${tracks[0].cover_colors[1]})`
    : "linear-gradient(135deg, #0E3B35, #1E9E54)";

  return (
    <div className="flex flex-col min-h-full pb-20" onClick={() => setActiveMenuTrackId(null)}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="hero relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />
        <div className="absolute inset-0 opacity-30 z-0" style={{ background: heroGradient }} />

        {/* Artist avatar */}
        <div
          className="w-40 h-40 md:w-52 md:h-52 rounded-full shadow-2xl z-10 flex-none overflow-hidden flex items-center justify-center"
          style={{ background: heroGradient }}
        >
          {artist.image ? (
            <img src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-20 h-20 fill-cream/70">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 z-10 flex-1 min-w-0">
          <span className="text-xs font-bold text-cream/70 uppercase tracking-widest flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-blue">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Verified Artist
          </span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white tracking-tighter drop-shadow-lg truncate">
            {artist.display_name}
          </h1>
          <p className="text-white/70 text-sm font-medium">
            {artist.track_count.toLocaleString()} songs · {artist.album_count} albums
          </p>
        </div>
      </div>

      {/* ── Controls ─────────────────────────────────────────── */}
      <div className="px-6 md:px-10 py-6 flex items-center gap-4">
        {tracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Popular Tracks ────────────────────────────────────── */}
      {tracks.length > 0 && (
        <div className="px-6 md:px-10 mb-8">
          <h2 className="text-xl font-bold text-cream mb-4">Popular</h2>
          <div className="flex flex-col bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {tracks.slice(0, 10).map((t, idx) => (
              <TrackRow
                key={t.id}
                track={t}
                index={idx}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Albums ────────────────────────────────────────────── */}
      {albums.length > 0 && (
        <div className="px-6 md:px-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-cream">Albums</h2>
            <span className="text-sm text-muted">{albums.length} releases</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {albums.map((album) => {
              const colors = Array.isArray(album.cover_colors)
                ? album.cover_colors
                : ["#F0824E", "#1E9E54"];
              return (
                <div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  className="flex flex-col gap-3 min-w-40 md:min-w-44 p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all hover:scale-105"
                >
                  <div
                    className="w-full aspect-square rounded-lg shadow-lg flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                  >
                    {album.cover_image ? (
                      <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream/60">
                        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                      </svg>
                    )}
                    <div className="absolute right-2 bottom-2 w-10 h-10 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-0 opacity-100 md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 transition-all z-10">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-forest-dark ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-cream truncate">{album.title}</p>
                    <p className="text-xs text-muted truncate mt-0.5">
                      {album.year ? `${album.year} · ` : ""}Album · {album.track_count} songs
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
