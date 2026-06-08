"use client";

import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface Language { id: string; name: string; code: string | null; slug: string }
interface TrackItem { id: string; title: string; artist: string; album: string; audio_url: string; cover_colors: string[]; duration_sec: number; is_active: boolean; singers?: string[] }

export function LanguageDetailView({ language, tracks }: { language: Language; tracks: TrackItem[] }) {
  const { playTrack } = useAudio();

  const activeTracks = tracks.filter((t) => t.is_active !== false);

  return (
    <div className="flex flex-col min-h-full pb-20">
      <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 overflow-hidden bg-gradient-to-b from-green/30 to-forest-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />
        <div className="w-36 h-36 md:w-48 md:h-48 rounded-2xl shadow-2xl z-10 flex-none flex items-center justify-center bg-gradient-to-br from-green/60 to-blue/60">
          <svg viewBox="0 0 24 24" className="w-16 h-16 fill-cream/70">
            <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" />
          </svg>
        </div>
        <div className="flex flex-col gap-2 z-10">
          <span className="text-xs font-bold text-cream/60 uppercase tracking-widest">Language</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white tracking-tighter drop-shadow-lg">{language.name}</h1>
          {language.code && <span className="text-xs text-green/80 font-mono uppercase tracking-widest">{language.code}</span>}
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
          <div className="p-12 text-center text-muted text-sm border border-white/5 rounded-2xl bg-white/4">No tracks in this language yet.</div>
        ) : (
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/5">
            {activeTracks.map((t, idx) => (
              <TrackRow key={t.id} track={t as any} index={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
