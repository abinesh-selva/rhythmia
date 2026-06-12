"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAudio } from "./AudioContext";
import { useToast } from "./ToastContext";

interface TrackMenuContextType {
  openTrackMenu: (e: React.MouseEvent, trackId: string) => void;
}

const TrackMenuContext = createContext<TrackMenuContextType | undefined>(undefined);

export const TrackMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const { playlists, addToQueue, addTrackToPlaylist } = useAudio();
  const { addToast } = useToast();

  const [trackId, setTrackId] = useState<string | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const openTrackMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setTrackId(id);
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  const close = useCallback(() => setTrackId(null), []);

  useEffect(() => {
    if (!trackId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [trackId, close]);

  return (
    <TrackMenuContext.Provider value={{ openTrackMenu }}>
      {children}

      {trackId && (
        <>
          <div className="fixed inset-0 z-50" onClick={close} onContextMenu={(e) => { e.preventDefault(); close(); }} />
          <div
            className="fixed z-50 w-48 bg-panel border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in py-1"
            style={{
              top: Math.min(pos.y, window.innerHeight - 240),
              left: Math.min(pos.x, window.innerWidth - 200),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { addToQueue(trackId); close(); addToast("Added to queue", "success"); }}
              className="w-full text-left px-4 py-2.5 text-sm text-cream hover:bg-white/8 transition-colors font-medium"
            >
              Add to Queue
            </button>

            <div className="mx-3 my-1 border-t border-white/8" />
            <div className="px-4 py-1.5 text-label font-semibold text-muted uppercase tracking-wider">
              Add to Playlist
            </div>
            <div className="max-h-36 overflow-y-auto pb-1">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => { addTrackToPlaylist(pl.id, trackId); close(); addToast(`Added to ${pl.name}`, "success"); }}
                  className="w-full text-left px-4 py-2 text-sm text-cream hover:bg-white/8 transition-colors"
                >
                  {pl.name}
                </button>
              ))}
              {playlists.length === 0 && (
                <div className="px-4 py-2.5 text-xs text-muted/60">No playlists yet</div>
              )}
            </div>
          </div>
        </>
      )}
    </TrackMenuContext.Provider>
  );
};

export const useTrackMenu = () => {
  const ctx = useContext(TrackMenuContext);
  if (!ctx) throw new Error("useTrackMenu must be used within a TrackMenuProvider");
  return ctx;
};
