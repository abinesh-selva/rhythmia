"use client";

import React, { useMemo, useState } from "react";
import { useAudio, Track } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

type SortOption = "recent" | "title" | "artist";

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Recently Added",
  title: "Title (A–Z)",
  artist: "Artist (A–Z)",
};

function fmtDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

export function LikedSongsView() {
  const { tracks, likedSongs, playTrack, toggleShuffle, isShuffle } = useAudio();
  const [sort, setSort] = useState<SortOption>("recent");
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const likedTracks: Track[] = useMemo(
    () => tracks.filter((t) => likedSongs.has(t.id)),
    [tracks, likedSongs]
  );

  const genres: string[] = useMemo(() => {
    const set = new Set<string>();
    for (const t of likedTracks) {
      if (t.genre) set.add(t.genre);
    }
    return Array.from(set).sort();
  }, [likedTracks]);

  const filteredTracks: Track[] = useMemo(() => {
    let result = activeGenre
      ? likedTracks.filter((t) => t.genre === activeGenre)
      : [...likedTracks];
    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "artist") result.sort((a, b) => a.artist.localeCompare(b.artist));
    return result;
  }, [likedTracks, activeGenre, sort]);

  const totalDuration = useMemo(
    () => filteredTracks.reduce((acc, t) => acc + (t.duration_sec ?? 0), 0),
    [filteredTracks]
  );

  const playAll = () => {
    if (filteredTracks.length === 0) return;
    playTrack(filteredTracks[0].id, filteredTracks.map((t) => t.id));
  };

  const shuffleAll = () => {
    if (filteredTracks.length === 0) return;
    if (!isShuffle) toggleShuffle();
    const idx = Math.floor(Math.random() * filteredTracks.length);
    playTrack(filteredTracks[idx].id, filteredTracks.map((t) => t.id));
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Hero */}
      <div className="liked-hero-bg p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent z-0" />

        <div className="liked-art-bg w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center flex-none shadow-2xl z-10 transition-transform hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        <div className="flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-white/80">Playlist</span>
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-7xl text-white tracking-tighter py-1 drop-shadow-lg">
            Liked Songs
          </h2>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
            <div className="w-6 h-6 rounded-full bg-coral flex items-center justify-center shadow-md">
              <span className="text-xs font-bold text-white">V</span>
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">Vibeblower</span>
            <span className="text-sm text-white/60">•</span>
            <span className="text-sm text-white/90 font-medium">{filteredTracks.length} songs</span>
            {totalDuration > 0 && (
              <>
                <span className="text-sm text-white/60">•</span>
                <span className="text-sm text-white/70">{fmtDuration(totalDuration)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      {likedTracks.length > 0 && (
        <div className="px-6 md:px-8 py-5 flex items-center gap-4 flex-wrap">
          {/* Play all */}
          <button
            onClick={playAll}
            aria-label="Play liked songs"
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          {/* Shuffle */}
          <button
            onClick={shuffleAll}
            aria-label="Shuffle liked songs"
            className={`w-10 h-10 rounded-full flex items-center justify-center shadow transition-all hover:scale-105 active:scale-95 ${
              isShuffle
                ? "bg-coral text-forest-dark"
                : "bg-white/10 text-muted hover:text-cream hover:bg-white/15"
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>

          {/* Sort dropdown */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowSortMenu((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-cream px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 transition-all"
              aria-haspopup="listbox"
              aria-expanded={showSortMenu}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M3 18h6v-2H3v2zm0-5h12v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
              {SORT_LABELS[sort]}
            </button>
            {showSortMenu && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-1.5 bg-panel border border-white/10 rounded-xl shadow-xl z-20 overflow-hidden min-w-[170px] animate-fade-in"
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                  <button
                    key={key}
                    role="option"
                    aria-selected={sort === key}
                    onClick={() => { setSort(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      sort === key
                        ? "text-coral font-semibold bg-white/6"
                        : "text-cream hover:bg-white/8"
                    }`}
                  >
                    {SORT_LABELS[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Genre filter chips */}
      {genres.length > 0 && (
        <div className="px-6 md:px-8 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveGenre(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-none ${
              activeGenre === null
                ? "bg-cream text-forest-dark"
                : "bg-white/8 text-muted hover:text-cream hover:bg-white/15"
            }`}
          >
            All
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGenre(g === activeGenre ? null : g)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-none capitalize ${
                activeGenre === g
                  ? "bg-coral text-white"
                  : "bg-white/8 text-muted hover:text-cream hover:bg-white/15"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* Track list */}
      <div className="px-6 md:px-8 flex flex-col gap-1.5 flex-1 mt-2">
        {filteredTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
              <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
            </svg>
            {likedTracks.length === 0
              ? "Click the heart on any track to add it here."
              : "No tracks match the selected genre."}
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-white/5">
            {filteredTracks.map((t, idx) => (
              <TrackRow
                key={t.id}
                track={t}
                index={idx}
                playQueue={filteredTracks.map((x) => x.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Click-away for sort menu */}
      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
