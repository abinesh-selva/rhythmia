"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAudio, usePlaybackTime, Track } from "../../context/AudioContext";

interface NowPlayingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  npTab: "lyrics" | "queue";
  setNpTab: (val: "lyrics" | "queue") => void;
}

const fmt = (s: number) => {
  if (isNaN(s) || !isFinite(s)) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

export function NowPlayingPanel({ isOpen, onClose, npTab, setNpTab }: NowPlayingPanelProps) {
  const { currentTime, duration } = usePlaybackTime();
  const {
    currentTrack,
    isPlaying,
    isShuffle,
    repeatMode,
    analyserNode,
    likedSongs,
    sleepTimer,
    sleepTimerRemaining,
    lyrics,
    updateLyrics,
    queue,
    playbackContext,
    tracks,
    removeFromQueue,
    reorderQueue,
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

  // Shared state
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [mobileTab, setMobileTab] = useState<"song" | "lyrics">("song");
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [showSleepSheet, setShowSleepSheet] = useState(false);

  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const desktopLyricsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Waveform visualizer (desktop)
  useEffect(() => {
    if (!canvasRef.current || !analyserNode || !isPlaying || !currentTrack) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserNode.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, currentTrack.cover_colors?.[0] || "#1E9E54");
      gradient.addColorStop(1, currentTrack.cover_colors?.[1] || "#F0824E");
      ctx.fillStyle = gradient;
      const totalBars = Math.min(dataArray.length, 32);
      const gap = 3;
      const barWidth = (canvas.width - (totalBars - 1) * gap) / totalBars;
      for (let i = 0; i < totalBars; i++) {
        const percent = Math.pow(dataArray[i] / 255, 1.2);
        const barHeight = Math.max(3, percent * (canvas.height - 4));
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        else ctx.rect(x, y, barWidth, barHeight);
        ctx.fill();
      }
    };
    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [analyserNode, isPlaying, currentTrack]);

  // Shared lyrics parsing
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return { parsed: [], isSynced: false };
    const lines = lyrics.split("\n");
    const parsed: { time: number; text: string }[] = [];
    let isSynced = false;
    for (const line of lines) {
      const match = line.match(/^\[(\d{2,}):(\d{2}(?:\.\d{1,3})?)\](.*)/);
      if (match) {
        isSynced = true;
        parsed.push({ time: parseInt(match[1], 10) * 60 + parseFloat(match[2]), text: match[3].trim() });
      } else if (line.trim()) {
        parsed.push({ time: -1, text: line.trim() });
      }
    }
    return { parsed, isSynced };
  }, [lyrics]);

  const activeLineIndex = useMemo(() => {
    if (!parsedLyrics.isSynced) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.parsed.length; i++) {
      if (currentTime >= parsedLyrics.parsed[i].time) idx = i;
      else break;
    }
    return idx;
  }, [currentTime, parsedLyrics]);

  // Auto-scroll active lyric line
  useEffect(() => {
    if (!isEditingLyrics && parsedLyrics.isSynced && activeLineIndex !== -1) {
      [lyricsContainerRef, desktopLyricsRef].forEach((ref) => {
        const el = ref.current?.children[activeLineIndex] as HTMLElement;
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, [activeLineIndex, parsedLyrics.isSynced, isEditingLyrics]);

  const upcomingFromContext = useMemo(() => {
    if (!currentTrack) return [];
    const idx = playbackContext.indexOf(currentTrack.id);
    return idx >= 0 ? playbackContext.slice(idx + 1) : playbackContext;
  }, [currentTrack, playbackContext]);

  if (!isOpen || !currentTrack) return null;

  const coverColors = currentTrack.cover_colors || ["#0E3B35", "#0c332c"];
  const totalQueueCount = queue.length + upcomingFromContext.length;

  // ─── Shared sub-renders ─────────────────────────────────────────────────────

  const lyricsContent = (compact: boolean) => (
    <div className={`flex-1 flex flex-col ${compact ? "min-h-48 bg-black/15 border border-white/8 rounded-xl p-3.5" : "bg-black/20 border border-white/6 rounded-2xl p-5"} relative`}>
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
            className={`mt-3 w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${compact ? "bg-white/10 hover:bg-white/20 text-cream" : "bg-coral text-forest-dark"}`}
          >
            Save Lyrics
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          <div className="flex justify-end mb-2">
            <button onClick={() => setIsEditingLyrics(true)} className="text-xs text-muted hover:text-cream transition-colors font-semibold px-2 py-1 bg-white/5 rounded-lg">
              Edit
            </button>
          </div>
          <div ref={compact ? desktopLyricsRef : lyricsContainerRef} className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
            {parsedLyrics.parsed.map((line, idx) => {
              const isActive = parsedLyrics.isSynced && idx === activeLineIndex;
              return (
                <p key={idx} className={`transition-all duration-300 ${compact ? "text-sm" : "text-base"} ${
                  isActive ? "text-coral font-bold scale-105 origin-left" : parsedLyrics.isSynced ? "text-muted/60 hover:text-muted" : "text-cream"
                }`}>
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const queueContent = (compact: boolean) => (
    <div className={`flex flex-col gap-1.5 ${compact ? "pb-2" : "pb-4"}`}>
      {queue.length > 0 && (
        <>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-1 pb-1">Next in queue</p>
          {queue.map((trackId, idx) => {
            const qTrack = tracks.find((t) => t.id === trackId);
            if (!qTrack) return null;
            return (
              <QueueRow
                key={`q-${trackId}-${idx}`}
                track={qTrack}
                compact={compact}
                draggable={compact}
                onDragStart={compact ? (e: React.DragEvent) => { e.dataTransfer.setData("text/plain", idx.toString()); e.dataTransfer.effectAllowed = "move"; } : undefined}
                onDragOver={compact ? (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } : undefined}
                onDrop={compact ? (e: React.DragEvent) => { e.preventDefault(); const src = parseInt(e.dataTransfer.getData("text/plain"), 10); if (!isNaN(src) && src !== idx) reorderQueue(src, idx); } : undefined}
                onRemove={() => removeFromQueue(idx)}
              />
            );
          })}
        </>
      )}

      {upcomingFromContext.length === 0 && queue.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-muted/30">
            <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
          </svg>
          <p className="text-xs text-muted/60 max-w-40">Queue is empty. Play from a playlist to see upcoming tracks.</p>
        </div>
      ) : upcomingFromContext.length > 0 ? (
        <>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest px-1 pb-1 pt-2">Next up</p>
          {upcomingFromContext.slice(0, 50).map((trackId, idx) => {
            const qTrack = tracks.find((t) => t.id === trackId);
            if (!qTrack) return null;
            return <QueueRow key={`ctx-${trackId}-${idx}`} track={qTrack} compact={compact} />;
          })}
        </>
      ) : null}
    </div>
  );

  // ─── MOBILE LAYOUT (< md) — full-screen overlay ──────────────────────────

  const mobileLayout = (
    <div className="fixed inset-0 z-50 flex flex-col bg-forest-dark text-cream overflow-hidden md:hidden animate-slide-up">
      {/* Opaque gradient tint */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to bottom, ${coverColors[0]}, var(--theme-forest-dark) 80%)` }} />
      <div className="absolute inset-0 opacity-25 blur-[100px] pointer-events-none" style={{ background: `radial-gradient(circle at 50% 20%, ${coverColors[0]}, transparent 55%), radial-gradient(circle at 50% 100%, ${coverColors[1] || coverColors[0]}, transparent 50%)` }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-start text-cream active:scale-90 transition-transform" aria-label="Minimize player">
          <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-current stroke-2 fill-none"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        <div className="flex flex-col items-center min-w-0">
          <span className="text-[10px] tracking-widest text-muted/80 uppercase font-bold">Now Playing</span>
          <span className="text-xs font-bold truncate max-w-48 mt-0.5">{currentTrack.album || "Vibeblower"}</span>
        </div>
        <button onClick={() => setShowSleepSheet(true)} className="w-10 h-10 flex items-center justify-end text-cream active:scale-90 transition-transform relative" aria-label="More options">
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
          {sleepTimer !== null && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-coral rounded-full" />}
        </button>
      </header>

      {/* Tab toggle */}
      <div className="relative z-10 flex gap-1 mx-6 mb-3 p-1 bg-black/20 rounded-full border border-white/5 flex-none">
        {(["song", "lyrics"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-all capitalize ${mobileTab === t ? "bg-coral text-forest-dark shadow-sm" : "text-muted hover:text-cream"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-8 py-2 z-10 min-h-0 overflow-hidden">
        {mobileTab === "song" ? (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <div className="w-full aspect-square max-w-[320px] rounded-2xl shadow-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${coverColors[0]}, ${coverColors[1] || coverColors[0]})` }}>
              {currentTrack.cover_image
                ? <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-24 h-24 fill-cream/20"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg></div>
              }
            </div>
          </div>
        ) : (
          lyricsContent(false)
        )}
      </div>

      {/* Track info + like */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-4 pb-2">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-cream truncate leading-tight">{currentTrack.title}</h2>
          <p className="text-sm text-muted truncate mt-1">{currentTrack.artist}</p>
        </div>
        <button onClick={() => toggleLike(currentTrack.id)} className={`ml-4 flex-none transition-all active:scale-90 ${likedSongs.has(currentTrack.id) ? "text-coral" : "text-muted/70"}`} aria-label="Like">
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill={likedSongs.has(currentTrack.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth={likedSongs.has(currentTrack.id) ? "0" : "2"}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Seek bar */}
      <div className="relative z-10 px-8 pb-2">
        <input type="range" min={0} max={duration || 1} step={0.5} value={currentTime} onChange={(e) => seek(Number(e.target.value))}
          className="w-full h-1 appearance-none bg-white/20 rounded-full accent-coral cursor-pointer" />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted">{fmt(currentTime)}</span>
          <span className="text-[10px] text-muted">{fmt(duration)}</span>
        </div>
      </div>

      {/* Playback controls */}
      <div className="relative z-10 flex items-center justify-between px-8 pb-4">
        <button onClick={toggleShuffle} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${isShuffle ? "text-coral" : "text-muted/60 hover:text-cream"}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4zM14.83 13.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04z" /></svg>
        </button>
        <button onClick={prevTrack} className="w-12 h-12 flex items-center justify-center text-cream active:scale-90 transition-transform">
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>
        </button>
        <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-cream flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          {isPlaying
            ? <svg viewBox="0 0 24 24" className="w-8 h-8 fill-forest-dark"><path d="M6 19h4V5H6zm8-14v14h4V5z" /></svg>
            : <svg viewBox="0 0 24 24" className="w-8 h-8 fill-forest-dark"><path d="M8 5v14l11-7z" /></svg>
          }
        </button>
        <button onClick={nextTrack} className="w-12 h-12 flex items-center justify-center text-cream active:scale-90 transition-transform">
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current"><path d="M6 18l8.5-6L6 6zm10-12v12h2V6z" /></svg>
        </button>
        <button onClick={cycleRepeatMode} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 relative ${repeatMode !== 0 ? "text-coral" : "text-muted/60 hover:text-cream"}`}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            {repeatMode === 2
              ? <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
              : <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
            }
          </svg>
        </button>
      </div>

      {/* Queue button */}
      <div className="relative z-10 flex items-center justify-center gap-6 px-8 pb-6">
        <button onClick={() => setShowQueueSheet(true)} className="flex items-center gap-2 text-xs font-bold text-muted/70 hover:text-cream transition-colors px-4 py-2 rounded-full bg-white/5 hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" /></svg>
          Queue ({totalQueueCount})
        </button>
      </div>

      {/* Queue bottom sheet */}
      {showQueueSheet && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end" onClick={() => setShowQueueSheet(false)}>
          <div className="w-full bg-panel border-t border-white/10 rounded-t-3xl max-h-[80%] flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="font-display font-bold text-base">Play Queue ({totalQueueCount})</h3>
              <button onClick={() => setShowQueueSheet(false)} className="text-xs font-bold text-coral px-3 py-1 hover:bg-white/5 rounded-full transition-colors">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar">
              {queueContent(false)}
            </div>
          </div>
        </div>
      )}

      {/* Sleep timer sheet */}
      {showSleepSheet && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end" onClick={() => setShowSleepSheet(false)}>
          <div className="w-full bg-panel border-t border-white/10 rounded-t-3xl flex flex-col animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-white/15 rounded-full mx-auto my-3 flex-shrink-0" />
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
              <h3 className="font-display font-bold text-base">Sleep Timer</h3>
              <button onClick={() => setShowSleepSheet(false)} className="text-xs font-bold text-coral px-3 py-1 hover:bg-white/5 rounded-full transition-colors">Close</button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-1">
              {[5, 10, 15, 20, 30, 45, 60].map((min) => (
                <button key={min} onClick={() => { setSleepTimer(min * 60); setShowSleepSheet(false); }} className="w-full text-left text-sm py-3 px-4 hover:bg-white/5 rounded-xl transition-colors">
                  {min} minutes
                </button>
              ))}
              <button onClick={() => { setSleepTimerOnTrackEnd(); setShowSleepSheet(false); }} className="w-full text-left text-sm py-3 px-4 hover:bg-white/5 rounded-xl transition-colors text-coral">
                End of track
              </button>
              {sleepTimer !== null && (
                <button onClick={() => { setSleepTimer(null); setShowSleepSheet(false); }} className="w-full text-center text-sm py-3 mt-4 font-bold bg-pink/10 hover:bg-pink/15 rounded-xl transition-colors text-pink">
                  Turn Off Timer ({fmt(sleepTimerRemaining || 0)} left)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── DESKTOP LAYOUT (>= md) — sidebar panel ──────────────────────────────

  const desktopLayout = (
    <aside className="np fixed top-1.5 right-1.5 bottom-np-bottom w-72 bg-panel border border-white/8 rounded-xl z-40 overflow-hidden hidden md:flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/6 flex-none">
        <h3 className="font-display font-bold text-base text-cream">Now Playing</h3>
        <button onClick={onClose} aria-label="Hide Now Playing" className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-muted hover:text-cream transition-colors">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <path d="M5.03 10.53a.75.75 0 1 1-1.06-1.06L5.44 8 3.97 6.53a.75.75 0 0 1 1.06-1.06l2 2a.75.75 0 0 1 0 1.06z" />
            <path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm.5 1.5h8v13h-8zm13 13H11v-13h3.5z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Cover art */}
        <div className="w-full aspect-square rounded-xl shadow-xl overflow-hidden flex-none" style={{ background: `linear-gradient(135deg, ${coverColors[0]}, ${coverColors[1] || coverColors[0]})` }}>
          {currentTrack.cover_image
            ? <img src={currentTrack.cover_image} alt={currentTrack.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-14 h-14 fill-cream/70"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg></div>
          }
        </div>

        {/* Track info */}
        <div>
          <h4 className="font-display font-bold text-lg text-cream truncate leading-tight">{currentTrack.title}</h4>
          <p className="text-sm text-muted mt-0.5 truncate">{currentTrack.artist}</p>
        </div>

        {/* Visualizer */}
        <div className="bg-black/25 rounded-lg p-2.5 border border-white/5 flex-none">
          <canvas ref={canvasRef} width="280" height="56" className="w-full h-14 rounded opacity-75" />
        </div>

        {/* Tab selector */}
        <div className="flex gap-1.5 p-1 bg-black/20 rounded-full border border-white/5 flex-none">
          {(["lyrics", "queue"] as const).map((tab) => (
            <button key={tab} onClick={() => setNpTab(tab)} className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-all capitalize ${npTab === tab ? "bg-coral text-forest-dark shadow-sm" : "text-muted hover:text-cream"}`}>
              {tab === "queue" ? `Queue (${totalQueueCount})` : "Lyrics"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {npTab === "lyrics" ? lyricsContent(true) : queueContent(true)}
      </div>
    </aside>
  );

  return (
    <>
      {mobileLayout}
      {desktopLayout}
    </>
  );
}

// ─── Shared queue row ─────────────────────────────────────────────────────────

interface QueueRowProps extends Partial<React.HTMLAttributes<HTMLDivElement>> {
  track: Track;
  compact: boolean;
  onRemove?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

function QueueRow({ track, compact, onRemove, draggable, onDragStart, onDragOver, onDrop }: QueueRowProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart as any}
      onDragOver={onDragOver as any}
      onDrop={onDrop as any}
      className={`flex items-center gap-2.5 p-2 hover:bg-white/6 rounded-lg group transition-colors ${draggable && onRemove ? "cursor-grab active:cursor-grabbing" : ""}`}
      title={draggable && onRemove ? "Drag to reorder" : undefined}
    >
      <div className={`${compact ? "w-9 h-9 rounded-md" : "w-10 h-10 rounded-lg"} flex-none shadow-sm overflow-hidden`}
        style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}>
        {track.cover_image
          ? <img src={track.cover_image} alt={track.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/70"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" /></svg></div>
        }
      </div>
      <div className="min-w-0 flex-1">
        <div className={`${compact ? "text-xs" : "text-sm"} font-semibold text-cream truncate group-hover:text-coral transition-colors`}>{track.title}</div>
        <div className="text-xs text-muted truncate mt-0.5">{track.artist}</div>
      </div>
      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className={`${compact ? "opacity-0 group-hover:opacity-100" : ""} text-xs font-bold text-pink hover:bg-pink/10 px-3 py-1.5 rounded-lg transition-opacity`}>
          Remove
        </button>
      )}
    </div>
  );
}
