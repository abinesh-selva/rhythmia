"use client";

import { useRouter } from "next/navigation";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface Singer { id: string; display_name: string; slug: string; image: string | null; track_count: number }
interface Album  { id: string; title: string; slug: string; cover_colors: string[]; artist_name: string }

interface SingerDetailViewProps {
  singer: Singer;
  tracks: { id: string; title: string; artist: string; album: string; audio_url: string; cover_colors: string[]; duration_sec: number; is_active: boolean; singers?: string[] }[];
  appearsOnAlbums: Album[];
}

export function SingerDetailView({ singer, tracks, appearsOnAlbums }: SingerDetailViewProps) {
  const { playTrack } = useAudio();
  const router = useRouter();

  const activeTracks = tracks.filter((t) => t.is_active !== false);

  return (
    <div className="flex flex-col min-h-full pb-20">
      {/* Hero */}
      <div className="relative p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-white/5 overflow-hidden bg-gradient-to-b from-blue/40 to-forest-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-forest-dark to-transparent z-0" />

        <div className="w-40 h-40 md:w-52 md:h-52 rounded-full shadow-2xl z-10 flex-none overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue to-panel border-4 border-cream/10">
          {singer.image ? (
            <img src={singer.image} alt={singer.display_name} className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-20 h-20 fill-cream/50">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2z" />
            </svg>
          )}
        </div>

        <div className="flex flex-col gap-2 z-10 flex-1 min-w-0">
          <span className="text-xs font-bold text-cream/60 uppercase tracking-widest">Singer</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-white tracking-tighter drop-shadow-lg truncate">
            {singer.display_name}
          </h1>
          <p className="text-white/60 text-sm">{singer.track_count.toLocaleString()} songs</p>
        </div>
      </div>

      {/* Play all */}
      {activeTracks.length > 0 && (
        <div className="px-6 md:px-8 py-6 flex items-center gap-4">
          <button
            onClick={() => playTrack(activeTracks[0].id as any, activeTracks.map(t => t.id as any), activeTracks[0] as any)}
            className="w-14 h-14 rounded-full bg-coral hover:bg-coral-bright flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-forest-dark ml-1"><path d="M8 5v14l11-7z" /></svg>
          </button>
        </div>
      )}

      {/* Songs */}
      {activeTracks.length > 0 && (
        <div className="px-6 md:px-8 mb-8">
          <h2 className="text-xl font-bold text-cream mb-4">Songs</h2>
          <div className="flex flex-col rounded-xl overflow-hidden border border-white/5">
            {activeTracks.map((t, idx) => (
              <TrackRow key={t.id} track={t as any} index={idx} playQueue={activeTracks.map(x => x.id as any)} />
            ))}
          </div>
        </div>
      )}

      {/* Appears On */}
      {appearsOnAlbums.length > 0 && (
        <div className="px-6 md:px-8">
          <h2 className="text-xl font-bold text-cream mb-4">Appears On</h2>
          <div className="overflow-hidden"><div className="flex gap-4 overflow-x-auto pb-4 -mb-4 no-scrollbar">
            {appearsOnAlbums.map((album) => {
              const c = Array.isArray(album.cover_colors) ? album.cover_colors : ["#F0824E", "#1E9E54"];
              return (
                <div key={album.id} onClick={() => router.push(`/album/${album.id}/${album.slug}`)} className="flex flex-col gap-2 min-w-40 p-3 bg-white/4 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all">
                  <div className="w-full aspect-square rounded-md" style={{ background: `linear-gradient(135deg, ${c[0]}, ${c[1]})` }} />
                  <span className="text-sm font-bold text-cream truncate">{album.title}</span>
                  <span className="text-xs text-muted truncate">{album.artist_name}</span>
                </div>
              );
            })}
          </div></div>
        </div>
      )}

    </div>
  );
}
