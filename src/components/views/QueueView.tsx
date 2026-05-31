import React from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface QueueViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
}

export function QueueView({ onContextMenu }: QueueViewProps) {
  const { tracks, queue, clearQueue } = useAudio();
  
  const qTracks = queue.map((id) => tracks.find((t) => t.id === id)!).filter(Boolean);

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-cream tracking-tight">Play Queue</h2>
          <p className="text-sm text-muted mt-2">Tracks queued up to play next</p>
        </div>
        
        {queue.length > 0 && (
          <button
            onClick={clearQueue}
            className="text-xs font-bold px-5 py-2.5 border border-coral text-coral hover:bg-coral hover:text-forest-dark rounded-full transition-all cursor-pointer hover:shadow-md active:scale-95 self-start md:self-auto"
          >
            Clear Queue
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 flex-1 animate-fade-in">
        {qTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-2xl bg-panel/30 flex flex-col items-center gap-4">
             <svg viewBox="0 0 24 24" className="w-12 h-12 fill-current opacity-30">
               <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
             </svg>
             Queue is empty. Right-click or click track options (...) to add tracks to the queue.
          </div>
        ) : (
          <div className="bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 px-2">Next in Queue</h3>
            {qTracks.map((t, idx) => (
              <TrackRow 
                key={`${t.id}-${idx}`} // using idx in case of duplicate tracks in queue
                track={t} 
                index={idx} 
                onContextMenu={onContextMenu} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
