"use client";

import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface Genre { id: string; name: string; slug: string }
interface TrackItem { id: string; title: string; artist: string; album: string; audio_url: string; cover_colors: string[]; duration_sec: number; is_active: boolean; singers?: string[] }

export function GenreDetailView({ genre, tracks }: { genre: Genre; tracks: TrackItem[] }) {
  const { playTrack } = useAudio();

  const activeTracks = tracks.filter((t) => t.is_active !== false);

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 overflow-hidden bg-gradient-to-b from-coral/30 to-forest-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl shadow-2xl z-10 flex-none flex items-center justify-center bg-gradient-to-br from-coral to-pink">
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-forest-dark/70">
            <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2 z-10">
          <span className="text-xs font-bold text-cream/60 uppercase tracking-widest">Genre</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white tracking-tighter drop-shadow-lg">{genre.name}</h1>
          <p className="text-white/60 text-sm">{activeTracks.length} songs</p>
        </div>
      </div>

      {activeTracks.length > 0 && (
        <div className="px-6 md:px-8 py-6 flex items-center gap-4">
          <button onClick={() => playTrack(activeTracks[0].id as any, activeTracks.map(t => t.id as any), activeTracks[0] as any)}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
          </button>
        </div>
      )}

      <div className="px-6 md:px-8">
        {activeTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4">No tracks in this genre yet.</div>
        ) : (
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/5">
            {activeTracks.map((t, idx) => (
              <TrackRow key={t.id} track={t as any} index={idx} playQueue={activeTracks.map(x => x.id as any)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
