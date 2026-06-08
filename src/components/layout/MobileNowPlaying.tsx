"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { useAudio, usePlaybackTime, Track } from "../../context/AudioContext";

interface MobileNowPlayingProps {
  isOpen: boolean;
  onClose: () => void;
}

const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function MobileNowPlaying({ isOpen, onClose }: MobileNowPlayingProps) {
  const { currentTime, duration } = usePlaybackTime();
  const {
    currentTrack,
    isPlaying,
    isShuffle,
    repeatMode,
    likedSongs,
    sleepTimer,
    sleepTimerRemaining,
    lyrics,
    updateLyrics,
    queue,
    playbackContext,
    tracks,
    removeFromQueue,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    toggleShuffle,
    cycleRepeatMode,
    toggleLike,
    setSleepTimer,
    setSleepTimerOnTrackEnd,
  } = useAudio();

  const [activeTab, setActiveTab] = useState<"song" | "lyrics">("song");
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [showSleepSheet, setShowSleepSheet] = useState(false);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Parse lyrics LRC format
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return { parsed: [], isSynced: false };
    const lines = lyrics.split("\n");
    const parsed = [];
    let isSynced = false;
    for (const line of lines) {
      const match = line.match(/^\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\](.*)/);
      if (match) {
        isSynced = true;
        const min = parseInt(match[1], 10);
        const sec = parseFloat(match[2]);
        parsed.push({ time: min * 60 + sec, text: match[3].trim() });
      } else if (line.trim() !== "") {
        parsed.push({ time: -1, text: line.trim() });
      }
    }
    return { parsed, isSynced };
  }, [lyrics]);

  const activeLineIndex = useMemo(() => {
    if (!parsedLyrics.isSynced) return -1;
    let activeIdx = -1;
    for (let i = 0; i < parsedLyrics.parsed.length; i++) {
      if (currentTime >= parsedLyrics.parsed[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [currentTime, parsedLyrics]);

  // Auto-scroll active lyric
  useEffect(() => {
    if (activeTab === "lyrics" && !isEditingLyrics && parsedLyrics.isSynced && activeLineIndex !== -1 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeLineIndex, parsedLyrics.isSynced, isEditingLyrics, activeTab]);

  if (!isOpen || !currentTrack) return null;

  const coverColors = currentTrack.cover_colors || ["#0E3B35", "#0c332c"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-forest-dark text-cream overflow-hidden md:hidden animate-slide-up">
      {/* Solid colour tint — always fully opaque so no content bleeds through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(to bottom, ${coverColors[0]}, var(--theme-forest-dark) 80%)` }}
      />
      {/* Soft radial glow accent */}
      <div
        className="absolute inset-0 opacity-25 blur-[100px] pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${coverColors[0]}, transparent 55%), radial-gradient(circle at 50% 100%, ${coverColors[1] || coverColors[0]}, transparent 50%)`,
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-start text-cream active:scale-90 transition-transform"
          aria-label="Minimize player"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current stroke-2 fill-none">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div className="flex flex-col items-center min-w-0">
          <span className="text-[10px] tracking-widest text-muted/80 uppercase font-bold">Playing from Library</span>
          <span className="text-xs font-bold truncate max-w-48 mt-0.5">{currentTrack.album || "Vibeblower Player"}</span>
        </div>
        <button 
          onClick={() => setShowSleepSheet(true)}
          className={`w-10 h-10 flex items-center justify-end text-cream active:scale-90 transition-transform relative`}
          aria-label="More options"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
          {sleepTimer !== null && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-coral rounded-full" />
          )}
        </button>
      </header>

      {/* Main Content Area: Switchable between Song (artwork) and Lyrics */}
      <div className="flex-1 flex flex-col justify-center px-8 py-4 z-10 min-h-0">
        {activeTab === "song" ? (
          /* SONG VIEW (Artwork) */
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div 
              className="w-full aspect-square max-w-[320px] rounded-2xl shadow-2xl overflow-hidden relative"
              style={{ background: `linear-gradient(135deg, ${coverColors[0]}, ${coverColors[1] || coverColors[0]})` }}
            >
              {currentTrack.cover_image ? (
                <img 
                  src={currentTrack.cover_image} 
                  alt={currentTrack.album} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-24 h-24 fill-cream/20">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* LYRICS VIEW */
          <div className="flex-1 flex flex-col min-h-0 bg-black/20 border border-white/6 rounded-2xl p-5 relative">
            {(!lyrics || isEditingLyrics) ? (
              <div className="flex-1 flex flex-col h-full">
                <textarea
                  value={lyrics}
                  onChange={(e) => updateLyrics(e.target.value)}
                  placeholder="Paste LRC format lyrics here (e.g. [00:15.20] Hello...)"
                  className="flex-1 w-full h-full bg-transparent text-sm text-cream placeholder-muted/40 resize-none focus:outline-none"
                />
                <button 
                  onClick={() => setIsEditingLyrics(false)}
                  className="mt-3 w-full py-2.5 rounded-xl bg-coral text-forest-dark text-xs font-bold transition-all active:scale-[0.98]"
                >
                  Save Lyrics
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={() => setIsEditingLyrics(true)}
                    className="text-xs text-muted hover:text-cream transition-colors font-semibold px-2 py-1 bg-white/5 rounded-lg"
                  >
                    Edit
                  </button>
                </div>
                <div 
                  ref={lyricsContainerRef} 
                  className="flex-1 overflow-y-auto space-y-4 no-scrollbar py-8"
                >
                  {parsedLyrics.parsed.map((line, idx) => {
                    const isActive = parsedLyrics.isSynced ? idx === activeLineIndex : false;
                    return (
                      <p 
                        key={idx} 
                        className={`text-base font-bold transition-all duration-300 leading-snug ${
                          isActive 
                            ? "text-coral text-xl scale-105 origin-left" 
                            : parsedLyrics.isSynced 
                              ? "text-muted/50" 
                              : "text-cream"
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pill Switcher Tab (Song vs Lyrics) */}
      <div className="flex justify-center z-10 px-8 py-2">
        <div className="flex p-0.5 bg-black/30 backdrop-blur-md rounded-full border border-white/5 w-48">
          <button
            onClick={() => setActiveTab("song")}
            className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${
              activeTab === "song" ? "bg-cream text-forest-dark shadow" : "text-muted hover:text-cream"
            }`}
          >
            Song
          </button>
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`flex-1 text-xs font-bold py-1.5 rounded-full transition-all ${
              activeTab === "lyrics" ? "bg-cream text-forest-dark shadow" : "text-muted hover:text-cream"
            }`}
          >
            Lyrics
          </button>
        </div>
      </div>

      {/* Track Metadata and Heart Row */}
      <div className="px-8 pt-4 pb-2 z-10 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-cream truncate leading-tight">{currentTrack.title}</h2>
          <p className="text-sm text-muted truncate mt-1">{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => toggleLike(currentTrack.id)}
          className={`w-12 h-12 flex items-center justify-end flex-none active:scale-95 transition-transform ${
            likedSongs.has(currentTrack.id) ? "text-coral" : "text-muted/70"
          }`}
          aria-label={likedSongs.has(currentTrack.id) ? "Remove from Liked" : "Like Track"}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6">
            <path
              d="M12 21l-1.45-1.32C5.4 15 2 11.9 2 8.1 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.1c0 3.8-3.4 6.9-8.55 11.58L12 21z"
              stroke="currentColor"
              strokeWidth={likedSongs.has(currentTrack.id) ? "0" : "2"}
              fill={likedSongs.has(currentTrack.id) ? "currentColor" : "none"}
            />
          </svg>
        </button>
      </div>

      {/* Progress Scrubbing Bar */}
      <div className="px-8 py-2 z-10 flex flex-col gap-1.5">
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="w-full cursor-pointer accent-cream h-1.5 rounded-full"
          style={{ background: "rgba(255, 255, 255, 0.15)" }}
        />
        <div className="flex justify-between items-center text-[10px] text-muted/80 font-bold tabular-nums">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="px-8 py-4 z-10 flex items-center justify-between gap-2">
        <button
          onClick={toggleShuffle}
          className={`w-10 h-10 flex items-center justify-center transition-colors active:scale-95 ${
            isShuffle ? "text-coral" : "text-muted/60"
          }`}
          aria-label="Shuffle"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M17 3l4 4-4 4V8h-3l-2.5 3.5-1.4-1.9L12.5 6H17V3zM3 6h4l3 4-1.4 1.9L6 8H3V6zm14 9v-3l4 4-4 4v-3h-4.5l-2.6-3.6 1.4-1.9L14 15h3zM3 16h3l2.5-3.5 1.4 1.9L7 18H3v-2z" />
          </svg>
        </button>

        <button
          onClick={prevTrack}
          className="w-12 h-12 flex items-center justify-center text-cream active:scale-90 transition-transform"
          aria-label="Previous Track"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M6 5h2v14H6V5zm3.5 7L18 5v14l-8.5-7z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-cream text-forest-dark flex items-center justify-center active:scale-95 transition-transform shadow-xl flex-none"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current translate-x-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={nextTrack}
          className="w-12 h-12 flex items-center justify-center text-cream active:scale-90 transition-transform"
          aria-label="Next Track"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M16 5h2v14h-2V5zM6 5l8.5 7L6 19V5z" />
          </svg>
        </button>

        <button
          onClick={cycleRepeatMode}
          className={`w-10 h-10 flex items-center justify-center transition-colors active:scale-95 relative ${
            repeatMode > 0 ? "text-coral" : "text-muted/60"
          }`}
          aria-label="Repeat"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
          </svg>
          {repeatMode === 2 && (
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-coral text-forest-dark text-[8px] font-black rounded-full flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </div>

      {/* Utility Bottom Bar */}
      <footer className="px-8 pt-2 pb-8 z-10 flex items-center justify-between gap-4 text-muted/70">
        <button className="w-10 h-10 flex items-center justify-start hover:text-cream">
          {/* Device Connect */}
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M4 5h16v10H4V5zm-2 13h20v2H2v-2z" />
          </svg>
        </button>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowQueueSheet(true)}
            className="w-10 h-10 flex items-center justify-end hover:text-cream"
            aria-label="Queue"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
            </svg>
          </button>
        </div>
      </footer>

      {/* QUEUE BOTTOM SHEET */}
      {showQueueSheet && (
        <div 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setShowQueueSheet(false)}
        >
          <div 
            className="w-full bg-panel border-t border-white/10 rounded-t-3xl max-h-[80%] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="font-display font-bold text-base">Play Queue ({queue.length})</h3>
              <button 
                onClick={() => setShowQueueSheet(false)}
                className="text-xs font-bold text-coral px-3 py-1 hover:bg-white/5 rounded-full transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 no-scrollbar">
              {/* Explicit queue — priority tracks added by the user */}
              {queue.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest pb-1">Next in queue</p>
                  {queue.map((trackId, idx) => {
                    const qTrack = tracks.find((t) => t.id === trackId);
                    if (!qTrack) return null;
                    return (
                      <QueueTrackRow
                        key={`q-${trackId}-${idx}`}
                        track={qTrack}
                        onRemove={() => removeFromQueue(idx)}
                      />
                    );
                  })}
                </>
              )}

              {/* Playback context — upcoming tracks from the active playlist/view */}
              {(() => {
                const currentIdx = currentTrack ? playbackContext.indexOf(currentTrack.id) : -1;
                const upcoming = currentIdx >= 0 ? playbackContext.slice(currentIdx + 1) : playbackContext;
                if (upcoming.length === 0 && queue.length === 0) {
                  return (
                    <div className="text-center py-12 text-muted">
                      <p className="text-sm">Queue is empty</p>
                      <p className="text-xs text-muted/60 mt-1">Play from a playlist to see upcoming tracks.</p>
                    </div>
                  );
                }
                if (upcoming.length === 0) return null;
                return (
                  <>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest pb-1 pt-2">Next up</p>
                    {upcoming.slice(0, 50).map((trackId, idx) => {
                      const qTrack = tracks.find((t) => t.id === trackId);
                      if (!qTrack) return null;
                      return <QueueTrackRow key={`ctx-${trackId}-${idx}`} track={qTrack} />;
                    })}
                  </>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* MORE OPTIONS / SLEEP SHEET */}
      {showSleepSheet && (
        <div 
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setShowSleepSheet(false)}
        >
          <div 
            className="w-full bg-panel border-t border-white/10 rounded-t-3xl max-h-[80%] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="font-display font-bold text-base">Sleep Timer</h3>
              <button 
                onClick={() => setShowSleepSheet(false)}
                className="text-xs font-bold text-coral px-3 py-1 hover:bg-white/5 rounded-full transition-colors"
              >
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
              {[5, 15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => { setSleepTimer(mins); setShowSleepSheet(false); }}
                  className={`w-full text-left text-sm py-3 px-4 hover:bg-white/5 rounded-xl transition-colors flex justify-between items-center ${
                    sleepTimer === mins ? "text-coral font-bold" : "text-cream"
                  }`}
                >
                  <span>{mins} minutes</span>
                  {sleepTimer === mins && (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </button>
              ))}
              <button
                onClick={() => { setSleepTimerOnTrackEnd(); setShowSleepSheet(false); }}
                className="w-full text-left text-sm py-3 px-4 hover:bg-white/5 rounded-xl transition-colors text-coral"
              >
                End of track
              </button>
              {sleepTimer !== null && (
                <button
                  onClick={() => { setSleepTimer(null); setShowSleepSheet(false); }}
                  className="w-full text-center text-sm py-3 mt-4 font-bold bg-pink/10 hover:bg-pink/15 rounded-xl transition-colors text-pink"
                >
                  Turn Off Timer ({fmt(sleepTimerRemaining || 0)} left)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueTrackRow({ track, onRemove }: { track: Track; onRemove?: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl">
      <div
        className="w-10 h-10 rounded-lg flex-none overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}
      >
        {track.cover_image ? (
          <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/70">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold truncate">{track.title}</p>
        <p className="text-[10px] text-muted truncate mt-0.5">{track.artist}</p>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-xs font-bold text-pink hover:bg-pink/10 px-3 py-1.5 rounded-lg"
        >
          Remove
        </button>
      )}
    </div>
  );
}
