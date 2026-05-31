import React, { useEffect, useRef } from "react";
import { useAudio } from "../../context/AudioContext";

interface NowPlayingSidebarProps {
  setIsNPOpen: (val: boolean) => void;
  npTab: "lyrics" | "queue";
  setNpTab: (val: "lyrics" | "queue") => void;
}

export function NowPlayingSidebar({ setIsNPOpen, npTab, setNpTab }: NowPlayingSidebarProps) {
  const {
    currentTrack,
    isPlaying,
    analyserNode,
    lyrics,
    updateLyrics,
    queue,
    tracks,
    removeFromQueue,
  } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Synchronize Live Frequencies Visualizer Canvas
  useEffect(() => {
    if (!canvasRef.current || !analyserNode || !isPlaying) {
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
      const barWidth = canvas.width / dataArray.length;

      for (let i = 0; i < dataArray.length; i++) {
        const percent = dataArray[i] / 255;
        const barHeight = percent * canvas.height;

        // Beautiful alternating organic colors
        ctx.fillStyle = i % 2 === 0 ? "#F0824E" : "#1E9E54";
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [analyserNode, isPlaying]);

  if (!currentTrack) return null;

  return (
    <aside className="np fixed top-0 right-0 bottom-24 w-full md:top-4 md:right-4 md:bottom-28 md:w-80 bg-panel md:rounded-2xl z-40 overflow-hidden flex flex-col shadow-2xl border-t border-cream/5 md:border animate-slide-in-right">
      <div className="flex justify-between items-center p-5 pb-0 flex-none relative z-10">
        <h3 className="font-display font-bold text-lg text-cream">Now Playing</h3>
        <button
          onClick={() => setIsNPOpen(false)}
          className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-muted hover:text-cream transition-colors cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pt-4 custom-scrollbar">
        {/* Dynamic gradient cover */}
        <div
          className="np-cover w-full aspect-square rounded-2xl shadow-xl flex items-center justify-center mb-5 transition-all relative overflow-hidden group"
          style={{
            background: `linear-gradient(135deg, ${currentTrack.cover_colors[0]}, ${currentTrack.cover_colors[1]})`,
          }}
        >
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/90 group-hover:scale-110 transition-transform duration-500">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>

        <div className="mb-4">
          <h4 className="font-display text-2xl font-bold truncate text-cream">{currentTrack.title}</h4>
          <p className="text-sm text-muted mt-0.5 truncate hover:underline cursor-pointer">{currentTrack.artist}</p>
        </div>

        {/* Web Audio frequencies canvas */}
        <div className="bg-black/20 rounded-xl mb-5 p-3 shadow-inner border border-cream/5">
          <canvas
            ref={canvasRef}
            width="300"
            height="64"
            className="w-full h-16 rounded-lg opacity-80"
          />
        </div>

        {/* Tab selector */}
        <div className="np-tabs flex gap-2 mb-4 p-1 bg-black/20 rounded-full border border-cream/5">
          <button
            onClick={() => setNpTab("lyrics")}
            className={`flex-1 text-xs font-bold py-2 rounded-full transition-all cursor-pointer ${
              npTab === "lyrics" ? "bg-coral text-forest-dark shadow-md" : "text-muted hover:text-cream hover:bg-panel-hover"
            }`}
          >
            Lyrics
          </button>
          <button
            onClick={() => setNpTab("queue")}
            className={`flex-1 text-xs font-bold py-2 rounded-full transition-all cursor-pointer ${
              npTab === "queue" ? "bg-coral text-forest-dark shadow-md" : "text-muted hover:text-cream hover:bg-panel-hover"
            }`}
          >
            Queue ({queue.length})
          </button>
        </div>

        <div className="min-h-0">
          {npTab === "lyrics" ? (
            <div className="flex flex-col h-64">
              <textarea
                value={lyrics}
                onChange={(e) => updateLyrics(e.target.value)}
                placeholder="No synced lyrics. Type or paste lyrics here to preserve locally..."
                className="w-full h-full bg-black/15 border border-cream/10 hover:border-cream/20 rounded-xl p-4 text-sm text-cream placeholder-muted resize-none focus:outline-none focus:border-coral transition-all shadow-inner custom-scrollbar"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-4">
              {queue.length === 0 ? (
                <div className="text-center py-10 bg-black/10 rounded-xl border border-cream/5 border-dashed">
                   <svg viewBox="0 0 24 24" className="w-8 h-8 fill-muted mx-auto mb-2 opacity-50"><path d="M3 6h13v2H3V6zm0 4h13v2H3v-2zm0 4h9v2H3v-2zm15-3l4 3-4 3v-6z" /></svg>
                   <p className="text-xs text-muted max-w-48 mx-auto">
                     Queue is empty. Right-click or click menu on songs to queue.
                   </p>
                </div>
              ) : (
                queue.map((trackId, idx) => {
                  const qTrack = tracks.find((t) => t.id === trackId);
                  if (!qTrack) return null;
                  return (
                    <div
                      key={idx}
                      onClick={() => removeFromQueue(idx)}
                      className="q-item flex items-center justify-between gap-3 p-2.5 hover:bg-panel-hover rounded-xl cursor-pointer group transition-colors border border-transparent hover:border-cream/5"
                      title="Click to remove from queue"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="qa w-10 h-10 rounded-lg flex items-center justify-center flex-none shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${qTrack.cover_colors[0]}, ${qTrack.cover_colors[1]})`,
                          }}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/80">
                            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                          </svg>
                        </div>
                        <div className="qm min-w-0 flex flex-col justify-center">
                          <div className="qn font-bold text-xs text-cream truncate group-hover:text-coral transition-colors">{qTrack.title}</div>
                          <div className="qs text-xs text-muted truncate mt-0.5">{qTrack.artist}</div>
                        </div>
                      </div>
                      <button className="text-xs text-coral opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider px-2 py-1 bg-coral/10 rounded">
                        Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
