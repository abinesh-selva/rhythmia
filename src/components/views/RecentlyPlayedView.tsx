"use client";

import React, { useMemo, useState } from "react";
import { useAudio, Track } from "../../context/AudioContext";
import { useDialog } from "../../context/DialogContext";
import { TrackRow } from "../ui/TrackRow";

type DateGroup = "Today" | "Yesterday" | "This week" | "Earlier";

function getDateGroup(index: number, total: number): DateGroup {
  const relPos = index / Math.max(total - 1, 1);
  if (relPos < 0.12) return "Today";
  if (relPos < 0.28) return "Yesterday";
  if (relPos < 0.60) return "This week";
  return "Earlier";
}

export function RecentlyPlayedView() {
  const { tracks, recentlyPlayed, playTrack, clearRecentlyPlayed } = useAudio();
  const { showConfirm } = useDialog();
  const [clearing, setClearing] = useState(false);

  const recentTracks: Track[] = useMemo(
    () =>
      recentlyPlayed
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined),
    [recentlyPlayed, tracks]
  );

  const grouped = useMemo(() => {
    const ORDER: DateGroup[] = ["Today", "Yesterday", "This week", "Earlier"];
    const map = new Map<DateGroup, Track[]>();
    for (const g of ORDER) map.set(g, []);

    recentTracks.forEach((t, idx) => {
      const group = getDateGroup(idx, recentTracks.length);
      map.get(group)!.push(t);
    });

    return ORDER.map((label) => ({ label, items: map.get(label)! })).filter(
      (g) => g.items.length > 0
    );
  }, [recentTracks]);

  const allQueue = recentTracks.map((t) => t.id);

  const handleClearAll = async () => {
    const confirmed = await showConfirm({
      title: "Clear listening history?",
      description:
        "This will remove all your recently played tracks. This action cannot be undone.",
      confirmLabel: "Clear All",
      variant: "danger",
    });
    if (!confirmed) return;
    setClearing(true);
    clearRecentlyPlayed();
    setClearing(false);
  };

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Hero */}
      <div className="recent-hero-bg p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/80 to-transparent z-0" />

        <div className="recent-art-bg w-40 h-40 md:w-56 md:h-56 rounded-xl flex items-center justify-center flex-none shadow-2xl z-10 transition-transform hover:scale-105">
          <svg viewBox="0 0 24 24" className="w-16 h-16 md:w-24 md:h-24 fill-white drop-shadow-md">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
          </svg>
        </div>

        <div className="flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-white/80">History</span>
          <h2 className="font-display font-black text-3xl sm:text-5xl md:text-7xl text-white tracking-tighter py-1 drop-shadow-lg">
            Recently Played
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-white drop-shadow">Vibeblower</span>
            <span className="text-sm text-white/60">•</span>
            <span className="text-sm text-white/90 font-medium">{recentTracks.length} songs</span>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      {recentTracks.length > 0 && (
        <div className="px-6 md:px-8 py-5 flex items-center gap-4">
          <button
            onClick={() => playTrack(recentTracks[0].id, allQueue)}
            aria-label="Play recently played"
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>

          <button
            onClick={handleClearAll}
            disabled={clearing}
            aria-label="Clear all listening history"
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-pink px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
            Clear All
          </button>
        </div>
      )}

      {/* Grouped track list */}
      <div className="px-6 md:px-8 flex flex-col gap-6 flex-1 mt-2">
        {recentTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4 flex flex-col items-center gap-4">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            Your listening history will appear here once you start playing music!
          </div>
        ) : (
          grouped.map(({ label, items }) => (
            <div key={label}>
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 px-1">
                {label}
              </h3>
              <div className="rounded-xl overflow-hidden border border-white/5">
                {items.map((t, idx) => (
                  <TrackRow
                    key={`${t.id}-${idx}`}
                    track={t}
                    index={idx}
                    playQueue={allQueue}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
