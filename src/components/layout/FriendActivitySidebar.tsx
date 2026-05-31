"use client";

import React, { useMemo } from "react";
import { useAudio } from "../../context/AudioContext";
import { useAuth } from "../../context/AuthContext";

interface FriendActivitySidebarProps {
  setIsFriendOpen: (val: boolean) => void;
}

const MOCK_FRIENDS = [
  { name: "Melody Clara",    initials: "MC", timeAgo: "Now playing", active: true },
  { name: "Beat Maker Dave", initials: "BD", timeAgo: "3m ago",      active: true },
  { name: "Amigo John",      initials: "AJ", timeAgo: "2h ago",      active: false },
];

export function FriendActivitySidebar({ setIsFriendOpen }: FriendActivitySidebarProps) {
  const { isPrivateSession, currentTrack, isPlaying, recentlyPlayed, tracks } = useAudio();
  const { profile } = useAuth();

  // Assign each mock friend a real track from the catalog, deterministically
  const friendTracks = useMemo(() => {
    if (tracks.length === 0) return MOCK_FRIENDS.map(() => null);
    return MOCK_FRIENDS.map((_, i) => {
      // Pick from a spread of catalog positions so friends look diverse
      const offset = (i * 2 + 1) % tracks.length;
      return tracks[offset];
    });
  }, [tracks]);

  // Most recent track the current user listened to (for sidebar "your state" display)
  const lastHeardTrack = useMemo(() => {
    if (currentTrack) return currentTrack;
    const firstId = recentlyPlayed[0];
    return firstId ? tracks.find((t) => t.id === firstId) ?? null : null;
  }, [currentTrack, recentlyPlayed, tracks]);

  return (
    <aside className="friend-sidebar hidden md:flex flex-col bg-forest rounded-2xl p-4 shadow-md border border-cream/5 min-h-0 relative select-none z-30">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-cream/10 flex-none">
        <span className="font-display font-bold text-sm tracking-tight text-cream">Friend Activity</span>
        <button
          onClick={() => setIsFriendOpen(false)}
          className="text-muted hover:text-cream text-lg transition-colors cursor-pointer select-none leading-none"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar">

        {/* Current user's activity card */}
        <div className="bg-panel border border-cream/5 rounded-xl p-3 text-xs shadow-sm">
          <div className="font-bold text-coral text-[9px] uppercase tracking-wider mb-2">Your Activity</div>

          {isPrivateSession ? (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-coral opacity-80">
                <path d="M12 1L3 5v6c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V5l-9-4z" />
              </svg>
              <span className="font-bold text-cream text-[10px]">Private Session Active</span>
              <p className="text-[10px] text-muted leading-relaxed">
                Friends can't see your listening activity.
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
                <div className="text-[11px] font-bold text-cream truncate">{lastHeardTrack.title}</div>
                <div className="text-[10px] text-muted truncate">{lastHeardTrack.artist}</div>
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
              <span className="text-muted text-[10px]">Not listening to anything yet</span>
            </div>
          )}

          {!isPrivateSession && (
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-cream/5">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse shadow-[0_0_6px_#1E9E54]" />
              <span className="text-muted text-[10px]">Sharing with friends</span>
            </div>
          )}
        </div>

        {/* Mock friends with real catalog tracks */}
        {MOCK_FRIENDS.map((friend, idx) => {
          const track = friendTracks[idx];
          if (!track) return null;
          return (
            <div
              key={idx}
              className="flex gap-3 text-xs min-w-0 p-2 rounded-xl hover:bg-panel-hover transition-colors cursor-pointer group"
            >
              <div className="relative flex-none">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold text-forest-dark shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${track.cover_colors[0]}, ${track.cover_colors[1]})` }}
                >
                  {friend.initials}
                </div>
                {friend.active && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green border-2 border-forest rounded-full shadow-sm" />
                )}
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-cream truncate group-hover:text-coral transition-colors text-[11px]">
                    {friend.name}
                  </span>
                  <span className="text-[9px] text-muted whitespace-nowrap">{friend.timeAgo}</span>
                </div>
                <div className="text-[11px] font-medium text-cream/90 truncate mt-0.5 group-hover:underline">
                  {track.title}
                </div>
                <div className="text-[10px] text-muted truncate">{track.artist}</div>
              </div>
            </div>
          );
        })}

        <p className="text-[9px] text-muted/50 text-center pt-2 border-t border-cream/5 mt-auto">
          Friend activity updates when they listen
        </p>
      </div>
    </aside>
  );
}
