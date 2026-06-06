"use client";

import React, { useMemo } from "react";
import { useAudio } from "../../context/AudioContext";
import { useRealtime } from "../../context/RealtimeContext";

interface FriendActivitySidebarProps {
  setIsFriendOpen: (val: boolean) => void;
}

export function FriendActivitySidebar({ setIsFriendOpen }: FriendActivitySidebarProps) {
  const { setView, isPrivateSession, currentTrack, isPlaying, recentlyPlayed, tracks } = useAudio();
  const { onlineUsers, setActiveChatUser, setIsChatOpen } = useRealtime();

  const lastHeardTrack = useMemo(() => {
    if (currentTrack) return currentTrack;
    const firstId = recentlyPlayed[0];
    return firstId ? tracks.find((t) => t.id === firstId) ?? null : null;
  }, [currentTrack, recentlyPlayed, tracks]);

  return (
    <aside className="hidden lg:flex flex-col bg-forest rounded-xl p-4 border border-white/5 min-h-0 relative select-none z-30">
      <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-white/8 flex-none">
        <span className="font-semibold text-sm text-cream">Friend Activity</span>
        <button
          onClick={() => setIsFriendOpen(false)}
          className="text-muted hover:text-cream text-lg transition-colors cursor-pointer select-none leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">

        {/* Current user's activity card */}
        <div className="bg-panel border border-white/5 rounded-xl p-3 text-xs shadow-sm">
          <div className="font-bold text-coral text-xs uppercase tracking-wider mb-2">Your Activity</div>

          {isPrivateSession ? (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-coral opacity-80">
                <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
              </svg>
              <span className="font-bold text-cream text-xs">Private Session Active</span>
              <p className="text-xs text-muted leading-relaxed">
                Friends can&apos;t see your listening activity.
              </p>
            </div>
          ) : lastHeardTrack ? (
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-none shadow-sm"
                style={{ background: `linear-gradient(135deg, ${lastHeardTrack.cover_colors[0]}, ${lastHeardTrack.cover_colors[1]})` }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-cream/80">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-cream truncate">{lastHeardTrack.title}</div>
                <div className="text-xs text-muted truncate">{lastHeardTrack.artist}</div>
              </div>
              {isPlaying && currentTrack?.id === lastHeardTrack.id && (
                <div className="flex gap-0.5 items-end h-4 flex-none">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-coral rounded-full animate-bounce"
                      style={{ height: `${50 + i * 20}%`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted/30" />
              <span className="text-muted text-xs">Not listening to anything yet</span>
            </div>
          )}

          {!isPrivateSession && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse shadow-sm" />
              <span className="text-muted text-xs">Sharing with friends</span>
            </div>
          )}
        </div>

        {/* Real friends from Realtime Presence */}
        {onlineUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center h-full">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-muted/30 mb-2">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span className="text-muted text-xs">No friends online</span>
          </div>
        ) : (
          onlineUsers.map((friend) => (
            <div
              key={friend.user_id}
              className="flex gap-3 text-xs min-w-0 p-2 rounded-xl hover:bg-white/8 transition-colors cursor-pointer group"
              onClick={() => {
                setActiveChatUser(friend.user_id);
                setIsChatOpen(true);
              }}
            >
              <div className="relative flex-none">
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.display_name} className="w-10 h-10 rounded-full shadow-sm object-cover" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-forest-dark shadow-sm bg-coral"
                  >
                    {friend.display_name.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green border-2 border-forest rounded-full shadow-sm" />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center gap-2">
                  <span 
                    className="font-bold text-cream truncate group-hover:text-coral transition-colors text-xs hover:underline cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setView(`user:${friend.user_id}`);
                    }}
                  >
                    {friend.display_name}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">Online</span>
                </div>
                {friend.current_track_id ? (
                  <>
                    <div className="text-xs font-medium text-cream/90 truncate mt-0.5 group-hover:underline">
                      {friend.current_track_title}
                    </div>
                    <div className="text-xs text-muted truncate">{friend.current_track_artist}</div>
                  </>
                ) : (
                  <div className="text-xs text-muted mt-1 italic">Idle</div>
                )}
              </div>
            </div>
          ))
        )}

        <p className="text-xs text-muted/50 text-center pt-2 border-t border-white/5 mt-auto">
          Friend activity updates when they listen
        </p>
      </div>
    </aside>
  );
}
