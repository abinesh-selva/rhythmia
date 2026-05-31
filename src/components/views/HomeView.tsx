import React, { useState } from "react";
import { useAudio } from "../../context/AudioContext";
import { TrackRow } from "../ui/TrackRow";

interface HomeViewProps {
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
  showToast: (msg: string) => void;
}

export function HomeView({ onContextMenu, showToast }: HomeViewProps) {
  const { tracks, recentlyPlayed, playTrack, setView } = useAudio();
  const [homeCategory, setHomeCategory] = useState<"all" | "music" | "podcast">("all");

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  const recentlyPlayedTracks = recentlyPlayed
    .map((id) => tracks.find((t) => t.id === id)!)
    .filter(Boolean)
    .slice(0, 6);

  // Derive top artists
  const uniqueArtists = Array.from(new Set(tracks.map((t) => t.artist))).slice(0, 10);

  // Derive top albums
  const uniqueAlbumsMap = new Map<string, typeof tracks[0]>();
  tracks.forEach((t) => {
    if (t.album && !uniqueAlbumsMap.has(t.album)) {
      uniqueAlbumsMap.set(t.album, t);
    }
  });
  const uniqueAlbums = Array.from(uniqueAlbumsMap.values()).slice(0, 10);

  const filteredTracks = tracks.filter((t) => {
    if (homeCategory === "all") return true;
    if (homeCategory === "music") return !t.type || t.type === "music";
    return t.type === homeCategory;
  });

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header Hero */}
      <div className="hero bg-gradient-to-b from-forest/40 to-forest-dark p-6 md:p-10 flex flex-col md:flex-row md:items-end gap-6 border-b border-cream/5 relative overflow-hidden transition-all">
        {/* Subtle decorative background blur */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-coral/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-green/5 rounded-full blur-3xl" />
        
        <div className="hero-info flex flex-col gap-2 z-10">
          <span className="text-sm font-bold tracking-wider text-cream/70">{getGreeting()}</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl text-cream tracking-tight">
            Discover
          </h2>
        </div>
      </div>

      {/* Popular albums and singles */}
      {uniqueAlbums.length > 0 && (
        <div className="px-6 md:px-10 pt-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-cream hover:underline cursor-pointer">Popular albums and singles</h3>
            <span className="text-sm font-semibold text-muted hover:text-cream cursor-pointer">Show all</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {uniqueAlbums.map((albumTrack, idx) => (
              <div 
                key={idx} 
                onClick={() => setView(`album:${albumTrack.album}`)}
                className="flex flex-col gap-3 min-w-[140px] md:min-w-[180px] p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
              >
                <div 
                  className="w-full aspect-square rounded-md shadow-lg relative overflow-hidden flex-none"
                  style={{
                    background: `linear-gradient(135deg, ${albumTrack.cover_colors[0]}, ${albumTrack.cover_colors[1]})`,
                  }}
                >
                  {/* Hover Play Button */}
                  <div className="absolute right-2 bottom-2 w-12 h-12 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-base font-bold text-cream truncate block">{albumTrack.album}</span>
                  <span className="text-sm text-muted truncate block mt-1">{albumTrack.artist}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Artists */}
      {uniqueArtists.length > 0 && (
        <div className="px-6 md:px-10 pt-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-2xl font-bold tracking-tight text-cream hover:underline cursor-pointer">Popular artists</h3>
            <span className="text-sm font-semibold text-muted hover:text-cream cursor-pointer">Show all</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {uniqueArtists.map((artist, idx) => (
              <div 
                key={idx} 
                onClick={() => setView(`artist:${artist}`)}
                className="flex flex-col items-center gap-3 min-w-[140px] md:min-w-[180px] p-4 bg-panel/30 hover:bg-panel/60 rounded-xl cursor-pointer group transition-all"
              >
                <div className="w-full aspect-square rounded-full bg-panel/50 border border-cream/5 shadow-lg flex items-center justify-center group-hover:bg-panel transition-colors overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-coral/20 to-pink/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <svg viewBox="0 0 24 24" className="w-16 h-16 fill-muted group-hover:fill-cream transition-colors">
                     <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                   </svg>
                   {/* Hover Play Button */}
                   <div className="absolute right-2 bottom-2 w-12 h-12 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10">
                     <svg viewBox="0 0 24 24" className="w-6 h-6 fill-forest-dark ml-1">
                       <path d="M8 5v14l11-7z" />
                     </svg>
                   </div>
                </div>
                <div className="min-w-0 text-center">
                  <span className="text-base font-bold text-cream truncate block">{artist}</span>
                  <span className="text-sm text-muted block mt-1">Artist</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured / Recently Played Section */}
      {recentlyPlayedTracks.length > 0 && (
        <div className="px-6 md:px-10 pt-10 animate-fade-in">
          <h3 className="text-xl font-bold tracking-tight text-cream mb-4">Jump back in</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {recentlyPlayedTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => playTrack(track.id)}
                className="group relative p-4 bg-panel/30 hover:bg-panel/60 rounded-xl flex flex-col gap-3 cursor-pointer transition-all hover:scale-[1.02] shadow-sm hover:shadow-md border border-cream/5"
              >
                <div
                  className="w-full aspect-square rounded-md shadow-lg relative overflow-hidden flex items-center justify-center flex-none"
                  style={{
                    background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})`,
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8 fill-cream/50 transition-transform group-hover:scale-110">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                  
                  {/* Hover Play Button */}
                  <div className="absolute right-2 bottom-2 w-10 h-10 bg-coral rounded-full flex items-center justify-center shadow-xl translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all z-10">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-forest-dark ml-1">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-cream truncate">{track.title}</div>
                  <div className="text-xs text-muted truncate mt-1">{track.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tracks Section */}
      <div className="p-6 md:p-10 flex flex-col gap-1.5 flex-1 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 px-1">
          <h3 className="text-xl font-bold tracking-tight text-cream">Made for you</h3>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "music", label: "Music" },
              { id: "podcast", label: "Podcasts" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setHomeCategory(cat.id as any)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer flex-none ${
                  homeCategory === cat.id
                    ? "bg-cream text-forest-dark shadow-md"
                    : "bg-panel/30 hover:bg-panel border border-cream/5 text-muted hover:text-cream"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {filteredTracks.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm border border-cream/5 rounded-xl bg-forest/10 flex flex-col items-center gap-3 shadow-inner">
            <svg viewBox="0 0 24 24" className="w-10 h-10 fill-current opacity-40">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>No tracks found matching "{homeCategory}". Sync or import media from your Cloudinary folder.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 bg-panel/10 rounded-2xl p-2 md:p-4 border border-cream/5">
            {filteredTracks.map((t, idx) => (
              <TrackRow 
                key={t.id} 
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
