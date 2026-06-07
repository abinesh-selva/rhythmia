import React, { useEffect, useRef, useState, useMemo } from "react";
import { useAudio, usePlaybackTime } from "../../context/AudioContext";

interface NowPlayingSidebarProps {
  setIsNPOpen: (val: boolean) => void;
  npTab: "lyrics" | "queue";
  setNpTab: (val: "lyrics" | "queue") => void;
}

export function NowPlayingSidebar({ setIsNPOpen, npTab, setNpTab }: NowPlayingSidebarProps) {
  const { currentTime } = usePlaybackTime();
  const {
    currentTrack,
    isPlaying,
    analyserNode,
    lyrics,
    updateLyrics,
    queue,
    tracks,
    removeFromQueue,
    reorderQueue,
  } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

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
      
      // Dynamic gradient using the active track's cover colors
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, currentTrack.cover_colors?.[0] || "#1E9E54");
      gradient.addColorStop(1, currentTrack.cover_colors?.[1] || "#F0824E");
      ctx.fillStyle = gradient;

      const totalBars = Math.min(dataArray.length, 32); // Limit number of bars for a cleaner, modern look
      const gap = 3;
      const barWidth = (canvas.width - (totalBars - 1) * gap) / totalBars;

      for (let i = 0; i < totalBars; i++) {
        // Apply an exponential curve to frequency data for better low-mid visual representation
        const rawValue = dataArray[i];
        const percent = Math.pow(rawValue / 255, 1.2);
        const barHeight = Math.max(3, percent * (canvas.height - 4));
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [analyserNode, isPlaying, currentTrack]);

  const parsedLyrics = useMemo(() => {
    const lines = lyrics.split('\n');
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

  useEffect(() => {
    if (!isEditingLyrics && parsedLyrics.isSynced && activeLineIndex !== -1 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.children[activeLineIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeLineIndex, parsedLyrics.isSynced, isEditingLyrics]);

  if (!currentTrack) return null;

  return (
    <aside className="np fixed top-1.5 right-1.5 bottom-np-bottom w-full md:w-72 bg-panel border border-white/8 md:rounded-xl z-40 overflow-hidden flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/6 flex-none">
        <h3 className="font-display font-bold text-base text-cream">Now Playing</h3>
        <button
          onClick={() => setIsNPOpen(false)}
          aria-label="Hide Now Playing view"
          title="Hide Now Playing view"
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-muted hover:text-cream transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
            <path d="M5.03 10.53a.75.75 0 1 1-1.06-1.06L5.44 8 3.97 6.53a.75.75 0 0 1 1.06-1.06l2 2a.75.75 0 0 1 0 1.06z" />
            <path d="M1 0a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1zm.5 1.5h8v13h-8zm13 13H11v-13h3.5z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Cover art */}
        <div
          className="w-full aspect-square rounded-xl shadow-xl flex items-center justify-center relative overflow-hidden flex-none"
          style={{ background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})` }}
        >
          <svg viewBox="0 0 24 24" className="w-14 h-14 fill-cream/70">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>

        {/* Track info */}
        <div>
          <h4 className="font-display font-bold text-lg text-cream truncate leading-tight">{currentTrack.title}</h4>
          <p className="text-sm text-muted mt-0.5 truncate">{currentTrack.artist}</p>
        </div>

        {/* Frequency visualizer */}
        <div className="bg-black/25 rounded-lg p-2.5 border border-white/5 flex-none">
          <canvas
            ref={canvasRef}
            width="280"
            height="56"
            className="w-full h-14 rounded opacity-75"
          />
        </div>

        {/* Tab selector */}
        <div className="flex gap-1.5 p-1 bg-black/20 rounded-full border border-white/5 flex-none">
          {(["lyrics", "queue"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setNpTab(tab)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-full transition-all capitalize ${
                npTab === tab
                  ? "bg-coral text-forest-dark shadow-sm"
                  : "text-muted hover:text-cream"
              }`}
            >
              {tab === "queue" ? `Queue (${queue.length})` : "Lyrics"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {npTab === "lyrics" ? (
          <div className="flex-1 flex flex-col min-h-48 bg-black/15 border border-white/8 rounded-xl p-3.5 relative">
            {(!lyrics || isEditingLyrics) ? (
              <div className="flex-1 flex flex-col h-full">
                <textarea
                  value={lyrics}
                  onChange={(e) => updateLyrics(e.target.value)}
                  placeholder="Paste LRC format lyrics here (e.g. [00:15.20] Hello...)"
                  className="flex-1 w-full h-full bg-transparent text-sm text-cream placeholder-muted/50 resize-none focus:outline-none"
                />
                <button 
                  onClick={() => setIsEditingLyrics(false)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-cream transition-colors"
                >
                  Save Lyrics
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full">
                <div className="flex justify-end mb-2">
                  <button 
                    onClick={() => setIsEditingLyrics(true)}
                    className="text-xs text-muted hover:text-cream transition-colors"
                  >
                    Edit
                  </button>
                </div>
                <div 
                  ref={lyricsContainerRef} 
                  className="flex-1 overflow-y-auto space-y-3 no-scrollbar"
                >
                  {parsedLyrics.parsed.map((line, idx) => {
                    const isActive = parsedLyrics.isSynced ? idx === activeLineIndex : false;
                    return (
                      <p 
                        key={idx} 
                        className={`text-sm transition-all duration-300 ${
                          isActive 
                            ? "text-coral font-bold text-lg scale-105 origin-left" 
                            : parsedLyrics.isSynced 
                              ? "text-muted/60 hover:text-muted" 
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
        ) : (
          <div className="flex flex-col gap-1.5 pb-2">
            {queue.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-muted/30">
                  <path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" />
                </svg>
                <p className="text-xs text-muted/60 max-w-40">Queue is empty. Right-click a song to add it.</p>
              </div>
            ) : (
              queue.map((trackId, idx) => {
                const qTrack = tracks.find((t) => t.id === trackId);
                if (!qTrack) return null;
                return (
                  <div
                    key={`${trackId}-${idx}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", idx.toString());
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const sourceIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                      if (!isNaN(sourceIdx) && sourceIdx !== idx) {
                        reorderQueue(sourceIdx, idx);
                      }
                    }}
                    className="flex items-center gap-2.5 p-2 hover:bg-white/6 rounded-lg group transition-colors cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center flex-none shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${qTrack.cover_colors[0]}, ${qTrack.cover_colors[1]})` }}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/70">
                        <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-cream truncate group-hover:text-coral transition-colors">{qTrack.title}</div>
                      <div className="text-xs text-muted truncate mt-0.5">{qTrack.artist}</div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(idx);
                      }}
                      className="text-label text-coral/70 opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex-none px-2 py-1 hover:bg-coral/20 rounded cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

