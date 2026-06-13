"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAudio, Track } from "@/context/AudioContext";
import { TrackRow } from "@/components/ui/TrackRow";
import Image from "next/image";

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
  const { playTrack, registerTracks } = useAudio();

  const [showAllTracks, setShowAllTracks] = useState(false);

  useEffect(() => {
    if (tracks.length > 0) {
      registerTracks(tracks);
    }
  }, [tracks, registerTracks]);

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    playTrack(tracks[0].id, tracks.map((t) => t.id), tracks[0]);
  };

  const heroGradient = tracks[0]?.cover_colors
    ? `linear-gradient(135deg, ${tracks[0].cover_colors[0]}, ${tracks[0].cover_colors[1]})`
    : "linear-gradient(135deg, #0E3B35, #1E9E54)";

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="relative p-6 md:p-8 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark via-transparent to-transparent z-0" />
        <div className="absolute inset-0 opacity-20 z-0" style={{ background: heroGradient }} />

        <div
          className="w-40 h-40 md:w-48 md:h-48 rounded-full shadow-2xl z-10 flex-none overflow-hidden flex items-center justify-center"
          style={{ background: heroGradient }}
        >
          {artist.image ? (
            <Image width={400} height={400} src={artist.image} alt={artist.display_name} className="w-full h-full object-cover" priority />
          ) : (
            <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/60">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-1.5 z-10 flex-1 min-w-0">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Artist</span>
          <h1 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight leading-none truncate">
            {artist.display_name}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {artist.track_count.toLocaleString()} songs · {artist.album_count} albums
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 py-5 flex items-center gap-3">
        {tracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="w-12 h-12 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {tracks.length > 0 && (
        <div className="px-6 md:px-8 mb-8">
          <h2 className="text-lg font-bold text-cream mb-3">Popular</h2>
          <div className="flex flex-col rounded-xl border border-white/5 overflow-hidden">
            {(showAllTracks ? tracks : tracks.slice(0, 10)).map((t, idx) => (
              <TrackRow
                key={t.id}
                track={t}
                index={idx}
                playQueue={tracks.map((x) => x.id)}
              />
            ))}
          </div>
          {tracks.length > 10 && (
            <button
              onClick={() => setShowAllTracks(!showAllTracks)}
              className="mt-4 text-xs font-bold uppercase tracking-widest text-muted hover:text-white transition-colors py-2 px-3 rounded hover:bg-white/5 transition-all"
            >
              {showAllTracks ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {albums.length > 0 && (
        <div className="px-6 md:px-8 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-cream">Albums</h2>
            <span className="text-xs text-muted">{albums.length} releases</span>
          </div>
          <div className="overflow-hidden"><div className="flex gap-3 overflow-x-auto pb-4 -mb-4 no-scrollbar">
            {albums.map((album) => {
              const colors = Array.isArray(album.cover_colors) ? album.cover_colors : ["#F0824E", "#1E9E54"];
              return (
                <div
                  key={album.id}
                  onClick={() => router.push(`/album/${album.id}/${album.slug}`)}
                  className="flex flex-col gap-2.5 min-w-card-xs md:min-w-card-alt p-3 bg-white/4 hover:bg-white/8 rounded-xl cursor-pointer group transition-all"
                >
                  <div
                    className="w-full aspect-square rounded-lg shadow-md flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
                  >
                    {album.cover_image ? (
                      <Image width={400} height={400} src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-10 h-10 fill-cream/50">
                        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                      </svg>
                    )}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const albumTracks = tracks.filter((t) => t.album_id === album.id);
                        if (albumTracks.length > 0) playTrack(albumTracks[0].id, albumTracks.map((t) => t.id), albumTracks[0]);
                        else router.push(`/album/${album.id}/${album.slug}`);
                      }}
                      className="absolute right-2 bottom-2 w-10 h-10 bg-green rounded-full flex items-center justify-center shadow-xl translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-cream truncate">{album.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {album.year ? `${album.year} · ` : ""}Album · {album.track_count} songs
                    </p>
                  </div>
                </div>
              );
            })}
          </div></div>
        </div>
      )}

    </div>
  );
}
