"use client";

import React, { useState, useEffect } from "react";
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
  const { playTrack, toggleShuffle, registerTracks } = useAudio();

  const activeTracks  = tracks.filter((t) => t.is_active !== false);

  useEffect(() => {
    if (activeTracks.length > 0) {
      registerTracks(activeTracks);
    }
  }, [activeTracks, registerTracks]);

  const artist = Array.isArray(album.artists) ? album.artists[0] : album.artists;
  const colors: string[] = Array.isArray(album.cover_colors)
    ? album.cover_colors
    : typeof album.cover_colors === "string"
      ? JSON.parse(album.cover_colors)
      : ["#F0824E", "#1E9E54"];

  const totalDuration = tracks.reduce((s, t) => s + (t.duration_sec ?? 0), 0);

  const handlePlayAll = () => {
    if (activeTracks.length === 0) return;
    playTrack(activeTracks[0].id, activeTracks.map((t) => t.id), activeTracks[0]);
  };

  const handleShuffle = () => {
    if (activeTracks.length === 0) return;
    toggleShuffle();
    const rand = activeTracks[Math.floor(Math.random() * activeTracks.length)];
    playTrack(rand.id, activeTracks.map((t) => t.id), rand);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(160deg, ${colors[0]}30, transparent 60%)` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-transparent to-transparent z-0" />

        <div
          className="w-40 h-40 md:w-52 md:h-52 rounded-xl shadow-2xl z-10 flex-none flex items-center justify-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
        >
          {album.cover_image ? (
            <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-14 h-14 fill-cream/60">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-1.5 z-10 flex-1 min-w-0">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Album</span>
          <h1 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight leading-none">
            {album.title}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-white/60">
            {artist && (
              <button onClick={() => router.push(`/artist/${artist.id}/${artist.slug}`)} className="font-semibold text-white hover:underline">
                {artist.display_name}
              </button>
            )}
            {album.year && <span>· {album.year}</span>}
            <span>· {tracks.length} songs, {fmtTotal(totalDuration)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-5 flex items-center gap-3">
        {activeTracks.length > 0 && (
          <>
            <button
              onClick={handlePlayAll}
              className="w-12 h-12 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-0.5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <button
              onClick={handleShuffle}
              className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90"
              title="Shuffle"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
              </svg>
            </button>
          </>
        )}
        <button
          onClick={handleShare}
          className="text-muted hover:text-cream transition-all hover:scale-110 active:scale-90 ml-auto"
          title="Copy link"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
          </svg>
        </button>
      </div>

      <div className="px-6 md:px-8">
        {tracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-xl bg-white/3">
            No tracks in this album yet.
          </div>
        ) : (
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/5">
            {tracks.map((track, idx) => (
              <TrackRow
                key={track.id}
                track={track}
                index={idx}
                playQueue={activeTracks.map((t) => t.id)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
