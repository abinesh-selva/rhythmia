import React from "react";
import { useAudio } from "../../context/AudioContext";

export function LiveEventsView() {
  const { tracks, playTrack } = useAudio();

  const liveTracks = tracks.filter((t) => t.type === "podcast" || t.type === "audiobook");

  return (
    <div className="flex flex-col p-6 md:p-10 min-h-full pb-20">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute -top-4 -left-4 w-48 h-48 bg-coral/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-coral animate-pulse shadow-sm" />
            <span className="text-xs font-bold tracking-widest uppercase text-coral">Live & Episodes</span>
          </div>
          <h2 className="font-display font-black text-4xl md:text-5xl text-cream tracking-tight">Podcasts &amp; More</h2>
          <p className="text-sm text-muted mt-2 max-w-xl">
            Tune into podcasts, audiobooks, and spoken-word content from your library.
          </p>
        </div>
      </div>

      {liveTracks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-12 text-center border border-cream/5 rounded-3xl bg-panel/20">
          <div className="w-20 h-20 rounded-full bg-coral/10 border border-coral/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-coral opacity-70">
              <path d="M22 10V6c0-1.11-.9-2-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
            </svg>
          </div>
          <div>
            <p className="text-cream font-bold text-lg mb-1">No episodes yet</p>
            <p className="text-muted text-sm max-w-sm">
              Upload podcast or audiobook files to your Cloudinary folder and run a sync to see them here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {["podcast", "audiobook", "live radio"].map((tag) => (
              <span key={tag} className="px-3 py-1.5 rounded-full bg-panel border border-cream/5 text-xs text-muted font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveTracks.map((track) => (
            <div
              key={track.id}
              onClick={() => playTrack(track.id)}
              className="group flex gap-4 p-4 bg-panel/30 hover:bg-panel/60 rounded-2xl cursor-pointer transition-all border border-cream/5 hover:border-cream/10"
            >
              <div
                className="w-16 h-16 rounded-xl flex-none shadow-md flex items-center justify-center relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-cream/70">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h-3v2h8v-2h-3v-2.06A9 9 0 0 0 21 12v-2h-2z" />
                </svg>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <div className="text-sm font-bold text-cream truncate group-hover:text-coral transition-colors">
                  {track.title}
                </div>
                <div className="text-xs text-muted truncate">{track.artist}</div>
                <span className="text-xs font-bold uppercase tracking-wider text-coral/80 bg-coral/10 px-2 py-0.5 rounded-full w-fit">
                  {track.type || "episode"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
