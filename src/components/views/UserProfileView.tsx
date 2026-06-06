import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAudio } from "../../context/AudioContext";
import { Track, Playlist as PlaylistRow } from "../../context/AudioContext";

interface ProfileRow {
  id: string;
  display_name: string;
  avatar_url: string;
}

interface UserProfileViewProps {
  userId: string;
  onContextMenu: (e: React.MouseEvent, trackId: string) => void;
}

export function UserProfileView({ userId, onContextMenu }: UserProfileViewProps) {
  const { setView } = useAudio();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [publicPlaylists, setPublicPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      if (!supabase) {
        setLoading(false);
        return;
      }
      
      // Fetch Profile
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (prof) setProfile(prof);

      // Fetch Public Playlists
      const { data: pls } = await supabase
        .from("playlists")
        .select("*")
        .eq("owner_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false });
      if (pls) setPublicPlaylists(pls);

      setLoading(false);
    }
    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 text-center text-muted">User not found.</div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-32 animate-fade-in">
      {/* Header */}
      <div className="h-64 bg-gradient-to-b from-forest-light to-forest p-8 flex items-end gap-6 relative border-b border-white/5">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="w-48 h-48 rounded-full shadow-2xl object-cover z-10 border-4 border-forest" />
        ) : (
          <div className="w-48 h-48 rounded-full shadow-2xl bg-coral flex items-center justify-center text-6xl font-bold text-forest-dark z-10 border-4 border-forest">
            {profile.display_name?.substring(0, 2).toUpperCase() || "??"}
          </div>
        )}
        <div className="z-10 pb-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-cream/80 mb-2">Profile</p>
          <h1 className="text-6xl font-display font-bold text-cream mb-4">{profile.display_name}</h1>
          <p className="text-sm text-cream/70 font-medium">
            {publicPlaylists.length} Public Playlists
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <h2 className="text-2xl font-bold text-cream mb-6">Public Playlists</h2>
        
        {publicPlaylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 rounded-xl border border-white/10">
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-muted/30 mb-4">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
            </svg>
            <p className="text-muted font-medium">This user hasn&apos;t created any public playlists yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {publicPlaylists.map(pl => (
              <div 
                key={pl.id}
                onClick={() => setView(`playlist:${pl.id}`)}
                className="bg-white/5 hover:bg-white/10 p-4 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-white/10"
              >
                <div 
                  className="w-full aspect-square rounded-md shadow-lg mb-4 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${pl.cover_colors[0]}, ${pl.cover_colors[1]})` }}
                >
                  <svg viewBox="0 0 24 24" className="w-12 h-12 fill-cream/50 group-hover:fill-cream/80 transition-colors">
                    <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                  </svg>
                </div>
                <h3 className="font-bold text-cream truncate group-hover:text-coral transition-colors">{pl.name}</h3>
                <p className="text-sm text-muted mt-1 truncate">By {profile.display_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
